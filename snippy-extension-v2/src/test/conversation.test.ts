import * as assert from 'assert';
import { Conversation } from '../conversation';

suite('Conversation Tests', () => {
  test('conversation initializes with system prefix', () => {
    const conv = new Conversation();
    const messages = conv.list();
    assert.strictEqual(messages.length, 1);
    assert.strictEqual(messages[0].role, 'system');
    assert.strictEqual(messages[0].content, 'You are a helpful AI assistant.');
  });

  test('conversation appends messages correctly', () => {
    const conv = new Conversation();
    conv.append({ role: 'user', content: 'Hello' });
    conv.append({ role: 'assistant', content: 'Hi there!' });
    
    const messages = conv.list();
    assert.strictEqual(messages.length, 3);
    assert.strictEqual(messages[1].role, 'user');
    assert.strictEqual(messages[1].content, 'Hello');
    assert.strictEqual(messages[2].role, 'assistant');
    assert.strictEqual(messages[2].content, 'Hi there!');
  });

  test('toRequestBody works with cache disabled', () => {
    const conv = new Conversation();
    const body = conv.toRequestBody('claude-3-haiku-latest', 4096, false);
    
    assert.ok(body);
    assert.strictEqual(body.model, 'claude-3-haiku-latest');
    assert.strictEqual(body.max_tokens, 4096);
  });
});
