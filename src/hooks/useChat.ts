import { useState, useCallback } from 'react';
import { Message, Agent } from '../types';

const STORAGE_KEY = 'openrouter_api_key';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  const sendMessage = useCallback((content: string) => {
    const message: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const askAgent = useCallback(async (agent: Agent) => {
    const apiKey = localStorage.getItem(STORAGE_KEY);
    if (!apiKey) {
      alert('Please set OpenRouter API key in Settings');
      return;
    }

    setIsLoading(true);
    setActiveAgentId(agent.id);

    try {
      const chatMessages = [
        { role: 'system', content: agent.systemPrompt },
        ...messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.role === 'agent' ? `[${m.agentName}]: ${m.content}` : m.content,
        })),
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent.model,
          messages: chatMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No response';

      const agentMessage: Message = {
        id: generateId(),
        role: 'agent',
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

  const addAgent = useCallback((agent: Omit<Agent, 'id'>) => {
    const newAgent: Agent = {
      ...agent,
      id: generateId(),
    };
    setAgents((prev) => [...prev, newAgent]);
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
