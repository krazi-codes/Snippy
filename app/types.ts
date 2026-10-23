export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/** Shared body shape for /messages and /messages/count_tokens. */
export interface AnthropicRequestBody {
  model: string;
  system?: AnthropicSystemBlock[] | string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  max_tokens?: number;
}

/** System as blocks so we can attach a cache_control breakpoint. */
export interface AnthropicSystemBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

export interface MessagesResponse {
  content: { type: string; text?: string }[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

/** A unit of work the router proposes. */
export interface Subtask {
  id: string;
  title: string;
  prompt: string;
  /** Claude model id the router suggests for this subtask. */
  suggestedModel: string;
  splittable: boolean;
}

export type RouteMode = 'inject' | 'synthesize';

export interface RoutePlan {
  mode: RouteMode;
  subtasks: Subtask[];
  /** 'ollama' when the local router produced it, 'heuristic' on fallback. */
  source: 'ollama' | 'heuristic';
  notes?: string;
}

export interface SubtaskResult {
  subtaskId: string;
  model: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
  downshiftSavingUsd: number;
}
