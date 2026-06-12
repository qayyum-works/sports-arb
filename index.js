// index.js — full updated version
const cron = require('node-cron');
const { runScan } = require('./src/scanner');
const { sendTelegramAlert } = require('./src/notify');

(async () => {
  await sendTelegramAlert('🟢 Arb scanner started and running.');
  await runScan();
})();

cron.schedule('*/15 * * * *', () => runScan());

cron.schedule('*/3 * * * *', () => {
  const now = new Date();
  if (now.getHours() >= 6 && now.getHours() <= 23) {
    runScan();
  }
});

console.log('🚀 Scanner running — 15min base + 3min during active hours.');