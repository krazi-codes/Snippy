import { ChatMessage } from './types';

export interface ClaudeModel {
  id: string;
  displayName: string;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  cacheReadMultiplier: number;
  cacheWriteMultiplier: number;
}

export const CLAUDE_MODELS: ClaudeModel[] = [
  {
    id: 'claude-3-5-sonnet-latest',
    displayName: 'Claude 3.5 Sonnet',
    inputPricePerMTok: 3.0,
    outputPricePerMTok: 15.0,
    cacheReadMultiplier: 0.1,
    cacheWriteMultiplier: 1.25
  },
  {
    id: 'claude-3-opus-latest',
    displayName: 'Claude 3 Opus',
    inputPricePerMTok: 15.0,
    outputPricePerMTok: 75.0,
    cacheReadMultiplier: 0.1,
    cacheWriteMultiplier: 1.25
  },
  {
    id: 'claude-3-sonnet-latest',
    displayName: 'Claude 3 Sonnet',
    inputPricePerMTok: 3.0,
    outputPricePerMTok: 15.0,
    cacheReadMultiplier: 0.1,
    cacheWriteMultiplier: 1.25
  },
  {
    id: 'claude-3-haiku-latest',
    displayName: 'Claude 3 Haiku',
    inputPricePerMTok: 0.25,
    outputPricePerMTok: 1.25,
    cacheReadMultiplier: 0.1,
    cacheWriteMultiplier: 1.25
  }
];

export function findModel(modelId: string): ClaudeModel | undefined {
  return CLAUDE_MODELS.find(m => m.id === modelId);
}

export function cheapestModel(): ClaudeModel {
  return CLAUDE_MODELS.reduce((prev, current) => 
    (prev.inputPricePerMTok + prev.outputPricePerMTok) < (current.inputPricePerMTok + current.outputPricePerMTok) ? prev : current
  );
}

export function mergePriceOverrides(overrides: Record<string, Partial<ClaudeModel>> = {}): ClaudeModel[] {
  return CLAUDE_MODELS.map(model => {
    const override = overrides[model.id];
    if (!override) return model;
    
    return {
      ...model,
      ...override
    };
  });
}
