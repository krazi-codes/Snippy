import * as vscode from 'vscode';

export class KeyStore {
  static async set(key: string, value: string): Promise<void> {
    const secrets = vscode.workspace.getConfiguration('snippy');
    await secrets.update(key, value, vscode.ConfigurationTarget.Global);
  }

  static async get(key: string): Promise<string | undefined> {
    const secrets = vscode.workspace.getConfiguration('snippy');
    return secrets.get<string>(key);
  }

  static async clear(key: string): Promise<void> {
    const secrets = vscode.workspace.getConfiguration('snippy');
    await secrets.update(key, undefined, vscode.ConfigurationTarget.Global);
  }

  static async has(key: string): Promise<boolean> {
    const secrets = vscode.workspace.getConfiguration('snippy');
    const value = await secrets.get<string>(key);
    return value !== undefined;
  }
}
