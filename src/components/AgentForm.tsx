import { useState, useEffect, useMemo } from 'react';
import { AgentConfig, OpenRouterModel, MafiaRole } from '../types';
import './AgentForm.css';

interface AgentFormProps {
  onSubmit: (config: Omit<AgentConfig, 'id'>) => void;
  onCancel: () => void;
}

const FIRST_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn',
  'Max', 'Charlie', 'Jamie', 'Avery', 'Parker', 'Skyler', 'Drew', 'Reese',
  'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia', 'James', 'Mia', 'Lucas',
  'Ivan', 'Olga', 'Dmitri', 'Anna', 'Viktor', 'Elena', 'Nikita', 'Maria',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Moore', 'Clark', 'Hall',
  'Young', 'King', 'Wright', 'Green', 'Adams', 'Baker', 'Hill', 'Scott',
  'Torres', 'Chen', 'Kumar', 'Silva', 'Kim', 'Müller', 'Rossi', 'Tanaka',
  'Petrov', 'Ivanov', 'Volkov', 'Novak', 'Berg', 'Costa', 'Santos', 'Park',
];

function generateAgentName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

const COLORS = [
  '#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4',
  '#f44336', '#3f51b5', '#009688', '#ff5722', '#795548', '#607d8b',
  '#8bc34a', '#03a9f4', '#ffc107', '#673ab7', '#cddc39', '#ff4081',
  '#00e676', '#651fff',
];
const MODELS_STORAGE = 'selected_models';

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function AgentForm({ onSubmit, onCancel }: AgentFormProps) {
  const placeholderName = useMemo(() => generateAgentName(), []);
  const initialColor = useMemo(() => randomColor(), []);
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [color, setColor] = useState(initialColor);
  const [mafiaRole, setMafiaRole] = useState<MafiaRole>(MafiaRole.Civilian);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(MODELS_STORAGE);
    if (stored) {
      const models = JSON.parse(stored) as OpenRouterModel[];
      setAvailableModels(models);
      if (models.length > 0 && !model) {
        setModel(models[0].id);
      }
    }
  }, [model]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model) return;
    const finalName = name.trim() || placeholderName;
    onSubmit({ name: finalName, model, systemPrompt, color, mafiaRole });
  };

  return (
    <form className="agent-form" onSubmit={handleSubmit}>
      <div className="agent-form-field">
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholderName}
        />
      </div>
      <div className="agent-form-field">
        <label>Role</label>
        <select value={mafiaRole} onChange={(e) => setMafiaRole(e.target.value as MafiaRole)}>
          {Object.values(MafiaRole).map((role) => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="agent-form-field">
        <label>Model</label>
        {availableModels.length > 0 ? (
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
          </select>
        ) : (
          <div className="no-models-hint">
            No models selected. Go to Settings to select models.
          </div>
        )}
      </div>
      <div className="agent-form-field">
        <label>System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Instructions for the agent..."
          rows={3}
        />
      </div>
      <div className="agent-form-field">
        <label>Color</label>
        <div className="color-picker">
          {COLORS.map((c) => (
            <div
              key={c}
              className={`color-option ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div className="agent-form-buttons">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-submit" disabled={!model}>
          Add
        </button>
      </div>
    </form>
  );
}
