export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AnthropicRequestBody {
  model: string;
  max_tokens: number;
  messages: ChatMessage[];
  system?: string | Array<{ type: string; text?: string; cache_control?: { type: "ephemeral" } }>;
}

export interface MessagesResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string }>;
  model: string;
  stop_reason: string;
  stop_sequence: null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
}

export interface Subtask {
  id: string;
  description: string;
  model: string;
  mode?: 'inject' | 'synthesize';
}

export interface RoutePlan {
  mode: 'inject' | 'synthesize';
  subtasks: Subtask[];
  source: 'ollama' | 'heuristic';
}

export interface SubtaskResult {
  id: string;
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
}
