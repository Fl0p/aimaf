import { useState } from 'react';
import { AgentConfig, GameState } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import { AgentForm } from './AgentForm';
import { AgentCard } from './AgentCard';
import './AgentPanel.css';

interface AgentPanelProps {
  agents: ChatAgent[];
  isLoading: boolean;
  activeAgentId: string | null;
  onAskAgent: (agent: ChatAgent) => void;
  onAddAgent: (config: Omit<AgentConfig, 'id'>) => void;
  onRemoveAgent: (agentId: string) => void;
  onKillAgent: (agentId: string) => void;
  gameState: GameState;
}

export function AgentPanel({
  agents,
  isLoading,
  activeAgentId,
  onAskAgent,
  onAddAgent,
  onRemoveAgent,
  onKillAgent,
  gameState,
}: AgentPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const isInitial = gameState === GameState.Initial;

  const onAgentClick = (agent: ChatAgent) => {
    if (isInitial) {
      setEditingAgentId(agent.id);
    } else {
      onAskAgent(agent);
    }
  };

  const handleAddAgent = (config: Omit<AgentConfig, 'id'>) => {
    onAddAgent(config);
    setShowForm(false);
  };

  const handleEditAgent = (config: Omit<AgentConfig, 'id'>) => {
    if (editingAgentId) {
      // Remove old agent and add updated one
      onRemoveAgent(editingAgentId);
      onAddAgent(config);
      setEditingAgentId(null);
    }
  };

  const handleX = (agentId: string) => {
    if (isInitial) {
      onRemoveAgent(agentId);
    } else {
      onKillAgent(agentId);
    }
  };

  const editingAgent = editingAgentId ? agents.find(a => a.id === editingAgentId) : null;

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
            onX={() => handleX(agent.id)}
          />
        ))}
      </div>
      {isInitial && (
        editingAgent ? (
          <AgentForm 
            onSubmit={handleEditAgent} 
            onCancel={() => setEditingAgentId(null)}
            existingAgents={agents}
            initialAgent={editingAgent}
          />
        ) : showForm ? (
          <AgentForm 
            onSubmit={handleAddAgent} 
            onCancel={() => setShowForm(false)}
            existingAgents={agents}
          />
        ) : (
          <button className="agent-add-btn" onClick={() => setShowForm(true)}>
            + Add Agent
          </button>
        )
      )}
    </div>
  );
}
