import { Message, MessageSender } from '../types';
import './MessageHeader.css';

interface MessageHeaderProps {
  message: Message;
  agentColor: string;
  agentModel?: string;
}

export function MessageHeader({ message, agentColor, agentModel }: MessageHeaderProps) {
  const isSystem = message.sender === MessageSender.System;
  const isModerator = message.sender === MessageSender.Moderator;
  const isAgent = message.sender === MessageSender.Agent;
  const isMafia = message.mafia === true;
  const isPrivate = message.pm === true;
  var targetName = 'Public';
  if (isPrivate) {
    targetName = message.agentName || 'Unknown';
  }
  if (isMafia) {
    targetName = 'Mafia Channel';
  }

  return (
    <div className="message-header">
      <div className="message-header-content">
        {isSystem ? (
          <div className="message-sender-name message-sender-name-system">
            {'System -> ' + targetName}
          </div>
        ) : (
          <div
            className="message-sender-name"
            style={{ color: isModerator ? '#1976d2' : agentColor }}
          >
            {isModerator ? 'Moderator' : message.agentName}
            {!isModerator && agentModel && (
              <span style={{ opacity: 0.9, fontWeight: 'normal', marginLeft: '8px' }}>
                {agentModel}
              </span>
            )}
            {message.executionTime !== undefined && (
              <span style={{ opacity: 0.9, fontWeight: 'normal', marginLeft: '8px' }}>
                thought for {message.executionTime.toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>
      {message.tool && (
        <div className="message-tool-badge">
          {message.tool}
        </div>
      )}
    </div>
  );
}
