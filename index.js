// index.js
const cron = require('node-cron');
const { runScan } = require('./src/scanner');
const { sendTelegramAlert } = require('./src/notify');

async function scheduledScan() {
  await runScan();
}

(async () => {
  await sendTelegramAlert('🟢 Arb scanner started (running locally via PM2).');
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