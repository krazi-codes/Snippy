import { Subtask, SubtaskResult, RoutePlan } from './types';
import { ChatTransport } from './transport';
import { downshiftSaving, cacheReadCost, formatUsd } from './pricing';
import { ClaudeModel, findModel } from './models';

export class Orchestrator {
  constructor(private transport: ChatTransport) {}

  async runSubtask(subtask: Subtask): Promise<SubtaskResult> {
    const model = findModel(subtask.model);
    if (!model) {
      throw new Error(`Unknown model: ${subtask.model}`);
    }

    // Create a simple task for the subtask
    const body = {
      model: subtask.model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user' as const,
          content: subtask.description
        }
      ]
    };

    const response = await this.transport.createMessage(body);
    
    return {
      id: subtask.id,
      content: response.content[0]?.text || '',
      model: subtask.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadInputTokens: response.usage.cache_read_input_tokens
    };
  }

  async run(plan: RoutePlan): Promise<SubtaskResult[]> {
    // Run all subtasks in parallel
    const promises = plan.subtasks.map(subtask => this.runSubtask(subtask));
    return await Promise.all(promises);
  }

  buildAppendBlock(result: SubtaskResult, mode: 'inject' | 'synthesize'): string {
    if (mode === 'inject') {
      return result.content;
    } else {
      return `---\n[Subtask ${result.id}]\n${result.content}\n---`;
    }
  }

  calculateTotalDownshiftSaving(
    mainModel: ClaudeModel,
    plan: RoutePlan,
    results: SubtaskResult[]
  ): number {
    let total = 0;
    
    for (let i = 0; i < plan.subtasks.length; i++) {
      const subtask = plan.subtasks[i];
      const result = results[i];
      
      if (result) {
        const subModel = findModel(subtask.model);
        if (subModel) {
          const saving = downshiftSaving(
            mainModel,
            subModel,
            result.inputTokens,
            result.outputTokens,
            0.001 // Estimated overhead
          );
          
          total += saving;
        }
      }
    }
    
    return total;
  }
}
