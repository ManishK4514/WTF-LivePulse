const http = require('http');
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const { initWS } = require('./websocket/broadcast');
const anomalyDetector = require('./jobs/anomalyDetector');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/gyms', require('./routes/gyms'));
app.use('/api/anomalies', require('./routes/anomalies'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/simulator', require('./routes/simulator'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
initWS(server);

async function runSeedIfNeeded() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM gyms');
  if (parseInt(rows[0].count) === 0) {
    console.log('Database empty, running seed...');
    await new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      const proc = exec('node src/db/seeds/seed.js', { env: process.env });
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
      proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Seed exited with code ${code}`))));
    });
  } else {
    console.log('Database already seeded.');
  }
}

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection established.');

    await runSeedIfNeeded();

    anomalyDetector.start();

    // Refresh materialized view every 15 minutes
    setInterval(async () => {
      try {
        await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY gym_hourly_stats');
      } catch {}
    }, 15 * 60 * 1000);

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`WTF LivePulse backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server };
