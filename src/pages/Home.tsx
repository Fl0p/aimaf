import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { Header } from '../components/Header';
import { AgentPanel } from '../components/AgentPanel';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { GameState } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import './Home.css';

export function Home() {
  const {
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
    startGame,
    status,
    round,
    toggleDayNight,
  } = useChat();

  const [selectedAgent, setSelectedAgent] = useState<ChatAgent | null>(null);

  const isInitial = gameState === GameState.Initial;
  const isStarted = gameState === GameState.Started;
  const canStart = isInitial && agents.length >= 2;

  const visibleMessages = selectedAgent ? selectedAgent.getVisibleMessages(messages) : [];

  return (
    <>
      <Header 
        onStart={startGame}
        onStatus={status}
        onRound={round}
        onToggleDayNight={toggleDayNight}
        isDay={isDay}
        disableStart={!canStart}
        disableSettings={!isInitial}
        disableDayNight={!isStarted}
      />
      <div className="home">
        <AgentPanel
          agents={agents}
          isLoading={isLoading}
          activeAgentId={activeAgentId}
          onAskAgent={askAgent}
          onAddAgent={addAgent}
          onRemoveAgent={removeAgent}
          onKillAgent={killAgent}
          gameState={gameState}
          onShowAgentInfo={setSelectedAgent}
        />
        <div className="chat-area">
          <ChatMessages messages={messages} agents={agents} />
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>

      {selectedAgent && (
        <div className="agent-popup-overlay" onClick={() => setSelectedAgent(null)}>
          <div className="agent-popup" onClick={(e) => e.stopPropagation()}>
            <div className="agent-popup-header">
              <h3>Messages for {selectedAgent.name}</h3>
              <button onClick={() => setSelectedAgent(null)}>×</button>
            </div>
            <div className="agent-popup-content">
              {visibleMessages.map((msg: any, idx: number) => (
                <div key={idx} className="agent-popup-message">
                  <div className="agent-popup-message-role">{msg.role}</div>
                  <div className="agent-popup-message-content">{msg.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
