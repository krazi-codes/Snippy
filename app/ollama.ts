export interface OllamaClient {
  listModels(): Promise<string[]>;
  generate(model: string, prompt: string): Promise<string>;
  isReachable(): Promise<boolean>;
}

/** Talks to a local Ollama server. All calls are free and offline. */
export class HttpOllamaClient implements OllamaClient {
  constructor(private readonly getBaseUrl: () => string) {}

  private base(): string {
    return this.getBaseUrl().replace(/\/+$/, '');
  }

  async isReachable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.base()}/api/tags`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    const res = await fetch(`${this.base()}/api/tags`, { method: 'GET' });
    if (!res.ok) throw new Error(`Ollama /api/tags ${res.status}`);
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name);
  }

  async generate(model: string, prompt: string): Promise<string> {
    const res = await fetch(`${this.base()}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        // Ask Ollama to bias toward JSON; we still parse defensively.
        format: 'json',
        options: { temperature: 0 }
      })
    });
    if (!res.ok) throw new Error(`Ollama /api/generate ${res.status}`);
    const data = (await res.json()) as { response?: string };
    return data.response ?? '';
  }
}
