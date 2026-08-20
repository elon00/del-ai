import { BotConfig, BotState, BotLogEntry, TradeOpportunity, MarketForecast, DelphiMarket } from "./types";
import { loadBotConfig } from "./config";
import { marketScanner } from "./marketScanner";
import { oddsAggregator } from "./oddsAggregator";
import { SuperforecasterEngine } from "./superforecaster";
import { riskKellyEngine } from "./riskKellyEngine";
import { tradeExecutor } from "./executor";
import { autoRedeemer } from "./autoRedeemer";
import { selfHealing } from "./selfHealing";

export class DelphiBotRunner {
  private config: BotConfig;
  private forecaster: SuperforecasterEngine;
  private state: BotState;
  private isRunning: boolean = false;
  private loopTimer: any = null;
  private listeners: Array<(state: BotState) => void> = [];

  // Cached analysis and opportunities for UI inspectability
  public currentMarkets: DelphiMarket[] = [];
  public currentForecasts: Map<string, MarketForecast> = new Map();
  public currentOpportunities: TradeOpportunity[] = [];

  constructor() {
    this.config = loadBotConfig();
    this.forecaster = new SuperforecasterEngine(this.config.geminiApiKey);
    this.state = {
      status: "IDLE",
      lastScanTime: null,
      bankroll: 1000.0,
      allocatedCapital: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      activePositionsCount: 0,
      logs: [],
    };
    tradeExecutor.setBankroll(this.state.bankroll);
  }

