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
  const isPrivate = message.mafia === true || message.pm === true;

  return (
    <div
      className={`message ${isSystem ? 'message-system' : isModerator ? 'message-user' : 'message-agent'} ${isPrivate ? (isSystem ? 'message-private-system' : 'message-private') : ''} ${message.tool ? 'message-with-tool' : ''}`}
      style={isAgent ? { borderLeftColor: agentColor } : undefined}
    >
      {message.tool && (
        <div className="message-tool-badge">
          {message.tool}
        </div>
      )}
      <div className="message-main-content">
        {!isSystem && (
          <div
            className="message-sender-name"
            style={{ color: isModerator ? '#1976d2' : agentColor }}
          >
            {isModerator ? 'Moderator' : message.agentName}
            {message.executionTime !== undefined && (
              <span style={{ opacity: 0.9, fontWeight: 'normal', marginLeft: '8px' }}>
                thought for {message.executionTime.toFixed(1)}s
              </span>
            )}
          </div>
        )}
        <div className="message-content">{message.content}</div>
      </div>
    </div>
  );
}
