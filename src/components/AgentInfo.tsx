import React from 'react';
import { ChatAgent } from '../agents/ChatAgent';

interface AgentInfoProps {
  agent: ChatAgent;
  messages: any[];
  onClose: () => void;
}

export const AgentInfo: React.FC<AgentInfoProps> = ({
  agent,
  messages,
  onClose,
}) => {
  return (
    <div className="agent-popup-overlay" onClick={onClose}>
      <div className="agent-popup" onClick={(e) => e.stopPropagation()}>
        <div className="agent-popup-header">
          <h3>Messages for {agent.name}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="agent-popup-content">
          <div className="agent-popup-message">
            <div className="agent-popup-message-role">system</div>
            <div className="agent-popup-message-content">{agent.fullInstructions}</div>
          </div>
          {messages.map((msg: any, idx: number) => (
            <div key={idx} className="agent-popup-message">
              <div className="agent-popup-message-role">{msg.role}</div>
              <div className="agent-popup-message-content">{msg.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
