import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, ChatMessage, AgentConfig, MessageSender, GameState, MafiaRole, AgentGenerateResult } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import { formatGameStatus, formatPlayersList } from '../utils/gameStatus';
import { generateId, isMafia } from '../utils/helpers';
import { NightActions } from '../utils/NightActions';
import { DayActions } from '../utils/DayActions';

const STORAGE_KEY = 'openrouter_api_key';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.Initial);
  const [isDay, setIsDay] = useState(true);
  const nightActionsRef = useRef(new NightActions());
  const dayActionsRef = useRef(new DayActions());

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
        nightActionsRef.current.addAction({
          agentId: agent.id,
          agentName: agent.name,
          actionType: 'kill',
          targetName: playerName,
        });
        
        addMessage({
          sender: MessageSender.System,
          content: `@${agent.name} wants to kill @${playerName}.`,
          mafia: true,
          tool: toolName,
        });
        break;
      }
      
      case 'check': {
        nightActionsRef.current.addAction({
          agentId: agent.id,
          agentName: agent.name,
          actionType: 'check',
          targetName: playerName,
        });
        
        addMessage({
          sender: MessageSender.System,
          content: `@${agent.name} wants to check @${playerName}.`,
          agentId: agent.id,
          pm: true,
          tool: toolName,
        });
        break;
      }
      
      case 'save': {
        nightActionsRef.current.addAction({
          agentId: agent.id,
          agentName: agent.name,
          actionType: 'save',
          targetName: playerName,
        });
        
        addMessage({
          sender: MessageSender.System,
          content: `@${agent.name} wants to save @${playerName}.`,
          agentId: agent.id,
          pm: true,
          tool: toolName,
        });
        break;
      }
      
      case 'vote': {
        dayActionsRef.current.addVote({
          voterId: agent.id,
          voterName: agent.name,
          targetName: playerName,
        });
        
        addMessage({
          sender: MessageSender.System,
          content: `@${agent.name} votes to eliminate @${playerName}.`,
          tool: toolName,
        });
        break;
      }
    }
  }, [addMessage]);

  const callAgentInternal = useCallback(async (agent: ChatAgent): Promise<AgentGenerateResult> => {
    setIsLoading(true);
    setActiveAgentId(agent.id);

    try {
      const startTime = performance.now();
      const allMessages = messagesRef.current;
      const allAgentNames = agents.map(a => a.name);
      const result = await agent.generate(allMessages, allAgentNames);
      const endTime = performance.now();
      const executionTime = (endTime - startTime) / 1000; // convert to seconds
      return { ...result, executionTime };
    } catch (error) {
      console.error('Error calling API:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setActiveAgentId(null);
    }
  }, [agents]);

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
        executionTime: result.executionTime,
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
        content: `Error calling @${agent.name}: ${error}`,
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
        content: `@${agent.name} (${agent.mafiaRole}) has been killed by @Moderator!`,
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
    const donInfo = don ? `\nThe Don is @${don.name}.` : '';
    const welcomeMessage = `Welcome to the game, Mafia teammates are: ${mafiaAgents.map((a) => `@${a.name}`).join(', ')}.${donInfo}`;
    addMessage({
      sender: MessageSender.System,
      content: welcomeMessage,
      mafia: true,
    });
  }, [agents, addMessage]);

  const welcomeDetectiveMessage = useCallback(() => {
    const detective = agents.find((a) => a.mafiaRole === MafiaRole.Detective);
    if (detective) {
      const welcomeMessage = `Welcome to the game, @${detective.name}! You are the Detective. Use your skills to find the mafia members.`;
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
      const welcomeMessage = `Welcome to the game, @${doctor.name}! You are the Doctor. You can save one player each night.`;
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
    
    // First discussion cycle
    // Shuffle alive agents randomly
    const shuffledAgents = [...aliveAgents].sort(() => Math.random() - 0.5);

    addMessage({
      sender: MessageSender.System,
      content: `Day round started. First of two discussions. Agents will speak in order: ${shuffledAgents.map((a) => `@${a.name}`).join(', ')}`,
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
          executionTime: result.executionTime,
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

    // Second discussion cycle
    // Re-shuffle alive agents randomly
    const aliveAgentsSecond = agents.filter((a) => !a.isDead);
    const shuffledAgentsSecond = [...aliveAgentsSecond].sort(() => Math.random() - 0.5);

    addMessage({
      sender: MessageSender.System,
      content: `Second discussion. Agents will speak in order: ${shuffledAgentsSecond.map((a) => `@${a.name}`).join(', ')}`,
    });

    // Call each agent sequentially again
    for (const agent of shuffledAgentsSecond) {
      try {
        const result = await callAgentInternal(agent);
        addMessage({
          sender: MessageSender.Agent,
          agentId: agent.id,
          agentName: agent.name,
          content: result.text,
          executionTime: result.executionTime,
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

    addMessage({
      sender: MessageSender.System,
      content: 'Day rounds completed. Let\'s vote to eliminate suspects. Use the [vote] tool to vote for a suspect.',
    });
  }, [agents, addMessage, callAgentInternal, handleToolCall]);

  const roundNight = useCallback(async () => {
    const aliveMafia = agents.filter((a) => !a.isDead && isMafia(a.mafiaRole));
    const don = agents.find((a) => a.mafiaRole === MafiaRole.Don && !a.isDead);
    const detective = agents.find((a) => a.mafiaRole === MafiaRole.Detective && !a.isDead);
    const doctor = agents.find((a) => a.mafiaRole === MafiaRole.Doctor && !a.isDead);
    
    addMessage({
      sender: MessageSender.System,
      content: `Night round started. Mafia members will act: ${aliveMafia.map((a) => `@${a.name}`).join(', ')}. Now you can discuss who to kill tonight.`,
      mafia: true,
    });

    // Call each mafia agent sequentially (discussion phase - no tools)
    for (const agent of aliveMafia) {
      try {
        const result = await callAgentInternal(agent);
        addMessage({
          sender: MessageSender.Agent,
          agentId: agent.id,
          agentName: agent.name,
          content: result.text,
          mafia: true,
          executionTime: result.executionTime,
        });

        // Ignore tool calls during discussion phase
      } catch (error) {
        console.error('Error calling API:', error);
      }
    }

    // Give word to Don or first mafia member
    const finalMafiaWord = don || aliveMafia[0];
    if (finalMafiaWord) {
      addMessage({
        sender: MessageSender.System,
        content: `@${finalMafiaWord.name}, now you can use the [kill] tool to make the final decision.`,
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
          executionTime: result.executionTime,
        });

        // Handle tool calls only in decision phase
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
        content: `@${detective.name} Detective is investigating. use the [check] tool to check if a player is a mafia member.`,
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
          executionTime: result.executionTime,
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
        content: `@${doctor.name} Doctor is choosing who to save. use the [save] tool to save a player.`,
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
          executionTime: result.executionTime,
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

  const processNightResults = useCallback(() => {
    const results = nightActionsRef.current.processActions(agents);
    
    // Show check results to detectives
    results.checks.forEach(check => {
      addMessage({
        sender: MessageSender.System,
        content: `@${check.detective.name} checked @${check.target.name}. Result: ${check.isMafia ? 'MAFIA' : 'NOT MAFIA'}`,
        agentId: check.detective.id,
        pm: true,
      });
    });

    // Show who was saved (only to doctor)
    if (results.saved) {
      const doctor = agents.find(a => a.mafiaRole === MafiaRole.Doctor && !a.isDead);
      if (doctor) {
        addMessage({
          sender: MessageSender.System,
          content: `@${doctor.name} You saved @${results.saved.name} tonight.`,
          agentId: doctor.id,
          pm: true,
        });
      }
    }

    // Kill the target if not saved
    if (results.killed) {
      results.killed.isDead = true;
      setAgents([...agents]);
      
      addMessage({
        sender: MessageSender.System,
        content: `@${results.killed.name} (${results.killed.mafiaRole}) was killed during the night!`,
      });
    } else {
      addMessage({
        sender: MessageSender.System,
        content: 'Nobody was killed during the night.',
      });
    }

    // Clear night actions for next night
    nightActionsRef.current.clear();
    
    gameStatusMessage();
  }, [agents, addMessage, gameStatusMessage]);

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

    // If switching to day, process night results
    if (newIsDay) {
      processNightResults();
    }

  }, [gameState, isDay, addMessage, processNightResults]);



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
