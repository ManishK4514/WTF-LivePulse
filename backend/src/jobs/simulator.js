const pool = require('../db/pool');
const { broadcast } = require('../websocket/broadcast');
const { getState, setState } = require('../services/simulatorService');

const SPEED_INTERVALS = { 1: 2000, 5: 400, 10: 200 };

function currentHour() {
  return new Date().getHours();
}

function isPeakHour() {
  const h = currentHour();
  return (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
}

async function getRandomGym() {
  const { rows } = await pool.query(
    `SELECT id, name, capacity FROM gyms WHERE status = 'active' ORDER BY RANDOM() LIMIT 1`
  );
  return rows[0] || null;
}

async function doCheckin(gym) {
  const { rows: members } = await pool.query(
    `SELECT m.id, m.name FROM members m
     WHERE m.gym_id = $1
       AND m.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM checkins c
         WHERE c.member_id = m.id AND c.checked_out IS NULL
       )
     ORDER BY RANDOM()
     LIMIT 1`,
    [gym.id]
  );

  if (!members.length) return null;
  const member = members[0];

  await pool.query(
    `INSERT INTO checkins (member_id, gym_id, checked_in)
     VALUES ($1, $2, NOW())`,
    [member.id, gym.id]
  );

  await pool.query(
    `UPDATE members SET last_checkin_at = NOW() WHERE id = $1`,
    [member.id]
  );

  const { rows: occ } = await pool.query(
    `SELECT COUNT(*) AS cnt FROM checkins WHERE gym_id = $1 AND checked_out IS NULL`,
    [gym.id]
  );
  const occupancy = parseInt(occ[0].cnt);
  const capacity_pct = Math.round((occupancy / gym.capacity) * 100);

  broadcast({
    type: 'CHECKIN_EVENT',
    gym_id: gym.id,
    member_name: member.name,
    timestamp: new Date().toISOString(),
    current_occupancy: occupancy,
    capacity_pct,
  });

  return member;
}

async function doCheckout(gym) {
  const { rows: checkins } = await pool.query(
    `SELECT c.id, m.name AS member_name
     FROM checkins c JOIN members m ON m.id = c.member_id
     WHERE c.gym_id = $1 AND c.checked_out IS NULL
     ORDER BY RANDOM()
     LIMIT 1`,
    [gym.id]
  );

  if (!checkins.length) return null;
  const checkin = checkins[0];

  await pool.query(
    `UPDATE checkins SET checked_out = NOW() WHERE id = $1`,
    [checkin.id]
  );

  const { rows: occ } = await pool.query(
    `SELECT COUNT(*) AS cnt FROM checkins WHERE gym_id = $1 AND checked_out IS NULL`,
    [gym.id]
  );
  const occupancy = parseInt(occ[0].cnt);
  const capacity_pct = Math.round((occupancy / gym.capacity) * 100);

  broadcast({
    type: 'CHECKOUT_EVENT',
    gym_id: gym.id,
    member_name: checkin.member_name,
    timestamp: new Date().toISOString(),
    current_occupancy: occupancy,
    capacity_pct,
  });

  return checkin;
}

async function doPayment(gym) {
  const { rows: members } = await pool.query(
    `SELECT id, name, plan_type FROM members
     WHERE gym_id = $1 AND status = 'active'
     ORDER BY RANDOM() LIMIT 1`,
    [gym.id]
  );

  if (!members.length) return;
  const member = members[0];

  const amounts = { monthly: 1499, quarterly: 3999, annual: 11999 };
  const amount = amounts[member.plan_type] || 1499;

  await pool.query(
    `INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type)
     VALUES ($1, $2, $3, $4, 'renewal')`,
    [member.id, gym.id, amount, member.plan_type]
  );

  const { rows: total } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS t FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE`,
    [gym.id]
  );

  broadcast({
    type: 'PAYMENT_EVENT',
    gym_id: gym.id,
    amount,
    plan_type: member.plan_type,
    member_name: member.name,
    today_total: parseFloat(total[0].t),
  });
}

async function tick() {
  try {
    const gym = await getRandomGym();
    if (!gym) return;

    const preferCheckin = isPeakHour() ? Math.random() < 0.65 : Math.random() < 0.35;

    if (preferCheckin) {
      const result = await doCheckin(gym);
      if (!result) await doCheckout(gym);
    } else {
      const result = await doCheckout(gym);
      if (!result) await doCheckin(gym);
    }

    if (Math.random() < 0.05) {
      await doPayment(gym);
    }
  } catch {}
}

function start(speed = 1) {
  const state = getState();
  if (state.intervalId) clearInterval(state.intervalId);

  const interval = SPEED_INTERVALS[speed] || SPEED_INTERVALS[1];
  const intervalId = setInterval(tick, interval);
  setState({ running: true, speed, intervalId });
  console.log(`Simulator started at ${speed}x speed`);
}

function stop() {
  const state = getState();
  if (state.intervalId) {
    clearInterval(state.intervalId);
    setState({ running: false, intervalId: null });
  }
}

async function reset() {
  stop();
  await pool.query(`UPDATE checkins SET checked_out = NOW() WHERE checked_out IS NULL`);
  console.log('Simulator reset: all open check-ins closed');
}

module.exports = { start, stop, reset };
