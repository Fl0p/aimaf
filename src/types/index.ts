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

export interface Message {
  id: string;
  role: 'user' | 'agent';
  agentId?: string;
  agentName?: string;
  content: string;
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

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
