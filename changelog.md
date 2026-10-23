## 0.2.0

- Reworked Snippy into a Claude orchestrator with a free local Ollama router.
- Local router (Ollama) proposes a routing plan per task; heuristic fallback
  when Ollama is unreachable.
- Editable routing plan: change sub-model, merge/split/edit subtasks, or send
  the whole task to the main model.
- Parallel, stateless Claude sub-model workers; results appended to an
  append-only, cache-warm main conversation.
- Prompt caching via a stable `cache_control` prefix.
- Savings widget now tracks three buckets: downshift, prompt-cache reuse, and
  free local routing. Persisted across reloads.
- `ChatTransport` seam retained for a future proxy mode.
