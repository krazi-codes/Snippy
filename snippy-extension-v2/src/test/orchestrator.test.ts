import * as assert from 'assert';
import { Orchestrator } from '../orchestrator';
import { SubtaskResult } from '../types';

suite('Orchestrator Tests', () => {
  test('buildAppendBlock works for inject mode', () => {
    const result: SubtaskResult = {
      id: '1',
      content: 'This is the result content',
      model: 'claude-3-haiku-latest',
      inputTokens: 100,
      outputTokens: 200,
      cacheReadInputTokens: 50
    };
    
    const block = new Orchestrator(null as any).buildAppendBlock(result, 'inject');
    assert.strictEqual(block, 'This is the result content');
  });

  test('buildAppendBlock works for synthesize mode', () => {
    const result: SubtaskResult = {
      id: '1',
      content: 'This is the result content',
      model: 'claude-3-haiku-latest',
      inputTokens: 100,
      outputTokens: 200,
      cacheReadInputTokens: 50
    };
    
    const block = new Orchestrator(null as any).buildAppendBlock(result, 'synthesize');
    assert.ok(block.includes('[Subtask 1]'));
    assert.ok(block.includes('This is the result content'));
  });
});
