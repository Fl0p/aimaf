import { Message, MessageSender } from '../types';
import './ChatMessage.css';

interface ChatMessageProps {
  message: Message;
  agentColor: string;
}

export function ChatMessage({ message, agentColor }: ChatMessageProps) {
  return (
    <div
      className={`message ${message.sender === MessageSender.Moderator ? 'message-user' : 'message-agent'}`}
      style={message.sender !== MessageSender.Moderator ? { borderLeftColor: agentColor } : undefined}
    >
      <div
        className="message-sender-name"
        style={{ color: message.sender === MessageSender.Moderator ? '#1976d2' : agentColor }}
      >
        {message.sender === MessageSender.Moderator ? 'Moderator' : message.agentName}
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
}
