export interface Message {
  id: string;
  role: 'user' | 'agent';
  agentId?: string;
  agentName?: string;
  content: string;
  timestamp: number;
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  color: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
}
