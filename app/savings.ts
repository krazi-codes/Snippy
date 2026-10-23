import { PricingCalculator } from './pricing';

export interface SavingsSnapshot {
  downshiftSessionUsd: number;
  cacheSessionUsd: number;
  routerSessionUsd: number; // free local routing avoided this much Haiku spend
  totalSessionUsd: number;

  downshiftTotalUsd: number;
  cacheTotalUsd: number;
  routerTotalUsd: number;
  totalAllTimeUsd: number;
}

export interface SavingsPersistence {
  downshiftTotalUsd: number;
  cacheTotalUsd: number;
  routerTotalUsd: number;
}

/**
 * Tracks three savings buckets: downshifting subtasks to cheaper Claude models,
 * reading the cached prefix instead of paying full input, and doing routing on
 * free local Ollama instead of a paid Haiku router call.
 */
export class SavingsCalculator {
  private downshiftSession = 0;
  private cacheSession = 0;
  private routerSession = 0;

  constructor(
    private readonly pricing: PricingCalculator,
    private downshiftTotal = 0,
    private cacheTotal = 0,
    private routerTotal = 0
  ) {}

  addDownshift(usd: number): void {
    if (usd > 0) this.downshiftSession += usd;
  }

  addCache(usd: number): void {
    if (usd > 0) this.cacheSession += usd;
  }

  addRouter(usd: number): void {
    if (usd > 0) this.routerSession += usd;
  }

  /** Fold the session buckets into the cumulative totals (e.g. after a turn). */
  commit(): SavingsSnapshot {
    this.downshiftTotal += this.downshiftSession;
    this.cacheTotal += this.cacheSession;
    this.routerTotal += this.routerSession;
    this.downshiftSession = 0;
    this.cacheSession = 0;
    this.routerSession = 0;
    return this.snapshot();
  }

  snapshot(): SavingsSnapshot {
    const totalSession =
      this.downshiftSession + this.cacheSession + this.routerSession;
    const totalAll = this.downshiftTotal + this.cacheTotal + this.routerTotal;
    return {
      downshiftSessionUsd: this.downshiftSession,
      cacheSessionUsd: this.cacheSession,
      routerSessionUsd: this.routerSession,
      totalSessionUsd: totalSession,
      downshiftTotalUsd: this.downshiftTotal,
      cacheTotalUsd: this.cacheTotal,
      routerTotalUsd: this.routerTotal,
      totalAllTimeUsd: totalAll
    };
  }

  toPersistence(): SavingsPersistence {
    return {
      downshiftTotalUsd: this.downshiftTotal,
      cacheTotalUsd: this.cacheTotal,
      routerTotalUsd: this.routerTotal
    };
  }
}
