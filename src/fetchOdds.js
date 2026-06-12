const axios = require('axios');
require('dotenv').config();

async function fetchOdds() {
  try {
    const res = await axios.get(
      'https://api.the-odds-api.com/v4/sports/upcoming/odds',
      {
        params: {
          apiKey: process.env.ODDS_API_KEY,
          regions: 'eu,uk',        // combined = 1 request, not 2
          markets: 'h2h',
          oddsFormat: 'decimal'
        }
      }
    );

    const remaining = res.headers['x-requests-remaining'];
    const used = res.headers['x-requests-used'];
    console.log(`📊 API Usage — Used: ${used} | Remaining: ${remaining}`);

    return res.data;

  } catch (err) {
    console.error('Fetch error:', err.message);
    return [];
  }
}

module.exports = { fetchOdds };