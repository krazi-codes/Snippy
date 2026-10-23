import * as assert from 'assert';
import { SavingsTracker } from '../savings';

suite('Savings Tests', () => {
  test('savings tracker accumulates correctly', () => {
    const tracker = new SavingsTracker();
    
    tracker.addDownshift(1.5);
    tracker.addCacheReuse(0.75);
    tracker.addFreeRouting(0.25);
    
    const snapshot = tracker.snapshot();
    assert.strictEqual(snapshot.downshift, 1.5);
    assert.strictEqual(snapshot.cacheReuse, 0.75);
    assert.strictEqual(snapshot.freeRouting, 0.25);
    
    const committed = tracker.commit();
    assert.strictEqual(committed.downshift, 1.5);
    assert.strictEqual(committed.cacheReuse, 0.75);
    assert.strictEqual(committed.freeRouting, 0.25);
    
    const freshSnapshot = tracker.snapshot();
    assert.strictEqual(freshSnapshot.downshift, 0);
    assert.strictEqual(freshSnapshot.cacheReuse, 0);
    assert.strictEqual(freshSnapshot.freeRouting, 0);
  });

  test('cumulative savings persist', () => {
    const tracker = new SavingsTracker();
    
    tracker.addDownshift(1.5);
    tracker.commit();
    
    const cumulative = tracker.getCumulative();
    assert.strictEqual(cumulative.downshift, 1.5);
    
    tracker.addDownshift(2.0);
    tracker.commit();
    
    const cumulativeAfter = tracker.getCumulative();
    assert.strictEqual(cumulativeAfter.downshift, 3.5);
  });

  test('persistence works correctly', () => {
    const tracker = new SavingsTracker();
    
    tracker.addDownshift(1.5);
    tracker.addCacheReuse(0.75);
    tracker.addFreeRouting(0.25);
    
    const persistence = tracker.toPersistence();
    assert.strictEqual(persistence.downshift, 1.5);
    assert.strictEqual(persistence.cacheReuse, 0.75);
    assert.strictEqual(persistence.freeRouting, 0.25);
    
    const restored = new SavingsTracker();
    restored.fromPersistence(persistence);
    
    const cumulative = restored.getCumulative();
    assert.strictEqual(cumulative.downshift, 1.5);
    assert.strictEqual(cumulative.cacheReuse, 0.75);
    assert.strictEqual(cumulative.freeRouting, 0.25);
  });
});
