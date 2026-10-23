import { ModelInfo } from './models';

export type TokenKind = 'input' | 'output';

export class PricingCalculator {
  /** Full-price cost in USD for a token count against a model. */
  costFor(tokens: number, model: ModelInfo, kind: TokenKind = 'input'): number {
    if (tokens <= 0) return 0;
    const perMTok =
      kind === 'input' ? model.inputPricePerMTok : model.outputPricePerMTok;
    return (tokens / 1_000_000) * perMTok;
  }

  /** Cost of reading `tokens` from the prompt cache (~10% of input). */
  cacheReadCost(tokens: number, model: ModelInfo): number {
    if (tokens <= 0) return 0;
    return (tokens / 1_000_000) * model.inputPricePerMTok * model.cacheReadMultiplier;
  }

  /** Cost of writing `tokens` to the prompt cache (~125% of input, one-time). */
  cacheWriteCost(tokens: number, model: ModelInfo): number {
    if (tokens <= 0) return 0;
    return (tokens / 1_000_000) * model.inputPricePerMTok * model.cacheWriteMultiplier;
  }

  /**
   * What you save by reading the prefix from cache instead of paying full input.
   */
  cacheSaving(tokens: number, model: ModelInfo): number {
    return this.costFor(tokens, model, 'input') - this.cacheReadCost(tokens, model);
  }

  /**
   * Savings from running a subtask on `sub` instead of `main`, for a given
   * input/output token estimate. Net of any router overhead passed in.
   * Returns 0 (never negative) if the downshift wouldn't actually help.
   */
  downshiftSaving(
    main: ModelInfo,
    sub: ModelInfo,
    inputTokens: number,
    outputTokens: number,
    overheadUsd = 0
  ): number {
    const mainCost =
      this.costFor(inputTokens, main, 'input') +
      this.costFor(outputTokens, main, 'output');
    const subCost =
      this.costFor(inputTokens, sub, 'input') +
      this.costFor(outputTokens, sub, 'output');
    const net = mainCost - subCost - overheadUsd;
    return net > 0 ? net : 0;
  }

  formatUsd(amount: number): string {
    if (amount === 0) return '$0.00';
    if (Math.abs(amount) < 0.01) return `$${amount.toFixed(4)}`;
    return `$${amount.toFixed(2)}`;
  }

  formatTokens(tokens: number): string {
    return Math.round(tokens).toLocaleString('en-US');
  }
}
