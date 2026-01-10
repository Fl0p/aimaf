import { useState, useCallback } from 'react';
import { Message, ChatMessage, AgentConfig, MessageSender, GameState } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import { formatGameStatus } from '../utils/gameStatus';

const STORAGE_KEY = 'openrouter_api_key';

function generateId(): string {
  // Example output: "lkj2x3z-abc4def" (timestamp in base36 + random string)
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.Initial);

  const addMessage = useCallback((message: Message) => {
    const chatMessage: ChatMessage = {
      ...message,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, chatMessage]);
  }, []);

  const sendMessage = useCallback((content: string) => {
    addMessage({
      sender: MessageSender.Moderator,
      content,
    });
  }, [addMessage]);

  const askAgent = useCallback(async (agent: ChatAgent) => {
    if (gameState !== GameState.Started) {
      alert('Game has not started yet');
      return;
    }

    if (agent.isDead) {
      alert('Agent is dead');
      return;
    }

    const apiKey = localStorage.getItem(STORAGE_KEY);
    if (!apiKey) {
      alert('Please set OpenRouter API key in Settings');
      return;
    }

    setIsLoading(true);
    setActiveAgentId(agent.id);

    try {
      const content = await agent.generate(messages);

      addMessage({
        sender: MessageSender.Agent,
        agentId: agent.id,
        agentName: agent.name,
        content,
      });
    } catch (error) {
      console.error('Error calling API:', error);
      alert('Error calling API. Check console for details.');
    } finally {
      setIsLoading(false);
      setActiveAgentId(null);
    }
  }, [messages, addMessage]);

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

  const startGame = useCallback(() => {
    setGameState(GameState.Started);
    
    addMessage({
      sender: MessageSender.System,
      content: 'Game has started! This is a test system message.',
    });

    addMessage({
      sender: MessageSender.System,
      content: formatGameStatus(agents),
    });
  }, [addMessage, agents]);

  const test1 = useCallback(() => {
    console.log('Test 1 called');
    addMessage({
      sender: MessageSender.System,
      content: 'Test 1 executed',
    });
  }, [addMessage]);

  const test2 = useCallback(() => {
    console.log('Test 2 called');
    addMessage({
      sender: MessageSender.System,
      content: 'Test 2 executed',
    });
  }, [addMessage]);

  const test3 = useCallback(() => {
    console.log('Test 3 called');
    addMessage({
      sender: MessageSender.System,
      content: 'Test 3 executed',
    });
  }, [addMessage]);

  return {
    messages,
    agents,
    isLoading,
    activeAgentId,
    gameState,
    sendMessage,
    askAgent,
    addAgent,
    removeAgent,
    clearMessages,
    startGame,
    test1,
    test2,
    test3,
  };
}
