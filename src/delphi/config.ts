import { BotConfig } from "./types";

export function loadBotConfig(): BotConfig {
  const isDryRun = process.env.DRY_RUN === "true" || !process.env.WALLET_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY === "YOUR_PRIVATE_KEY_HERE";
  
  return {
    network: (process.env.DELPHI_NETWORK as any) || "competition-testnet",
    signerType: (process.env.DELPHI_SIGNER_TYPE as any) || (isDryRun ? "simulation" : "private_key"),
    walletAddress: process.env.WALLET_ADDRESS || "0x0000000000000000000000000000000000000000",
    privateKey: process.env.WALLET_PRIVATE_KEY || "",
    delphiApiKey: process.env.DELPHI_API_ACCESS_KEY || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    dryRun: isDryRun,
    minEdge: parseFloat(process.env.MIN_EDGE || "0.05"), // 5% minimum edge
    kellyMultiplier: parseFloat(process.env.KELLY_MULTIPLIER || "0.30"), // 30% fractional Kelly (Conservative & Optimal)
    maxSingleBetPct: parseFloat(process.env.MAX_SINGLE_BET_PCT || "0.12"), // Max 12% of bankroll per single trade
    maxTotalExposurePct: parseFloat(process.env.MAX_TOTAL_EXPOSURE_PCT || "0.80"), // Keep 20% in reserve
    minConfidence: parseFloat(process.env.MIN_CONFIDENCE || "0.60"),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "180000", 10), // 3 minutes
    autoRedeem: process.env.AUTO_REDEEM !== "false",
  };
}
