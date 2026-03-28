const pool = require('../db/pool');

async function getGymOccupancy(gymId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS occupancy
     FROM checkins
     WHERE gym_id = $1 AND checked_out IS NULL`,
    [gymId]
  );
  return parseInt(rows[0].occupancy);
}

async function getTodayRevenue(gymId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS revenue
     FROM payments
     WHERE gym_id = $1 AND paid_at >= CURRENT_DATE`,
    [gymId]
  );
  return parseFloat(rows[0].revenue);
}

async function getAllGymsWithStats() {
  const { rows: gyms } = await pool.query(
    `SELECT g.*,
       (SELECT COUNT(*) FROM checkins c WHERE c.gym_id = g.id AND c.checked_out IS NULL) AS current_occupancy,
       (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.gym_id = g.id AND p.paid_at >= CURRENT_DATE) AS today_revenue
     FROM gyms g
     ORDER BY g.name`
  );
  return gyms;
}

async function getGymLiveSnapshot(gymId) {
  const [occupancyRes, revenueRes, eventsRes, anomaliesRes, gymRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS occupancy FROM checkins WHERE gym_id = $1 AND checked_out IS NULL`,
      [gymId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE`,
      [gymId]
    ),
    pool.query(
      `(SELECT 'checkin' AS event_type, c.checked_in AS event_time,
               m.name AS member_name, NULL::NUMERIC AS amount, NULL::TEXT AS plan_type
        FROM checkins c JOIN members m ON m.id = c.member_id
        WHERE c.gym_id = $1
        ORDER BY c.checked_in DESC LIMIT 10)
       UNION ALL
       (SELECT 'checkout' AS event_type, c.checked_out AS event_time,
               m.name AS member_name, NULL::NUMERIC AS amount, NULL::TEXT AS plan_type
        FROM checkins c JOIN members m ON m.id = c.member_id
        WHERE c.gym_id = $1 AND c.checked_out IS NOT NULL
        ORDER BY c.checked_out DESC LIMIT 10)
       UNION ALL
       (SELECT 'payment' AS event_type, p.paid_at AS event_time,
               m.name AS member_name, p.amount, p.plan_type
        FROM payments p JOIN members m ON m.id = p.member_id
        WHERE p.gym_id = $1
        ORDER BY p.paid_at DESC LIMIT 10)
       ORDER BY event_time DESC LIMIT 20`,
      [gymId]
    ),
    pool.query(
      `SELECT * FROM anomalies
       WHERE gym_id = $1 AND resolved = FALSE AND dismissed = FALSE
       ORDER BY detected_at DESC`,
      [gymId]
    ),
    pool.query(`SELECT * FROM gyms WHERE id = $1`, [gymId]),
  ]);

  if (gymRes.rows.length === 0) return null;

  const gym = gymRes.rows[0];
  const occupancy = parseInt(occupancyRes.rows[0].occupancy);
  const capacity_pct = gym.capacity > 0 ? Math.round((occupancy / gym.capacity) * 100) : 0;

  return {
    gym,
    occupancy,
    capacity_pct,
    today_revenue: parseFloat(revenueRes.rows[0].revenue),
    recent_events: eventsRes.rows,
    active_anomalies: anomaliesRes.rows,
  };
}

module.exports = { getGymOccupancy, getTodayRevenue, getAllGymsWithStats, getGymLiveSnapshot };
