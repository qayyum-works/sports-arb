require('dotenv').config();

function calcStakes(opportunity, totalStake) {
  const stake = totalStake || parseFloat(process.env.TOTAL_STAKE);
  const arbPercent = parseFloat(opportunity.arbPercent);

  const stakes = {};

  for (const [outcome, leg] of Object.entries(opportunity.legs)) {
    const legStake = (stake * arbPercent) / leg.odds;
    stakes[outcome] = {
      book: leg.book,
      odds: leg.odds,
      stake: legStake.toFixed(2),
      return: (legStake * leg.odds).toFixed(2)
    };
  }

  return stakes;
}

module.exports = { calcStakes };