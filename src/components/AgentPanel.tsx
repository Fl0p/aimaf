import { useState } from 'react';
import { AgentConfig, GameState, MafiaRole, OpenRouterModel } from '../types';
import { ChatAgent } from '../agents/ChatAgent';
import { AgentForm, generateAgentName, randomColor } from './AgentForm';
import { AgentCard } from './AgentCard';
import './AgentPanel.css';

const MODELS_STORAGE = 'selected_models';

const TEAM_PRESETS = {
  team7: [
    { role: MafiaRole.Mafia, count: 2 },
    { role: MafiaRole.Detective, count: 1 },
    { role: MafiaRole.Civilian, count: 4 },
  ],
  team10: [
    { role: MafiaRole.Don, count: 1 },
    { role: MafiaRole.Mafia, count: 2 },
    { role: MafiaRole.Detective, count: 1 },
    { role: MafiaRole.Doctor, count: 1 },
    { role: MafiaRole.Civilian, count: 5 },
  ],
  team14: [
    { role: MafiaRole.Don, count: 1 },
    { role: MafiaRole.Mafia, count: 4 },
    { role: MafiaRole.Detective, count: 1 },
    { role: MafiaRole.Doctor, count: 1 },
    { role: MafiaRole.Civilian, count: 7 },
  ],
};

interface AgentPanelProps {
  agents: ChatAgent[];
  isLoading: boolean;
  activeAgentId: string | null;
  onAskAgent: (agent: ChatAgent) => void;
  onAddAgent: (config: Omit<AgentConfig, 'id'>) => void;
  onRemoveAgent: (agentId: string) => void;
  onKillAgent: (agentId: string) => void;
  gameState: GameState;
  onShowAgentInfo: (agent: ChatAgent) => void;
  isOpen?: boolean;
  onClose?: () => void;
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
  onShowAgentInfo,
  isOpen,
  onClose,
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

  const handleAddTeam = (presetKey: keyof typeof TEAM_PRESETS) => {
    const stored = localStorage.getItem(MODELS_STORAGE);
    if (!stored) {
      alert('No models selected. Go to Settings to select models.');
      return;
    }
    const models = JSON.parse(stored) as OpenRouterModel[];
    if (models.length === 0) {
      alert('No models selected. Go to Settings to select models.');
      return;
    }
    const model = models[0].id;
    const preset = TEAM_PRESETS[presetKey];
    const usedNames = new Set(agents.map(a => a.name));

    for (const { role, count } of preset) {
      for (let i = 0; i < count; i++) {
        let name = generateAgentName();
        while (usedNames.has(name)) {
          name = generateAgentName();
        }
        usedNames.add(name);
        onAddAgent({
          name,
          model,
          systemPrompt: '',
          color: randomColor(),
          mafiaRole: role,
        });
      }
    }
  };

  const sortedAgents = [...agents].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={`agent-panel ${isOpen ? 'agent-panel-open' : ''}`}>
      <div className="agent-panel-header">
        <span>Agents ({agents.length})</span>
        {onClose && (
          <button className="agent-panel-close" onClick={onClose} aria-label="Close panel">
            ✕
          </button>
        )}
      </div>
      <div className="agent-list">
        {sortedAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isActive={activeAgentId === agent.id}
            disabled={isLoading}
            onClick={() => onAgentClick(agent)}
            onX={() => handleX(agent.id)}
            onI={() => onShowAgentInfo(agent)}
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
      {isInitial && !showForm && !editingAgent && (
        <div className="team-presets">
          <button onClick={() => handleAddTeam('team7')}>Team 7</button>
          <button onClick={() => handleAddTeam('team10')}>Team 10</button>
          <button onClick={() => handleAddTeam('team14')}>Team 14</button>
        </div>
      )}
    </div>
  );
}
