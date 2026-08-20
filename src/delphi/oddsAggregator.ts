import { DelphiMarket, ExternalOddsMatch } from "./types";

/**
 * Searches external prediction markets (like Polymarket Gamma API) and real-time data sources
 * to find consensus market-clearing odds for comparison against Delphi LMSR prices.
 */
export class OddsAggregator {
  private cache: Map<string, ExternalOddsMatch> = new Map();

  /**
   * Fetches relevant external market odds matching a given Delphi question
   */
  public async getExternalOdds(market: DelphiMarket): Promise<ExternalOddsMatch | null> {
    const cacheKey = market.id;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // 1. Try Polymarket Gamma API (Public, no API key required)
      const polymarketOdds = await this.queryPolymarket(market.question);
      if (polymarketOdds) {
        this.cache.set(cacheKey, polymarketOdds);
        return polymarketOdds;
      }
    } catch (err) {
      console.warn(`[OddsAggregator] Polymarket query failed for "${market.question}":`, (err as any).message);
    }

    // 2. Return null if no high-confidence external match was found
    return null;
  }

  /**
   * Query Polymarket Gamma API for public prediction market probabilities
   */
  private async queryPolymarket(query: string): Promise<ExternalOddsMatch | null> {
    try {
      // Clean query for search
      const sanitized = encodeURIComponent(query.slice(0, 60).replace(/[^\w\s]/gi, ""));
      const url = `https://gamma-api.polymarket.com/events?limit=3&active=true&closed=false&title=${sanitized}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;

      const events = await res.json();
      if (!Array.isArray(events) || events.length === 0) return null;

      const bestEvent = events[0];
      if (!bestEvent || !bestEvent.markets || bestEvent.markets.length === 0) return null;

      const polymarketMarket = bestEvent.markets[0];
      const outcomeProbabilities: Record<string, number> = {};

      if (polymarketMarket.outcomePrices) {
        try {
          const prices = JSON.parse(polymarketMarket.outcomePrices);
          const outcomes = JSON.parse(polymarketMarket.outcomes || '["Yes", "No"]');
          outcomes.forEach((name: string, idx: number) => {
            const prob = parseFloat(prices[idx]);
            if (!isNaN(prob)) {
              outcomeProbabilities[name.toLowerCase()] = prob;
            }
          });
        } catch {
          // fallback parser
        }
      }

      if (Object.keys(outcomeProbabilities).length > 0) {
        return {
          source: "Polymarket",
          sourceUrl: `https://polymarket.com/event/${bestEvent.slug || ""}`,
          matchedQuestion: bestEvent.title || polymarketMarket.question,
          similarityScore: 0.85,
          outcomeProbabilities,
          newsSummary: bestEvent.description?.slice(0, 200) || "Live Polymarket Consensus Data",
        };
      }
    } catch {
      // Ignore network errors in case of offline/sandbox
    }
    return null;
  }
}

export const oddsAggregator = new OddsAggregator();
