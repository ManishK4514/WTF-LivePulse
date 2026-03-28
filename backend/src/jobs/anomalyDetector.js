const pool = require('../db/pool');
const { broadcast } = require('../websocket/broadcast');
const svc = require('../services/anomalyService');

let intervalId = null;

async function runDetection() {
  let gyms;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, city, capacity, status, opens_at::text, closes_at::text FROM gyms WHERE status = 'active'`
    );
    gyms = rows;
  } catch {
    return;
  }

  for (const gym of gyms) {
    await detectZeroCheckins(gym);
    await detectCapacityBreach(gym);
    await detectRevenueDrop(gym);
  }
}

async function detectZeroCheckins(gym) {
  try {
    const withinHours = svc.isWithinOperatingHours(gym);
    const existing = await svc.getActiveAnomaly(gym.id, 'zero_checkins');

    if (!withinHours) {
      if (existing) await svc.resolveAnomaly(existing.id);
      return;
    }

    const isZero = await svc.checkZeroCheckins(gym);

    if (isZero && !existing) {
      const anomaly = await svc.insertAnomaly(
        gym.id, 'zero_checkins', 'warning',
        `No check-ins at ${gym.name} in the last 2 hours during operating hours`
      );
      broadcast({
        type: 'ANOMALY_DETECTED',
        anomaly_id: anomaly.id,
        gym_id: gym.id,
        gym_name: gym.name,
        anomaly_type: 'zero_checkins',
        severity: 'warning',
        message: anomaly.message,
      });
    } else if (!isZero && existing) {
      const resolved = await svc.resolveAnomaly(existing.id);
      broadcast({
        type: 'ANOMALY_RESOLVED',
        anomaly_id: resolved.id,
        gym_id: gym.id,
        resolved_at: resolved.resolved_at,
      });
    }
  } catch {}
}

async function detectCapacityBreach(gym) {
  try {
    const existing = await svc.getActiveAnomaly(gym.id, 'capacity_breach');
    const occupancy = await svc.checkCapacityBreach(gym);

    if (occupancy && !existing) {
      const pct = Math.round((occupancy / gym.capacity) * 100);
      const anomaly = await svc.insertAnomaly(
        gym.id, 'capacity_breach', 'critical',
        `${gym.name} at ${pct}% capacity (${occupancy}/${gym.capacity} members)`
      );
      broadcast({
        type: 'ANOMALY_DETECTED',
        anomaly_id: anomaly.id,
        gym_id: gym.id,
        gym_name: gym.name,
        anomaly_type: 'capacity_breach',
        severity: 'critical',
        message: anomaly.message,
      });
    } else if (!occupancy && existing) {
      const resolved = await svc.resolveAnomaly(existing.id);
      broadcast({
        type: 'ANOMALY_RESOLVED',
        anomaly_id: resolved.id,
        gym_id: gym.id,
        resolved_at: resolved.resolved_at,
      });
    }
  } catch {}
}

async function detectRevenueDrop(gym) {
  try {
    const existing = await svc.getActiveAnomaly(gym.id, 'revenue_drop');
    const isDrop = await svc.checkRevenueDrop(gym);

    if (isDrop && !existing) {
      const anomaly = await svc.insertAnomaly(
        gym.id, 'revenue_drop', 'warning',
        `${gym.name} revenue today is more than 30% below same day last week`
      );
      broadcast({
        type: 'ANOMALY_DETECTED',
        anomaly_id: anomaly.id,
        gym_id: gym.id,
        gym_name: gym.name,
        anomaly_type: 'revenue_drop',
        severity: 'warning',
        message: anomaly.message,
      });
    } else if (!isDrop && existing) {
      const isRecovered = await svc.checkRevenueResolved(gym);
      if (isRecovered) {
        const resolved = await svc.resolveAnomaly(existing.id);
        broadcast({
          type: 'ANOMALY_RESOLVED',
          anomaly_id: resolved.id,
          gym_id: gym.id,
          resolved_at: resolved.resolved_at,
        });
      }
    }
  } catch {}
}

function start() {
  if (intervalId) return;
  runDetection();
  intervalId = setInterval(runDetection, 30000);
  console.log('Anomaly detector started (30s interval)');
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { start, stop, runDetection };
