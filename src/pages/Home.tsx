import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { Header } from '../components/Header';
import { AgentPanel } from '../components/AgentPanel';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { AgentInfo } from '../components/AgentInfo';
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
    gamePhase,
    autoPlay,
    setAutoPlay,
    sendMessage,
    askAgent,
    addAgent,
    removeAgent,
    killAgent,
    nextPhase,
    restartGame,
  } = useChat();

  const [selectedAgent, setSelectedAgent] = useState<ChatAgent | null>(null);

  const isInitial = gameState === GameState.Initial;
  const isEnded = gameState === GameState.Ended;

  const visibleMessages = selectedAgent ? selectedAgent.getVisibleMessages(messages) : [];

  return (
    <>
      <Header 
        onNext={nextPhase}
        onRestart={restartGame}
        gamePhase={gamePhase}
        gameState={gameState}
        disableSettings={!isInitial}
        disableNext={isLoading || agents.length < 5 || isEnded}
        autoPlay={autoPlay}
        onAutoPlayChange={setAutoPlay}
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
        <AgentInfo
          agent={selectedAgent}
          messages={visibleMessages}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </>
  );
}
