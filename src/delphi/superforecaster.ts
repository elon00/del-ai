import { GoogleGenAI } from "@google/genai";
import { DelphiMarket, ExternalOddsMatch, MarketForecast } from "./types";
import { circuitBreaker } from "./circuitBreaker";

/**
 * Superforecaster AI Engine
 * Implements Philip Tetlock's Superforecasting methodology:
 * 1. Base rate inquiry & reference class evaluation
 * 2. Bayesian probability updating on recent signals & news
 * 3. Calibration against external prediction market wisdom-of-the-crowd
 * 4. Extrapolating confidence intervals
 */
export class SuperforecasterEngine {
  private ai: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn("[Superforecaster] Failed to init Google GenAI:", err);
      }
    }
  }

  public setApiKey(apiKey: string) {
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Forecasts the true probabilities for each outcome of a Delphi market
   */
  public async forecastMarket(
    market: DelphiMarket,
    externalOdds: ExternalOddsMatch | null
  ): Promise<MarketForecast> {
    // If Gemini AI is configured, use LLM Superforecasting
    if (this.ai) {
      try {
        const aiForecast = await this.runGeminiForecast(market, externalOdds);
        if (aiForecast) return aiForecast;
      } catch (err) {
        console.warn(`[Superforecaster] LLM forecasting error for "${market.question}":`, (err as any).message);
      }
    }

    // Fallback: Quantitative Statistical / Heuristic Model
    return this.runHeuristicForecast(market, externalOdds);
  }

  private async runGeminiForecast(
    market: DelphiMarket,
    externalOdds: ExternalOddsMatch | null
  ): Promise<MarketForecast | null> {
    if (!this.ai) return null;

    const outcomesList = market.outcomes
      .map(o => `- Outcome ID "${o.id}": "${o.name}" (Current Delphi Price: ${(o.price * 100).toFixed(1)}%)`)
      .join("\n");

    const externalInfo = externalOdds
      ? `External Market Consensus (${externalOdds.source}):\n` +
        JSON.stringify(externalOdds.outcomeProbabilities, null, 2) +
        `\nContext/News: ${externalOdds.newsSummary || "N/A"}`
      : "No direct external prediction market match found.";

    const prompt = `You are a world-class Quantitative Superforecaster and Prediction Market Arbitrage Specialist competing in the Delphi Agent Arena.

MARKET DETAILS:
- Question: "${market.question}"
- Category: ${market.category}
- Description: ${market.description || "N/A"}
- Outcomes & Delphi LMSR Prices:
${outcomesList}

EXTERNAL EVIDENCE / ODDS:
${externalInfo}

SUPERFORECASTING INSTRUCTIONS:
1. Determine the historical base rate (reference class) for this class of event.
2. Synthesize current factual knowledge, timeline, and catalysts.
3. Incorporate external market probabilities if high quality, but adjust for bias/mispricings.
4. Provide a strictly calibrated probability for EVERY outcome (all outcome IDs must sum to exactly 1.00 or 100%).
5. State your confidence level (0.50 to 0.95).
6. Be objective, dispassionate, and avoid recency bias.

Return ONLY a valid JSON object matching this schema:
{
  "probabilities": {
    "<outcome_id>": <number between 0.01 and 0.99>
  },
  "confidence": <number between 0.50 and 0.95>,
  "baseRate": "<brief explanation of reference class base rate>",
  "reasons": [
    "<key rationale point 1>",
    "<key rationale point 2>",
    "<key rationale point 3>"
  ]
}`;

    const candidateModels = ["gemini-3.6-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
    let text: string | null = null;

    try {
      text = await circuitBreaker.executeWithBackoff(async () => {
        for (const modelName of candidateModels) {
          try {
            const response = await this.ai!.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json"
              }
            });
            if (response && response.text) {
              return response.text;
            }
          } catch (e) {
            // Try next candidate model
          }
        }
        throw new Error("All Gemini candidate models unavailable.");
      }, 3, 2000);
    } catch (err: any) {
      console.warn(`[Superforecaster] LLM backoff exhausted: ${err.message}. Falling back to Heuristic model.`);
      return null;
    }

    if (!text) return null;

    const parsed = JSON.parse(text);
    
    // Normalize probabilities so they sum to 1.00
    const rawProbs: Record<string, number> = parsed.probabilities || {};
    let totalProb = 0;
    const estimatedProbabilities: Record<string, number> = {};

    market.outcomes.forEach(o => {
      const p = typeof rawProbs[o.id] === "number" ? rawProbs[o.id] : 1 / market.outcomes.length;
      estimatedProbabilities[o.id] = Math.max(0.01, Math.min(0.99, p));
      totalProb += estimatedProbabilities[o.id];
    });

    // Normalize
    market.outcomes.forEach(o => {
      estimatedProbabilities[o.id] = parseFloat((estimatedProbabilities[o.id] / totalProb).toFixed(4));
    });

    return {
      marketId: market.id,
      question: market.question,
      category: market.category,
      estimatedProbabilities,
      confidence: Math.max(0.5, Math.min(0.95, parsed.confidence || 0.75)),
      reasoning: Array.isArray(parsed.reasons) ? parsed.reasons : ["Calibrated base rate analysis", "Empirical evidence synthesis"],
      baseRatesUsed: parsed.baseRate || "General domain reference class",
      externalSources: externalOdds ? [externalOdds] : [],
      lastUpdated: new Date().toISOString()
    };
  }

  private runHeuristicForecast(
    market: DelphiMarket,
    externalOdds: ExternalOddsMatch | null
  ): MarketForecast {
    const estimatedProbabilities: Record<string, number> = {};
    const reasons: string[] = [];

    if (externalOdds && Object.keys(externalOdds.outcomeProbabilities).length > 0) {
      reasons.push(`Arbitrage: Weighted with ${externalOdds.source} consensus odds`);
      let sum = 0;

      market.outcomes.forEach(o => {
        const lowerName = o.name.toLowerCase();
        let matchedP = externalOdds.outcomeProbabilities[lowerName] || externalOdds.outcomeProbabilities[o.id];
        
        if (matchedP === undefined) {
          // Yes/No heuristic match
          if (lowerName.includes("yes")) matchedP = externalOdds.outcomeProbabilities["yes"];
          else if (lowerName.includes("no")) matchedP = externalOdds.outcomeProbabilities["no"];
        }

        const baseline = matchedP !== undefined ? matchedP : o.price;
        // Blend 75% external consensus + 25% internal Delphi price
        const blended = 0.75 * baseline + 0.25 * o.price;
        estimatedProbabilities[o.id] = blended;
        sum += blended;
      });

      // Normalize
      market.outcomes.forEach(o => {
        estimatedProbabilities[o.id] = parseFloat((estimatedProbabilities[o.id] / sum).toFixed(4));
      });

      return {
        marketId: market.id,
        question: market.question,
        category: market.category,
        estimatedProbabilities,
        confidence: 0.82,
        reasoning: reasons,
        baseRatesUsed: "External prediction market equilibrium",
        externalSources: [externalOdds],
        lastUpdated: new Date().toISOString()
      };
    }

    // Default: Conservative mean-reversion / gentle smoothing
    let sum = 0;
    market.outcomes.forEach(o => {
      // Regress slightly towards uniform distribution (anti-overconfidence prior)
      const uniform = 1 / market.outcomes.length;
      const smoothed = 0.85 * o.price + 0.15 * uniform;
      estimatedProbabilities[o.id] = smoothed;
      sum += smoothed;
    });

    market.outcomes.forEach(o => {
      estimatedProbabilities[o.id] = parseFloat((estimatedProbabilities[o.id] / sum).toFixed(4));
    });

    return {
      marketId: market.id,
      question: market.question,
      category: market.category,
      estimatedProbabilities,
      confidence: 0.65,
      reasoning: ["Bayesian prior regression to uniform", "LMSR spread smoothing"],
      baseRatesUsed: "Standard domain prior",
      lastUpdated: new Date().toISOString()
    };
  }
}
