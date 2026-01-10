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

  const isInitial = gameState === GameState.Initial;
  const isStarted = gameState === GameState.Started;
  const canStart = isInitial && agents.length >= 2;

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
        />
        <div className="chat-area">
          <ChatMessages messages={messages} agents={agents} />
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </>
  );
}
