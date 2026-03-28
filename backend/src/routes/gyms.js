const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { getAllGymsWithStats, getGymLiveSnapshot } = require('../services/statsService');

router.get('/', async (req, res) => {
  try {
    const gyms = await getAllGymsWithStats();
    res.json(gyms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/live', async (req, res) => {
  try {
    const snapshot = await getGymLiveSnapshot(req.params.id);
    if (!snapshot) return res.status(404).json({ error: 'Gym not found' });
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const dateRange = req.query.dateRange || '7d';
    const intervalMap = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
    const interval = intervalMap[dateRange] || '7 days';

    const [heatmapRes, revenueRes, churnRes, ratioRes] = await Promise.all([
      pool.query(
        `SELECT day_of_week, hour_of_day, checkin_count
         FROM gym_hourly_stats
         WHERE gym_id = $1
         ORDER BY day_of_week, hour_of_day`,
        [id]
      ),
      pool.query(
        `SELECT plan_type, SUM(amount) AS total
         FROM payments
         WHERE gym_id = $1 AND paid_at >= NOW() - INTERVAL '${interval}'
         GROUP BY plan_type`,
        [id]
      ),
      pool.query(
        `SELECT m.id, m.name, m.last_checkin_at,
                EXTRACT(DAY FROM NOW() - m.last_checkin_at)::INTEGER AS days_inactive
         FROM members m
         WHERE m.gym_id = $1
           AND m.status = 'active'
           AND m.last_checkin_at < NOW() - INTERVAL '45 days'
         ORDER BY m.last_checkin_at ASC
         LIMIT 100`,
        [id]
      ),
      pool.query(
        `SELECT member_type, COUNT(*) AS cnt
         FROM members
         WHERE gym_id = $1
           AND joined_at >= NOW() - INTERVAL '${interval}'
         GROUP BY member_type`,
        [id]
      ),
    ]);

    const churnRisk = churnRes.rows.map(m => ({
      ...m,
      risk_level: m.days_inactive >= 60 ? 'CRITICAL' : 'HIGH',
    }));

    res.json({
      heatmap: heatmapRes.rows,
      revenue_by_plan: revenueRes.rows,
      churn_risk: churnRisk,
      membership_ratio: ratioRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
