const express = require('express');
const pool = require('../db');

// mergeParams permite leer :id del router padre (/api/incidents/:id/comments)
const router = express.Router({ mergeParams: true });

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function serverError(res, err) {
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

// Registrar un comentario en la bitácora
router.post('/', async (req, res) => {
  const incidentId = parseId(req.params.id);
  const { author_id, body } = req.body || {};
  const errors = [];

  if (incidentId === null) {
    errors.push('id de incidente inválido');
  }
  if (!Number.isInteger(author_id) || author_id <= 0) {
    errors.push('author_id debe ser un id de usuario válido');
  }
  if (typeof body !== 'string' || body.trim().length === 0 || body.length > 2000) {
    errors.push('body es obligatorio (máximo 2000 caracteres)');
  }
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const incident = await pool.query('SELECT id FROM incidents WHERE id = $1', [incidentId]);
    if (incident.rows.length === 0) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    const result = await pool.query(
      `INSERT INTO comments (incident_id, author_id, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [incidentId, author_id, body.trim()]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ errors: ['author_id no corresponde a un usuario existente'] });
    }
    return serverError(res, err);
  }
});

// Consultar la bitácora de un incidente (del más antiguo al más reciente)
router.get('/', async (req, res) => {
  const incidentId = parseId(req.params.id);
  if (incidentId === null) {
    return res.status(400).json({ errors: ['id de incidente inválido'] });
  }

  try {
    const incident = await pool.query('SELECT id FROM incidents WHERE id = $1', [incidentId]);
    if (incident.rows.length === 0) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    const result = await pool.query(
      `SELECT c.id, c.incident_id, c.author_id, u.name AS author_name, c.body, c.created_at
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.incident_id = $1
       ORDER BY c.created_at ASC, c.id ASC`,
      [incidentId]
    );
    return res.json(result.rows);
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;