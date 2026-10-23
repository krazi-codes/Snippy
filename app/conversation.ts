import { AnthropicRequestBody, AnthropicSystemBlock, ChatMessage } from './types';

let seq = 0;
const mid = () => `m${Date.now()}_${seq++}`;

/**
 * The main conversation. The system prefix is set ONCE and never mutated, so
 * its cache_control breakpoint keeps the Anthropic prompt cache warm. Messages
 * are append-only: results and user turns are added to the end, never spliced
 * into the middle. This is the "don't reset the cache / not painful" rule.
 */
export class Conversation {
  private readonly systemPrefix: string;
  private messages: ChatMessage[] = [];

  constructor(systemPrefix: string) {
    this.systemPrefix = systemPrefix;
  }

  /** Immutable snapshot for the UI. */
  list(): ReadonlyArray<ChatMessage> {
    return this.messages.slice();
  }

  appendUser(content: string): ChatMessage {
    const m: ChatMessage = { id: mid(), role: 'user', content };
    this.messages.push(m);
    return m;
  }

  appendAssistant(content: string): ChatMessage {
    const m: ChatMessage = { id: mid(), role: 'assistant', content };
    this.messages.push(m);
    return m;
  }

  /**
   * Build the request body. When cache is enabled, the stable system prefix
   * carries the cache_control breakpoint; everything volatile is in messages
   * AFTER it, so repeat turns read the prefix at the cache rate.
   */
  toRequestBody(modelId: string, maxTokens: number, cache: boolean): AnthropicRequestBody {
    const system: AnthropicSystemBlock[] = [
      cache
        ? { type: 'text', text: this.systemPrefix, cache_control: { type: 'ephemeral' } }
        : { type: 'text', text: this.systemPrefix }
    ];
    return {
      model: modelId,
      system,
      max_tokens: maxTokens,
      messages: this.messages.map((m) => ({ role: m.role, content: m.content }))
    };
  }

  prefix(): string {
    return this.systemPrefix;
  }
}
