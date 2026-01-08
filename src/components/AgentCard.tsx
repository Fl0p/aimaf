import { ChatAgent } from '../agents/ChatAgent';
import { MafiaRole } from '../types';
import './AgentCard.css';

const ROLE_COLORS: Record<MafiaRole, string> = {
  [MafiaRole.Civilian]: '#e8f5e9',
  [MafiaRole.Mafia]: '#ffebee',
  [MafiaRole.Doctor]: '#e3f2fd',
  [MafiaRole.Detective]: '#fff8e1',
  [MafiaRole.Don]: '#f3e5f5',
};

interface AgentCardProps {
  agent: ChatAgent;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export function AgentCard({ agent, isActive, disabled, onClick, onRemove }: AgentCardProps) {
  const backgroundColor = ROLE_COLORS[agent.mafiaRole] || '#fff';

  return (
    <div
      className={`agent-card ${isActive ? 'active' : ''}`}
      style={{ borderLeftColor: agent.color, backgroundColor }}
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
