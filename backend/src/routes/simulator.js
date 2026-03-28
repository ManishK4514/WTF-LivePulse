const express = require('express');
const router = express.Router();
const simulator = require('../jobs/simulator');
const { getState } = require('../services/simulatorService');

router.post('/start', async (req, res) => {
  const speed = [1, 5, 10].includes(Number(req.body.speed)) ? Number(req.body.speed) : 1;
  simulator.start(speed);
  res.json({ status: 'running', speed });
});

router.post('/stop', (req, res) => {
  simulator.stop();
  res.json({ status: 'paused' });
});

router.post('/reset', async (req, res) => {
  await simulator.reset();
  res.json({ status: 'reset' });
});

router.get('/status', (req, res) => {
  const { running, speed } = getState();
  res.json({ running, speed });
});

module.exports = router;
