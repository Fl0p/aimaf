import React from 'react';

interface AgentMessageProps {
  role: string;
  content: any;
}

const formatJson = (obj: any): React.ReactNode => {
  try {
    const formatted = JSON.stringify(obj, null, 2);
    return <pre className="tool-json">{formatted}</pre>;
  } catch {
    return String(obj);
  }
};

const renderContent = (content: any): React.ReactNode => {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((part, idx) => {
      if (part.type === 'text') {
        return <div key={idx} className="content-text">{part.text}</div>;
      }
      if (part.type === 'tool-call') {
        return (
          <div key={idx} className="tool-block tool-call">
            <div className="tool-header">
              <span className="tool-label">Tool Call</span>
              <span className="tool-name">{part.toolName}</span>
            </div>
            <div className="tool-body">
              {formatJson(part.args || part.input)}
            </div>
          </div>
        );
      }
      if (part.type === 'tool-result') {
        const output = part.result?.value ?? part.result ?? part.output?.value ?? part.output;
        return (
          <div key={idx} className="tool-block tool-result">
            <div className="tool-header">
              <span className="tool-label">Tool Result</span>
              <span className="tool-name">{part.toolName}</span>
            </div>
            <div className="tool-body">
              {typeof output === 'string' ? output : formatJson(output)}
            </div>
          </div>
        );
      }
      return <div key={idx} className="content-unknown">{formatJson(part)}</div>;
    });
  }
  return formatJson(content);
};

export const AgentMessage: React.FC<AgentMessageProps> = ({ role, content }) => {
  return (
    <div className="agent-popup-message">
      <div className="agent-popup-message-role">{role}</div>
      <div className="agent-popup-message-content">{renderContent(content)}</div>
    </div>
  );
};
