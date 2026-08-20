import { DelphiMarket, BotConfig } from "./types";

/**
 * Market Scanner
 * Interfaces with the Delphi SDK to discover live competition markets,
 * fetch outcome prices, liquidity, and settlement status.
 */
export class MarketScanner {
  private delphiClient: any = null;

  public async initClient(config: BotConfig) {
    if (config.dryRun || !config.privateKey || config.privateKey.startsWith("YOUR_")) {
      return;
    }

    try {
      // Dynamic import of Delphi SDK if available
      const sdk = await import("@gensyn-ai/gensyn-delphi-sdk");
      const DelphiClientClass = (sdk as any).DelphiClient || (sdk as any).default?.DelphiClient || (sdk as any).Delphi;
      
      if (DelphiClientClass) {
        this.delphiClient = new DelphiClientClass({
          network: config.network || "competition-testnet",
          signerType: "private_key",
          privateKey: config.privateKey,
          apiKey: config.delphiApiKey,
        });
      }
    } catch (err) {
      console.warn("[MarketScanner] Delphi SDK init fallback to simulation:", (err as any).message);
    }
  }

  /**
   * Fetches all active, un-resolved competition markets
   */
  public async getActiveMarkets(config: BotConfig): Promise<DelphiMarket[]> {
    if (this.delphiClient && !config.dryRun) {
      try {
        const rawMarkets = await this.delphiClient.getMarkets({ status: "active" });
        if (Array.isArray(rawMarkets) && rawMarkets.length > 0) {
          return rawMarkets.map((m: any) => this.normalizeSDKMarket(m));
        }
      } catch (err) {
        console.warn("[MarketScanner] Failed to fetch live SDK markets, falling back:", (err as any).message);
      }
    }

    // Return realistic competition markets (Curated set across Politics, Macro, Sports, Crypto, Tech)
    return this.getSimulatedCompetitionMarkets();
  }

  /**
   * Fetches resolved/settled markets to identify winning shares to redeem
   */
  public async getSettledMarkets(config: BotConfig): Promise<DelphiMarket[]> {
    if (this.delphiClient && !config.dryRun) {
      try {
        const rawMarkets = await this.delphiClient.getMarkets({ status: "resolved" });
        if (Array.isArray(rawMarkets)) {
          return rawMarkets.map((m: any) => this.normalizeSDKMarket(m));
        }
      } catch (err) {
        console.warn("[MarketScanner] Failed to fetch settled SDK markets:", (err as any).message);
      }
    }

    return this.getSimulatedSettledMarkets();
  }

  private normalizeSDKMarket(raw: any): DelphiMarket {
    const outcomes = (raw.outcomes || []).map((o: any, idx: number) => ({
      id: String(o.id ?? idx),
      name: o.name || `Outcome ${idx + 1}`,
      price: typeof o.price === "number" ? o.price : parseFloat(o.probability || "0.5"),
      shares: typeof o.shares === "number" ? o.shares : 0,
    }));

    return {
      id: String(raw.id || raw.marketId || Math.random().toString(36).substring(7)),
      question: raw.question || raw.title || "Untitled Market",
      category: raw.category || "General",
      description: raw.description || "",
      outcomes,
      liquidityB: raw.liquidityB || raw.b || 100,
      totalVolume: raw.totalVolume || raw.volume || 0,
      resolved: Boolean(raw.resolved || raw.settled),
      winningOutcomeId: raw.winningOutcomeId || raw.winnerId || null,
      settlementTimestamp: raw.settlementTimestamp || raw.settledAt,
      endTime: raw.endTime || raw.expiryDate,
      oracleCriteria: raw.oracleCriteria || raw.resolutionRules,
    };
  }

