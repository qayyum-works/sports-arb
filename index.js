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

app.get('/test-betking', async (req, res) => {
  const axios = require('axios');
  try {
    const response = await axios.get(
      'https://sportsapicdn-desktop.betking.com/api/feeds/prematch/lastminute/en/1/50/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.betking.com/sports/s/football/',
          'Origin': 'https://www.betking.com',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-NG,en;q=0.9',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site'
        },
        timeout: 10000
      }
    );
    res.json({ success: true, dataSize: JSON.stringify(response.data).length });
  } catch (err) {
    res.json({
      success: false,
      status: err.response?.status,
      headers: err.response?.headers,
      data: err.response?.data
    });
  }
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