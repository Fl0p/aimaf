import { useState, useCallback } from 'react';
import { Message, AgentConfig, MessageSender } from '../types';
import { ChatAgent } from '../agents/ChatAgent';

const STORAGE_KEY = 'openrouter_api_key';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  const sendMessage = useCallback((content: string) => {
    const message: Message = {
      id: generateId(),
      sender: MessageSender.Moderator,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const askAgent = useCallback(async (agent: ChatAgent) => {
    const apiKey = localStorage.getItem(STORAGE_KEY);
    if (!apiKey) {
      alert('Please set OpenRouter API key in Settings');
      return;
    }

    setIsLoading(true);
    setActiveAgentId(agent.id);

    try {
      const content = await agent.generate(messages);

      const agentMessage: Message = {
        id: generateId(),
        sender: MessageSender.Agent,
        agentId: agent.id,
        agentName: agent.name,
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error calling API:', error);
      alert('Error calling API. Check console for details.');
    } finally {
      setIsLoading(false);
      setActiveAgentId(null);
    }
  }, [messages]);

  const addAgent = useCallback((config: Omit<AgentConfig, 'id'>) => {
    const apiKey = localStorage.getItem(STORAGE_KEY);
    if (!apiKey) {
      alert('Please set OpenRouter API key in Settings first');
      return;
    }

    const fullConfig: AgentConfig = {
      ...config,
      id: generateId(),
    };

    const agent = new ChatAgent(fullConfig, apiKey);
    setAgents((prev) => [...prev, agent]);
  }, []);

  const removeAgent = useCallback((agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    agents,
    isLoading,
    activeAgentId,
    sendMessage,
    askAgent,
    addAgent,
    removeAgent,
    clearMessages,
  };
}
