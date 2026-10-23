import { OllamaClient } from './ollamaClient';
import { RoutePlan, Subtask } from './types';
import { cheapestModel, ModelInfo, resolveModels } from './models';

let seq = 0;
const sid = () => `s${Date.now()}_${seq++}`;

export interface RouterDeps {
  ollama: OllamaClient;
  routerModel: string;
  mainModelId: string;
  models: ModelInfo[];
}

/** Build the prompt we hand the local router model. */
export function buildRouterPrompt(task: string, models: ModelInfo[], mainId: string): string {
  const list = models
    .map((m) => `- ${m.id} (${m.displayName}, input $${m.inputPricePerMTok}/MTok)`)
    .join('\n');
  return [
    'You are a routing planner for a Claude orchestrator.',
    'Given a user task, decide the cheapest safe way to run it on Claude.',
    'Prefer cheaper models for easy work. Split only when parts are independent.',
    '',
    `Main model: ${mainId}`,
    'Available Claude models:',
    list,
    '',
    'Return STRICT JSON only, no prose, shaped exactly:',
    '{"mode":"inject|synthesize","subtasks":[{"title":"...","prompt":"...","suggestedModel":"<model id>","splittable":true|false}]}',
    'Use "inject" for a single easy subtask whose result is dropped straight into the chat.',
    'Use "synthesize" when you split into multiple parts the main model will combine.',
    '',
    'TASK:',
    task
  ].join('\n');
}

/** Parse the router model's JSON, tolerating stray text around it. */
export function parseRouterJson(raw: string, validIds: Set<string>): RoutePlan | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  const mode = parsed.mode === 'synthesize' ? 'synthesize' : 'inject';
  const rawSubs = Array.isArray(parsed.subtasks) ? parsed.subtasks : [];
  const subtasks: Subtask[] = rawSubs
    .filter((s: any) => s && typeof s.prompt === 'string')
    .map((s: any) => ({
      id: sid(),
      title: String(s.title ?? 'Subtask'),
      prompt: String(s.prompt),
      suggestedModel: validIds.has(String(s.suggestedModel))
        ? String(s.suggestedModel)
        : '',
      splittable: Boolean(s.splittable)
    }));
  if (subtasks.length === 0) return null;
  return { mode, subtasks, source: 'ollama' };
}

/** Local, free, no-network fallback router. */
export function heuristicPlan(task: string, models: ModelInfo[]): RoutePlan {
  const cheap = cheapestModel();
  const sentences = task.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const hard = /\b(refactor|architecture|design|debug|prove|optimi[sz]e|complex)\b/i.test(task) ||
    task.length > 1200;

  if (!hard) {
    return {
      mode: 'inject',
      source: 'heuristic',
      notes: 'Ollama unavailable; using local heuristic (single cheap subtask).',
      subtasks: [
        {
          id: sid(),
          title: 'Handle task',
          prompt: task,
          suggestedModel: cheap.id,
          splittable: false
        }
      ]
    };
  }
  // Hard task: split by sentence groups for the main model to synthesize.
  const mid = Math.ceil(sentences.length / 2) || 1;
  const parts = [sentences.slice(0, mid).join(' '), sentences.slice(mid).join(' ')]
    .filter((p) => p.trim().length > 0);
  return {
    mode: 'synthesize',
    source: 'heuristic',
    notes: 'Ollama unavailable; using local heuristic (split for synthesis).',
    subtasks: parts.map((p, i) => ({
      id: sid(),
      title: `Part ${i + 1}`,
      prompt: p,
      suggestedModel: cheap.id,
      splittable: true
    }))
  };
}

export class Router {
  constructor(private readonly deps: RouterDeps) {}

  async plan(task: string): Promise<RoutePlan> {
    const validIds = new Set(this.deps.models.map((m) => m.id));
    const reachable = await this.deps.ollama.isReachable();
    if (!reachable) {
      return heuristicPlan(task, this.deps.models);
    }
    try {
      const raw = await this.deps.ollama.generate(
        this.deps.routerModel,
        buildRouterPrompt(task, this.deps.models, this.deps.mainModelId)
      );
      const parsed = parseRouterJson(raw, validIds);
      if (!parsed) return heuristicPlan(task, this.deps.models);
      // Fill any missing model with the cheapest valid one.
      const cheap = cheapestModel().id;
      parsed.subtasks = parsed.subtasks.map((s) => ({
        ...s,
        suggestedModel: s.suggestedModel || cheap
      }));
      return parsed;
    } catch {
      return heuristicPlan(task, this.deps.models);
    }
  }
}

export function allModelIds(): string[] {
  return resolveModels().map((m) => m.id);
}
