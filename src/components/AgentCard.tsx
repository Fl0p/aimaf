import { ChatAgent } from '../agents/ChatAgent';
import './AgentCard.css';

interface AgentCardProps {
  agent: ChatAgent;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export function AgentCard({ agent, isActive, disabled, onClick, onRemove }: AgentCardProps) {
  return (
    <div
      className={`agent-card ${isActive ? 'active' : ''}`}
      style={{ borderLeftColor: agent.color }}
      onClick={() => !disabled && onClick()}
    >
      <div className="agent-card-name">
        <span className="agent-status">⚪</span>
        {agent.name}
      </div>
      <div className="agent-card-model">{agent.model}</div>
      <button
        className="agent-card-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        ×
      </button>
    </div>
  );
}
