import * as vscode from 'vscode';

function nonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}

export function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const n = nonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview.css'));
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} https: data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${n}'`
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
  <title>Snippy</title>
</head>
<body>
  <div id="app">
    <header class="topbar">
      <div class="brand"><span class="logo">✨</span> Snippy</div>
      <select id="mainModel" class="model-select" title="Main Claude model"></select>
    </header>

    <div id="ollamaBadge" class="badge warn hidden">Ollama offline — using local heuristic router</div>

    <section id="savings" class="savings collapsed">
      <button id="savingsToggle" class="savings-head" aria-expanded="false">
        <span class="savings-summary"><span class="chev">▸</span>
          <span>Saved <strong id="savedTotal">$0.00</strong></span></span>
        <span class="muted">this session <span id="savedSession">$0.00</span></span>
      </button>
      <div class="savings-body">
        <div class="savings-row"><span>Downshift (cheaper models)</span><strong id="savedDownshift">$0.00</strong></div>
        <div class="savings-row"><span>Prompt cache reuse</span><strong id="savedCache">$0.00</strong></div>
        <div class="savings-row"><span>Free local routing</span><strong id="savedRouter">$0.00</strong></div>
        <p class="hint">Routing runs on your local Ollama model for free. Easy subtasks go to cheaper Claude models; the main thread stays cache-warm.</p>
      </div>
    </section>

    <section id="noKey" class="empty hidden">
      <div class="empty-icon">🔑</div>
      <h3>Connect your Claude API key</h3>
      <p class="muted">Stored securely in VS Code; used only to call Anthropic.</p>
      <button id="connectBtn" class="primary">Set API Key</button>
    </section>

    <section id="main" class="chat hidden">
      <div id="messages" class="messages">
        <div id="placeholder" class="placeholder muted">Describe a task below. Snippy will route it locally, then run Claude sub-workers.</div>
      </div>

      <!-- Router proposal (editable) -->
      <section id="proposal" class="proposal hidden">
        <div class="proposal-head">
          <span>Routing plan <span id="planSource" class="muted"></span></span>
          <select id="planMode" title="Mode">
            <option value="inject">inject</option>
            <option value="synthesize">synthesize</option>
          </select>
        </div>
        <div id="subtasks" class="subtasks"></div>
        <div class="proposal-actions">
          <button id="addSubtask" class="ghost">+ Subtask</button>
          <span class="spacer"></span>
          <button id="rejectPlan" class="ghost">Send to main model instead</button>
          <button id="runPlan" class="primary">Run plan</button>
        </div>
      </section>

      <!-- Live worker chips -->
      <div id="workers" class="workers hidden"></div>

      <div class="composer">
        <textarea id="task" rows="3" placeholder="Describe the task…"></textarea>
        <div class="composer-foot">
          <span class="muted" id="statusLine">Ready</span>
          <button id="routeBtn" class="primary">Route task</button>
        </div>
        <div class="composer-foot"><button id="clearKeyBtn" class="link">Change key</button></div>
      </div>
    </section>

    <div id="toast" class="toast hidden"></div>
  </div>
  <script nonce="${n}" src="${scriptUri}"></script>
</body>
</html>`;
}
