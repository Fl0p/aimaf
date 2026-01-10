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

export interface Message {
  sender: MessageSender;
  agentId?: string;
  agentName?: string;
  content: string;
}

export interface ChatMessage extends Message {
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
