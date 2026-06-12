const axios = require("axios");

const API_URL = "https://www.sportybet.com/api/ng/factsCenter/pcUpcomingEvents";

async function getUpcomingMatches() {
  try {
    const res = await axios.get(API_URL, {
      params: {
        sportId: "sr:sport:1",
        marketId: "1",
        pageSize: 100,
        pageNum: 1,
        option: 1,
        _t: Date.now(),
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.sportybet.com/ng/sport/football",
      },
      timeout: 10000,
    });

    const tournaments = res.data?.data?.tournaments || [];
    const matches = [];
    const now = new Date();
    const hours = parseFloat(process.env.LOOKAHEAD_HOURS || 3);
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

    for (const tournament of tournaments) {
      for (const event of tournament.events || []) {
        try {
          const kickoff = new Date(event.estimateStartTime);

          // Only matches in next 3 hours
          if (kickoff < now || kickoff > cutoff) continue;

          // Get 1X2 market
          const market = event.markets?.find((m) => m.id === "1");
          if (!market) continue;

          const outcomes = market.outcomes || [];

          // Confirmed IDs: "1" = Home, "2" = Draw, "3" = Away
          const homeOdds = parseFloat(outcomes.find((o) => o.id === "1")?.odds);
          const drawOdds = parseFloat(outcomes.find((o) => o.id === "2")?.odds);
          const awayOdds = parseFloat(outcomes.find((o) => o.id === "3")?.odds);

          if (!homeOdds || !awayOdds) continue;

          matches.push({
            home: event.homeTeamName,
            away: event.awayTeamName,
            srId: event.eventId, // sr:match:XXXXXXX
            sourceId:
              event.eventSource?.preMatchSource?.sourceId, // raw BetRadar ID if needed
            kickoff: kickoff.toISOString(),
            tournament: tournament.name,
            odds: {
              home: homeOdds,
              draw: drawOdds || null,
              away: awayOdds,
            },
            source: "SportyBet",
          });
        } catch (_) {
          continue;
        }
      }
    }

    console.log(`✅ SportyBet: ${matches.length} matches in next ${hours} hours`);
    return matches;
  } catch (err) {
    console.error("SportyBet API error:", err.message);
    return [];
  }
}

module.exports = { getUpcomingMatches };
