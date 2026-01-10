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
  sender: MessageSender;
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
