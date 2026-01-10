import { useState, useCallback } from 'react';
import { Message, ChatMessage, AgentConfig, MessageSender, GameState, MafiaRole } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import { formatGameStatus, formatPlayersList } from '../utils/gameStatus';
import { generateId, isMafia } from '../utils/helpers';

const STORAGE_KEY = 'openrouter_api_key';

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

  const killAgent = useCallback((agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      agent.isDead = true;
      setAgents((prev) => [...prev]);
      
      addMessage({
        sender: MessageSender.System,
        content: `[${agent.name}] (${agent.mafiaRole}) has been killed by [Moderator]!`,
      });
      gameStatusMessage();
    }
  }, [agents, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);


  const gameStatusMessage = useCallback(() => {
    addMessage({
      sender: MessageSender.System,
      content: formatGameStatus(agents),
    });
  }, [agents, addMessage]);

  const mafiaWelcomeMessage = useCallback(() => {
    const mafiaAgents = agents.filter((a) => isMafia(a.mafiaRole));
    const don = agents.find((a) => a.mafiaRole === MafiaRole.Don);
    const donInfo = don ? `\nThe Don is [${don.name}].` : '';
    const welcomeMessage = `Welcome to the game! You are a mafia member. Your teammates are: ${mafiaAgents.map((a) => `[${a.name}]`).join(', ')}.${donInfo}`;
    addMessage({
      sender: MessageSender.System,
      content: welcomeMessage,
      mafia: true,
    });
  }, [agents, addMessage]);

  const startGame = useCallback(() => {
    setGameState(GameState.Started);
    
    addMessage({
      sender: MessageSender.System,
      content: `Game has started! ${formatPlayersList(agents)}`,
    });

    gameStatusMessage();

    mafiaWelcomeMessage();
  }, [addMessage, agents, gameStatusMessage, mafiaWelcomeMessage]);

  const status = useCallback(() => {
    gameStatusMessage();
  }, [gameStatusMessage]);

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
    killAgent,
    clearMessages,
    startGame,
    status,
    test2,
    test3,
  };
}
