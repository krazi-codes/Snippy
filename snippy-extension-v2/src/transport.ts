import { AnthropicRequestBody, MessagesResponse } from './types';
import { AnthropicHttpClient } from './httpClient';

export interface ChatTransport {
  createMessage(body: AnthropicRequestBody): Promise<MessagesResponse>;
}

export class DirectAnthropicTransport implements ChatTransport {
  constructor(private httpClient: AnthropicHttpClient) {}

  async createMessage(body: AnthropicRequestBody): Promise<MessagesResponse> {
    return await this.httpClient.createMessage(body);
  }
}

export function extractText(response: MessagesResponse): string {
  return response.content
    .filter(c => c.type === 'text')
    .map(c => c.text || '')
    .join('\n');
}
