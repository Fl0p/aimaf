import { generateText, ModelMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AgentConfig } from '../types';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export class ChatAgent {
  private config: AgentConfig;
  private openrouter: ReturnType<typeof createOpenRouter>;

  constructor(config: AgentConfig, apiKey: string) {
    this.config = config;
    this.openrouter = createOpenRouter({ apiKey });
  }

  async generate(messages: ChatMessage[]): Promise<string> {
    const modelMessages: ModelMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await generateText({
      model: this.openrouter(this.config.model),
      system: this.config.systemPrompt,
      messages: modelMessages,
    });
    return result.text;
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get color(): string {
    return this.config.color;
  }

  get model(): string {
    return this.config.model;
  }

  get systemPrompt(): string {
    return this.config.systemPrompt;
  }

  toJSON(): AgentConfig {
    return { ...this.config };
  }

  static fromJSON(config: AgentConfig, apiKey: string): ChatAgent {
    return new ChatAgent(config, apiKey);
  }
}
