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

const ROLE_EMOJI: Record<MafiaRole, string> = {
  [MafiaRole.Civilian]: '👤',
  [MafiaRole.Mafia]: '🔫',
  [MafiaRole.Doctor]: '💉',
  [MafiaRole.Detective]: '🔍',
  [MafiaRole.Don]: '🎩',
};

interface AgentCardProps {
  agent: ChatAgent;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
  onX: () => void;
  onI: () => void;
}

export function AgentCard({ agent, isActive, disabled, onClick, onX, onI }: AgentCardProps) {
  const backgroundColor = ROLE_COLORS[agent.mafiaRole] || '#fff';
  const statusColor = agent.isDead ? '⚫' : (isActive ? '🟢' : '⚪');

  return (
    <div
      className={`agent-card ${isActive ? 'active' : ''}`}
      style={{ borderLeftColor: agent.color, backgroundColor }}
      onClick={() => !disabled && onClick()}
      title={agent.systemPrompt}
    >
      <div className="agent-card-name">
        <span className="agent-status">{statusColor}</span>
        <span className="agent-role-emoji">{ROLE_EMOJI[agent.mafiaRole]}</span>
        {agent.name}
      </div>
      <div className="agent-card-model">{agent.model}</div>
      <button
        className="agent-card-info"
        onClick={(e) => {
          e.stopPropagation();
          onI();
        }}
      >
        ℹ
      </button>
      <button
        className="agent-card-remove"
        onClick={(e) => {
          e.stopPropagation();
          onX();
        }}
      >
        ×
      </button>
    </div>
  );
}
