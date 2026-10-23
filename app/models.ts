// Central, updatable model + pricing table.
// Prices are USD per 1,000,000 tokens (per-MTok).
// Cache multipliers: a cache READ costs ~0.1x a normal input token;
// a cache WRITE costs ~1.25x. (Anthropic prompt caching.)

export interface ModelInfo {
  id: string;
  displayName: string;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  cacheReadMultiplier: number;
  cacheWriteMultiplier: number;
}

const DEFAULT_CACHE_READ = 0.1;
const DEFAULT_CACHE_WRITE = 1.25;

function m(
  id: string,
  displayName: string,
  input: number,
  output: number
): ModelInfo {
  return {
    id,
    displayName,
    inputPricePerMTok: input,
    outputPricePerMTok: output,
    cacheReadMultiplier: DEFAULT_CACHE_READ,
    cacheWriteMultiplier: DEFAULT_CACHE_WRITE
  };
}

export const MODELS: ModelInfo[] = [
  m('claude-opus-4-1-20250805', 'Claude Opus 4.1', 15, 75),
  m('claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5', 3, 15),
  m('claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 1, 5),
  m('claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 3, 15),
  m('claude-3-5-haiku-20241022', 'Claude 3.5 Haiku', 0.8, 4)
];

export type PriceOverrides = Record<
  string,
  { inputPricePerMTok?: number; outputPricePerMTok?: number }
>;

export function resolveModels(overrides: PriceOverrides = {}): ModelInfo[] {
  return MODELS.map((model) => {
    const o = overrides[model.id];
    if (!o) return model;
    return {
      ...model,
      inputPricePerMTok: o.inputPricePerMTok ?? model.inputPricePerMTok,
      outputPricePerMTok: o.outputPricePerMTok ?? model.outputPricePerMTok
    };
  });
}

export function findModel(
  id: string,
  overrides: PriceOverrides = {}
): ModelInfo | undefined {
  return resolveModels(overrides).find((model) => model.id === id);
}

/** Cheapest Claude model — a sensible default sub-worker. */
export function cheapestModel(overrides: PriceOverrides = {}): ModelInfo {
  return resolveModels(overrides).reduce((a, b) =>
    a.inputPricePerMTok <= b.inputPricePerMTok ? a : b
  );
}
