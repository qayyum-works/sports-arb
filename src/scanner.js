const fs = require("fs");
const path = require("path");

const sportybet = require("./scrapers/sportybet");
const bet9ja = require("./scrapers/bet9ja");
const betking = require("./scrapers/betking");
const { mergeMatches } = require("./normalize");
const { findArbs, getCloseCalls } = require("./detectArb");
const { calcStakes } = require("./calcStakes");
const { sendTelegramAlert, formatArbAlert } = require("./notify");

const LOGS_DIR = path.join(__dirname, "../logs");
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

async function runScan() {
  console.log(`\n🔍 Scanning at ${new Date().toLocaleTimeString()}...\n`);

  const [sportyMatches, bet9jaMatches, betkingMatches] = await Promise.all([
    sportybet.getUpcomingMatches(),
    bet9ja.getUpcomingMatches(),
    betking.getUpcomingMatches(),
  ]);

  console.log(
    `\n📊 Raw counts — SportyBet: ${sportyMatches.length} | Bet9ja: ${bet9jaMatches.length} | BetKing: ${betkingMatches.length}`,
  );

  const merged = mergeMatches([sportyMatches, bet9jaMatches, betkingMatches]);
  console.log(`🔗 Matched across 2+ platforms: ${merged.length} events`);

  const arbs = findArbs(merged);

  if (arbs.length === 0) {
    console.log("\n❌ No arb opportunities this scan.");

    const closeCalls = getCloseCalls(merged, 1.1); // within 10%
    if (closeCalls.length > 0) {
      console.log("\n📈 Closest misses (lower = closer to arb):");
      closeCalls.slice(0, 5).forEach((c) => {
        console.log(`   ${c.event} — Arb%: ${c.arbPercent} (${c.gap} over)`);
      });

      // src/scanner.js — after closeCalls block, add:
      const closeCallLog = {
        timestamp: new Date().toISOString(),
        closeCalls,
      };

      const logFile = path.join(LOGS_DIR, "close_calls_history.jsonl");
      fs.appendFileSync(logFile, JSON.stringify(closeCallLog) + "\n");
    }
    return;
  }

  for (const opp of arbs) {
    console.log(`\n✅ ARB FOUND: ${opp.event}`);
    console.log(`   Kickoff: ${new Date(opp.kickoff).toLocaleString()}`);
    console.log(`   Margin: ${opp.profitMargin}`);

    const stakes = calcStakes(opp, parseFloat(process.env.TOTAL_STAKE));
    console.log("\n   Stake Distribution:");
    for (const [outcome, s] of Object.entries(stakes)) {
      console.log(
        `   → ₦${s.stake} on [${outcome.toUpperCase()}] @ ${s.odds} — ${s.book}`,
      );
      console.log(`     Returns: ₦${s.return}`);
    }
    
    // Send Telegram alert
    await sendTelegramAlert(formatArbAlert(opp, stakes));
  }

  fs.writeFileSync(
    path.join(LOGS_DIR, "opportunities.json"),
    JSON.stringify(arbs, null, 2),
  );
}

module.exports = { runScan };
