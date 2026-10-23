import { HttpClient } from './httpClient';
import { AnthropicRequestBody, MessagesResponse } from './types';

export interface ChatTransport {
  readonly name: string;
  send(body: AnthropicRequestBody): Promise<MessagesResponse>;
}

/**
 * Direct Anthropic transport. The system prefix may already carry a
 * cache_control breakpoint (set by Conversation); we pass it through untouched
 * so the prompt cache stays warm. Future ProxyTransport implements this seam.
 */
export class DirectAnthropicTransport implements ChatTransport {
  readonly name = 'direct';
  constructor(private readonly http: HttpClient) {}

  send(body: AnthropicRequestBody): Promise<MessagesResponse> {
    return this.http.createMessage(body);
  }
}

export function extractText(res: MessagesResponse): string {
  return (res.content || [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
    .trim();
}
