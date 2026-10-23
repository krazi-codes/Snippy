import { test, assert } from './helpers';
import { PricingCalculator } from '../src/pricing';
import { ModelInfo } from '../src/models';
import { test, assert } from './helpers';
import { PricingCalculator } from '../src/pricing';
import { ModelInfo } from '../src/models';

const model: ModelInfo = {
  id: 'x',
  displayName: 'X',
  inputPricePerMTok: 3,
  outputPricePerMTok: 15
};

test('costFor input tokens', () => {
  const p = new PricingCalculator();
  // 1,000,000 input tokens at $3/MTok = $3
  assert.strictEqual(p.costFor(1_000_000, model, 'input'), 3);
});

test('costFor output tokens uses output price', () => {
  const p = new PricingCalculator();
  assert.strictEqual(p.costFor(1_000_000, model, 'output'), 15);
});

test('costFor scales linearly and clamps negatives', () => {
  const p = new PricingCalculator();
  assert.strictEqual(p.costFor(500_000, model, 'input'), 1.5);
  assert.strictEqual(p.costFor(0, model, 'input'), 0);
  assert.strictEqual(p.costFor(-10, model, 'input'), 0);
});

test('formatUsd formats small and large amounts', () => {
  const p = new PricingCalculator();
  assert.strictEqual(p.formatUsd(0), '$0.00');
  assert.strictEqual(p.formatUsd(0.0003), '$0.0003');
  assert.strictEqual(p.formatUsd(2.5), '$2.50');
});
const main: ModelInfo = {
  id: 'opus', displayName: 'Opus', inputPricePerMTok: 15, outputPricePerMTok: 75,
  cacheReadMultiplier: 0.1, cacheWriteMultiplier: 1.25
};
const sub: ModelInfo = {
  id: 'haiku', displayName: 'Haiku', inputPricePerMTok: 1, outputPricePerMTok: 5,
  cacheReadMultiplier: 0.1, cacheWriteMultiplier: 1.25
};

test('costFor input/output', () => {
  const p = new PricingCalculator();
  assert.strictEqual(p.costFor(1_000_000, main, 'input'), 15);
  assert.strictEqual(p.costFor(1_000_000, main, 'output'), 75);
});

test('cacheReadCost is ~10% of input', () => {
  const p = new PricingCalculator();
  assert.strictEqual(p.cacheReadCost(1_000_000, main), 1.5); // 15 * 0.1
});

test('cacheSaving is full input minus cache read', () => {
  const p = new PricingCalculator();
  assert.strictEqual(p.cacheSaving(1_000_000, main), 13.5); // 15 - 1.5
});

test('downshiftSaving positive when sub is cheaper', () => {
  const p = new PricingCalculator();
  // 1M in + 1M out: main=90, sub=6 -> save 84
  assert.strictEqual(p.downshiftSaving(main, sub, 1_000_000, 1_000_000), 84);
});

test('downshiftSaving clamps to 0 when overhead exceeds gain', () => {
  const p = new PricingCalculator();
  const s = p.downshiftSaving(main, sub, 1000, 1000, 100);
  assert.strictEqual(s, 0);
});
