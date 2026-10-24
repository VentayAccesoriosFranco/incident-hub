const express = require('express');
const pool = require('../db');

const router = express.Router();

// Definiciones de los indicadores:
// - abiertos: incidentes cuyo estado no es CERRADO
// - cerrados: incidentes en estado CERRADO
// - críticos: incidentes de prioridad CRITICA que siguen abiertos
// - por técnico: incidentes abiertos asignados a cada técnico
router.get('/', async (req, res) => {
  try {
    const [totals, byStatus, byCategory, byTechnician] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status <> 'CERRADO')::int AS open,
           COUNT(*) FILTER (WHERE status = 'CERRADO')::int AS closed,
           COUNT(*) FILTER (WHERE priority = 'CRITICA' AND status <> 'CERRADO')::int AS critical
         FROM incidents`
      ),
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM incidents
         GROUP BY status
         ORDER BY count DESC, status ASC`
      ),
      pool.query(
        `SELECT category, COUNT(*)::int AS count
         FROM incidents
         GROUP BY category
         ORDER BY count DESC, category ASC`
      ),
      pool.query(
        `SELECT u.id AS technician_id, u.name, COUNT(i.id)::int AS count
         FROM users u
         LEFT JOIN incidents i ON i.assigned_to = u.id AND i.status <> 'CERRADO'
         WHERE u.role = 'TECNICO'
         GROUP BY u.id, u.name
         ORDER BY count DESC, u.name ASC`
      ),
    ]);

    const { total, open, closed, critical } = totals.rows[0];

    return res.json({
      total,
      open,
      closed,
      critical,
      byStatus: byStatus.rows,
      byCategory: byCategory.rows,
      byTechnician: byTechnician.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;