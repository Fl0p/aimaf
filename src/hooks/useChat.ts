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
      id: generateId(),
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

  const callAgentInternal = useCallback(async (agent: ChatAgent) => {
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
      addMessage({
        sender: MessageSender.System,
        content: `Error calling [${agent.name}]: ${error}`,
      });
      throw error;
    } finally {
      setIsLoading(false);
      setActiveAgentId(null);
    }
  }, [messages, addMessage]);

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

    try {
      await callAgentInternal(agent);
    } catch (error) {
      alert('Error calling API. Check console for details.');
    }
  }, [gameState, callAgentInternal]);

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

  const welcomeMafiaMessage = useCallback(() => {
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

  const welcomeDetectiveMessage = useCallback(() => {
    const detective = agents.find((a) => a.mafiaRole === MafiaRole.Detective);
    if (detective) {
      const welcomeMessage = `Welcome to the game, [${detective.name}]! You are the Detective. Use your skills to find the mafia members.`;
      addMessage({
        sender: MessageSender.System,
        content: welcomeMessage,
        agentId: detective.id,
        pm: true,
      });
    }
  }, [agents, addMessage]);

  const welcomeDoctorMessage = useCallback(() => {
    const doctor = agents.find((a) => a.mafiaRole === MafiaRole.Doctor);
    if (doctor) {
      const welcomeMessage = `Welcome to the game, [${doctor.name}]! You are the Doctor. You can save one player each night.`;
      addMessage({
        sender: MessageSender.System,
        content: welcomeMessage,
        agentId: doctor.id,
        pm: true,
      });
    }
  }, [agents, addMessage]);

  const startGame = useCallback(() => {
    setGameState(GameState.Started);
    
    addMessage({
      sender: MessageSender.System,
      content: `Game has started! ${formatPlayersList(agents)}`,
    });

    gameStatusMessage();

    welcomeMafiaMessage();

    welcomeDetectiveMessage();
    welcomeDoctorMessage();

  }, [addMessage, agents, gameStatusMessage, welcomeMafiaMessage]);

  const status = useCallback(() => {
    gameStatusMessage();
  }, [gameStatusMessage]);

  const round = useCallback(async () => {
    if (gameState !== GameState.Started) {
      alert('Game has not started yet');
      return;
    }

    const aliveAgents = agents.filter((a) => !a.isDead);
    if (aliveAgents.length === 0) {
      alert('No alive agents');
      return;
    }

    const apiKey = localStorage.getItem(STORAGE_KEY);
    if (!apiKey) {
      alert('Please set OpenRouter API key in Settings');
      return;
    }

    // Shuffle alive agents randomly
    const shuffledAgents = [...aliveAgents].sort(() => Math.random() - 0.5);

    addMessage({
      sender: MessageSender.System,
      content: `Round started. Agents will speak in order: ${shuffledAgents.map((a) => `[${a.name}]`).join(', ')}`,
    });

    // Call each agent sequentially
    for (const agent of shuffledAgents) {
      try {
        await callAgentInternal(agent);
      } catch (error) {
        // Error already logged in callAgentInternal
      }
    }

    addMessage({
      sender: MessageSender.System,
      content: 'Round completed.',
    });
  }, [agents, gameState, addMessage, callAgentInternal]);

  const [isDay, setIsDay] = useState(true);

  const toggleDayNight = useCallback(() => {
    if (gameState !== GameState.Started) {
      alert('Game has not started yet');
      return;
    }

    const newIsDay = !isDay;
    setIsDay(newIsDay);
    
    addMessage({
      sender: MessageSender.System,
      content: `Time changed to ${newIsDay ? 'DAY' : 'NIGHT'}`,
    });

    if (!newIsDay) {
      // Message for mafia
      const aliveMafia = agents.filter((a) => !a.isDead && isMafia(a.mafiaRole));
      if (aliveMafia.length > 0) {
        addMessage({
          sender: MessageSender.System,
          content: `Mafia is active! Alive mafia members: ${aliveMafia.map((a) => `[${a.name}]`).join(', ')}. You can act now.`,
          mafia: true,
        });
      }
    }
  }, [gameState, isDay, addMessage]);



  return {
    messages,
    agents,
    isLoading,
    activeAgentId,
    gameState,
    isDay,
    sendMessage,
    askAgent,
    addAgent,
    removeAgent,
    killAgent,
    clearMessages,
    startGame,
    status,
    round,
    toggleDayNight,
  };
}
