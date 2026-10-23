import { test, assert } from './helpers';
import { Router, parseRouterJson } from '../src/router';
import { OllamaClient } from '../src/ollamaClient';
import { MODELS } from '../src/models';

class FakeOllama implements OllamaClient {
  constructor(private reachable: boolean, private reply = '') {}
  async isReachable() { return this.reachable; }
  async listModels() { return ['llama3.1', 'qwen2.5']; }
  async generate() { return this.reply; }
}

test('Router falls back to heuristic when Ollama is unreachable', async () => {
  const r = new Router({
    ollama: new FakeOllama(false),
    routerModel: 'llama3.1',
    mainModelId: 'claude-sonnet-4-5-20250929',
    models: MODELS
  });
  const plan = await r.plan('say hello');
  assert.strictEqual(plan.source, 'heuristic');
});

test('Router uses Ollama output when reachable and valid', async () => {
  const reply = '{"mode":"inject","subtasks":[{"prompt":"x","suggestedModel":"claude-haiku-4-5-20251001"}]}';
  const r = new Router({
    ollama: new FakeOllama(true, reply),
    routerModel: 'llama3.1',
    mainModelId: 'claude-sonnet-4-5-20250929',
    models: MODELS
  });
  const plan = await r.plan('do x');
  assert.strictEqual(plan.source, 'ollama');
  assert.strictEqual(plan.subtasks.length, 1);
});

test('Router fills a missing/blank model with the cheapest', async () => {
  const reply = '{"mode":"inject","subtasks":[{"prompt":"x","suggestedModel":"bogus"}]}';
  const r = new Router({
    ollama: new FakeOllama(true, reply),
    routerModel: 'llama3.1',
    mainModelId: 'claude-sonnet-4-5-20250929',
    models: MODELS
  });
  const plan = await r.plan('do x');
  assert.notStrictEqual(plan.subtasks[0].suggestedModel, '');
});

test('Router falls back when Ollama returns garbage', async () => {
  const r = new Router({
    ollama: new FakeOllama(true, 'sorry, I cannot'),
    routerModel: 'llama3.1',
    mainModelId: 'claude-sonnet-4-5-20250929',
    models: MODELS
  });
  const plan = await r.plan('do x');
  assert.strictEqual(plan.source, 'heuristic');
});

