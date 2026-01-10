import { useEffect, useRef } from 'react';
import { Message, MessageSender } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
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
          <div
            key={message.id}
            className={`message ${message.sender === MessageSender.Moderator ? 'message-user' : 'message-agent'}`}
          >
            <div
              className="message-sender-name"
              style={{ color: message.sender === MessageSender.Moderator ? '#1976d2' : getAgentColor(message.agentId) }}
            >
              {message.sender === MessageSender.Moderator ? 'Moderator' : message.agentName}
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
