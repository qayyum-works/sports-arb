const Fuse = require('fuse.js');

// Common name normalization
function cleanName(name) {
  return name
    .toLowerCase()
    .replace(/\bu(\d{2})\b/g, '')      // remove U20, U23 etc for matching base teams
    .replace(/\bfc\b|\bsc\b|\bcf\b|\bac\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two matches refer to the same event
function isSameMatch(a, b, timeToleranceMins = 90) {
  const homeMatch = cleanName(a.home) === cleanName(b.home);
  const awayMatch = cleanName(a.away) === cleanName(b.away);

  if (!homeMatch || !awayMatch) return false;

  // Time proximity check
  const timeA = new Date(a.kickoff).getTime();
  const timeB = new Date(b.kickoff).getTime();
  const diffMins = Math.abs(timeA - timeB) / 60000;

  return diffMins <= timeToleranceMins;
}

// Fuzzy fallback for slightly different name spellings
function fuzzyIsSameMatch(a, b, timeToleranceMins = 90) {
  // Exact check first
  if (isSameMatch(a, b, timeToleranceMins)) return true;

  // Fuzzy check using Fuse
  const fuse = new Fuse([b], {
    keys: ['home', 'away'],
    threshold: 0.3,
    includeScore: true
  });

  const homeScore = fuse.search(cleanName(a.home));
  const awayScore = fuse.search(cleanName(a.away));

  const timeA = new Date(a.kickoff).getTime();
  const timeB = new Date(b.kickoff).getTime();
  const diffMins = Math.abs(timeA - timeB) / 60000;

  return (
    diffMins <= timeToleranceMins &&
    cleanName(a.home).includes(cleanName(b.home).split(' ')[0]) &&
    cleanName(a.away).includes(cleanName(b.away).split(' ')[0])
  );
}

// Merge matches from multiple sources into unified events
function mergeMatches(sourceArrays) {
  // sourceArrays = [sportybetMatches, bet9jaMatches, betkingMatches]
  const [primary, ...others] = sourceArrays;
  const merged = [];

  for (const baseMatch of primary) {
    const event = {
      home: baseMatch.home,
      away: baseMatch.away,
      kickoff: baseMatch.kickoff,
      odds: {
        home: [{ value: baseMatch.odds.home, source: baseMatch.source }],
        draw: baseMatch.odds.draw ? [{ value: baseMatch.odds.draw, source: baseMatch.source }] : [],
        away: [{ value: baseMatch.odds.away, source: baseMatch.source }]
      }
    };

    // Try to find this match in other sources
    for (const otherList of others) {
      const found = otherList.find(m => fuzzyIsSameMatch(baseMatch, m));

      if (found) {
        event.odds.home.push({ value: found.odds.home, source: found.source });
        if (found.odds.draw) event.odds.draw.push({ value: found.odds.draw, source: found.source });
        event.odds.away.push({ value: found.odds.away, source: found.source });
      }
    }

    // Only keep events found on 2+ platforms (otherwise no arb possible)
    if (event.odds.home.length >= 2) {
      merged.push(event);
    }
  }

  return merged;
}

module.exports = { cleanName, isSameMatch, fuzzyIsSameMatch, mergeMatches };