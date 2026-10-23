import { test, assert } from './helpers';
import { parseRouterJson, heuristicPlan, buildRouterPrompt } from '../src/router';
import { MODELS } from '../src/models';

const validIds = new Set(MODELS.map((m) => m.id));

test('parseRouterJson parses a clean plan', () => {
  const raw = JSON.stringify({
    mode: 'synthesize',
    subtasks: [
      { title: 'A', prompt: 'do a', suggestedModel: 'claude-haiku-4-5-20251001', splittable: true },
      { title: 'B', prompt: 'do b', suggestedModel: 'claude-sonnet-4-5-20250929', splittable: true }
    ]
  });
  const plan = parseRouterJson(raw, validIds);
  assert.ok(plan);
  assert.strictEqual(plan!.mode, 'synthesize');
  assert.strictEqual(plan!.subtasks.length, 2);
  assert.strictEqual(plan!.source, 'ollama');
});

test('parseRouterJson tolerates surrounding prose', () => {
  const raw = 'Here is the plan:\n{"mode":"inject","subtasks":[{"prompt":"x","suggestedModel":"claude-haiku-4-5-20251001"}]}\nThanks!';
  const plan = parseRouterJson(raw, validIds);
  assert.ok(plan);
  assert.strictEqual(plan!.subtasks.length, 1);
});

test('parseRouterJson returns null on garbage', () => {
  assert.strictEqual(parseRouterJson('not json at all', validIds), null);
  assert.strictEqual(parseRouterJson('{"mode":"inject"}', validIds), null); // no subtasks
});

test('invalid suggestedModel is blanked for later fill', () => {
  const raw = '{"mode":"inject","subtasks":[{"prompt":"x","suggestedModel":"gpt-4"}]}';
  const plan = parseRouterJson(raw, validIds);
  assert.strictEqual(plan!.subtasks[0].suggestedModel, '');
});

test('heuristicPlan: easy task -> single inject subtask', () => {
  const plan = heuristicPlan('say hello', MODELS);
  assert.strictEqual(plan.mode, 'inject');
  assert.strictEqual(plan.subtasks.length, 1);
  assert.strictEqual(plan.source, 'heuristic');
});

test('heuristicPlan: hard task -> synthesize with splits', () => {
  const plan = heuristicPlan('Refactor the architecture. Then optimize the hot path.', MODELS);
  assert.strictEqual(plan.mode, 'synthesize');
  assert.ok(plan.subtasks.length >= 1);
});

test('buildRouterPrompt includes the task and strict-JSON instruction', () => {
  const prompt = buildRouterPrompt('do thing', MODELS, 'claude-sonnet-4-5-20250929');
  assert.ok(prompt.includes('do thing'));
  assert.ok(prompt.toLowerCase().includes('strict json'));
});
