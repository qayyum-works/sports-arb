const axios = require('axios');

async function getUpcomingMatches() {
  try {
    const res = await axios.get(
      'https://sportsapicdn-desktop.betking.com/api/feeds/prematch/lastminute/en/1/100/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.betking.com/sports/s/football/',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    const areaMatches = res.data?.AreaMatches || [];
    const matches = [];

    for (const area of areaMatches) {
      if (area.SportName !== 'Football') continue;

      for (const item of area.Items || []) {
        try {
          // Split "Team A - Team B" on first " - "
          const sepIndex = item.ItemName.indexOf(' - ');
          if (sepIndex === -1) continue;

          const home = item.ItemName.substring(0, sepIndex).trim();
          const away = item.ItemName.substring(sepIndex + 3).trim();

          // Find 1X2 odds collection
          const oddsCollection = item.OddsCollection?.find(
            oc => oc.OddsType?.OddsTypeName === '1X2'
          );
          if (!oddsCollection) continue;

          // Dedupe MatchOdds by OddName, take first occurrence
          const seen = {};
          for (const mo of oddsCollection.MatchOdds || []) {
            const key = mo.OddAttribute?.OddName;
            if (key && !(key in seen)) {
              seen[key] = mo.Outcome?.OddOutcome;
            }
          }

          const homeOdds = parseFloat(seen['1']);
          const drawOdds = parseFloat(seen['X']);
          const awayOdds = parseFloat(seen['2']);

          if (!homeOdds || !awayOdds) continue;

          matches.push({
            home,
            away,
            kickoff: new Date(item.ItemDate).toISOString(),
            odds: { home: homeOdds, draw: drawOdds || null, away: awayOdds },
            source: 'BetKing'
          });

        } catch (_) { continue; }
      }
    }

    console.log(`✅ BetKing: ${matches.length} matches`);
    return matches;

  } catch (err) {
    console.error('BetKing API error:', err.message);
    return [];
  }
}

module.exports = { getUpcomingMatches };