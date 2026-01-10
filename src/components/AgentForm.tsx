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
  '#cc1919', '#ea4122', '#ed851d', '#c3c323', '#909052', '#a4bf24',
  '#7ae60f', '#7cc464', '#19b319', '#72da8c', '#0f9954', '#54c4a8',
  '#24bcbc', '#0db9f2', '#699ed3', '#193ca3', '#5e5ec5', '#4310da',
  '#ad7be0', '#9215bc', '#c16cc1', '#931b75', '#d66ba1', '#dd1346',
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
  const [systemPrompt, setSystemPrompt] = useState('');
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
          placeholder="Additional instructions for the agent..."
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
