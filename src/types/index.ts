export enum MessageSender {
  System = 'system',
  Moderator = 'moderator',
  Agent = 'agent',
}

export enum MafiaRole {
  Mafia = 'mafia',
  Civilian = 'civilian',
  Detective = 'detective',
  Doctor = 'doctor',
  Don = 'don',
}

export enum GameState {
  Initial = 'initial',
  Started = 'started',
  Ended = 'ended',
}

export enum GamePhase {
  Welcome = 'welcome',
  Night = 'night',     // mafia discussion
  Actions = 'actions', // active players actions + news
  Day = 'day',         // two rounds of discussion
  Voting = 'voting',   // all players vote + results
}

export interface Message {
  sender: MessageSender;
  agentId?: string;
  agentName?: string;
  content: string;
  pm?: boolean; // if true, the message is a private message
  mafia?: boolean; // if true, the message is visible to the mafia only
  tool?: string; // if set, the message is a tool call
  toolArgs?: Record<string, any>; // arguments for the tool call
  executionTime?: number; // execution time in seconds
}

export interface ChatMessage extends Message {
  id: string;
  timestamp: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  color: string;
  mafiaRole: MafiaRole;
}

export interface OpenRouterModel {
  id: string;
  name: string;
}

export interface AgentGenerateResult {
  text: string;
  executionTime: number;
  toolCalls?: Array<{ tool: string; args: Record<string, any> }>;
}
