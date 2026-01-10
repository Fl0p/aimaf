import { useChat } from '../hooks/useChat';
import { Header } from '../components/Header';
import { AgentPanel } from '../components/AgentPanel';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { GameState } from '../types';
import './Home.css';

export function Home() {
  const {
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
    startGame,
    status,
    test2,
    test3,
  } = useChat();

  const isInitial = gameState === GameState.Initial;
  const canStart = isInitial && agents.length >= 2;

  return (
    <>
      <Header 
        onStart={startGame}
        onStatus={status}
        onTest2={test2}
        onTest3={test3}
        disableStart={!canStart}
        disableSettings={!isInitial}
      />
      <div className="home">
        <AgentPanel
          agents={agents}
          isLoading={isLoading}
          activeAgentId={activeAgentId}
          onAgentClick={askAgent}
          onAddAgent={addAgent}
          onRemoveAgent={removeAgent}
          onKillAgent={killAgent}
          gameState={gameState}
        />
        <div className="chat-area">
          <ChatMessages messages={messages} agents={agents} />
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </>
  );
}
