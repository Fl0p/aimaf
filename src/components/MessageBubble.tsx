import { Message, MessageSender } from '../types';
import { MessageHeader } from './MessageHeader';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  agentColor: string;
  agentModel?: string;
}

export function MessageBubble({ message, agentColor, agentModel }: MessageBubbleProps) {
  const isSystem = message.sender === MessageSender.System;
  const isModerator = message.sender === MessageSender.Moderator;
  const isAgent = message.sender === MessageSender.Agent;
  const isPrivateSystem = message.pm === true || message.mafia === true;

  return (
    <div
      className={`message ${isSystem ? 'message-system' : isModerator ? 'message-user' : 'message-agent'} ${isPrivateSystem ? (isSystem ? 'message-private-system' : 'message-private') : ''}`}
      style={isAgent ? { borderLeftColor: agentColor } : undefined}
    >
      <MessageHeader message={message} agentColor={agentColor} agentModel={agentModel} />
      <div className="message-content">{message.content}</div>
    </div>
  );
}
