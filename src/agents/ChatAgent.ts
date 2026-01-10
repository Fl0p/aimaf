import { ToolLoopAgent, ModelMessage, ToolSet, tool } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AgentConfig, Message, MafiaRole, MessageSender } from '../types';
import { MafiaPrompts } from './MafiaPrompts';
import { isMafia } from '../utils/helpers';
import { z } from 'zod';

export class ChatAgent {
  private config: AgentConfig;
  private agent: ToolLoopAgent<never, ToolSet>;
  private _isDead: boolean = false;

  constructor(config: AgentConfig, apiKey: string) {
    this.config = config;
    const openrouter = createOpenRouter({ apiKey });

    const tools = this.createTools();

    this.agent = new ToolLoopAgent({
      model: openrouter(this.config.model),
      instructions: MafiaPrompts.getSystemPrompt(this.config.mafiaRole, this.config.systemPrompt),
      tools,
    });
  }

  private createToolResponse(action: string, playerName: string): string {
    return `[TOOL:${action}] Your request to ${action} player @${playerName} has been accepted. The result will be known when the day comes.`;
  }

  private createTools() {
    const tools: Record<string, any> = {};

    // Kill tool for Mafia
    if (isMafia(this.config.mafiaRole)) {
      tools.kill = tool({
        description: 'Kill a player during the night. Only available to Mafia members.',
        inputSchema: z.object({
          playerName: z.string().describe('The name of the player to kill'),
        }),
        execute: async ({ playerName }: { playerName: string }) => {
          return this.createToolResponse('kill', playerName);
        },
      });
    }

    // Check tool for Detective
    if (this.config.mafiaRole === MafiaRole.Detective) {
      tools.check = tool({
        description: 'Check if a player is Mafia during the night. Only available to Detective.',
        inputSchema: z.object({
          playerName: z.string().describe('The name of the player to check'),
        }),
        execute: async ({ playerName }: { playerName: string }) => {
          return this.createToolResponse('check', playerName);
        },
      });
    }

    // Save tool for Doctor
    if (this.config.mafiaRole === MafiaRole.Doctor) {
      tools.save = tool({
        description: 'Save a player from being killed during the night. Only available to Doctor.',
        inputSchema: z.object({
          playerName: z.string().describe('The name of the player to save'),
        }),
        execute: async ({ playerName }: { playerName: string }) => {
          return this.createToolResponse('save', playerName);
        },
      });
    }

    // Vote tool for all players during day
    tools.vote = tool({
      description: 'Vote to eliminate a player during the day. Available to all players after discussion rounds.',
      inputSchema: z.object({
        playerName: z.string().describe('The name of the player to vote for elimination'),
      }),
      execute: async ({ playerName }: { playerName: string }) => {
        return this.createToolResponse('vote', playerName);
      },
    });

    return tools;
  }

  async generate(messages: Message[], allAgentNames: string[]): Promise<{ text: string; toolCalls?: Array<{ tool: string; args: Record<string, any> }> }> {
    const modelMessages = this.convertMessages(messages);
    const result = await this.agent.generate({ messages: modelMessages });
    
    const toolCalls: Array<{ tool: string; args: Record<string, any> }> = [];
    
    // Extract tool calls from the result steps
    if (result.steps) {
      for (const step of result.steps) {
        // Check tool calls in step content
        for (const part of step.content) {
          if (part.type === 'tool-call') {
            toolCalls.push({
              tool: part.toolName,
              args: part.input as Record<string, any>,
            });
          }
        }
      }
    }
    
    return {
      text: this.fixNames(result.text, allAgentNames),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  private fixNames(text: string, allAgentNames: string[]): string {
    // Step 1: Remove own name at the start of the message
    // Remove "@Name" or "Name:" or "Name " or "[Name]" at the start
    const patterns = [
      new RegExp(`^@${this.name}\\s*:?\\s*`, 'i'),
      new RegExp(`^${this.name}\\s*:\\s*`, 'i'),
      new RegExp(`^\\[${this.name}\\]\\s*:?\\s*`, 'i'),
    ];

    let filtered = text;
    for (const pattern of patterns) {
      filtered = filtered.replace(pattern, '');
    }

    // Step 2: Add @ before all agent names that don't have it
    for (const name of allAgentNames) {
      // Match name that is NOT preceded by @ and is a whole word
      // Use word boundaries to avoid partial matches
      const namePattern = new RegExp(`(?<!@)\\b(${name})\\b`, 'gi');
      filtered = filtered.replace(namePattern, '@$1');
    }

    return filtered.trim();
  }

  getVisibleMessages(messages: Message[]): ModelMessage[] {
    return this.convertMessages(messages);
  }

  private convertMessages(messages: Message[]): ModelMessage[] {
    const result: ModelMessage[] = [
      {
        role: 'assistant',
        content: `My name is @${this.name} and my role is ${this.mafiaRole}.`,
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
        senderName = '[System]';
      } else if (m.sender === MessageSender.Moderator) {
        senderName = '[Moderator]';
      } else {
        senderName = `@${m.agentName || 'Unknown'}`;
      }

      result.push({
        role,
        content: `${senderName} ${m.content}`,
      });
    }

    console.log(` My name is @${this.name} and my role is ${this.mafiaRole}`);
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
