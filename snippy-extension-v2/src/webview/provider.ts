import * as vscode from 'vscode';
import { SavingsTracker } from '../savings';

export class SnippyWebviewProvider implements vscode.WebviewViewProvider {
  private _webview?: vscode.Webview;
  private _context: vscode.ExtensionContext;
  private _savingsTracker: SavingsTracker;
  
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._savingsTracker = new SavingsTracker();
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
    const nonce = this.getNonce();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-${nonce}';">
  <title>Snippy</title>
</head>
<body>
  <div class="container">
    <h1>Snippy</h1>
  </div>
  <script nonce="${nonce}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private async handleInit(message: any) {
    this._webview?.postMessage({
      command: 'initialized',
      apiKey: message.apiKey,
      mainModel: message.mainModel,
      enablePromptCache: message.enablePromptCache
    });
  }

  private async handleRouteTask(_message: any) {
    const plan = {
      mode: 'synthesize',
      subtasks: [
        {
          id: '1',
          description: 'Analyze requirements',
          model: 'claude-3-haiku-latest'
        },
        {
          id: '2',
          description: 'Design solution',
          model: 'claude-3-sonnet-latest'
        }
      ],
      source: 'heuristic'
    };
    
    this._webview?.postMessage({ 
      command: 'planGenerated', 
      plan 
    });
  }

  private async handleRunPlan(_message: any) {
    const results = [
      {
        id: '1',
        content: 'Requirements analysis completed',
        model: 'claude-3-haiku-latest',
        inputTokens: 100,
        outputTokens: 200,
        cacheReadInputTokens: 50
      },
      {
        id: '2',
        content: 'Solution design completed',
        model: 'claude-3-sonnet-latest',
        inputTokens: 200,
        outputTokens: 300,
        cacheReadInputTokens: 100
      }
    ];
    
    this._webview?.postMessage({ 
      command: 'planExecuted', 
      results 
    });
  }
}
