import { DelphiMarket, MarketForecast, TradeOpportunity, BotConfig } from "./types";

/**
 * Quantitative Risk & Bet Sizing Engine
 * Implements:
 * 1. Exact LMSR Cost & Slippage Simulation
 * 2. Fractional Kelly Criterion for categorical prediction markets
 * 3. Portfolio-level exposure constraints and diversification caps
 */
export class RiskKellyEngine {
  /**
   * Evaluates all outcomes in a forecasted market and returns positive-EV trade opportunities
   */
  public evaluateMarket(
    market: DelphiMarket,
    forecast: MarketForecast,
    config: BotConfig,
    availableBankroll: number
  ): TradeOpportunity[] {
    const opportunities: TradeOpportunity[] = [];
    const b = market.liquidityB || 100; // default liquidity parameter b

    for (const outcome of market.outcomes) {
      const fairProb = forecast.estimatedProbabilities[outcome.id] ?? outcome.price;
      const currentPrice = Math.max(0.01, Math.min(0.99, outcome.price));
      const edge = fairProb - currentPrice;

      // Only consider if edge exceeds minimum threshold (e.g. >= 5%)
      if (edge < config.minEdge) {
        continue;
      }

      // Check confidence filter
      if (forecast.confidence < config.minConfidence) {
        continue;
      }

      // 1. Full Kelly Fraction f* = (p - P) / (1 - P)
      const fullKelly = Math.max(0, (fairProb - currentPrice) / (1 - currentPrice));
      
      // 2. Fractional Kelly (e.g. 0.25x or 0.30x Kelly)
      let recommendedFraction = fullKelly * config.kellyMultiplier;

      // 3. Apply Hard Single-Bet Risk Cap (e.g. max 12% of bankroll)
      recommendedFraction = Math.min(recommendedFraction, config.maxSingleBetPct);

      if (recommendedFraction <= 0.005) {
        continue;
      }

      // 4. Calculate token amount to bet
      const rawBetAmount = availableBankroll * recommendedFraction;
      const betAmount = Math.max(1, Math.floor(rawBetAmount * 100) / 100);

      // 5. Simulate LMSR Slippage on this bet size
      const slippageData = this.calculateLMSRSlippage(currentPrice, betAmount, b);

      // Recalculate Post-Slippage Edge
      const effectiveEntryPrice = slippageData.avgEntryPrice;
      const postSlippageEdge = fairProb - effectiveEntryPrice;

      // If slippage completely destroys our edge, skip or downscale
      if (postSlippageEdge < config.minEdge / 2) {
        continue;
      }

      const expectedValue = (fairProb * (1 - effectiveEntryPrice) - (1 - fairProb) * effectiveEntryPrice) / effectiveEntryPrice;
      const priorityScore = (postSlippageEdge * forecast.confidence) / Math.max(0.01, slippageData.slippagePct);

      opportunities.push({
        marketId: market.id,
        question: market.question,
        outcomeId: outcome.id,
        outcomeName: outcome.name,
        currentPrice,
        fairProbability: fairProb,
        edge,
        expectedValue,
        kellyFraction: fullKelly,
        recommendedFraction,
        recommendedAmount: betAmount,
        estimatedSlippage: slippageData.slippagePct,
        confidence: forecast.confidence,
        priorityScore,
        rationale: `Fair prob: ${(fairProb * 100).toFixed(1)}% vs Delphi: ${(currentPrice * 100).toFixed(1)}% | Edge: +${(edge * 100).toFixed(1)}% | Post-Slippage Price: ${(effectiveEntryPrice * 100).toFixed(1)}%`
      });
    }

    // Sort opportunities by highest Priority Score descending
    return opportunities.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Exact LMSR Slippage and Price Impact calculation
   * Cost(Δq) = b * ln(1 + P_i * (e^(Δq/b) - 1))
   * Δq(S) = b * ln(1 + (e^(S/b) - 1) / P_i)
   */
  public calculateLMSRSlippage(
    initialPrice: number,
    betTokens: number,
    b: number = 100
  ): { shares: number; avgEntryPrice: number; slippagePct: number } {
    if (betTokens <= 0 || initialPrice <= 0 || initialPrice >= 1) {
      return { shares: 0, avgEntryPrice: initialPrice, slippagePct: 0 };
    }

    try {
      // Number of shares purchased for `betTokens`
      const expTerm = Math.exp(betTokens / b) - 1;
      const shares = b * Math.log(1 + expTerm / initialPrice);
      
      const avgEntryPrice = shares > 0 ? betTokens / shares : initialPrice;
      const slippagePct = Math.max(0, (avgEntryPrice - initialPrice) / initialPrice);

      return {
        shares: Math.max(0, shares),
        avgEntryPrice: Math.min(0.99, avgEntryPrice),
        slippagePct
      };
    } catch {
      return {
        shares: betTokens / initialPrice,
        avgEntryPrice: initialPrice * 1.05,
        slippagePct: 0.05
      };
    }
  }
}

export const riskKellyEngine = new RiskKellyEngine();
