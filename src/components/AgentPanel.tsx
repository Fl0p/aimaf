import { useState } from 'react';
import { Agent } from '../types';
import { AgentForm } from './AgentForm';
import './AgentPanel.css';

interface AgentPanelProps {
  agents: Agent[];
  isLoading: boolean;
  activeAgentId: string | null;
  onAgentClick: (agent: Agent) => void;
  onAddAgent: (agent: Omit<Agent, 'id'>) => void;
  onRemoveAgent: (agentId: string) => void;
}

export function AgentPanel({
  agents,
  isLoading,
  activeAgentId,
  onAgentClick,
  onAddAgent,
  onRemoveAgent,
}: AgentPanelProps) {
  const [showForm, setShowForm] = useState(false);

  const handleAddAgent = (agent: Omit<Agent, 'id'>) => {
    onAddAgent(agent);
    setShowForm(false);
  };

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">Agents</div>
      <div className="agent-list">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`agent-item ${activeAgentId === agent.id ? 'active' : ''}`}
            style={{ borderLeftColor: agent.color }}
            onClick={() => !isLoading && onAgentClick(agent)}
          >
            <div className="agent-name">{agent.name}</div>
            <div className="agent-model">{agent.model}</div>
            <button
              className="agent-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveAgent(agent.id);
              }}
            >
              x
            </button>
          </div>
        ))}
      </div>
      {showForm ? (
        <AgentForm onSubmit={handleAddAgent} onCancel={() => setShowForm(false)} />
      ) : (
        <button className="agent-add-btn" onClick={() => setShowForm(true)}>
          + Add Agent
        </button>
      )}
    </div>
  );
}
