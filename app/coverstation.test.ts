import { test, assert } from './helpers';
import { Conversation } from '../src/conversation';

test('system prefix never changes across appends (cache-safe)', () => {
  const c = new Conversation('STABLE PREFIX');
  const before = c.prefix();
  c.appendUser('hi');
  c.appendAssistant('hello');
  c.appendUser('more');
  assert.strictEqual(c.prefix(), before);
});

test('messages are append-only and ordered', () => {
  const c = new Conversation('P');
  c.appendUser('one');
  c.appendAssistant('two');
  c.appendUser('three');
  assert.deepStrictEqual(c.list().map((m) => m.content), ['one', 'two', 'three']);
});

test('cache enabled puts cache_control on the system prefix only', () => {
  const c = new Conversation('P');
  c.appendUser('q');
  const body = c.toRequestBody('opus', 100, true);
  const sys = body.system as any[];
  assert.strictEqual(sys[0].cache_control.type, 'ephemeral');
  // Messages carry no cache markers (volatile tail).
  assert.ok(body.messages.every((m) => !(m as any).cache_control));
});

test('cache disabled omits cache_control', () => {
  const c = new Conversation('P');
  const body = c.toRequestBody('opus', 100, false);
  const sys = body.system as any[];
  assert.strictEqual(sys[0].cache_control, undefined);
});

test('list returns a copy (no external mutation)', () => {
  const c = new Conversation('P');
  c.appendUser('x');
  const snap = c.list() as any[];
  snap.push({ id: 'z', role: 'user', content: 'injected' });
  assert.strictEqual(c.list().length, 1);
});
