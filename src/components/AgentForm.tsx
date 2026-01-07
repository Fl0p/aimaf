import { useState } from 'react';
import { Agent } from '../types';
import './AgentForm.css';

interface AgentFormProps {
  onSubmit: (agent: Omit<Agent, 'id'>) => void;
  onCancel: () => void;
}

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4'];

export function AgentForm({ onSubmit, onCancel }: AgentFormProps) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('openai/gpt-3.5-turbo');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
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
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="openai/gpt-4o"
        />
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
        <button type="submit" className="btn-submit">
          Add
        </button>
      </div>
    </form>
  );
}
