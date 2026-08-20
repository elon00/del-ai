export interface DelphiOutcome {
  id: string;
  name: string;
  price: number; // Implied probability (0.00 to 1.00)
  shares: number;
}

export interface DelphiMarket {
  id: string;
  question: string;
  category: "Politics" | "Economics" | "Sports" | "Crypto" | "Technology" | "Current Events" | "Other";
  description?: string;
  outcomes: DelphiOutcome[];
  liquidityB?: number; // LMSR parameter b
  totalVolume: number;
  resolved: boolean;
  winningOutcomeId?: string | null;
  settlementTimestamp?: number;
  endTime?: string;
  oracleCriteria?: string;
}

export interface ExternalOddsMatch {
  source: "Polymarket" | "Kalshi" | "WebSearch" | "DirectOracleData";
  sourceUrl?: string;
  matchedQuestion: string;
  similarityScore: number;
  outcomeProbabilities: Record<string, number>; // outcome name/id -> probability (0.0 to 1.0)
  newsSummary?: string;
}

export interface MarketForecast {
  marketId: string;
  question: string;
  category: string;
  estimatedProbabilities: Record<string, number>; // outcome id -> probability (sums to ~1.0)
  confidence: number; // 0.0 to 1.0
  reasoning: string[];
  baseRatesUsed?: string;
  externalSources?: ExternalOddsMatch[];
  lastUpdated: string;
}

export interface TradeOpportunity {
  marketId: string;
  question: string;
  outcomeId: string;
  outcomeName: string;
  currentPrice: number; // Market implied probability
  fairProbability: number; // AI estimated probability
  edge: number; // fairProbability - currentPrice
  expectedValue: number; // EV percentage
  kellyFraction: number; // Full Kelly fraction
  recommendedFraction: number; // Fractional Kelly (e.g. 0.25x Kelly)
  recommendedAmount: number; // in $TST tokens
  estimatedSlippage: number; // Expected price impact on LMSR
  confidence: number;
  priorityScore: number; // edge * confidence / slippage
  rationale: string;
}

export interface PositionRecord {
  id: string;
  marketId: string;
  marketQuestion: string;
  outcomeId: string;
  outcomeName: string;
  shares: number;
  costBasis: number; // Total tokens paid
  avgEntryPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  status: "OPEN" | "SETTLED_WON" | "SETTLED_LOST" | "REDEEMED";
  entryTimestamp: string;
  settlementTimestamp?: string;
  redeemedTimestamp?: string;
  txHash?: string;
}

export interface BotConfig {
  network: "competition-testnet" | "simulation";
  signerType: "private_key" | "simulation";
  walletAddress: string;
  privateKey: string;
  delphiApiKey: string;
  geminiApiKey: string;
  dryRun: boolean; // Simulation mode without actual gas/tokens
  minEdge: number; // e.g. 0.05 for 5% minimum edge
  kellyMultiplier: number; // e.g. 0.25 for quarter Kelly
  maxSingleBetPct: number; // e.g. 0.10 (max 10% of total bankroll per trade)
  maxTotalExposurePct: number; // e.g. 0.80 (keep 20% in reserve)
  minConfidence: number; // e.g. 0.60
  pollIntervalMs: number; // e.g. 180000 (3 mins)
  autoRedeem: boolean;
}

export interface BotLogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "ALPHA" | "TRADE" | "REDEEM" | "WARN" | "ERROR";
  message: string;
  details?: any;
}

export interface BotState {
  status: "IDLE" | "SCANNING" | "ANALYZING" | "EXECUTING" | "REDEEMING" | "WAITING";
  lastScanTime: string | null;
  bankroll: number;
  allocatedCapital: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  activePositionsCount: number;
  logs: BotLogEntry[];
}
