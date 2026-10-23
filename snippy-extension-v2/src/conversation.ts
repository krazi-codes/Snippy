import { ChatMessage } from './types';

export class Conversation {
  private messages: ChatMessage[] = [];
  private readonly systemPrefix: ChatMessage = {
    role: 'system',
    content: 'You are a helpful AI assistant.'
  };

  constructor() {
    this.messages = [this.systemPrefix];
  }

  append(message: ChatMessage): void {
    this.messages.push(message);
  }

  list(): ChatMessage[] {
    return [...this.messages];
  }

  getSystemPrefix(): ChatMessage {
    return this.systemPrefix;
  }

  toRequestBody(model: string, maxTokens: number, enableCache: boolean): any {
    const messages = this.list();
    const systemMessage = messages.find(m => m.role === 'system');
    
    if (enableCache && systemMessage) {
      const systemWithCache = {
        ...systemMessage,
        system: [
          {
            type: 'text',
            text: systemMessage.content,
            cache_control: { type: 'ephemeral' }
          }
        ]
      };
      
      return {
        model,
        max_tokens: maxTokens,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content
        })),
        system: systemWithCache.system
      };
    }
    
    return {
      model,
      max_tokens: maxTokens,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    };
  }
}
