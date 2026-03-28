const { WebSocketServer, OPEN } = require('ws');

let wss = null;

function initWS(server) {
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    ws.on('error', () => {});
  });
  console.log('WebSocket server initialized');
  return wss;
}

function broadcast(payload) {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === OPEN) {
      client.send(msg);
    }
  }
}

module.exports = { initWS, broadcast };
