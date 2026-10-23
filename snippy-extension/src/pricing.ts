import { ClaudeModel } from './models';

export function costFor(tokens: number, model: ClaudeModel, type: 'input' | 'output'): number {
  const pricePerMTok = type === 'input' ? model.inputPricePerMTok : model.outputPricePerMTok;
  return (tokens / 1_000_000) * pricePerMTok;
}

export function cacheReadCost(tokens: number, model: ClaudeModel): number {
  return costFor(tokens, model, 'input') * model.cacheReadMultiplier;
}

export function cacheWriteCost(tokens: number, model: ClaudeModel): number {
  return costFor(tokens, model, 'input') * model.cacheWriteMultiplier;
}

export function cacheSaving(inputTokens: number, cacheReadTokens: number, model: ClaudeModel): number {
  const fullCost = costFor(inputTokens, model, 'input');
  const cacheCost = cacheReadCost(cacheReadTokens, model);
  return Math.max(0, fullCost - cacheCost);
}

export function downshiftSaving(
  mainModel: ClaudeModel,
  subModel: ClaudeModel,
  inTokens: number,
  outTokens: number,
  overheadUsd: number
): number {
  const mainCost = costFor(inTokens, mainModel, 'input') + costFor(outTokens, mainModel, 'output');
  const subCost = costFor(inTokens, subModel, 'input') + costFor(outTokens, subModel, 'output');
  
  // Clamp to prevent negative savings
  return Math.max(0, mainCost - subCost - overheadUsd);
}

export function formatUsd(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

export function formatTokens(tokens: number): string {
  return `${tokens.toLocaleString()}`;
}
