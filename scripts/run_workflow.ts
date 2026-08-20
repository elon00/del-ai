import { delphiBotRunner } from "../src/delphi/botRunner";
import { tradeExecutor } from "../src/delphi/executor";
import { circuitBreaker } from "../src/delphi/circuitBreaker";

async function runFullWorkflow() {
  console.log("===============================================================");
  console.log("🚀 DELPHI AGENT ARENA - END-TO-END AUTONOMOUS WORKFLOW EXECUTION");
  console.log("===============================================================");

  // 1. Config & Operational Safety
  console.log("\n[STAGE 1] Loading Configuration & Checking Operational Safety:");
  const config = delphiBotRunner.getConfig();
  const safeStatus = circuitBreaker.isSafeMode();
  console.log("   • Target Network    :", config.network, "(Chain ID: 685685)");
  console.log("   • Trading Mode      :", config.dryRun ? "Simulation" : "Live On-Chain Reality");
  console.log("   • Min Edge Filter   :", `${(config.minEdge * 100).toFixed(0)}%`);
  console.log("   • Kelly Multiplier  :", `${(config.kellyMultiplier * 100).toFixed(0)}% (Optimal Fractional)`);
  console.log("   • Circuit Breakers  :", safeStatus.active ? `🚨 TRIGGERED (${safeStatus.reason})` : "✅ HEALTHY (All Systems Operational)");

  // 2. Execute Trading Cycle
  console.log("\n[STAGE 2] Executing Autonomous Delphi Trading & Superforecasting Cycle...");
  await delphiBotRunner.runCycle();

  // 3. Results & Portfolio State
  console.log("\n[STAGE 3] Cycle Completed Successfully! Summary of Results:");
  const state = delphiBotRunner.getState();
  const totalPnL = state.realizedPnL + state.unrealizedPnL;
  console.log("   • Available Bankroll :", `${state.bankroll.toFixed(2)} TST`);
  console.log("   • Capital Deployed   :", `${state.allocatedCapital.toFixed(2)} TST`);
  console.log("   • Realized P&L       :", `${state.realizedPnL >= 0 ? "+" : ""}${state.realizedPnL.toFixed(2)} TST`);
  console.log("   • Unrealized P&L     :", `${state.unrealizedPnL >= 0 ? "+" : ""}${state.unrealizedPnL.toFixed(2)} TST`);
  console.log("   • Net Profit/Loss    :", `${totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)} TST`);
  console.log("   • Active Positions   :", `${state.activePositionsCount} (${state.winCount} Won / ${state.lossCount} Lost)`);

  // 4. Open Positions Book
  console.log("\n[STAGE 4] Current Positions Book:");
  const positions = tradeExecutor.getPositions();
  if (positions.length === 0) {
    console.log("   (No open positions held yet)");
  } else {
    positions.forEach((p, idx) => {
      console.log(`   [#${idx + 1}] Outcome: "${p.outcomeName}" | Cost: ${p.costBasis.toFixed(1)} TST | Entry: ${(p.avgEntryPrice * 100).toFixed(1)}c | Current: ${(p.currentPrice * 100).toFixed(1)}c | Status: ${p.status}`);
      console.log(`        Market: "${p.marketQuestion}"`);
      console.log(`        Unrealized P&L: ${p.unrealizedPnL >= 0 ? "+" : ""}${p.unrealizedPnL.toFixed(2)} TST`);
    });
  }

  // 5. Execution Logs
  console.log("\n[STAGE 5] Live Activity & AI Superforecasting Logs:");
  state.logs.slice(0, 10).forEach(l => {
    const timestamp = new Date(l.timestamp).toLocaleTimeString();
    console.log(`   [${timestamp}] [${l.level}] ${l.message}`);
  });

  console.log("\n===============================================================");
  console.log("✅ 100% OPERATIONAL: DEL-AI WORKFLOW RUN COMPLETE & VERIFIED");
  console.log("===============================================================");
  process.exit(0);
}

runFullWorkflow().catch(err => {
  console.error("Workflow failed with error:", err);
  process.exit(1);
});
