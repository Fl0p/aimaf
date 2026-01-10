import { ToolLoopAgent, ModelMessage, ToolSet } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AgentConfig, Message, MafiaRole, MessageSender } from '../types';

export class ChatAgent {
  private config: AgentConfig;
  private agent: ToolLoopAgent<never, ToolSet>;

  constructor(config: AgentConfig, apiKey: string) {
    this.config = config;
    const openrouter = createOpenRouter({ apiKey });

    this.agent = new ToolLoopAgent({
      model: openrouter(this.config.model),
      instructions: this.config.systemPrompt,
      tools: {},
    });
  }

  async generate(messages: Message[]): Promise<string> {
    const modelMessages: ModelMessage[] = messages.map((m) => ({
      role: m.sender === MessageSender.Moderator ? 'user' : 'assistant',
      content: m.sender === MessageSender.Agent && m.agentName 
        ? `[${m.agentName}]: ${m.content}` 
        : m.content,
    }));

    const result = await this.agent.generate({ messages: modelMessages });
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

  get mafiaRole(): MafiaRole {
    return this.config.mafiaRole;
  }

  toJSON(): AgentConfig {
    return { ...this.config };
  }

  static fromJSON(config: AgentConfig, apiKey: string): ChatAgent {
    return new ChatAgent(config, apiKey);
  }
}
