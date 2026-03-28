const request = require('supertest');

// Use a test-specific app that doesn't auto-seed or start background jobs
let app;
let server;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://wtf:wtf_secret@localhost:5432/wtf_livepulse';

  // Require the app but we need to handle the async startup
  // The app starts the server itself, so we import it after setting env
  const mod = require('../../src/app');
  app = mod.app;
  server = mod.server;

  // Wait briefly for server to be ready
  await new Promise((r) => setTimeout(r, 500));
});

afterAll(async () => {
  if (server) server.close();
});

describe('GET /api/gyms', () => {
  test('returns array of 10 items', async () => {
    const res = await request(app).get('/api/gyms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(10);
  });

  test('returns correct fields', async () => {
    const res = await request(app).get('/api/gyms');
    expect(res.status).toBe(200);
    const gym = res.body[0];
    expect(gym).toHaveProperty('id');
    expect(gym).toHaveProperty('name');
    expect(gym).toHaveProperty('city');
    expect(gym).toHaveProperty('capacity');
    expect(gym).toHaveProperty('current_occupancy');
    expect(gym).toHaveProperty('today_revenue');
    expect(gym).toHaveProperty('status');
  });
});

describe('GET /api/gyms/:id/live', () => {
  let gymId;

  beforeAll(async () => {
    const res = await request(app).get('/api/gyms');
    gymId = res.body[0]?.id;
  });

  test('returns all required fields', async () => {
    const res = await request(app).get(`/api/gyms/${gymId}/live`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('occupancy');
    expect(res.body).toHaveProperty('capacity_pct');
    expect(res.body).toHaveProperty('today_revenue');
    expect(res.body).toHaveProperty('recent_events');
    expect(res.body).toHaveProperty('active_anomalies');
  });

  test('returns 404 for unknown gym id', async () => {
    const res = await request(app).get('/api/gyms/00000000-0000-0000-0000-000000000000/live');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/anomalies', () => {
  test('returns array (empty is fine)', async () => {
    const res = await request(app).get('/api/anomalies');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('severity=critical filter returns only critical anomalies', async () => {
    const res = await request(app).get('/api/anomalies?severity=critical');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const a of res.body) {
      expect(a.severity).toBe('critical');
    }
  });
});

describe('PATCH /api/anomalies/:id/dismiss', () => {
  test('returns 403 when severity is critical', async () => {
    const pool = require('../../src/db/pool');
    // Insert a test critical anomaly
    const { rows: gyms } = await pool.query('SELECT id FROM gyms LIMIT 1');
    const gymId = gyms[0].id;
    const { rows } = await pool.query(
      `INSERT INTO anomalies (gym_id, type, severity, message)
       VALUES ($1, 'capacity_breach', 'critical', 'test critical') RETURNING id`,
      [gymId]
    );
    const anomalyId = rows[0].id;

    const res = await request(app).patch(`/api/anomalies/${anomalyId}/dismiss`);
    expect(res.status).toBe(403);

    // cleanup
    await pool.query('DELETE FROM anomalies WHERE id = $1', [anomalyId]);
  });

  test('returns 404 for unknown anomaly id', async () => {
    const res = await request(app).patch('/api/anomalies/00000000-0000-0000-0000-000000000000/dismiss');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/simulator/*', () => {
  test('POST /start returns { status: "running", speed: 1 }', async () => {
    const res = await request(app).post('/api/simulator/start').send({ speed: 1 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('running');
    expect(res.body.speed).toBe(1);
  });

  test('POST /stop returns { status: "paused" }', async () => {
    const res = await request(app).post('/api/simulator/stop');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paused');
  });

  test('POST /reset returns { status: "reset" }', async () => {
    const res = await request(app).post('/api/simulator/reset');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reset');
  });
});

describe('GET /api/analytics/cross-gym', () => {
  test('returns 10 gyms sorted by total_revenue desc', async () => {
    const res = await request(app).get('/api/analytics/cross-gym');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(10);

    // Verify sorted descending
    for (let i = 1; i < res.body.length; i++) {
      expect(parseFloat(res.body[i - 1].total_revenue)).toBeGreaterThanOrEqual(
        parseFloat(res.body[i].total_revenue)
      );
    }
  });
});
