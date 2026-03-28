const pool = require('../db/pool');

async function checkZeroCheckins(gym) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM checkins
     WHERE gym_id = $1
       AND checked_in >= NOW() - INTERVAL '2 hours'`,
    [gym.id]
  );
  return parseInt(rows[0].cnt) === 0;
}

async function checkCapacityBreach(gym) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM checkins
     WHERE gym_id = $1 AND checked_out IS NULL`,
    [gym.id]
  );
  const occupancy = parseInt(rows[0].cnt);
  return occupancy / gym.capacity > 0.90 ? occupancy : false;
}

async function checkCapacityResolved(gym) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM checkins
     WHERE gym_id = $1 AND checked_out IS NULL`,
    [gym.id]
  );
  const occupancy = parseInt(rows[0].cnt);
  return occupancy / gym.capacity < 0.85;
}

async function checkRevenueDrop(gym) {
  const today = new Date();
  const todayDow = today.getDay();

  const { rows: todayRows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM payments
     WHERE gym_id = $1
       AND paid_at >= CURRENT_DATE`,
    [gym.id]
  );

  const { rows: lastWeekRows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM payments
     WHERE gym_id = $1
       AND paid_at >= (CURRENT_DATE - INTERVAL '7 days')
       AND paid_at < (CURRENT_DATE - INTERVAL '6 days')`,
    [gym.id]
  );

  const todayRevenue = parseFloat(todayRows[0].total);
  const lastWeekRevenue = parseFloat(lastWeekRows[0].total);

  if (lastWeekRevenue === 0) return false;
  return todayRevenue < lastWeekRevenue * 0.70;
}

async function checkRevenueResolved(gym) {
  const { rows: todayRows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM payments
     WHERE gym_id = $1
       AND paid_at >= CURRENT_DATE`,
    [gym.id]
  );

  const { rows: lastWeekRows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM payments
     WHERE gym_id = $1
       AND paid_at >= (CURRENT_DATE - INTERVAL '7 days')
       AND paid_at < (CURRENT_DATE - INTERVAL '6 days')`,
    [gym.id]
  );

  const todayRevenue = parseFloat(todayRows[0].total);
  const lastWeekRevenue = parseFloat(lastWeekRows[0].total);

  if (lastWeekRevenue === 0) return true;
  return todayRevenue >= lastWeekRevenue * 0.80;
}

async function getActiveAnomaly(gym_id, type) {
  const { rows } = await pool.query(
    `SELECT id FROM anomalies
     WHERE gym_id = $1 AND type = $2 AND resolved = FALSE
     LIMIT 1`,
    [gym_id, type]
  );
  return rows[0] || null;
}

async function insertAnomaly(gym_id, type, severity, message) {
  const { rows } = await pool.query(
    `INSERT INTO anomalies (gym_id, type, severity, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [gym_id, type, severity, message]
  );
  return rows[0];
}

async function resolveAnomaly(id) {
  const { rows } = await pool.query(
    `UPDATE anomalies SET resolved = TRUE, resolved_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
}

function isWithinOperatingHours(gym) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = gym.opens_at.split(':').map(Number);
  const [closeH, closeM] = gym.closes_at.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

module.exports = {
  checkZeroCheckins,
  checkCapacityBreach,
  checkCapacityResolved,
  checkRevenueDrop,
  checkRevenueResolved,
  getActiveAnomaly,
  insertAnomaly,
  resolveAnomaly,
  isWithinOperatingHours,
};
