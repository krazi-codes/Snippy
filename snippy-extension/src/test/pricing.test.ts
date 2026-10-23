import * as assert from 'assert';
import { costFor, cacheReadCost, cacheWriteCost, cacheSaving, downshiftSaving } from '../pricing';

suite('Pricing Tests', () => {
  test('costFor calculates correct input cost', () => {
    const model = {
      id: 'test',
      displayName: 'Test Model',
      inputPricePerMTok: 1.0,
      outputPricePerMTok: 2.0,
      cacheReadMultiplier: 0.1,
      cacheWriteMultiplier: 1.25
    };
    
    assert.strictEqual(costFor(1000000, model, 'input'), 1.0);
    assert.strictEqual(costFor(500000, model, 'input'), 0.5);
  });

  test('costFor calculates correct output cost', () => {
    const model = {
      id: 'test',
      displayName: 'Test Model',
      inputPricePerMTok: 1.0,
      outputPricePerMTok: 2.0,
      cacheReadMultiplier: 0.1,
      cacheWriteMultiplier: 1.25
    };
    
    assert.strictEqual(costFor(1000000, model, 'output'), 2.0);
    assert.strictEqual(costFor(500000, model, 'output'), 1.0);
  });

  test('cacheReadCost calculates correctly', () => {
    const model = {
      id: 'test',
      displayName: 'Test Model',
      inputPricePerMTok: 1.0,
      outputPricePerMTok: 2.0,
      cacheReadMultiplier: 0.1,
      cacheWriteMultiplier: 1.25
    };
    
    assert.strictEqual(cacheReadCost(1000000, model), 0.1);
    assert.strictEqual(cacheReadCost(500000, model), 0.05);
  });

  test('cacheWriteCost calculates correctly', () => {
    const model = {
      id: 'test',
      displayName: 'Test Model',
      inputPricePerMTok: 1.0,
      outputPricePerMTok: 2.0,
      cacheReadMultiplier: 0.1,
      cacheWriteMultiplier: 1.25
    };
    
    assert.strictEqual(cacheWriteCost(1000000, model), 1.25);
    assert.strictEqual(cacheWriteCost(500000, model), 0.625);
  });

  test('cacheSaving calculates correctly', () => {
    const model = {
      id: 'test',
      displayName: 'Test Model',
      inputPricePerMTok: 1.0,
      outputPricePerMTok: 2.0,
      cacheReadMultiplier: 0.1,
      cacheWriteMultiplier: 1.25
    };
    
    // Full cost: 1.0, Cache cost: 0.1
    assert.strictEqual(cacheSaving(1000000, 100000, model), 0.9);
    
    // No cache saving (same tokens)
    assert.strictEqual(cacheSaving(1000000, 1000000, model), 0);
  });

  test('downshiftSaving calculates correctly', () => {
    const mainModel = {
      id: 'main',
      displayName: 'Main Model',
      inputPricePerMTok: 3.0,
      outputPricePerMTok: 15.0,
      cacheReadMultiplier: 0.1,
      cacheWriteMultiplier: 1.25
    };
    
    const subModel = {
      id: 'sub',
      displayName: 'Sub Model',
      inputPricePerMTok: 0.25,
      outputPricePerMTok: 1.25,
      cacheReadMultiplier: 0.1,
      cacheWriteMultiplier: 1.25
    };
    
    // Main cost: 3.0 + 15.0 = 18.0
    // Sub cost: 0.25 + 1.25 = 1.5
    // Saving: 18.0 - 1.5 = 16.5
    assert.strictEqual(downshiftSaving(mainModel, subModel, 1000000, 1000000, 0), 16.5);
    
    // With overhead, should clamp to 0
    assert.strictEqual(downshiftSaving(mainModel, subModel, 1000000, 1000000, 20), 0);
  });
});
