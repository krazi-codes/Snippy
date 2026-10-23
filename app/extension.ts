import * as vscode from 'vscode';
import { KeyStore } from './keyStore';
import { AnthropicHttpClient } from './httpClient';
import { HttpOllamaClient } from './ollamaClient';
import { PricingCalculator } from './pricing';
import { SavingsCalculator, SavingsPersistence } from './savings';
import { DirectAnthropicTransport } from './transport';
import { resolveModels, findModel } from './models';
import { SnippyViewProvider } from './webview/provider';

const SAVINGS_STATE_KEY = 'snippy.savings.v2';

export function activate(context: vscode.ExtensionContext) {
  const keyStore = new KeyStore(context.secrets);
  const http = new AnthropicHttpClient(() => keyStore.get());

  const cfg = () => vscode.workspace.getConfiguration('snippy');
  const ollama = new HttpOllamaClient(() =>
    cfg().get<string>('snippy.ollama.baseUrl', 'http://localhost:11434')
  );

  const pricing = new PricingCalculator();
  const transport = new DirectAnthropicTransport(http);

  const persisted = context.globalState.get<SavingsPersistence>(SAVINGS_STATE_KEY, {
    downshiftTotalUsd: 0,
    cacheTotalUsd: 0,
    routerTotalUsd: 0
  });
  const savings = new SavingsCalculator(
    pricing,
    persisted.downshiftTotalUsd,
    persisted.cacheTotalUsd,
    persisted.routerTotalUsd
  );
  const persistSavings = () =>
    context.globalState.update(SAVINGS_STATE_KEY, savings.toPersistence());

  const statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusItem.command = 'snippy.focus';
  const renderStatus = () => {
    const snap = savings.snapshot();
    statusItem.text = `$(sparkle) Snippy ${pricing.formatUsd(snap.totalAllTimeUsd)}`;
    statusItem.tooltip = `Snippy — saved ${pricing.formatUsd(
      snap.totalAllTimeUsd
    )} all time (downshift ${pricing.formatUsd(
      snap.downshiftTotalUsd
    )} · cache ${pricing.formatUsd(snap.cacheTotalUsd)} · free routing ${pricing.formatUsd(
      snap.routerTotalUsd
    )})`;
    statusItem.show();
  };
  renderStatus();

  const provider = new SnippyViewProvider(context, {
    keyStore,
    ollama,
    pricing,
    savings,
    transport,
    getModels: () => resolveModels(cfg().get('priceOverrides', {})),
    findModel: (id) => findModel(id, cfg().get('priceOverrides', {})),
    getMainModelId: () =>
      cfg().get<string>('mainModel', 'claude-sonnet-4-5-20250929'),
    getRouterModel: () => cfg().get<string>('ollama.routerModel', 'llama3.1'),
    getMaxTokens: () => cfg().get<number>('maxTokens', 1024),
    getCacheEnabled: () => cfg().get<boolean>('enablePromptCache', true),
    onSavingsChanged: () => {
      renderStatus();
      void persistSavings();
    }
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SnippyViewProvider.viewId, provider),
    statusItem,
    vscode.commands.registerCommand('snippy.setApiKey', async () => {
      const value = await vscode.window.showInputBox({
        prompt: 'Enter your Anthropic API key',
        password: true,
        ignoreFocusOut: true,
        placeHolder: 'sk-ant-...'
      });
      if (value && value.trim()) {
        await keyStore.set(value);
        provider.notifyKeyState();
        vscode.window.showInformationMessage('Snippy: API key saved.');
      }
    }),
    vscode.commands.registerCommand('snippy.clearApiKey', async () => {
      await keyStore.clear();
      provider.notifyKeyState();
      vscode.window.showInformationMessage('Snippy: API key cleared.');
    }),
    vscode.commands.registerCommand('snippy.focus', async () => {
      await vscode.commands.executeCommand('snippy.panel.focus');
    })
  );
}

export function deactivate() {
  /* no-op */
}
