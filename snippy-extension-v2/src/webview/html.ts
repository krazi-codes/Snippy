export function generateWebviewHtml(nonce: string): string {
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
