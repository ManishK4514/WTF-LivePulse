const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/cross-gym', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.city,
              COALESCE(SUM(p.amount), 0) AS total_revenue
       FROM gyms g
       LEFT JOIN payments p ON p.gym_id = g.id
         AND p.paid_at >= NOW() - INTERVAL '30 days'
       GROUP BY g.id, g.name, g.city
       ORDER BY total_revenue DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
