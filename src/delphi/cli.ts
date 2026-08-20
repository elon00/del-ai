import { delphiBotRunner } from "./botRunner";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("=================================================");
  console.log("🏆 DELPHI AGENT ARENA - #1 AUTONOMOUS TRADING BOT");
  console.log("=================================================");

  const config = delphiBotRunner.getConfig();
  console.log(`📡 Network: ${config.network}`);
  console.log(`🤖 Mode: ${config.dryRun ? "SIMULATION (Safe Dry-Run)" : "LIVE ON-CHAIN TRADING"}`);
  console.log(`🎯 Min Edge: ${(config.minEdge * 100).toFixed(0)}% | Kelly Multiplier: ${(config.kellyMultiplier * 100).toFixed(0)}%`);
  console.log(`⏱️ Loop Interval: ${config.pollIntervalMs / 1000}s`);
  console.log("-------------------------------------------------");

  delphiBotRunner.subscribe(state => {
    const lastLog = state.logs[0];
    if (lastLog) {
      const color =
        lastLog.level === "TRADE" ? "\x1b[32m" :
        lastLog.level === "ALPHA" ? "\x1b[36m" :
        lastLog.level === "REDEEM" ? "\x1b[35m" :
        lastLog.level === "WARN" ? "\x1b[33m" :
        lastLog.level === "ERROR" ? "\x1b[31m" : "\x1b[37m";
      console.log(`${color}[${lastLog.level}] ${lastLog.message}\x1b[0m`);
    }
  });

  // Start the continuous autonomous loop
  await delphiBotRunner.start();
}

main().catch(err => {
  console.error("Fatal bot error:", err);
  process.exit(1);
});
