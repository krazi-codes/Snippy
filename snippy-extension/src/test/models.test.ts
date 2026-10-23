import * as assert from 'assert';
import { findModel, cheapestModel, mergePriceOverrides } from '../models';

suite('Models Tests', () => {
  test('findModel finds existing models', () => {
    const model = findModel('claude-3-5-sonnet-latest');
    assert.ok(model);
    assert.strictEqual(model!.id, 'claude-3-5-sonnet-latest');
    assert.strictEqual(model!.displayName, 'Claude 3.5 Sonnet');
  });

  test('findModel returns undefined for non-existent models', () => {
    const model = findModel('non-existent-model');
    assert.strictEqual(model, undefined);
  });

  test('cheapestModel returns correct model', () => {
    const model = cheapestModel();
    assert.strictEqual(model.id, 'claude-3-haiku-latest');
  });

  test('mergePriceOverrides merges correctly', () => {
    const overrides = {
      'claude-3-5-sonnet-latest': {
        inputPricePerMTok: 2.5,
        outputPricePerMTok: 12.0
      }
    };
    
    const merged = mergePriceOverrides(overrides);
    
    // Check that original model was overridden
    const sonnet = merged.find(m => m.id === 'claude-3-5-sonnet-latest');
    assert.ok(sonnet);
    assert.strictEqual(sonnet!.inputPricePerMTok, 2.5);
    assert.strictEqual(sonnet!.outputPricePerMTok, 12.0);
    
    // Check that other models remain unchanged
    const haiku = merged.find(m => m.id === 'claude-3-haiku-latest');
    assert.ok(haiku);
    assert.strictEqual(haiku!.inputPricePerMTok, 0.25);
  });
});
