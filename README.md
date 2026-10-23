# Snippy ✨

Orchestrate Claude with a free local router. Snippy uses a model running on your
own machine (via **Ollama**) to decide how to handle each task, then runs the
real work on **Claude** — spawning cheap sub-model workers for the easy parts,
keeping the main conversation's **prompt cache** warm, and showing you exactly
what you saved.

## How it works

1. You pick one **main Claude model** per session (e.g. Opus or Sonnet).
2. You describe a task. A **local Ollama model** reads it and proposes a plan:
   which Claude sub-model should handle each piece, and whether to split the
   task into parallel subtasks. This routing is **free** and never hits your
   Claude bill.
3. You can **edit the plan** — change a subtask's model, merge/split/edit
   subtasks, or send the whole thing to the main model instead.
4. Approved subtasks run as **stateless, parallel Claude calls**. Each worker
   has its own tiny context and is discarded when it returns.
5. Results are **appended** to the main conversation (never spliced into the
   middle), so Claude's prompt cache stays warm. Simple tasks inject the result
   directly; complex ones let the main model synthesize.

If Ollama isn't running, Snippy falls back to a built-in **local heuristic
router** so it still works — and tells you it's in fallback mode.

## What you save

Snippy tracks three buckets, shown in a collapsible widget and the status bar:

- **Downshift** — running easy subtasks on a cheaper Claude model instead of the
  main one (net of overhead, never negative).
- **Prompt cache reuse** — re-reading the stable prefix at the cache rate
  (~10% of input) instead of full price on every turn.
- **Free local routing** — routing on Ollama instead of paying for a Haiku
  router call.

## Requirements

- An Anthropic API key (**Snippy: Set API Key**). Stored in VS Code
  SecretStorage; never exposed to the webview.
- [Ollama](https://ollama.com) running locally with at least one model pulled
  (e.g. `ollama pull llama3.1`). Optional — Snippy degrades gracefully without
  it.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `snippy.mainModel` | `claude-sonnet-4-5-20250929` | Main Claude model (session-fixed). |
| `snippy.maxTokens` | `1024` | `max_tokens` for Claude replies. |
| `snippy.enablePromptCache` | `true` | Mark the stable prefix with `cache_control`. |
| `snippy.ollama.baseUrl` | `http://localhost:11434` | Local Ollama server URL. |
| `snippy.ollama.routerModel` | `llama3.1` | Ollama model used to route tasks. |
| `snippy.priceOverrides` | `{}` | Per-model price overrides (USD per MTok). |

## Privacy

Your API key lives in VS Code SecretStorage. Task text is sent to your local
Ollama server (for routing) and to Anthropic (for the actual work). Nothing goes
anywhere else.

## Roadmap

- **Local sub-workers**: run easy subtasks on Ollama too (currently local is
  router-only; sub-workers are Claude).
- **Proxy mode**: the `ChatTransport` interface in `src/transport.ts` is the
  seam a future `ProxyTransport` plugs into without touching the UI.

## Development

```bash
npm install
npm run compile
npm test
npm run package
npx @vscode/vsce package   # -> snippy-0.2.0.vsix
```

## License

MIT

