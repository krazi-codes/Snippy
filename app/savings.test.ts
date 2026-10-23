import { test, assert } from './helpers';
import { SavingsCalculator } from '../src/savings';
import { PricingCalculator } from '../src/pricing';

function calc() {
  return new SavingsCalculator(new PricingCalculator());
}

test('buckets accumulate separately and total up', () => {
  const s = calc();
  s.addDownshift(2);
  s.addCache(0.5);
  s.addRouter(0.1);
  const snap = s.snapshot();
  assert.strictEqual(snap.downshiftSessionUsd, 2);
  assert.strictEqual(snap.cacheSessionUsd, 0.5);
  assert.strictEqual(snap.routerSessionUsd, 0.1);
  assert.strictEqual(snap.totalSessionUsd, 2.6);
});

test('negative/zero contributions are ignored', () => {
  const s = calc();
  s.addDownshift(-5);
  s.addCache(0);
  assert.strictEqual(s.snapshot().totalSessionUsd, 0);
});

test('commit folds session into all-time and resets session', () => {
  const s = calc();
  s.addDownshift(3);
  s.addCache(1);
  const after = s.commit();
  assert.strictEqual(after.downshiftTotalUsd, 3);
  assert.strictEqual(after.cacheTotalUsd, 1);
  assert.strictEqual(after.totalSessionUsd, 0);
  assert.strictEqual(after.totalAllTimeUsd, 4);
});

test('persistence round-trip restores all three totals', () => {
  const s = new SavingsCalculator(new PricingCalculator(), 1, 2, 3);
  const p = s.toPersistence();
  assert.deepStrictEqual(p, { downshiftTotalUsd: 1, cacheTotalUsd: 2, routerTotalUsd: 3 });
  const restored = new SavingsCalculator(new PricingCalculator(), p.downshiftTotalUsd, p.cacheTotalUsd, p.routerTotalUsd);
  assert.strictEqual(restored.snapshot().totalAllTimeUsd, 6);
});
