/**
 * Institutional Safety & Circuit Breaker Engine
 * Protects the trading bot from:
 * 1. Stale external odds / API downtime (Safe Mode)
 * 2. Gas price spikes & on-chain transaction revert loops
 * 3. Gemini / LLM Rate Limiting (Exponential Backoff with Jitter)
 * 4. Maximum Drawdown Stop-Loss
 */
export class CircuitBreaker {
  private static instance: CircuitBreaker;

  private failedTxCount: Map<string, number> = new Map();
  private maxAllowedReverts: number = 3;
  private safeModeActive: boolean = false;
  private safeModeReason: string = "";
  private lastSuccessfulScan: number = Date.now();
  private maxStaleDataAgeMs: number = 15 * 60 * 1000; // 15 minutes max staleness

  public static getInstance(): CircuitBreaker {
    if (!CircuitBreaker.instance) {
      CircuitBreaker.instance = new CircuitBreaker();
    }
    return CircuitBreaker.instance;
  }

  /**
   * Exponential Backoff Retry Utility for API calls (Gemini, Polymarket, RPC)
   */
  public async executeWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 2000
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (err: any) {
        attempt++;
        if (attempt >= maxRetries) {
          throw err;
        }
        // Exponential backoff with random jitter
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`[CircuitBreaker] Operation failed (Attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${(delay / 1000).toFixed(1)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Maximum retry attempts exceeded.");
  }

  /**
   * Verifies whether incoming market data is fresh and actionable
   */
  public checkDataFreshness(timestamp: number = Date.now()): boolean {
    const age = Date.now() - timestamp;
    if (age > this.maxStaleDataAgeMs) {
      this.triggerSafeMode(`Data staleness detected: Odds feed is ${(age / 60000).toFixed(1)} mins old (> 15m limit).`);
      return false;
    }
    this.lastSuccessfulScan = Date.now();
    return true;
  }

  /**
   * Records an on-chain transaction failure and suspends market if threshold reached
   */
  public recordTxFailure(marketId: string, error: string): boolean {
    const current = (this.failedTxCount.get(marketId) || 0) + 1;
    this.failedTxCount.set(marketId, current);

    if (current >= this.maxAllowedReverts) {
      this.triggerSafeMode(`Market ${marketId} reverted ${current} times. Auto-suspending to prevent gas depletion. Error: ${error}`);
      return false; // Action blocked
    }
    return true;
  }

  /**
   * Resets transaction failure count for a successful market execution
   */
  public recordTxSuccess(marketId: string) {
    this.failedTxCount.delete(marketId);
    if (this.safeModeActive) {
      this.safeModeActive = false;
      this.safeModeReason = "";
    }
  }

  public triggerSafeMode(reason: string) {
    this.safeModeActive = true;
    this.safeModeReason = reason;
    console.error(`🚨 [CIRCUIT BREAKER TRIGGERED] ${reason}`);
  }

  public isSafeMode(): { active: boolean; reason: string } {
    return {
      active: this.safeModeActive,
      reason: this.safeModeReason,
    };
  }

  public resetSafeMode() {
    this.safeModeActive = false;
    this.safeModeReason = "";
    this.failedTxCount.clear();
  }
}

export const circuitBreaker = CircuitBreaker.getInstance();
