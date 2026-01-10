import { ToolLoopAgent, ModelMessage, ToolSet } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AgentConfig, Message, MafiaRole, MessageSender } from '../types';
import { MafiaPrompts } from './MafiaPrompts';
import { isMafia } from '../utils/helpers';

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
    return this.filterOwnName(result.text);
  }

  private filterOwnName(text: string): string {
    // Remove "[Name]" or "Name:" or "Name " at the start of the message
    const patterns = [
      new RegExp(`^\\[${this.name}\\]\\s*:?\\s*`, 'i'),
      new RegExp(`^${this.name}\\s*:\\s*`, 'i'),
    ];

    let filtered = text;
    for (const pattern of patterns) {
      filtered = filtered.replace(pattern, '');
    }

    return filtered.trim();
  }

  private convertMessages(messages: Message[]): ModelMessage[] {
    const result: ModelMessage[] = [
      {
        role: 'user',
        content: `[System] [${this.name}] joined the game. Your role is ${this.mafiaRole}.`,
      },
    ];

    for (const m of messages) {
      // Filter mafia messages: only mafia members can see them
      if (m.mafia && !isMafia(this.mafiaRole)) {
        continue;
      }

      // Filter private messages: only the recipient can see them
      if (m.pm && m.agentId !== this.id) {
        continue;
      }

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

    console.log(` My name is [${this.name}] and my role is [${this.mafiaRole}]`);
    console.log(` My messages are: ${JSON.stringify(result, null, 2)}`);
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
