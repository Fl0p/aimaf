import React from 'react';
import { ChatAgent } from '../agents/ChatAgent';
import { AgentMessage } from './AgentMessage';

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
          <AgentMessage role="system" content={agent.fullInstructions} />
          {messages.map((msg: any, idx: number) => (
            <AgentMessage key={idx} role={msg.role} content={msg.content} />
          ))}
        </div>
      </div>
    </div>
  );
};
