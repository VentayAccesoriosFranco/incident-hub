const express = require('express');
const pool = require('../db');

const router = express.Router();

const PRIORITIES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

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
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar incidentes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.name AS created_by_name, t.name AS assigned_to_name
       FROM incidents i
       JOIN users u ON u.id = i.created_by
       LEFT JOIN users t ON t.id = i.assigned_to
       ORDER BY i.created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Consultar un incidente
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ errors: ['id inválido'] });
  }

  try {
    const result = await pool.query(
      `SELECT i.*, u.name AS created_by_name, t.name AS assigned_to_name
       FROM incidents i
       JOIN users u ON u.id = i.created_by
       LEFT JOIN users t ON t.id = i.assigned_to
       WHERE i.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;