import { useChat } from '../hooks/useChat';
import { AgentPanel } from '../components/AgentPanel';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import './Home.css';

export function Home() {
  const {
    messages,
    agents,
    isLoading,
    activeAgentId,
    sendMessage,
    askAgent,
    addAgent,
    removeAgent,
  } = useChat();

  return (
    <div className="home">
      <AgentPanel
        agents={agents}
        isLoading={isLoading}
        activeAgentId={activeAgentId}
        onAgentClick={askAgent}
        onAddAgent={addAgent}
        onRemoveAgent={removeAgent}
      />
      <div className="chat-area">
        <ChatMessages messages={messages} agents={agents} />
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
