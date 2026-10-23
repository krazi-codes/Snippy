import { RoutePlan, Subtask } from './types';
import { CLAUDE_MODELS, findModel } from './models';
import { OllamaClient } from './ollamaClient';

export function buildRouterPrompt(taskDescription: string): string {
  return `
You are an expert at analyzing tasks and determining the best way to break them down for Claude models.
Given a task description, analyze it and respond with a JSON object containing:
1. mode: either "inject" for simple tasks that should be handled by one model, or "synthesize" for complex tasks that need to be broken into subtasks
2. subtasks: an array of subtasks with descriptions and model recommendations

Task: "${taskDescription}"

Your response should be a JSON object with the following structure:
{
  "mode": "inject" | "synthesize",
  "subtasks": [
    {
      "id": "unique-id",
      "description": "description of subtask",
      "model": "claude-model-id"
    }
  ]
}

Only respond with the JSON object, no other text.
`.trim();
}

export function parseRouterJson(jsonStr: string): RoutePlan | null {
  // Try to extract JSON from potentially surrounding text
  const jsonMatch = jsonStr.match(/\{.*\}/s);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.mode || !['inject', 'synthesize'].includes(parsed.mode)) {
      return null;
    }
    
    if (!Array.isArray(parsed.subtasks)) {
      return null;
    }
    
    // Validate subtasks
    const validSubtasks = parsed.subtasks.filter((st: any) => 
      st.id && st.description && st.model && CLAUDE_MODELS.some(m => m.id === st.model)
    );
    
    return {
      mode: parsed.mode,
      subtasks: validSubtasks,
      source: 'ollama'
    };
  } catch {
    return null;
  }
}

export function heuristicPlan(taskDescription: string): RoutePlan {
  // Simple heuristic: if task is complex, split it
  const words = taskDescription.split(/\s+/).length;
  
  if (words > 20) {
    // Complex task - split into subtasks
    return {
      mode: 'synthesize',
      subtasks: [
        {
          id: '1',
          description: 'Analyze requirements and constraints',
          model: 'claude-3-haiku-latest',
          mode: 'synthesize'
        },
        {
          id: '2',
          description: 'Generate implementation plan',
          model: 'claude-3-sonnet-latest',
          mode: 'synthesize'
        },
        {
          id: '3',
          description: 'Review and optimize solution',
          model: 'claude-3-opus-latest',
          mode: 'synthesize'
        }
      ],
      source: 'heuristic'
    };
  } else {
    // Simple task - inject directly
    return {
      mode: 'inject',
      subtasks: [
        {
          id: '1',
          description: taskDescription,
          model: 'claude-3-haiku-latest',
          mode: 'inject'
        }
      ],
      source: 'heuristic'
    };
  }
}

export class Router {
  constructor(private ollamaClient: OllamaClient) {}

  async plan(taskDescription: string): Promise<RoutePlan> {
    // Try Ollama first
    try {
      const prompt = buildRouterPrompt(taskDescription);
      const response = await this.ollamaClient.generate(prompt, 'llama3.2:3b');
      
      const plan = parseRouterJson(response);
      if (plan) {
        return plan;
      }
    } catch (error) {
      console.warn('Ollama routing failed, falling back to heuristic:', error);
    }
    
    // Fall back to heuristic
    return heuristicPlan(taskDescription);
  }
}
