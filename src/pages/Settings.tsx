import { useState, useEffect } from 'react';
import './Settings.css';

const STORAGE_KEY = 'openrouter_api_key';

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings">
      <h1>Settings</h1>

      <div className="settings-section">
        <label className="settings-label" htmlFor="api-key">
          OpenRouter API Key
        </label>
        <input
          id="api-key"
          type="password"
          className="settings-input"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-..."
        />
        <button className="settings-button" onClick={handleSave}>
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  );
}
