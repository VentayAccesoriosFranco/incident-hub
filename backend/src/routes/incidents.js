const express = require('express');
const pool = require('../db');
const { STATUSES, TRANSITIONS, canTransition } = require('../domain/incidentRules');

const router = express.Router();

const PRIORITIES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

const SELECT_WITH_NAMES = `
  SELECT i.*, u.name AS created_by_name, t.name AS assigned_to_name
  FROM incidents i
  JOIN users u ON u.id = i.created_by
  LEFT JOIN users t ON t.id = i.assigned_to`;

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function serverError(res, err) {
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

function validateNewIncident(body) {
  const errors = [];
  const { title, description, category, priority, created_by } = body || {};

  if (typeof title !== 'string' || title.trim().length < 3 || title.length > 150) {
    errors.push('title debe tener entre 3 y 150 caracteres');
  }
  if (typeof description !== 'string' || description.trim().length === 0) {
    errors.push('description es obligatoria');
  }
  if (typeof category !== 'string' || category.trim().length === 0 || category.length > 50) {
    errors.push('category es obligatoria (máximo 50 caracteres)');
  }
  if (!PRIORITIES.includes(priority)) {
    errors.push(`priority debe ser una de: ${PRIORITIES.join(', ')}`);
  }
  if (!Number.isInteger(created_by) || created_by <= 0) {
    errors.push('created_by debe ser un id de usuario válido');
  }
  return errors;
}

// Crear incidente
router.post('/', async (req, res) => {
  const errors = validateNewIncident(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const { title, description, category, priority, created_by } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO incidents (title, description, category, priority, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title.trim(), description.trim(), category.trim(), priority, created_by]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ errors: ['created_by no corresponde a un usuario existente'] });
    }
    return serverError(res, err);
  }
});

// Listar incidentes (con filtros opcionales)
router.get('/', async (req, res) => {
  const { status, priority, category, assigned_to } = req.query;
  const conditions = [];
  const values = [];

  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ errors: [`status debe ser uno de: ${STATUSES.join(', ')}`] });
    }
    values.push(status);
    conditions.push(`i.status = $${values.length}`);
  }
  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ errors: [`priority debe ser una de: ${PRIORITIES.join(', ')}`] });
    }
    values.push(priority);
    conditions.push(`i.priority = $${values.length}`);
  }
  if (category !== undefined) {
    if (typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ errors: ['category inválida'] });
    }
    values.push(category.trim());
    conditions.push(`i.category = $${values.length}`);
  }
  if (assigned_to !== undefined) {
    const techId = parseId(assigned_to);
    if (techId === null) {
      return res.status(400).json({ errors: ['assigned_to debe ser un id válido'] });
    }
    values.push(techId);
    conditions.push(`i.assigned_to = $${values.length}`);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `${SELECT_WITH_NAMES}${where} ORDER BY i.created_at DESC`,
      values
    );
    return res.json(result.rows);
  } catch (err) {
    return serverError(res, err);
  }
});

// Consultar un incidente
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ errors: ['id inválido'] });
  }

  try {
    const result = await pool.query(`${SELECT_WITH_NAMES} WHERE i.id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return serverError(res, err);
  }
});

// Asignar técnico
router.patch('/:id/assign', async (req, res) => {
  const id = parseId(req.params.id);
  const technicianId = parseId(req.body && req.body.technician_id);

  if (id === null) {
    return res.status(400).json({ errors: ['id inválido'] });
  }
  if (technicianId === null) {
    return res.status(400).json({ errors: ['technician_id debe ser un id válido'] });
  }

  try {
    const incident = await pool.query('SELECT id, status FROM incidents WHERE id = $1', [id]);
    if (incident.rows.length === 0) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    const current = incident.rows[0];
    if (current.status === 'RESUELTO' || current.status === 'CERRADO') {
      return res.status(409).json({ error: `No se puede asignar un incidente en estado ${current.status}` });
    }

    const tech = await pool.query('SELECT id, role FROM users WHERE id = $1', [technicianId]);
    if (tech.rows.length === 0 || tech.rows[0].role !== 'TECNICO') {
      return res.status(400).json({ errors: ['technician_id debe corresponder a un usuario con rol TECNICO'] });
    }

    const newStatus = current.status === 'NUEVO' ? 'ASIGNADO' : current.status;
    const updated = await pool.query(
      `UPDATE incidents
       SET assigned_to = $1, status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [technicianId, newStatus, id]
    );
    return res.json(updated.rows[0]);
  } catch (err) {
    return serverError(res, err);
  }
});

// Cambiar estado
router.patch('/:id/status', async (req, res) => {
  const id = parseId(req.params.id);
  const newStatus = req.body && req.body.status;

  if (id === null) {
    return res.status(400).json({ errors: ['id inválido'] });
  }
  if (!STATUSES.includes(newStatus)) {
    return res.status(400).json({ errors: [`status debe ser uno de: ${STATUSES.join(', ')}`] });
  }

  try {
    const incident = await pool.query(
      'SELECT id, status, assigned_to FROM incidents WHERE id = $1',
      [id]
    );
    if (incident.rows.length === 0) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    const current = incident.rows[0];
    if (!canTransition(current.status, newStatus)) {
      const allowed = TRANSITIONS[current.status].join(', ') || 'ninguno';
      return res.status(409).json({
        error: `Transición no permitida: ${current.status} -> ${newStatus}. Permitidos: ${allowed}`,
      });
    }
    if (newStatus === 'ASIGNADO' && !current.assigned_to) {
      return res.status(409).json({ error: 'Para pasar a ASIGNADO primero debe asignarse un técnico' });
    }

    const updated = await pool.query(
      `UPDATE incidents SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );
    return res.json(updated.rows[0]);
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;