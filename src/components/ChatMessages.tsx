import { useEffect, useRef } from 'react';
import { Message } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import { ChatMessage } from './ChatMessage';
import './ChatMessages.css';

interface ChatMessagesProps {
  messages: Message[];
  agents: ChatAgent[];
}

export function ChatMessages({ messages, agents }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAgentColor = (agentId?: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.color || '#666';
  };

  return (
    <div className="chat-messages">
      {messages.length === 0 ? (
        <div className="chat-empty">
          Send a message to start the conversation
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            agentColor={getAgentColor(message.agentId)}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
