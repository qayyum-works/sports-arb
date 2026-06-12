// index.js — full rewrite
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const { runScan } = require('./src/scanner');
const { sendTelegramAlert } = require('./src/notify');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    lastScan: lastScanTime,
    timestamp: new Date().toISOString()
  });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

let lastScanTime = null;

app.listen(PORT, () => {
  console.log(`🌐 Server listening on port ${PORT}`);
});

// Self-ping every 10 minutes to prevent Render free tier sleep
const SELF_URL = process.env.RENDER_EXTERNAL_URL; // Render provides this automatically

if (SELF_URL) {
  cron.schedule('*/10 * * * *', async () => {
    try {
      await axios.get(`${SELF_URL}/ping`, { timeout: 10000 });
      console.log('🔁 Self-ping successful');
    } catch (err) {
      console.log('Self-ping failed:', err.message);
    }
  });
} else {
  console.log('⚠️  RENDER_EXTERNAL_URL not set — self-ping disabled (normal for local dev)');
}

// Main scanning logic
async function scheduledScan() {
  lastScanTime = new Date().toISOString();
  await runScan();
}

(async () => {
  await sendTelegramAlert('🟢 Arb scanner started and running.');
  await scheduledScan();
})();

cron.schedule('*/15 * * * *', () => scheduledScan());

cron.schedule('*/3 * * * *', () => {
  const now = new Date();
  if (now.getHours() >= 6 && now.getHours() <= 23) {
    scheduledScan();
  }
});

console.log('🚀 Scanner running — 15min base + 3min during active hours.');