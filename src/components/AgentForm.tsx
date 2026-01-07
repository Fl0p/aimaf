import { useState, useEffect } from 'react';
import { Agent, OpenRouterModel } from '../types';
import './AgentForm.css';

interface AgentFormProps {
  onSubmit: (agent: Omit<Agent, 'id'>) => void;
  onCancel: () => void;
}

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4'];
const MODELS_STORAGE = 'selected_models';

export function AgentForm({ onSubmit, onCancel }: AgentFormProps) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [color, setColor] = useState(COLORS[0]);
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
    if (!name.trim() || !model) return;
    onSubmit({ name, model, systemPrompt, color });
  };

  return (
    <form className="agent-form" onSubmit={handleSubmit}>
      <div className="agent-form-field">
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Agent name"
          required
        />
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
