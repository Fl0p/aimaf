import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { OpenRouterModel, MafiaRole } from '../types';
import { DEFAULT_PROMPTS } from '../agents/MafiaPrompts';
import './Settings.css';

const API_KEY_STORAGE = 'openrouter_api_key';
const MODELS_STORAGE = 'selected_models';
const PROMPTS_STORAGE = 'mafia_prompts';

interface ApiModel {
  id: string;
  name: string;
}

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const [allModels, setAllModels] = useState<ApiModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [search, setSearch] = useState('');

  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [promptsSaved, setPromptsSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE);
    if (storedKey) {
      setApiKey(storedKey);
    }

    const storedModels = localStorage.getItem(MODELS_STORAGE);
    if (storedModels) {
      setSelectedModels(JSON.parse(storedModels));
    }

    const storedPrompts = localStorage.getItem(PROMPTS_STORAGE);
    if (storedPrompts) {
      setPrompts(JSON.parse(storedPrompts));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(API_KEY_STORAGE, apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!apiKey) {
      setTestResult('error');
      setTimeout(() => setTestResult(null), 2000);
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "OK" and nothing else.' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 2000);
    }
  };

  const handleLoadModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      if (response.ok) {
        const data = await response.json();
        const models = data.data.map((m: { id: string; name: string }) => ({
          id: m.id,
          name: m.name,
        }));
        setAllModels(models);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const toggleModel = (model: ApiModel) => {
    const exists = selectedModels.find((m) => m.id === model.id);
    let newSelected: OpenRouterModel[];
    if (exists) {
      newSelected = selectedModels.filter((m) => m.id !== model.id);
    } else {
      newSelected = [...selectedModels, { id: model.id, name: model.name }];
    }
    setSelectedModels(newSelected);
    localStorage.setItem(MODELS_STORAGE, JSON.stringify(newSelected));
  };

  const filteredModels = allModels
    .filter(
      (m) =>
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  const handleSavePrompts = () => {
    localStorage.setItem(PROMPTS_STORAGE, JSON.stringify(prompts));
    setPromptsSaved(true);
    setTimeout(() => setPromptsSaved(false), 2000);
  };

  const handleResetPrompts = () => {
    setPrompts(DEFAULT_PROMPTS);
    localStorage.setItem(PROMPTS_STORAGE, JSON.stringify(DEFAULT_PROMPTS));
  };

  const updatePrompt = (key: string, value: string) => {
    setPrompts({ ...prompts, [key]: value });
  };

  return (
    <>
      <Header showBack />
      <div className="settings">
        <h1>Settings</h1>

      <div className="settings-section">
        <label className="settings-label" htmlFor="api-key">
          OpenRouter API Key <span className="settings-hint">(stored locally in browser)</span>
        </label>
        <input
          id="api-key"
          type="password"
          className="settings-input"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-..."
        />
        <div className="settings-buttons">
          <button className="settings-button" onClick={handleSave}>
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            className={`settings-button settings-button-test ${testResult === 'success' ? 'success' : ''} ${testResult === 'error' ? 'error' : ''}`}
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : testResult === 'success' ? 'OK!' : testResult === 'error' ? 'Failed' : 'Test'}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <label className="settings-label">
          Models <span className="settings-hint">({selectedModels.length} selected)</span>
        </label>

        {selectedModels.length > 0 && (
          <div className="selected-models">
            {selectedModels.map((m) => (
              <span key={m.id} className="selected-model-tag">
                {m.id}
                <button onClick={() => toggleModel(m)}>×</button>
              </span>
            ))}
          </div>
        )}

        <button
          className="settings-button"
          onClick={handleLoadModels}
          disabled={loadingModels}
        >
          {loadingModels ? 'Loading...' : allModels.length > 0 ? 'Refresh Models' : 'Load Models'}
        </button>

        {allModels.length > 0 && (
          <>
            <input
              type="text"
              className="settings-input"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="models-list">
              {filteredModels.map((model) => (
                <label key={model.id} className="model-item">
                  <input
                    type="checkbox"
                    checked={selectedModels.some((m) => m.id === model.id)}
                    onChange={() => toggleModel(model)}
                  />
                  <span className="model-id">{model.id}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="settings-section">
        <label className="settings-label">
          Game Prompts <span className="settings-hint">(customize AI behavior)</span>
        </label>

        <div className="prompt-group">
          <label className="prompt-label">General Rules</label>
          <textarea
            className="settings-textarea"
            value={prompts.generalRules}
            onChange={(e) => updatePrompt('generalRules', e.target.value)}
            rows={3}
          />
        </div>

        <div className="prompt-group">
          <label className="prompt-label">Mafia Role</label>
          <textarea
            className="settings-textarea"
            value={prompts[MafiaRole.Mafia]}
            onChange={(e) => updatePrompt(MafiaRole.Mafia, e.target.value)}
            rows={4}
          />
        </div>

        <div className="prompt-group">
          <label className="prompt-label">Don Role</label>
          <textarea
            className="settings-textarea"
            value={prompts[MafiaRole.Don]}
            onChange={(e) => updatePrompt(MafiaRole.Don, e.target.value)}
            rows={4}
          />
        </div>

        <div className="prompt-group">
          <label className="prompt-label">Civilian Role</label>
          <textarea
            className="settings-textarea"
            value={prompts[MafiaRole.Civilian]}
            onChange={(e) => updatePrompt(MafiaRole.Civilian, e.target.value)}
            rows={4}
          />
        </div>

        <div className="prompt-group">
          <label className="prompt-label">Detective Role</label>
          <textarea
            className="settings-textarea"
            value={prompts[MafiaRole.Detective]}
            onChange={(e) => updatePrompt(MafiaRole.Detective, e.target.value)}
            rows={4}
          />
        </div>

        <div className="prompt-group">
          <label className="prompt-label">Doctor Role</label>
          <textarea
            className="settings-textarea"
            value={prompts[MafiaRole.Doctor]}
            onChange={(e) => updatePrompt(MafiaRole.Doctor, e.target.value)}
            rows={4}
          />
        </div>

        <div className="settings-buttons">
          <button className="settings-button" onClick={handleSavePrompts}>
            {promptsSaved ? 'Saved!' : 'Save Prompts'}
          </button>
          <button className="settings-button settings-button-secondary" onClick={handleResetPrompts}>
            Reset to Default
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
