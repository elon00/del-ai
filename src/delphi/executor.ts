import { TradeOpportunity, PositionRecord, BotConfig, BotLogEntry } from "./types";
import { riskKellyEngine } from "./riskKellyEngine";
import { circuitBreaker } from "./circuitBreaker";

/**
 * Trade Executor & Position Manager
 * Executes orders on Delphi Testnet via SDK or in-memory simulation,
 * manages the open positions book, and calculates real-time Mark-to-Market P&L.
 */
export class TradeExecutor {
  private delphiClient: any = null;
  private positions: Map<string, PositionRecord> = new Map();
  private bankroll: number = 1000.0; // Default starting testnet balance
  private realizedPnL: number = 0.0;
  private tradeHistory: TradeOpportunity[] = [];

  public setBankroll(amount: number) {
    this.bankroll = amount;
  }

  public getBankroll(): number {
    return this.bankroll;
  }

  public getRealizedPnL(): number {
    return this.realizedPnL;
  }

  public getPositions(): PositionRecord[] {
    return Array.from(this.positions.values());
  }

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
    } catch (err) {
      console.warn("[TradeExecutor] Delphi SDK init fallback to simulation:", (err as any).message);
    }
  }

  /**
   * Executes a list of ranked high-EV trade opportunities
   */
  public async executeOpportunity(
    opp: TradeOpportunity,
    config: BotConfig
  ): Promise<{ success: boolean; log: BotLogEntry; position?: PositionRecord }> {
    // Check if we have sufficient bankroll
    if (opp.recommendedAmount > this.bankroll) {
      const log: BotLogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        level: "WARN",
        message: `Insufficient bankroll for trade on "${opp.question.slice(0, 40)}...". Needed: ${opp.recommendedAmount}, Available: ${this.bankroll.toFixed(2)} $TST`
      };
      return { success: false, log };
    }

    // Check if we already hold an open position in this exact outcome
    const posKey = `${opp.marketId}_${opp.outcomeId}`;
    const existingPos = this.positions.get(posKey);
    if (existingPos && existingPos.status === "OPEN") {
      // Don't overconcentrate if position already exists
      const log: BotLogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: `Position already held in "${opp.outcomeName}" (${opp.question.slice(0, 30)}...). Holding existing shares.`
      };
      return { success: false, log };
    }

    // Check circuit breaker status
    const safeMode = circuitBreaker.isSafeMode();
    if (safeMode.active) {
      const log: BotLogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        level: "WARN",
        message: `🛡️ [CIRCUIT BREAKER ACTIVE] Trade skipped on "${opp.question.slice(0, 30)}...": ${safeMode.reason}`
      };
      return { success: false, log };
    }

    // Execute Live on Delphi Testnet via SDK
    if (this.delphiClient && !config.dryRun) {
      try {
        const tx = await this.delphiClient.buyShares({
          marketId: opp.marketId,
          outcomeId: opp.outcomeId,
          amountTokens: opp.recommendedAmount,
          maxSlippage: opp.estimatedSlippage * 1.5,
        });

        circuitBreaker.recordTxSuccess(opp.marketId);

        const sharesBought = tx.sharesBought || (opp.recommendedAmount / opp.currentPrice);
        const avgPrice = tx.avgPrice || (opp.recommendedAmount / sharesBought);
        const txHash = tx.hash || tx.transactionHash || "0x_onchain_tx";

        this.bankroll -= opp.recommendedAmount;
        
        const position: PositionRecord = {
          id: posKey,
          marketId: opp.marketId,
          marketQuestion: opp.question,
          outcomeId: opp.outcomeId,
          outcomeName: opp.outcomeName,
          shares: sharesBought,
          costBasis: opp.recommendedAmount,
          avgEntryPrice: avgPrice,
          currentPrice: opp.currentPrice,
          currentValue: sharesBought * opp.currentPrice,
          unrealizedPnL: 0,
          realizedPnL: 0,
          status: "OPEN",
          entryTimestamp: new Date().toISOString(),
          txHash,
        };

        this.positions.set(posKey, position);
        this.tradeHistory.push(opp);

        const log: BotLogEntry = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          level: "TRADE",
          message: `[ON-CHAIN] BOUGHT ${sharesBought.toFixed(1)} shares of "${opp.outcomeName}" @ ${(avgPrice * 100).toFixed(1)}¢ in "${opp.question.slice(0, 35)}..." (Tx: ${txHash.slice(0, 10)}...)`,
          details: { txHash, opp, position }
        };

        return { success: true, log, position };
      } catch (err) {
        circuitBreaker.recordTxFailure(opp.marketId, (err as any).message);
        const log: BotLogEntry = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          level: "ERROR",
          message: `On-chain trade failed for "${opp.outcomeName}": ${(err as any).message}`
        };
        return { success: false, log };
      }
    }

    // Simulation / Dry Run Execution
    const slippageData = riskKellyEngine.calculateLMSRSlippage(opp.currentPrice, opp.recommendedAmount);
    const sharesBought = slippageData.shares;
    const avgPrice = slippageData.avgEntryPrice;

    this.bankroll -= opp.recommendedAmount;

    const position: PositionRecord = {
      id: posKey,
      marketId: opp.marketId,
      marketQuestion: opp.question,
      outcomeId: opp.outcomeId,
      outcomeName: opp.outcomeName,
      shares: sharesBought,
      costBasis: opp.recommendedAmount,
      avgEntryPrice: avgPrice,
      currentPrice: opp.currentPrice,
      currentValue: sharesBought * opp.currentPrice,
      unrealizedPnL: 0,
      realizedPnL: 0,
      status: "OPEN",
      entryTimestamp: new Date().toISOString(),
      txHash: `sim_${Math.random().toString(36).substring(2, 10)}`,
    };

    this.positions.set(posKey, position);
    this.tradeHistory.push(opp);

    const log: BotLogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      level: "TRADE",
      message: `[SIMULATION] BOUGHT ${sharesBought.toFixed(1)} shares of "${opp.outcomeName}" @ ${(avgPrice * 100).toFixed(1)}¢ for ${opp.recommendedAmount.toFixed(1)} $TST (Edge: +${(opp.edge * 100).toFixed(1)}%, Slippage: +${(opp.estimatedSlippage * 100).toFixed(1)}%)`,
      details: { opp, position }
    };

    return { success: true, log, position };
  }

  /**
   * Updates mark-to-market prices for all open positions
   */
  public updatePositionsMarkToMarket(currentPrices: Map<string, number>) {
    let totalUnrealized = 0;
    
    for (const pos of this.positions.values()) {
      if (pos.status === "OPEN") {
        const currentP = currentPrices.get(`${pos.marketId}_${pos.outcomeId}`) ?? pos.currentPrice;
        pos.currentPrice = currentP;
        pos.currentValue = pos.shares * currentP;
        pos.unrealizedPnL = pos.currentValue - pos.costBasis;
        totalUnrealized += pos.unrealizedPnL;
      }
    }

    return totalUnrealized;
  }

  /**
   * Mark a position as redeemed after settlement payout
   */
  public applyRedemption(posId: string, payoutTokens: number) {
    const pos = this.positions.get(posId);
    if (!pos) return;

    const netProfit = payoutTokens - pos.costBasis;
    pos.status = "REDEEMED";
    pos.realizedPnL = netProfit;
    pos.unrealizedPnL = 0;
    pos.redeemedTimestamp = new Date().toISOString();

    this.bankroll += payoutTokens;
    this.realizedPnL += netProfit;
  }
}

export const tradeExecutor = new TradeExecutor();
