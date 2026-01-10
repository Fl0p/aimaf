import { Message, MessageSender } from '../types';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  agentColor: string;
}

export function MessageBubble({ message, agentColor }: MessageBubbleProps) {
  const isSystem = message.sender === MessageSender.System;
  const isModerator = message.sender === MessageSender.Moderator;
  const isAgent = message.sender === MessageSender.Agent;
  const isMafia = message.mafia === true;

  return (
    <div
      className={`message ${isSystem ? 'message-system' : isModerator ? 'message-user' : 'message-agent'} ${isMafia ? 'message-mafia' : ''}`}
      style={isAgent ? { borderLeftColor: agentColor } : undefined}
    >
      {!isSystem && (
        <div
          className="message-sender-name"
          style={{ color: isModerator ? '#1976d2' : agentColor }}
        >
          {isModerator ? 'Moderator' : message.agentName}
        </div>
      )}
      <div className="message-content">{message.content}</div>
    </div>
  );
}
