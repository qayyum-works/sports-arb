// src/notify.js
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramAlert(message) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log('⚠️  Telegram not configured — skipping alert');
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      },
      { timeout: 10000 }
    );
    console.log('📲 Telegram alert sent');
  } catch (err) {
    console.error('Telegram send error:', err.response?.data || err.message);
  }
}

function formatArbAlert(opp, stakes) {
  let msg = `🚨 <b>ARB FOUND</b>\n\n`;
  msg += `<b>${opp.event}</b>\n`;
  msg += `Kickoff: ${new Date(opp.kickoff).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}\n`;
  msg += `Margin: <b>${opp.profitMargin}</b>\n\n`;
  msg += `<b>Stakes:</b>\n`;

  for (const [outcome, s] of Object.entries(stakes)) {
    msg += `→ ₦${s.stake} on <b>${outcome.toUpperCase()}</b> @ ${s.odds} (${s.book})\n`;
    msg += `   Returns: ₦${s.return}\n`;
  }

  return msg;
}

module.exports = { sendTelegramAlert, formatArbAlert };