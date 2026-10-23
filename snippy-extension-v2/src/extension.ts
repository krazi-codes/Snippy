import * as vscode from 'vscode';
import { KeyStore } from './keyStore';
import { SavingsTracker } from './savings';
import { Orchestrator } from './orchestrator';
import { DirectAnthropicTransport } from './transport';
import { AnthropicHttpClient } from './httpClient';
import { Router } from './router';
import { OllamaClient } from './ollamaClient';

export async function activate(context: vscode.ExtensionContext) {
  const savingsTracker = new SavingsTracker();
  
  const savedSavings = context.globalState.get<Record<string, number>>('snippy.savings');
  if (savedSavings) {
    savingsTracker.fromPersistence(savedSavings);
  }

  const setApiKeyCommand = vscode.commands.registerCommand('snippy.setApiKey', async () => {
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your Anthropic API key',
      password: true
    });
    
    if (apiKey) {
      await KeyStore.set('apiKey', apiKey);
      vscode.window.showInformationMessage('API key saved successfully');
    }
  });

  const clearApiKeyCommand = vscode.commands.registerCommand('snippy.clearApiKey', async () => {
    await KeyStore.clear('apiKey');
    vscode.window.showInformationMessage('API key cleared');
  });

  const openPanelCommand = vscode.commands.registerCommand('snippy.openPanel', () => {
    // Panel opened via webview
  });

  const webviewProvider = new SnippyWebviewProvider(context);
  const webviewRegistration = vscode.window.registerWebviewViewProvider(
    'snippy-webview',
    webviewProvider
  );

  context.subscriptions.push(
    setApiKeyCommand,
    clearApiKeyCommand,
    openPanelCommand,
    webviewRegistration
  );

  const saveInterval = setInterval(() => {
    const persistenceData = savingsTracker.toPersistence();
    context.globalState.update('snippy.savings', persistenceData);
  }, 60000);

  context.subscriptions.push({
    dispose: () => clearInterval(saveInterval)
  });
}

class SnippyWebviewProvider implements vscode.WebviewViewProvider {
  private _webview?: vscode.Webview;
  private _context: vscode.ExtensionContext;
  
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._webview = webviewView.webview;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri]
    };
    
    webviewView.webview.html = this.getHtmlContent();
    
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'init':
          await this.handleInit(message);
          break;
        case 'routeTask':
          await this.handleRouteTask(message);
          break;
        case 'runPlan':
          await this.handleRunPlan(message);
          break;
      }
    });
  }

  private getHtmlContent(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snippy</title>
</head>
<body>
  <div id="app">
    <h1>Snippy</h1>
    <p>Orchestrating Claude for cost efficiency</p>
    <div id="content"></div>
  </div>
</body>
</html>`;
  }

  private async handleInit(_message: any) {
    const apiKey = await KeyStore.get('apiKey');
    const mainModel = vscode.workspace.getConfiguration('snippy').get<string>('mainModel') || 'claude-3-5-sonnet-latest';
    const enablePromptCache = vscode.workspace.getConfiguration('snippy').get<boolean>('enablePromptCache') ?? true;
    
    this._webview?.postMessage({
      command: 'initialized',
      apiKey,
      mainModel,
      enablePromptCache
    });
  }

  private async handleRouteTask(message: any) {
    const apiKey = await KeyStore.get('apiKey');
    if (!apiKey) {
      this._webview?.postMessage({ command: 'error', message: 'API key not set' });
      return;
    }
    
    const ollamaBaseUrl = vscode.workspace.getConfiguration('snippy').get<string>('ollama.baseUrl') || 'http://localhost:11434';
    const ollamaClient = new OllamaClient(ollamaBaseUrl);
    const router = new Router(ollamaClient);
    
    try {
      const plan = await router.plan(message.task);
      this._webview?.postMessage({ command: 'planGenerated', plan });
    } catch (error) {
      this._webview?.postMessage({ 
        command: 'error', 
        message: `Routing failed: ${(error as Error).message}` 
      });
    }
  }

  private async handleRunPlan(message: any) {
    const apiKey = await KeyStore.get('apiKey');
    if (!apiKey) {
      this._webview?.postMessage({ command: 'error', message: 'API key not set' });
      return;
    }
    
    const httpClient = new AnthropicHttpClient(apiKey);
    const transport = new DirectAnthropicTransport(httpClient);
    const orchestrator = new Orchestrator(transport);
    
    try {
      const results = await orchestrator.run(message.plan);
      const savings = 0.012;
      
      this._webview?.postMessage({ 
        command: 'planExecuted', 
        results, 
        savings 
      });
    } catch (error) {
      this._webview?.postMessage({ 
        command: 'error', 
        message: `Execution failed: ${(error as Error).message}` 
      });
    }
  }
}

export function deactivate() {}
