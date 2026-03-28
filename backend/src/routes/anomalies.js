const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { gym_id, severity } = req.query;
    let query = `
      SELECT a.*, g.name AS gym_name
      FROM anomalies a JOIN gyms g ON g.id = a.gym_id
      WHERE a.resolved = FALSE AND a.dismissed = FALSE
    `;
    const params = [];

    if (gym_id) {
      params.push(gym_id);
      query += ` AND a.gym_id = $${params.length}`;
    }
    if (severity) {
      params.push(severity);
      query += ` AND a.severity = $${params.length}`;
    }
    query += ' ORDER BY a.detected_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/dismiss', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM anomalies WHERE id = $1`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Anomaly not found' });
    const anomaly = rows[0];

    if (anomaly.severity === 'critical') {
      return res.status(403).json({ error: 'Cannot dismiss critical anomalies' });
    }

    const { rows: updated } = await pool.query(
      `UPDATE anomalies SET dismissed = TRUE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
