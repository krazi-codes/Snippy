const esbuild = require('esbuild');

// Bundle extension
esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  platform: 'node',
  external: ['vscode'],
  format: 'cjs',
  sourcemap: true
}).catch(() => process.exit(1));

// Bundle webview provider
esbuild.build({
  entryPoints: ['src/webview/provider.ts'],
  bundle: true,
  outfile: 'out/webview/provider.js',
  platform: 'browser',
  external: ['vscode'],
  format: 'iife',
  sourcemap: true
}).catch(() => process.exit(1));
