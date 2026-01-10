import { ToolLoopAgent, ModelMessage, ToolSet } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AgentConfig, Message, MafiaRole, MessageSender } from '../types';
import { MafiaPrompts } from './MafiaPrompts';

export class ChatAgent {
  private config: AgentConfig;
  private agent: ToolLoopAgent<never, ToolSet>;
  private _isDead: boolean = false;

  constructor(config: AgentConfig, apiKey: string) {
    this.config = config;
    const openrouter = createOpenRouter({ apiKey });

    this.agent = new ToolLoopAgent({
      model: openrouter(this.config.model),
      instructions: MafiaPrompts.getSystemPrompt(this.config.mafiaRole, this.config.systemPrompt),
      tools: {},
    });
  }

  async generate(messages: Message[]): Promise<string> {
    const modelMessages = this.convertMessages(messages);
    const result = await this.agent.generate({ messages: modelMessages });
    return result.text;
  }

  private convertMessages(messages: Message[]): ModelMessage[] {
    const result: ModelMessage[] = [
      {
        role: 'user',
        content: `[System] Welcome to the game! ${this.name}, your role is ${this.mafiaRole}.`,
      },
    ];

    for (const m of messages) {
      // TODO: add filtering logic here

      const isOwnMessage = m.sender === MessageSender.Agent && m.agentId === this.id;
      const role = isOwnMessage ? 'assistant' : 'user';

      let senderName: string;
      if (m.sender === MessageSender.System) {
        senderName = 'System';
      } else if (m.sender === MessageSender.Moderator) {
        senderName = 'Moderator';
      } else {
        senderName = m.agentName || 'Unknown';
      }

      result.push({
        role,
        content: `[${senderName}] ${m.content}`,
      });
    }

    return result;
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

  get isDead(): boolean {
    return this._isDead;
  }

  set isDead(value: boolean) {
    this._isDead = value;
  }

  toJSON(): AgentConfig {
    return { ...this.config };
  }

  static fromJSON(config: AgentConfig, apiKey: string): ChatAgent {
    return new ChatAgent(config, apiKey);
  }
}