  private getSimulatedCompetitionMarkets(): DelphiMarket[] {
    return [
      {
        id: "delphi-comp-01",
        question: "Will the US Federal Reserve cut interest rates at the next FOMC meeting?",
        category: "Economics",
        description: "Resolves Yes if FOMC announces a target rate reduction of at least 25 bps.",
        outcomes: [
          { id: "cut_yes", name: "Yes (Cut)", price: 0.38, shares: 1250 },
          { id: "cut_no", name: "No (Hold/Hike)", price: 0.62, shares: 2040 }
        ],
        liquidityB: 150,
        totalVolume: 3290,
        resolved: false,
        endTime: "2026-09-18T18:00:00Z",
        oracleCriteria: "Federal Reserve Official Press Release"
      },
      {
        id: "delphi-comp-02",
        question: "Will Bitcoin (BTC) exceed $105,000 before the end of August 2026?",
        category: "Crypto",
        description: "Resolves Yes if Binance 1-minute candle high touches or exceeds $105,000 USDT.",
        outcomes: [
          { id: "btc_yes", name: "Yes (>= $105k)", price: 0.31, shares: 1800 },
          { id: "btc_no", name: "No (< $105k)", price: 0.69, shares: 4100 }
        ],
        liquidityB: 200,
        totalVolume: 5900,
        resolved: false,
        endTime: "2026-08-31T23:59:59Z",
        oracleCriteria: "Binance Index Price / CoinGecko"
      },
      {
        id: "delphi-comp-03",
        question: "Which LLM architecture will hold #1 rank on LMSYS Chatbot Arena by Sept 1?",
        category: "Technology",
        description: "Leading models across Gemini, OpenAI, Claude, DeepSeek.",
        outcomes: [
          { id: "m_gemini", name: "Google Gemini (Ultra/Flash)", price: 0.44, shares: 1400 },
          { id: "m_openai", name: "OpenAI (GPT-5/o3)", price: 0.32, shares: 1020 },
          { id: "m_claude", name: "Anthropic Claude (3.7/Opus)", price: 0.18, shares: 580 },
          { id: "m_other", name: "Other / DeepSeek", price: 0.06, shares: 190 }
        ],
        liquidityB: 120,
        totalVolume: 3190,
        resolved: false,
        endTime: "2026-09-01T00:00:00Z",
        oracleCriteria: "LMSYS Leaderboard Overall Elo"
      },
      {
        id: "delphi-comp-04",
        question: "Will SpaceX conduct an orbital refueling demonstration in Starship Flight 6/7?",
        category: "Technology",
        description: "Resolves Yes upon official NASA/SpaceX confirmation of cryogenic propellant transfer.",
        outcomes: [
          { id: "starship_yes", name: "Yes (Demonstrated)", price: 0.41, shares: 820 },
          { id: "starship_no", name: "No / Postponed", price: 0.59, shares: 1180 }
        ],
        liquidityB: 100,
        totalVolume: 2000,
        resolved: false,
        endTime: "2026-09-15T00:00:00Z",
        oracleCriteria: "NASA Artemis Update / SpaceX Webcast"
      },
      {
        id: "delphi-comp-05",
        question: "Will Ethereum gas fee average remain below 12 Gwei throughout next week?",
        category: "Crypto",
        description: "Resolves Yes if Etherscan 7-day average gas fee is strictly under 12 Gwei.",
        outcomes: [
          { id: "gas_yes", name: "Yes (< 12 Gwei)", price: 0.72, shares: 2100 },
          { id: "gas_no", name: "No (>= 12 Gwei)", price: 0.28, shares: 820 }
        ],
        liquidityB: 100,
        totalVolume: 2920,
        resolved: false,
        endTime: "2026-08-28T00:00:00Z",
        oracleCriteria: "Etherscan Gas Tracker 7-Day Average"
      }
    ];
  }

  private getSimulatedSettledMarkets(): DelphiMarket[] {
    return [
      {
        id: "delphi-settled-01",
        question: "Did the ECB cut interest rates in the August monetary policy meeting?",
        category: "Economics",
        outcomes: [
          { id: "ecb_yes", name: "Yes", price: 1.00, shares: 5000 },
          { id: "ecb_no", name: "No", price: 0.00, shares: 0 }
        ],
        liquidityB: 100,
        totalVolume: 5000,
        resolved: true,
        winningOutcomeId: "ecb_yes",
        settlementTimestamp: Date.now() - 3600000,
      }
    ];
  }
}

export const marketScanner = new MarketScanner();
