import { useState } from 'react';
import { AgentConfig } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import { AgentForm } from './AgentForm';
import { AgentCard } from './AgentCard';
import './AgentPanel.css';

interface AgentPanelProps {
  agents: ChatAgent[];
  isLoading: boolean;
  activeAgentId: string | null;
  onAgentClick: (agent: ChatAgent) => void;
  onAddAgent: (config: Omit<AgentConfig, 'id'>) => void;
  onRemoveAgent: (agentId: string) => void;
  disabled?: boolean;
}

export function AgentPanel({
  agents,
  isLoading,
  activeAgentId,
  onAgentClick,
  onAddAgent,
  onRemoveAgent,
  disabled = false,
}: AgentPanelProps) {
  const [showForm, setShowForm] = useState(false);

  const handleAddAgent = (config: Omit<AgentConfig, 'id'>) => {
    onAddAgent(config);
    setShowForm(false);
  };

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">Agents</div>
      <div className="agent-list">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isActive={activeAgentId === agent.id}
            disabled={isLoading}
            onClick={() => onAgentClick(agent)}
            onRemove={disabled ? undefined : () => onRemoveAgent(agent.id)}
          />
        ))}
      </div>
      {!disabled && (
        showForm ? (
          <AgentForm onSubmit={handleAddAgent} onCancel={() => setShowForm(false)} />
        ) : (
          <button className="agent-add-btn" onClick={() => setShowForm(true)}>
            + Add Agent
          </button>
        )
      )}
    </div>
  );
}
