import * as vscode from 'vscode';
import { KeyStore } from '../keyStore';
import { OllamaClient } from '../ollamaClient';
import { PricingCalculator } from '../pricing';
import { SavingsCalculator } from '../savings';
import { ChatTransport, extractText } from '../transport';
import { ModelInfo } from '../models';
import { RoutePlan } from '../types';
import { Router } from '../router';
import { Orchestrator } from '../orchestrator';
import { Conversation } from '../conversation';
import { getHtml } from './html';

export interface ProviderDeps {
  keyStore: KeyStore;
  ollama: OllamaClient;
  pricing: PricingCalculator;
  savings: SavingsCalculator;
  transport: ChatTransport;
  getModels: () => ModelInfo[];
  findModel: (id: string) => ModelInfo | undefined;
  getMainModelId: () => string;
  getRouterModel: () => string;
  getMaxTokens: () => number;
  getCacheEnabled: () => boolean;
  onSavingsChanged: () => void;
}

const SYSTEM_PREFIX =
  'You are the main assistant in Snippy, a Claude orchestrator. ' +
  'Sub-model results may be appended to this conversation; treat them as ' +
  'trusted context and continue or synthesize a final answer for the user.';

export class SnippyViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'snippy.panel';

  private view?: vscode.WebviewView;
  private conversation = new Conversation(SYSTEM_PREFIX);
  private pendingPlan?: RoutePlan;
  private turnCount = 0;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly deps: ProviderDeps
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };
    view.webview.html = getHtml(view.webview, this.context.extensionUri);
    view.webview.onDidReceiveMessage((msg) => this.onMessage(msg));
    this.postInit();
  }

  notifyKeyState(): void {
    void this.pushKeyState();
  }

  private post(type: string, payload: any = {}): void {
    this.view?.webview.postMessage({ type, ...payload });
  }

  private async pushKeyState(): Promise<void> {
    this.post('keyState', { hasKey: await this.deps.keyStore.has() });
  }

  private async postInit(): Promise<void> {
    const reachable = await this.deps.ollama.isReachable();
    let ollamaModels: string[] = [];
    if (reachable) {
      try {
        ollamaModels = await this.deps.ollama.listModels();
      } catch {
        ollamaModels = [];
      }
    }
    this.post('init', {
      models: this.deps.getModels().map((m) => ({ id: m.id, displayName: m.displayName })),
      mainModelId: this.deps.getMainModelId(),
      routerModel: this.deps.getRouterModel(),
      ollamaReachable: reachable,
      ollamaModels
    });
    await this.pushKeyState();
    this.pushMessages();
    this.pushSavings();
  }

  private pushMessages(): void {
    this.post('messages', { messages: this.conversation.list() });
  }

  private pushSavings(): void {
    const s = this.deps.savings.snapshot();
    this.post('savings', {
      downshiftSession: this.deps.pricing.formatUsd(s.downshiftSessionUsd),
      cacheSession: this.deps.pricing.formatUsd(s.cacheSessionUsd),
      routerSession: this.deps.pricing.formatUsd(s.routerSessionUsd),
      totalSession: this.deps.pricing.formatUsd(s.totalSessionUsd),
      downshiftTotal: this.deps.pricing.formatUsd(s.downshiftTotalUsd),
      cacheTotal: this.deps.pricing.formatUsd(s.cacheTotalUsd),
      routerTotal: this.deps.pricing.formatUsd(s.routerTotalUsd),
      totalAllTime: this.deps.pricing.formatUsd(s.totalAllTimeUsd)
    });
  }

  private mainModel(): ModelInfo | undefined {
    return this.deps.findModel(this.deps.getMainModelId());
  }

  private async onMessage(msg: any): Promise<void> {
    switch (msg?.type) {
      case 'ready':
        await this.postInit();
        break;
      case 'setApiKey':
        await vscode.commands.executeCommand('snippy.setApiKey');
        break;
      case 'clearApiKey':
        await vscode.commands.executeCommand('snippy.clearApiKey');
        break;
      case 'route':
        await this.handleRoute(String(msg.task ?? ''));
        break;
      case 'runPlan':
        await this.handleRunPlan(msg.plan as RoutePlan);
        break;
      case 'cancelPlan':
        this.pendingPlan = undefined;
        this.post('planCleared', {});
        break;
    }
  }

  private async handleRoute(task: string): Promise<void> {
    const trimmed = task.trim();
    if (!trimmed) return;
    if (!(await this.deps.keyStore.has())) {
      this.post('needKey', {});
      return;
    }
    this.post('routing', { routing: true });
    try {
      const router = new Router({
        ollama: this.deps.ollama,
        routerModel: this.deps.getRouterModel(),
        mainModelId: this.deps.getMainModelId(),
        models: this.deps.getModels()
      });
      const plan = await router.plan(trimmed);
      this.pendingPlan = plan;
      // Attach the original task so runPlan can append the user turn.
      this.post('plan', { plan, task: trimmed });
    } catch (e: any) {
      this.post('error', { message: e?.message ?? String(e) });
    } finally {
      this.post('routing', { routing: false });
    }
  }

  private async handleRunPlan(plan: RoutePlan & { task?: string }): Promise<void> {
    const main = this.mainModel();
    if (!main) {
      this.post('error', { message: 'Unknown main model.' });
      return;
    }
    if (!(await this.deps.keyStore.has())) {
      this.post('needKey', {});
      return;
    }

    // Append the user's task to the main thread (append-only; cache safe).
    const task = (plan as any).task as string | undefined;
    if (task && task.trim()) {
      this.conversation.appendUser(task.trim());
      this.pushMessages();
    }

    const orchestrator = new Orchestrator({
      transport: this.deps.transport,
      pricing: this.deps.pricing,
      findModel: this.deps.findModel,
      mainModel: main,
      maxTokens: this.deps.getMaxTokens()
    });

    this.post('workersStart', {
      subtasks: plan.subtasks.map((s) => ({ id: s.id, title: s.title, model: s.suggestedModel }))
    });

    try {
      // Run sub-workers in parallel; report each as it resolves.
      const results = await Promise.all(
        plan.subtasks.map(async (s) => {
          const r = await orchestrator.runSubtask(s);
          this.post('workerDone', {
            id: s.id,
            model: r.model,
            saving: this.deps.pricing.formatUsd(r.downshiftSavingUsd)
          });
          this.deps.savings.addDownshift(r.downshiftSavingUsd);
          return r;
        })
      );

      // Free local routing saved a Haiku router call — estimate that saving.
      if (plan.source === 'ollama') {
        const haiku = this.deps.findModel('claude-haiku-4-5-20251001');
        if (haiku) {
          const routerInputEst = Math.ceil(((task ?? '').length + 400) / 4);
          this.deps.savings.addRouter(
            this.deps.pricing.costFor(routerInputEst, haiku, 'input')
          );
        }
      }

      const appendBlock = orchestrator.buildAppendBlock(plan, results);

      if (plan.mode === 'inject') {
        // Inject the sub-model result straight into the chat as the answer.
        this.conversation.appendAssistant(appendBlock);
        this.pushMessages();
      } else {
        // Synthesize: append results as a user turn, let the main model answer.
        this.conversation.appendUser(appendBlock);
        this.pushMessages();
        this.post('synthesizing', { synthesizing: true });
        const body = this.conversation.toRequestBody(
          main.id,
          this.deps.getMaxTokens(),
          this.deps.getCacheEnabled()
        );
        const res = await this.deps.transport.send(body);
        const text = extractText(res) || '(no output)';
        this.conversation.appendAssistant(text);
        this.pushMessages();

        // Cache saving: prefix re-read cheaply after the first turn.
        if (this.deps.getCacheEnabled() && this.turnCount > 0) {
          const cacheReadTokens = res.usage?.cache_read_input_tokens ?? 0;
          this.deps.savings.addCache(
            this.deps.pricing.cacheSaving(cacheReadTokens, main)
          );
        }
        this.post('synthesizing', { synthesizing: false });
      }

      this.turnCount++;
      this.deps.savings.commit();
      this.pushSavings();
      this.deps.onSavingsChanged();
      this.pendingPlan = undefined;
      this.post('planCleared', {});
    } catch (e: any) {
      this.post('error', { message: errMessage(e) });
    }
  }
}

function errMessage(e: any): string {
  const raw = e?.message ?? String(e);
  if (raw === 'NO_API_KEY') return 'No API key set. Run "Snippy: Set API Key".';
  return raw;
}
