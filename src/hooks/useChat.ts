import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, ChatMessage, AgentConfig, MessageSender, GameState, GamePhase, MafiaRole, AgentGenerateResult } from '../types';
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
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.Welcome);
  const [autoPlay, setAutoPlay] = useState(false);
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

  const callAgentInternal = useCallback(async (agent: ChatAgent, phaseOverride?: GamePhase): Promise<AgentGenerateResult> => {
    setIsLoading(true);
    setActiveAgentId(agent.id);

    try {
      const startTime = performance.now();
      const allMessages = messagesRef.current;
      const allAgentNames = agents.map(a => a.name);
      const currentPhase = phaseOverride ?? gamePhase;
      const result = await agent.generate(allMessages, allAgentNames, currentPhase);
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
  }, [agents, gamePhase]);

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

  const killAgent = useCallback((agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      agent.isDead = true;
      setAgents((prev) => [...prev]);
      
      addMessage({
        sender: MessageSender.System,
        content: `@${agent.name} (${agent.mafiaRole}) has been killed by @Moderator!`,
      });
      const result = formatGameStatus(agents);
      addMessage({
        sender: MessageSender.System,
        content: result.message,
      });
    }
  }, [agents, addMessage]);

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

    const result = formatGameStatus(agents);
    addMessage({
      sender: MessageSender.System,
      content: result.message,
    });

    welcomeMafiaMessage();
    welcomeDetectiveMessage();
    welcomeDoctorMessage();

  }, [addMessage, agents, welcomeMafiaMessage, welcomeDetectiveMessage, welcomeDoctorMessage]);

  const endGame = useCallback(() => {
    setGameState(GameState.Ended);
    addMessage({
      sender: MessageSender.System,
      content: 'Game has ended!',
    });
  }, [addMessage]);

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
    
    const result = formatGameStatus(agents);
    addMessage({
      sender: MessageSender.System,
      content: result.message,
    });

    // Check for victory
    if (result.gameStatus.mafiaWin || result.gameStatus.civiliansWin) {
      endGame();
    }
  }, [agents, addMessage, endGame]);

  const processVotingResults = useCallback(() => {
    const results = dayActionsRef.current.processVotes(agents);
    
    if (results.eliminated) {
      results.eliminated.isDead = true;
      setAgents([...agents]);
      
      addMessage({
        sender: MessageSender.System,
        content: `@${results.eliminated.name} (${results.eliminated.mafiaRole}) was eliminated by vote! Votes: ${results.voteCount}`,
      });
    } else if (results.tie) {
      addMessage({
        sender: MessageSender.System,
        content: `Vote ended in a tie. Nobody was eliminated.`,
      });
    } else {
      addMessage({
        sender: MessageSender.System,
        content: 'No votes were cast. Nobody was eliminated.',
      });
    }

    dayActionsRef.current.clear();

    const result = formatGameStatus(agents);
    addMessage({
      sender: MessageSender.System,
      content: result.message,
    });

    // Check for victory
    if (result.gameStatus.mafiaWin || result.gameStatus.civiliansWin) {
      endGame();
    }
  }, [agents, addMessage, endGame]);

  const runDay = useCallback(async () => {
    const aliveAgents = agents.filter((a) => !a.isDead);
    
    // First discussion cycle
    const shuffledAgents = [...aliveAgents].sort(() => Math.random() - 0.5);

    addMessage({
      sender: MessageSender.System,
      content: `Day started. First discussion. Agents will speak in order: ${shuffledAgents.map((a) => `@${a.name}`).join(', ')}`,
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
    const aliveAgentsSecond = agents.filter((a) => !a.isDead);
    const shuffledAgentsSecond = [...aliveAgentsSecond].sort(() => Math.random() - 0.5);

    addMessage({
      sender: MessageSender.System,
      content: `Second discussion. Agents will speak in order: ${shuffledAgentsSecond.map((a) => `@${a.name}`).join(', ')}`,
    });

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
      content: 'Day discussions completed.',
    });
  }, [agents, addMessage, callAgentInternal, handleToolCall]);

  // Night phase: mafia discussion only (no tools)
  const runNight = useCallback(async () => {
    const aliveMafia = agents.filter((a) => !a.isDead && isMafia(a.mafiaRole));
    
    addMessage({
      sender: MessageSender.System,
      content: `Night started. Mafia members: ${aliveMafia.map((a) => `@${a.name}`).join(', ')}. Discuss who to kill tonight.`,
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

    addMessage({
      sender: MessageSender.System,
      content: 'Mafia discussion completed.',
      mafia: true,
    });
  }, [agents, addMessage, callAgentInternal]);

  // Actions phase: active players actions + news + status
  const runActions = useCallback(async () => {
    const aliveMafia = agents.filter((a) => !a.isDead && isMafia(a.mafiaRole));
    const don = agents.find((a) => a.mafiaRole === MafiaRole.Don && !a.isDead);
    const detective = agents.find((a) => a.mafiaRole === MafiaRole.Detective && !a.isDead);
    const doctor = agents.find((a) => a.mafiaRole === MafiaRole.Doctor && !a.isDead);

    addMessage({
      sender: MessageSender.System,
      content: 'Actions phase started. Active players will act.',
    });

    // Give word to Don or first mafia member for kill
    const finalMafiaWord = don || aliveMafia[0];
    if (finalMafiaWord) {
      addMessage({
        sender: MessageSender.System,
        content: `@${finalMafiaWord.name}, use the [kill] tool to make the final decision.`,
        mafia: true,
      });
      try {
        const result = await callAgentInternal(finalMafiaWord, GamePhase.Actions);
        addMessage({
          sender: MessageSender.Agent,
          agentId: finalMafiaWord.id,
          agentName: finalMafiaWord.name,
          content: result.text,
          mafia: true,
          executionTime: result.executionTime,
        });

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
        content: `@${detective.name}, use the [check] tool to investigate a player.`,
        agentId: detective.id,
        pm: true,
      });
      try {
        const result = await callAgentInternal(detective, GamePhase.Actions);
        addMessage({
          sender: MessageSender.Agent,
          agentId: detective.id,
          agentName: detective.name,
          content: result.text,
          pm: true,
          executionTime: result.executionTime,
        });

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
        content: `@${doctor.name}, use the [save] tool to save a player.`,
        agentId: doctor.id,
        pm: true,
      });
      try {
        const result = await callAgentInternal(doctor, GamePhase.Actions);
        addMessage({
          sender: MessageSender.Agent,
          agentId: doctor.id,
          agentName: doctor.name,
          content: result.text,
          pm: true,
          executionTime: result.executionTime,
        });

        if (result.toolCalls) {
          for (const toolCall of result.toolCalls) {
            handleToolCall(doctor, toolCall.tool, toolCall.args);
          }
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
    }

    // Process night results (news)
    processNightResults();
  }, [agents, addMessage, callAgentInternal, handleToolCall, processNightResults]);

  const runVoting = useCallback(async () => {
    const aliveAgents = agents.filter((a) => !a.isDead);
    const shuffledAgents = [...aliveAgents].sort(() => Math.random() - 0.5);

    addMessage({
      sender: MessageSender.System,
      content: `Voting started. Players will vote in order: ${shuffledAgents.map((a) => `@${a.name}`).join(', ')}. Use the [vote] tool.`,
    });

    for (const agent of shuffledAgents) {
      try {
        const result = await callAgentInternal(agent, GamePhase.Voting);
        addMessage({
          sender: MessageSender.Agent,
          agentId: agent.id,
          agentName: agent.name,
          content: result.text,
          executionTime: result.executionTime,
        });

        if (result.toolCalls) {
          for (const toolCall of result.toolCalls) {
            handleToolCall(agent, toolCall.tool, toolCall.args);
          }
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
    }

    // Process voting results
    processVotingResults();
  }, [agents, addMessage, callAgentInternal, handleToolCall, processVotingResults]);

  const nextPhase = useCallback(async () => {
    const apiKey = localStorage.getItem(STORAGE_KEY);
    if (!apiKey) {
      alert('Please set OpenRouter API key in Settings');
      return;
    }

    const aliveAgents = agents.filter((a) => !a.isDead);
    if (gameState === GameState.Started && aliveAgents.length === 0) {
      alert('No alive agents');
      return;
    }

    const phaseTransitions: Record<GamePhase, GamePhase> = {
      [GamePhase.Welcome]: GamePhase.Night,
      [GamePhase.Night]: GamePhase.Actions,
      [GamePhase.Actions]: GamePhase.Day,
      [GamePhase.Day]: GamePhase.Voting,
      [GamePhase.Voting]: GamePhase.Night,
    };

    const newPhase = phaseTransitions[gamePhase];
    setGamePhase(newPhase);

    addMessage({
      sender: MessageSender.System,
      content: `Phase: ${newPhase.toUpperCase()}`,
    });

    // Handle phase-specific actions
    if (gamePhase === GamePhase.Welcome) {
      // Start the game and run night discussion
      startGame();
      await runNight();
    } else if (newPhase === GamePhase.Actions) {
      await runActions();
    } else if (newPhase === GamePhase.Day) {
      await runDay();
    } else if (newPhase === GamePhase.Voting) {
      await runVoting();
    } else if (newPhase === GamePhase.Night) {
      await runNight();
    }
  }, [gameState, gamePhase, agents, addMessage, startGame, runNight, runActions, runDay, runVoting]);

  const restartGame = useCallback(() => {
    clearMessages();
    setGameState(GameState.Initial);
    setGamePhase(GamePhase.Welcome);
    nightActionsRef.current.clear();
    dayActionsRef.current.clear();
    
    // Reset all agents to alive state
    agents.forEach(agent => {
      agent.isDead = false;
    });
    setAgents([...agents]);
  }, [clearMessages, agents]);

  // Auto-play effect: trigger nextPhase when not loading
  useEffect(() => {
    if (autoPlay && !isLoading && gameState === GameState.Started) {
      const timer = setTimeout(() => {
        nextPhase();
      }, 1000); // 1 second delay after activity finishes
      
      return () => clearTimeout(timer);
    }
  }, [autoPlay, isLoading, gameState, nextPhase]);

  return {
    messages,
    agents,
    isLoading,
    activeAgentId,
    gameState,
    gamePhase,
    autoPlay,
    setAutoPlay,
    sendMessage,
    askAgent,
    addAgent,
    removeAgent,
    killAgent,
    clearMessages,
    nextPhase,
    restartGame,
  };
}
