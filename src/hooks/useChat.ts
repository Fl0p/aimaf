import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, ChatMessage, AgentConfig, MessageSender, GameState, MafiaRole } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import { formatGameStatus, formatPlayersList } from '../utils/gameStatus';
import { generateId, isMafia } from '../utils/helpers';

const STORAGE_KEY = 'openrouter_api_key';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.Initial);
  const [isDay, setIsDay] = useState(true);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const addMessage = useCallback((message: Message) => {
    const chatMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };
    // Update ref synchronously so next callAgentInternal sees new message
    messagesRef.current = [...messagesRef.current, chatMessage];
    setMessages(messagesRef.current);
  }, []);

  const sendMessage = useCallback((content: string) => {
    addMessage({
      sender: MessageSender.Moderator,
      content,
    });
  }, [addMessage]);

  const handleToolCall = useCallback((agent: ChatAgent, toolName: string, args: Record<string, any>) => {
    const playerName = args.playerName as string;
    
    switch (toolName) {
      case 'kill': {
        const targetAgent = agents.find((a) => a.name === playerName);
        if (!targetAgent) {
          addMessage({
            sender: MessageSender.System,
            content: `[${agent.name}] tried to kill [${playerName}], but player not found.`,
            mafia: true,
          });
          return;
        }
        
        if (targetAgent.isDead) {
          addMessage({
            sender: MessageSender.System,
            content: `[${agent.name}] tried to kill [${playerName}], but they are already dead.`,
            mafia: true,
          });
          return;
        }

        addMessage({
          sender: MessageSender.System,
          content: `[${agent.name}] wants to kill [${playerName}].`,
          mafia: true,
        });
        break;
      }
      
      case 'check': {
        const targetAgent = agents.find((a) => a.name === playerName);
        if (!targetAgent) {
          addMessage({
            sender: MessageSender.System,
            content: `[${agent.name}] tried to check [${playerName}], but player not found.`,
            agentId: agent.id,
            pm: true,
          });
          return;
        }
        
        if (targetAgent.isDead) {
          addMessage({
            sender: MessageSender.System,
            content: `[${agent.name}] tried to check [${playerName}], but they are already dead.`,
            agentId: agent.id,
            pm: true,
          });
          return;
        }

        const isMafiaPlayer = isMafia(targetAgent.mafiaRole);
        addMessage({
          sender: MessageSender.System,
          content: `[${agent.name}] checked [${playerName}]. Result: ${isMafiaPlayer ? 'MAFIA' : 'NOT MAFIA'}`,
          agentId: agent.id,
          pm: true,
        });
        break;
      }
      
      case 'save': {
        const targetAgent = agents.find((a) => a.name === playerName);
        if (!targetAgent) {
          addMessage({
            sender: MessageSender.System,
            content: `[${agent.name}] tried to save [${playerName}], but player not found.`,
            agentId: agent.id,
            pm: true,
          });
          return;
        }
        
        if (targetAgent.isDead) {
          addMessage({
            sender: MessageSender.System,
            content: `[${agent.name}] tried to save [${playerName}], but they are already dead.`,
            agentId: agent.id,
            pm: true,
          });
          return;
        }

        addMessage({
          sender: MessageSender.System,
          content: `[${agent.name}] will save [${playerName}] tonight.`,
          agentId: agent.id,
          pm: true,
        });
        break;
      }
    }
  }, [agents, addMessage]);

  const callAgentInternal = useCallback(async (agent: ChatAgent): Promise<{ text: string; toolCalls?: Array<{ tool: string; args: Record<string, any> }> }> => {
    setIsLoading(true);
    setActiveAgentId(agent.id);

    try {
      const allMessages = messagesRef.current
      const result = await agent.generate(allMessages);
      return result;
    } catch (error) {
      console.error('Error calling API:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setActiveAgentId(null);
    }
  }, []);

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
      const result = await callAgentInternal(agent);
      addMessage({
        sender: MessageSender.Agent,
        agentId: agent.id,
        agentName: agent.name,
        content: result.text,
      });

      // Handle tool calls
      if (result.toolCalls) {
        for (const toolCall of result.toolCalls) {
          handleToolCall(agent, toolCall.tool, toolCall.args);
        }
      }
    } catch (error) {
      addMessage({
        sender: MessageSender.System,
        content: `Error calling [${agent.name}]: ${error}`,
      });
      alert('Error calling API. Check console for details.');
    }
  }, [gameState, callAgentInternal, addMessage, handleToolCall]);

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

  const gameStatusMessage = useCallback(() => {
    addMessage({
      sender: MessageSender.System,
      content: formatGameStatus(agents),
    });
  }, [agents, addMessage]);

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
  }, [agents, addMessage, gameStatusMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const welcomeMafiaMessage = useCallback(() => {
    const mafiaAgents = agents.filter((a) => isMafia(a.mafiaRole));
    const don = agents.find((a) => a.mafiaRole === MafiaRole.Don);
    const donInfo = don ? `\nThe Don is [${don.name}].` : '';
    const welcomeMessage = `Welcome to the game, Mafia teammates are: ${mafiaAgents.map((a) => `[${a.name}]`).join(', ')}.${donInfo}`;
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

  }, [addMessage, agents, gameStatusMessage, welcomeMafiaMessage, welcomeDetectiveMessage, welcomeDoctorMessage]);

  const status = useCallback(() => {
    gameStatusMessage();
  }, [gameStatusMessage]);

  const roundDay = useCallback(async () => {
    const aliveAgents = agents.filter((a) => !a.isDead);
    
    // Shuffle alive agents randomly
    const shuffledAgents = [...aliveAgents].sort(() => Math.random() - 0.5);

    addMessage({
      sender: MessageSender.System,
      content: `Day round started. Agents will speak in order: ${shuffledAgents.map((a) => `[${a.name}]`).join(', ')}`,
    });

    // Call each agent sequentially
    for (const agent of shuffledAgents) {
      try {
        const result = await callAgentInternal(agent);
        addMessage({
          sender: MessageSender.Agent,
          agentId: agent.id,
          agentName: agent.name,
          content: result.text,
        });

        // Handle tool calls
        if (result.toolCalls) {
          for (const toolCall of result.toolCalls) {
            handleToolCall(agent, toolCall.tool, toolCall.args);
          }
        }
      } catch (error) {
        addMessage({
          sender: MessageSender.System,
          content: `Error calling [${agent.name}]: ${error}`,
        });
      }
    }

    addMessage({
      sender: MessageSender.System,
      content: 'Day round completed.',
    });
  }, [agents, addMessage, callAgentInternal, handleToolCall]);

  const roundNight = useCallback(async () => {
    const aliveMafia = agents.filter((a) => !a.isDead && isMafia(a.mafiaRole));
    const don = agents.find((a) => a.mafiaRole === MafiaRole.Don && !a.isDead);
    const detective = agents.find((a) => a.mafiaRole === MafiaRole.Detective && !a.isDead);
    const doctor = agents.find((a) => a.mafiaRole === MafiaRole.Doctor && !a.isDead);
    
    addMessage({
      sender: MessageSender.System,
      content: `Night round started. Mafia members will act: ${aliveMafia.map((a) => `[${a.name}]`).join(', ')}`,
      mafia: true,
    });

    // Call each mafia agent sequentially
    for (const agent of aliveMafia) {
      try {
        const result = await callAgentInternal(agent);
        addMessage({
          sender: MessageSender.Agent,
          agentId: agent.id,
          agentName: agent.name,
          content: result.text,
          mafia: true,
        });

        // Handle tool calls
        if (result.toolCalls) {
          for (const toolCall of result.toolCalls) {
            handleToolCall(agent, toolCall.tool, toolCall.args);
          }
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
    }

    // Give word to Don or first mafia member
    const finalMafiaWord = don || aliveMafia[0];
    if (finalMafiaWord) {
      addMessage({
        sender: MessageSender.System,
        content: `[${finalMafiaWord.name}] has the final word.`,
        mafia: true,
      });
      try {
        const result = await callAgentInternal(finalMafiaWord);
        addMessage({
          sender: MessageSender.Agent,
          agentId: finalMafiaWord.id,
          agentName: finalMafiaWord.name,
          content: result.text,
          mafia: true,
        });

        // Handle tool calls
        if (result.toolCalls) {
          for (const toolCall of result.toolCalls) {
            handleToolCall(finalMafiaWord, toolCall.tool, toolCall.args);
          }
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
    }

    // Detective's turn
    if (detective) {
      addMessage({
        sender: MessageSender.System,
        content: `[${detective.name}] Detective is investigating.`,
        agentId: detective.id,
        pm: true,
      });
      try {
        const result = await callAgentInternal(detective);
        addMessage({
          sender: MessageSender.Agent,
          agentId: detective.id,
          agentName: detective.name,
          content: result.text,
          pm: true,
        });

        // Handle tool calls
        if (result.toolCalls) {
          for (const toolCall of result.toolCalls) {
            handleToolCall(detective, toolCall.tool, toolCall.args);
          }
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
    }

    // Doctor's turn
    if (doctor) {
      addMessage({
        sender: MessageSender.System,
        content: `[${doctor.name}] Doctor is choosing who to save.`,
        agentId: doctor.id,
        pm: true,
      });
      try {
        const result = await callAgentInternal(doctor);
        addMessage({
          sender: MessageSender.Agent,
          agentId: doctor.id,
          agentName: doctor.name,
          content: result.text,
          pm: true,
        });

        // Handle tool calls
        if (result.toolCalls) {
          for (const toolCall of result.toolCalls) {
            handleToolCall(doctor, toolCall.tool, toolCall.args);
          }
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
    }

    addMessage({
      sender: MessageSender.System,
      content: 'Night round completed.',
      mafia: true,
    });
  }, [agents, addMessage, callAgentInternal, handleToolCall]);

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

    if (isDay) {
      await roundDay();
    } else {
      await roundNight();
    }
  }, [agents, gameState, isDay, roundDay, roundNight]);

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