  public getConfig(): BotConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<BotConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.geminiApiKey) {
      this.forecaster.setApiKey(newConfig.geminiApiKey);
    }
    this.addLog("INFO", "Bot configuration updated.");
  }

  public getState(): BotState {
    const positions = tradeExecutor.getPositions();
    const activePositions = positions.filter(p => p.status === "OPEN");
    const allocated = activePositions.reduce((sum, p) => sum + p.costBasis, 0);
    const unrealized = activePositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const realized = tradeExecutor.getRealizedPnL();
    const winCount = positions.filter(p => p.status === "REDEEMED").length;
    const lossCount = positions.filter(p => p.status === "SETTLED_LOST").length;

    return {
      ...this.state,
      bankroll: tradeExecutor.getBankroll(),
      allocatedCapital: allocated,
      realizedPnL: realized,
      unrealizedPnL: unrealized,
      totalTrades: positions.length,
      winCount,
      lossCount,
      activePositionsCount: activePositions.length,
    };
  }

  public subscribe(cb: (state: BotState) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    const currentState = this.getState();
    for (const cb of this.listeners) {
      cb(currentState);
    }
  }

  public addLog(level: BotLogEntry["level"], message: string, details?: any) {
    const entry: BotLogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    };
    this.state.logs = [entry, ...this.state.logs.slice(0, 99)];
    this.notify();
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.addLog("INFO", `🚀 Autonomous Delphi Trading Loop started (${this.config.dryRun ? "Simulation Mode" : "Live Testnet"}). Interval: ${this.config.pollIntervalMs / 1000}s`);

    // Initialize clients
    await marketScanner.initClient(this.config);
    await tradeExecutor.initClient(this.config);
    await autoRedeemer.initClient(this.config);

    // Run first cycle immediately
    await this.runCycle();

    // Schedule recurring loop
    this.loopTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.runCycle();
      }
    }, this.config.pollIntervalMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    this.state.status = "IDLE";
    this.addLog("INFO", "⏹️ Autonomous Trading Loop paused.");
    this.notify();
  }

  public isLoopRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Executes 1 complete quantitative Delphi trading & compounding cycle
   */
  public async runCycle(): Promise<void> {
    try {
      this.state.status = "SCANNING";
      this.notify();
      this.addLog("INFO", "🔍 [Cycle Start] Scanning Delphi LMSR markets...");

      // 1. Scan Active Delphi Markets
      const activeMarkets = await marketScanner.getActiveMarkets(this.config);
      this.currentMarkets = activeMarkets;
      this.state.lastScanTime = new Date().toLocaleTimeString();
      this.addLog("INFO", `Found ${activeMarkets.length} active prediction markets on Delphi.`);

      // 2. Update mark-to-market prices for existing positions
      const priceMap = new Map<string, number>();
      for (const m of activeMarkets) {
        for (const o of m.outcomes) {
          priceMap.set(`${m.id}_${o.id}`, o.price);
        }
      }
      tradeExecutor.updatePositionsMarkToMarket(priceMap);

      // 3. Process settlements & Auto-Redeem
      if (this.config.autoRedeem) {
        this.state.status = "REDEEMING";
        this.notify();
        const settledMarkets = await marketScanner.getSettledMarkets(this.config);
        const redeemLogs = await autoRedeemer.processRedemptions(settledMarkets, this.config);
        for (const rLog of redeemLogs) {
          this.addLog(rLog.level, rLog.message, rLog.details);
        }
      }

      // 4. Superforecast & Analyze Opportunities with Self-Healing
      this.state.status = "ANALYZING";
      this.notify();
      const allOpportunities: TradeOpportunity[] = [];

      for (const market of activeMarkets) {
        try {
          // Fetch Polymarket / Web Odds
          const externalOdds = await oddsAggregator.getExternalOdds(market);
          
          // AI Superforecasting
          let forecast = await this.forecaster.forecastMarket(market, externalOdds);
          
          // Self-Healing auto-correction for probabilities
          forecast.estimatedProbabilities = selfHealing.sanitizeProbabilities(
            forecast.estimatedProbabilities,
            market.outcomes
          );
          this.currentForecasts.set(market.id, forecast);

          // Quantitative Kelly & LMSR Slippage Evaluation
          const availableBankroll = tradeExecutor.getBankroll();
          const opps = riskKellyEngine.evaluateMarket(market, forecast, this.config, availableBankroll);

          for (const opp of opps) {
            // Auto-heal bet amount
            opp.recommendedAmount = selfHealing.sanitizeTradeAmount(
              opp.recommendedAmount,
              availableBankroll,
              this.config.maxSingleBetPct
            );

            if (opp.recommendedAmount > 0) {
              allOpportunities.push(opp);
              this.addLog("ALPHA", `⚡ Alpha Found: "${opp.outcomeName}" in "${opp.question.slice(0, 35)}..." | Edge: +${(opp.edge * 100).toFixed(1)}% | Fair: ${(opp.fairProbability * 100).toFixed(1)}% vs Delphi: ${(opp.currentPrice * 100).toFixed(1)}%`);
            }
          }
        } catch (err: any) {
          selfHealing.healError(`Market Analysis on "${market.question.slice(0, 25)}"`, err.message);
        }
      }

      // Sort opportunities by highest priority score
      this.currentOpportunities = allOpportunities.sort((a, b) => b.priorityScore - a.priorityScore);

      // 5. Execute Trades with Revert Protection
      if (this.currentOpportunities.length > 0) {
        this.state.status = "EXECUTING";
        this.notify();

        // Limit to top 3 trades per cycle to conserve bankroll and ensure diversification
        const tradesToExecute = this.currentOpportunities.slice(0, 3);

        for (const opp of tradesToExecute) {
          try {
            const result = await tradeExecutor.executeOpportunity(opp, this.config);
            this.addLog(result.log.level, result.log.message, result.log.details);
          } catch (err: any) {
            selfHealing.healError(`Trade Execution on "${opp.outcomeName}"`, err.message);
          }
        }
      } else {
        this.addLog("INFO", "No high-edge trades meeting minimum criteria this cycle. Capital preserved.");
      }

      this.state.status = this.isRunning ? "WAITING" : "IDLE";
      this.notify();
    } catch (err: any) {
      selfHealing.healError("Global Bot Cycle", err.message);
      this.state.status = "IDLE";
      this.addLog("WARN", `Cycle auto-recovered: ${err.message}`);
    }
  }
}

export const delphiBotRunner = new DelphiBotRunner();
