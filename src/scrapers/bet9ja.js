const axios = require('axios');

async function getMatches(dispCode = 1001) { // 1000=today, 1001=tomorrow
  try {
    const res = await axios.get(
      'https://sports.bet9ja.com/mobile/feapi/PalimpsestAjax/GetEventsInDailyBundleV3',
      {
        params: {
          SPORTID: 1,
          MKTKEY: 'S_1X2',
          DISP: dispCode,
          DISPH: 0,
          SORTBY: 'date',
          SORTTYPE: 'asc',
          v_cache_version: '1.315.10.236'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
          'Referer': `https://sports.bet9ja.com/mobile/dailybundle/soccer/1-${dispCode}/S_1X2`,
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    const events = res.data?.D?.E || [];
    const groups = res.data?.D?.G || {};

    const matches = [];

    for (const ev of events) {
      try {
        // Split "Team A - Team B" — only on FIRST " - " occurrence
        const sepIndex = ev.N.indexOf(' - ');
        if (sepIndex === -1) continue;

        const home = ev.N.substring(0, sepIndex).trim();
        const away = ev.N.substring(sepIndex + 3).trim();

        const homeOdds = parseFloat(ev.O?.S_1X2_1);
        const drawOdds = parseFloat(ev.O?.S_1X2_X);
        const awayOdds = parseFloat(ev.O?.S_1X2_2);

        if (!homeOdds || !awayOdds) continue;

        // Bet9ja times are WAT (UTC+1) — convert to proper ISO
        const kickoff = new Date(ev.D.replace(' ', 'T') + '+01:00');

        matches.push({
          home,
          away,
          kickoff: kickoff.toISOString(),
          league: groups[ev.GID]?.N || 'Unknown',
          odds: { home: homeOdds, draw: drawOdds || null, away: awayOdds },
          source: 'Bet9ja'
        });

      } catch (_) { continue; }
    }

    console.log(`✅ Bet9ja: ${matches.length} matches (DISP=${dispCode})`);
    return matches;

  } catch (err) {
    console.error('Bet9ja API error:', err.message);
    return [];
  }
}

// Helper: get both today + tomorrow combined
async function getUpcomingMatches() {
  const [today, tomorrow] = await Promise.all([
    getMatches(1000),
    getMatches(1001)
  ]);
  return [...today, ...tomorrow];
}

module.exports = { getMatches, getUpcomingMatches };