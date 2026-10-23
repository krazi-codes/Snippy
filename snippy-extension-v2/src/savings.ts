export interface SavingsTotals {
  downshift: number;
  cacheReuse: number;
  freeRouting: number;
}

export class SavingsTracker {
  private sessionTotals: SavingsTotals = {
    downshift: 0,
    cacheReuse: 0,
    freeRouting: 0
  };

  private cumulativeTotals: SavingsTotals = {
    downshift: 0,
    cacheReuse: 0,
    freeRouting: 0
  };

  addDownshift(amount: number): void {
    this.sessionTotals.downshift += amount;
    this.cumulativeTotals.downshift += amount;
  }

  addCacheReuse(amount: number): void {
    this.sessionTotals.cacheReuse += amount;
    this.cumulativeTotals.cacheReuse += amount;
  }

  addFreeRouting(amount: number): void {
    this.sessionTotals.freeRouting += amount;
    this.cumulativeTotals.freeRouting += amount;
  }

  commit(): SavingsTotals {
    const snapshot = {
      ...this.sessionTotals
    };
    
    this.sessionTotals = {
      downshift: 0,
      cacheReuse: 0,
      freeRouting: 0
    };
    
    return snapshot;
  }

  snapshot(): SavingsTotals {
    return {
      ...this.sessionTotals
    };
  }

  getCumulative(): SavingsTotals {
    return {
      ...this.cumulativeTotals
    };
  }

  toPersistence(): Record<string, number> {
    return {
      downshift: this.cumulativeTotals.downshift,
      cacheReuse: this.cumulativeTotals.cacheReuse,
      freeRouting: this.cumulativeTotals.freeRouting
    };
  }

  fromPersistence(data: Record<string, number>): void {
    this.cumulativeTotals = {
      downshift: data.downshift || 0,
      cacheReuse: data.cacheReuse || 0,
      freeRouting: data.freeRouting || 0
    };
  }
}
