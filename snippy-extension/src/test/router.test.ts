import * as assert from 'assert';
import { buildRouterPrompt, parseRouterJson, heuristicPlan } from '../router';

suite('Router Tests', () => {
  test('buildRouterPrompt creates correct prompt', () => {
    const prompt = buildRouterPrompt('Create a React component');
    assert.ok(prompt.includes('Create a React component'));
    assert.ok(prompt.includes('mode'));
    assert.ok(prompt.includes('subtasks'));
  });

  test('parseRouterJson parses valid JSON', () => {
    const json = `
      {
        "mode": "synthesize",
        "subtasks": [
          {
            "id": "1",
            "description": "Analyze requirements",
            "model": "claude-3-haiku-latest"
          }
        ]
      }
    `;
    
    const result = parseRouterJson(json);
    assert.ok(result);
    assert.strictEqual(result!.mode, 'synthesize');
    assert.strictEqual(result!.subtasks.length, 1);
    assert.strictEqual(result!.subtasks[0].id, '1');
  });

  test('parseRouterJson handles surrounding text', () => {
    const json = `
      Here's the plan:
      {
        "mode": "inject",
        "subtasks": [
          {
            "id": "1",
            "description": "Simple task",
            "model": "claude-3-haiku-latest"
          }
        ]
      }
      End of plan.
    `;
    
    const result = parseRouterJson(json);
    assert.ok(result);
    assert.strictEqual(result!.mode, 'inject');
    assert.strictEqual(result!.subtasks.length, 1);
  });

  test('parseRouterJson returns null for invalid JSON', () => {
    const result = parseRouterJson('{ invalid json }');
    assert.strictEqual(result, null);
  });

  test('heuristicPlan handles simple tasks', () => {
    const plan = heuristicPlan('Write a short email');
    assert.strictEqual(plan.mode, 'inject');
    assert.strictEqual(plan.subtasks.length, 1);
    assert.ok(plan.subtasks[0].description.includes('Write a short email'));
  });

  test('heuristicPlan handles complex tasks', () => {
    const plan = heuristicPlan('Create a full React application with authentication, database integration, and API endpoints');
    assert.strictEqual(plan.mode, 'synthesize');
    assert.strictEqual(plan.subtasks.length, 3);
  });
});
