import { DelphiMarket, BotConfig, BotLogEntry } from "./types";
import { tradeExecutor } from "./executor";

/**
 * Auto-Redeemer Module
 * Automatically discovers settled prediction markets where our agent holds shares,
 * redeems the winning shares for 1 $TST each, and updates realized P&L so capital
 * is immediately available for compounding.
 */
export class AutoRedeemer {
  private delphiClient: any = null;

  public async initClient(config: BotConfig) {
    if (config.dryRun || !config.privateKey || config.privateKey.startsWith("YOUR_")) {
      return;
    }

    try {
      const sdk = await import("@gensyn-ai/gensyn-delphi-sdk");
      const DelphiClientClass = (sdk as any).DelphiClient || (sdk as any).default?.DelphiClient || (sdk as any).Delphi;
      if (DelphiClientClass) {
        this.delphiClient = new DelphiClientClass({
          network: config.network,
          signerType: "private_key",
          privateKey: config.privateKey,
          apiKey: config.delphiApiKey,
        });
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Scans positions against settled markets and executes redemptions
   */
  public async processRedemptions(
    settledMarkets: DelphiMarket[],
    config: BotConfig
  ): Promise<BotLogEntry[]> {
    const logs: BotLogEntry[] = [];
    const openPositions = tradeExecutor.getPositions().filter(p => p.status === "OPEN");

    if (openPositions.length === 0 || settledMarkets.length === 0) {
      return logs;
    }

    for (const settledMarket of settledMarkets) {
      if (!settledMarket.resolved || !settledMarket.winningOutcomeId) {
        continue;
      }

      const matchingPositions = openPositions.filter(p => p.marketId === settledMarket.id);

      for (const pos of matchingPositions) {
        const isWinner = pos.outcomeId === settledMarket.winningOutcomeId;

        if (isWinner) {
          // On-chain redemption via SDK
          if (this.delphiClient && !config.dryRun) {
            try {
              const tx = await this.delphiClient.redeem({
                marketId: settledMarket.id,
                outcomeId: pos.outcomeId,
              });

              const payoutTokens = pos.shares * 1.0; // 1 winning share = 1 token
              tradeExecutor.applyRedemption(pos.id, payoutTokens);

              const profit = payoutTokens - pos.costBasis;
              logs.push({
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toISOString(),
                level: "REDEEM",
                message: `🎉 [REDEEMED WIN] Settled on "${pos.outcomeName}" in "${settledMarket.question.slice(0, 35)}...". Received ${payoutTokens.toFixed(1)} $TST (Net Profit: +${profit.toFixed(1)} $TST, ROI: +${((profit / pos.costBasis) * 100).toFixed(0)}%)! Tx: ${tx?.hash?.slice(0, 10) || "0x_done"}`,
                details: { tx, position: pos, profit }
              });
              continue;
            } catch (err) {
              logs.push({
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toISOString(),
                level: "ERROR",
                message: `Failed to redeem winning position ${pos.id}: ${(err as any).message}`
              });
            }
          }

          // Simulation Redemption
          const payoutTokens = pos.shares * 1.0;
          tradeExecutor.applyRedemption(pos.id, payoutTokens);
          const profit = payoutTokens - pos.costBasis;

          logs.push({
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
            level: "REDEEM",
            message: `🎉 [SIMULATION REDEEM] Market Settled! Won "${pos.outcomeName}" in "${settledMarket.question.slice(0, 35)}...". Payout: +${payoutTokens.toFixed(1)} $TST (Net Profit: +${profit.toFixed(1)} $TST)!`,
            details: { position: pos, profit }
          });
        } else {
          // Position lost in settlement
          pos.status = "SETTLED_LOST";
          pos.realizedPnL = -pos.costBasis;
          pos.unrealizedPnL = 0;
          pos.settlementTimestamp = new Date().toISOString();

          logs.push({
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
            level: "INFO",
            message: `Market settled against position in "${pos.outcomeName}" (${settledMarket.question.slice(0, 30)}...). Loss realized: -${pos.costBasis.toFixed(1)} $TST.`,
            details: { position: pos }
          });
        }
      }
    }

    return logs;
  }
}

export const autoRedeemer = new AutoRedeemer();
