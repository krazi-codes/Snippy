import { ChatTransport, extractText } from './transport';
import { PricingCalculator } from './pricing';
import { ModelInfo } from './models';
import { RoutePlan, Subtask, SubtaskResult } from './types';

export interface OrchestratorDeps {
  transport: ChatTransport;
  pricing: PricingCalculator;
  findModel: (id: string) => ModelInfo | undefined;
  mainModel: ModelInfo;
  maxTokens: number;
  /** Rough token estimate when exact counts aren't needed (chars/4). */
  estimateTokens?: (text: string) => number;
}

function estimate(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Runs approved subtasks as stateless one-shot Claude calls IN PARALLEL.
 * Each worker has its own tiny context (just its prompt) and is discarded
 * after returning — it never touches the main conversation's cache.
 */
export class Orchestrator {
  constructor(private readonly deps: OrchestratorDeps) {}

  private est = this.deps.estimateTokens ?? estimate;

  async runSubtask(sub: Subtask): Promise<SubtaskResult> {
    const sampleModel =
      this.deps.findModel(sub.suggestedModel) ?? this.deps.mainModel;
    const res = await this.deps.transport.send({
      model: sampleModel.id,
      max_tokens: this.deps.maxTokens,
      messages: [{ role: 'user', content: sub.prompt }]
    });
    const text = extractText(res) || '(no output)';
    const inputTokens = res.usage?.input_tokens ?? this.est(sub.prompt);
    const outputTokens = res.usage?.output_tokens ?? this.est(text);

    // Savings vs having done this subtask on the main model.
    const downshiftSavingUsd = this.deps.pricing.downshiftSaving(
      this.deps.mainModel,
      sampleModel,
      inputTokens,
      outputTokens,
      0 // router runs on local Ollama = $0 overhead
    );

    return {
      subtaskId: sub.id,
      model: sampleModel.id,
      text,
      inputTokens,
      outputTokens,
      downshiftSavingUsd
    };
  }

  /** Run all subtasks concurrently (6=a: parallel). */
  async run(plan: RoutePlan): Promise<SubtaskResult[]> {
    return Promise.all(plan.subtasks.map((s) => this.runSubtask(s)));
  }

  /**
   * Fold results into an append-only block for the main thread.
   * inject: single result appended verbatim.
   * synthesize: all results appended as labeled context for the main model.
   */
  buildAppendBlock(plan: RoutePlan, results: SubtaskResult[]): string {
    if (plan.mode === 'inject' && results.length === 1) {
      return results[0].text;
    }
    const byId = new Map(results.map((r) => [r.subtaskId, r]));
    const parts = plan.subtasks.map((s, i) => {
      const r = byId.get(s.id);
      return `### ${s.title || `Part ${i + 1}`}\n${r?.text ?? '(missing)'}`;
    });
    return [
      'Sub-model results (synthesize these into a final answer):',
      ...parts
    ].join('\n\n');
  }

  totalDownshiftSaving(results: SubtaskResult[]): number {
    return results.reduce((acc, r) => acc + r.downshiftSavingUsd, 0);
  }
}
