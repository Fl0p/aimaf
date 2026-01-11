import React from 'react';
import { ChatAgent } from '../agents/ChatAgent';

interface AgentInfoProps {
  agent: ChatAgent;
  messages: any[];
  onClose: () => void;
}

const formatContent = (content: any): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map(part => {
      if (part.type === 'text') {
        return part.text;
      }
      if (part.type === 'tool-call') {
        return `[TOOL [${part.toolName}] CALL]: ${JSON.stringify(part.input)}`;
      }
      if (part.type === 'tool-result') {
        const output = part.output?.value || JSON.stringify(part.output);
        return `[TOOL [${part.toolName}] RESULT]: ${output}`;
      }
      return JSON.stringify(part);
    }).join('\n');
  }
  return JSON.stringify(content);
};

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
              <div className="agent-popup-message-content">{formatContent(msg.content)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
