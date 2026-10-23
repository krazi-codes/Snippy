import { AnthropicRequestBody, MessagesResponse } from './types';

export interface HttpClient {
  countTokens(body: AnthropicRequestBody): Promise<{ input_tokens: number }>;
  createMessage(body: AnthropicRequestBody): Promise<MessagesResponse>;
}

const API_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicHttpClient implements HttpClient {
  constructor(private readonly getApiKey: () => Promise<string | undefined>) {}

  private async headers(): Promise<Record<string, string>> {
    const key = await this.getApiKey();
    if (!key) throw new Error('NO_API_KEY');
    return {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION
    };
  }

  async countTokens(body: AnthropicRequestBody): Promise<{ input_tokens: number }> {
    const res = await fetch(`${API_BASE}/messages/count_tokens`, {
      method: 'POST',
      headers: await this.headers(),
      body: JSON.stringify({
        model: body.model,
        system: body.system,
        messages: body.messages
      })
    });
    if (!res.ok) throw await toError(res);
    return (await res.json()) as { input_tokens: number };
  }

  async createMessage(body: AnthropicRequestBody): Promise<MessagesResponse> {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: await this.headers(),
      body: JSON.stringify({
        model: body.model,
        system: body.system,
        messages: body.messages,
        max_tokens: body.max_tokens ?? 1024
      })
    });
    if (!res.ok) throw await toError(res);
    return (await res.json()) as MessagesResponse;
  }
}

async function toError(res: Response): Promise<Error> {
  let detail = '';
  try {
    detail = await res.text();
  } catch {
    /* ignore */
  }
  const err = new Error(`Anthropic API error ${res.status}: ${detail}`);
  (err as any).status = res.status;
  return err;
}
