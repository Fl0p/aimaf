import { useState, useEffect } from 'react';
import './Settings.css';

const STORAGE_KEY = 'openrouter_api_key';

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

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

  return (
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
    </div>
  );
}
