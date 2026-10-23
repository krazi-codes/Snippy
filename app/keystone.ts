import type * as vscode from 'vscode';

const KEY = 'snippy.anthropicApiKey';

/** Thin wrapper over SecretStorage so the key never leaks to the webview. */
export class KeyStore {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  get(): Promise<string | undefined> {
    return Promise.resolve(this.secrets.get(KEY));
  }

  async set(value: string): Promise<void> {
    await this.secrets.store(KEY, value.trim());
  }

  async clear(): Promise<void> {
    await this.secrets.delete(KEY);
  }

  async has(): Promise<boolean> {
    return (await this.get())?.length ? true : false;
  }
}
