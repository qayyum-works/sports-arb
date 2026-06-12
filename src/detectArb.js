function getBestOdds(oddsArray) {
  if (!oddsArray || oddsArray.length === 0) return null;
  return oddsArray.reduce((best, curr) =>
    curr.value > best.value ? curr : best
  );
}

function findArbs(mergedEvents) {
  const opportunities = [];

  for (const event of mergedEvents) {
    const bestHome = getBestOdds(event.odds.home);
    const bestDraw = getBestOdds(event.odds.draw);
    const bestAway = getBestOdds(event.odds.away);

    // Need at least home + away; draw is optional but usually present
    if (!bestHome || !bestAway) continue;

    const outcomes = [bestHome, bestAway];
    if (bestDraw) outcomes.push(bestDraw);

    const arbPercent = outcomes.reduce((sum, o) => sum + (1 / o.value), 0);

    if (arbPercent < 1.0) {
      opportunities.push({
        event: `${event.home} vs ${event.away}`,
        kickoff: event.kickoff,
        arbPercent: arbPercent.toFixed(4),
        profitMargin: ((1 - arbPercent) * 100).toFixed(2) + '%',
        legs: {
          home: { odds: bestHome.value, book: bestHome.source },
          ...(bestDraw ? { draw: { odds: bestDraw.value, book: bestDraw.source } } : {}),
          away: { odds: bestAway.value, book: bestAway.source }
        }
      });
    }
  }

  return opportunities;
}

function getCloseCalls(mergedEvents, threshold = 1.05) {
  const closeCalls = [];

  for (const event of mergedEvents) {
    const bestHome = getBestOdds(event.odds.home);
    const bestDraw = getBestOdds(event.odds.draw);
    const bestAway = getBestOdds(event.odds.away);

    if (!bestHome || !bestAway) continue;

    const outcomes = [bestHome, bestAway];
    if (bestDraw) outcomes.push(bestDraw);

    const arbPercent = outcomes.reduce((sum, o) => sum + (1 / o.value), 0);

    if (arbPercent < threshold) {
      closeCalls.push({
        event: `${event.home} vs ${event.away}`,
        arbPercent: arbPercent.toFixed(4),
        gap: ((arbPercent - 1) * 100).toFixed(2) + '%'
      });
    }
  }

  return closeCalls.sort((a, b) => a.arbPercent - b.arbPercent);
}

module.exports = { findArbs, getCloseCalls };