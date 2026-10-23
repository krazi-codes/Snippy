// This file will be generated during compilation
export function generateWebviewHtml(nonce: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-${nonce}';">
  <title>Snippy</title>
  <style>
    :root {
      --background-color: #1e1e1e;
      --panel-background: #2d2d2d;
      --text-color: #d4d4d4;
      --border-color: #444444;
      --primary-color: #007acc;
      --success-color: #4caf50;
      --warning-color: #ff9800;
      --error-color: #f44336;
    }
    
    body {
      background-color: var(--background-color);
      color: var(--text-color);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', system-ui, 'Ubuntu', 'Droid Sans', sans-serif;
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;
    }
    
    .container {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .status-bar {
      background-color: var(--panel-background);
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
    }
    
    .savings-widget {
      background-color: var(--panel-background);
      border-radius: 4px;
      padding: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .savings-header {
      display: flex;
      justify-content: space-between;
      cursor: pointer;
      padding: 0.25rem 0;
    }
    
    .savings-content {
      display: none;
      padding-top: 0.5rem;
    }
    
    .savings-content.expanded {
      display: block;
    }
    
    .savings-item {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
    }
    
    .controls {
      margin-bottom: 1rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.25rem;
      font-weight: bold;
    }
    
    input, select, textarea {
      width: 100%;
      padding: 0.5rem;
      background-color: var(--panel-background);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-color);
    }
    
    button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 0.5rem;
    }
    
    button:hover {
      background-color: #005a9e;
    }
    
    .btn-secondary {
      background-color: #555;
    }
    
    .btn-secondary:hover {
      background-color: #777;
    }
    
    .messages-list {
      background-color: var(--panel-background);
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .message {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
    }
    
    .user-message {
      background-color: rgba(0, 122, 204, 0.1);
    }
    
    .assistant-message {
      background-color: rgba(100, 100, 100, 0.1);
    }
    
    .plan-editor {
      background-color: var(--panel-background);
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .subtask {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
    
    .subtask-input {
      flex-grow: 1;
      margin-right: 0.5rem;
    }
    
    .subtask-model {
      width: 150px;
      margin-right: 0.5rem;
    }
    
    .subtask-actions {
      display: flex;
      gap: 0.25rem;
    }
    
    .worker-chip {
      background-color: var(--primary-color);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      margin-right: 0.5rem;
      font-size: 0.8rem;
    }
    
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 0.5rem;
    }
    
    .status-indicator.connected {
      background-color: var(--success-color);
    }
    
    .status-indicator.disconnected {
      background-color: var(--error-color);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Snippy</h1>
      <div class="status-bar">
        <span id="savings-display">$0.0000</span>
        <span id="status-indicator" class="status-indicator disconnected"></span>
        <span id="status-text">No API key</span>
      </div>
    </div>
    
    <div class="savings-widget">
      <div class="savings-header" id="savings-header">
        <span>Savings Summary</span>
        <span>▼</span>
      </div>
      <div class="savings-content" id="savings-content">
        <div class="savings-item">
          <span>Downshift:</span>
          <span id="downshift-savings">$0.0000</span>
        </div>
        <div class="savings-item">
          <span>Cache Reuse:</span>
          <span id="cache-reuse-savings">$0.0000</span>
        </div>
        <div class="savings-item">
          <span>Free Routing:</span>
          <span id="free-routing-savings">$0.0000</span>
        </div>
      </div>
    </div>
    
    <div class="controls">
      <div class="form-group">
        <label for="main-model">Main Model:</label>
        <select id="main-model">
          <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
          <option value="claude-3-opus-latest">Claude 3 Opus</option>
          <option value="claude-3-sonnet-latest">Claude 3 Sonnet</option>
          <option value="claude-3-haiku-latest">Claude 3 Haiku</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="task-input">Task Description:</label>
        <textarea id="task-input" rows="3" placeholder="Describe the task you want to execute..."></textarea>
      </div>
      
      <button id="route-btn">Route Task</button>
      <button id="clear-btn" class="btn-secondary">Clear</button>
    </div>
    
    <div id="plan-editor" class="plan-editor" style="display: none;">
      <h2>Routing Plan</h2>
      <div id="subtasks-container"></div>
      <button id="run-plan-btn">Run Plan</button>
      <button id="send-to-main-btn" class="btn-secondary">Send to Main Model</button>
    </div>
    
    <div class="messages-list" id="messages-list">
      <!-- Messages will appear here -->
    </div>
    
    <div id="workers-container"></div>
  </div>
  
  <script nonce="${nonce}">
    // JavaScript for the webview will be embedded here
  </script>
</body>
</html>`;
}
