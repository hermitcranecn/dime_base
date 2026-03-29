import { useState, useEffect } from 'react'
import './pages.css'

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api`

interface DimeConfig {
  llmBackend: string
  apiKey?: string
  modelName?: string
  temperature: number
  tone: string
  mode: string
  privacy: {
    shareLocation: boolean
    allowDataCollection: boolean
  }
  conversationRetention: number
}

interface Props {
  dimeId: string
  ownerId: string
}

export default function DimeConfig({ dimeId, ownerId }: Props) {
  const [config, setConfig] = useState<DimeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState<DimeConfig>({
    llmBackend: 'deepseek',
    temperature: 0.7,
    tone: 'casual',
    mode: 'assistant',
    privacy: { shareLocation: false, allowDataCollection: false },
    conversationRetention: 30
  })

  useEffect(() => {
    fetchConfig()
  }, [dimeId])

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/config/dime/${dimeId}`, {
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success && data.data) {
        setConfig(data.data)
        setFormData(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch config:', err)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/config/dime/${dimeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-owner-id': ownerId },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Configuration saved successfully')
        setConfig(formData)
      } else {
        setMessage(data.error || 'Failed to save')
      }
    } catch (err) {
      setMessage('Failed to connect')
    }
    setSaving(false)
  }

  const handleReset = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/config/dime/${dimeId}/reset`, {
        method: 'POST',
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) {
        setFormData(data.data)
        setMessage('Reset to defaults')
      }
    } catch (err) {
      setMessage('Failed to reset')
    }
    setSaving(false)
  }

  if (loading) return <div className="page-loading">Loading configuration...</div>

  return (
    <div className="page dime-config">
      <div className="page-header">
        <h1>Dime Configuration</h1>
        <p className="subtitle">Customize your digital agent's personality and behavior</p>
      </div>

      <div className="config-grid">
        <div className="config-card glass-panel">
          <h2>AI Backend</h2>
          <div className="form-group">
            <label>LLM Provider</label>
            <select
              value={formData.llmBackend}
              onChange={e => setFormData({...formData, llmBackend: e.target.value})}
            >
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>
          {formData.llmBackend === 'custom' && (
            <div className="form-group">
              <label>Custom Endpoint URL</label>
              <input
                type="text"
                placeholder="https://api.example.com/v1"
                value={formData.customEndpoint || ''}
                onChange={e => setFormData({...formData, customEndpoint: e.target.value})}
              />
            </div>
          )}
          <div className="form-group">
            <label>Model Name</label>
            <input
              type="text"
              value={formData.modelName || ''}
              onChange={e => setFormData({...formData, modelName: e.target.value})}
              placeholder="e.g., gpt-4, deepseek-chat"
            />
          </div>
        </div>

        <div className="config-card glass-panel">
          <h2>Response Settings</h2>
          <div className="form-group">
            <label>Temperature: {formData.temperature}</label>
            <input
              type="range"
              min="0" max="2" step="0.1"
              value={formData.temperature}
              onChange={e => setFormData({...formData, temperature: parseFloat(e.target.value)})}
            />
            <span className="hint">Lower = more focused, Higher = more creative</span>
          </div>
          <div className="form-group">
            <label>Tone</label>
            <select
              value={formData.tone}
              onChange={e => setFormData({...formData, tone: e.target.value})}
            >
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mode</label>
            <select
              value={formData.mode}
              onChange={e => setFormData({...formData, mode: e.target.value})}
            >
              <option value="assistant">Assistant</option>
              <option value="analytical">Analytical</option>
              <option value="creative">Creative</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>
        </div>

        <div className="config-card glass-panel">
          <h2>Privacy Controls</h2>
          <div className="toggle-group">
            <label className="toggle">
              <input
                type="checkbox"
                checked={formData.privacy.shareLocation}
                onChange={e => setFormData({
                  ...formData,
                  privacy: {...formData.privacy, shareLocation: e.target.checked}
                })}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Share Location</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={formData.privacy.allowDataCollection}
                onChange={e => setFormData({
                  ...formData,
                  privacy: {...formData.privacy, allowDataCollection: e.target.checked}
                })}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Allow Data Collection</span>
            </label>
          </div>
        </div>

        <div className="config-card glass-panel">
          <h2>Data Management</h2>
          <div className="form-group">
            <label>Conversation Retention (days)</label>
            <input
              type="number"
              min="0" max="365"
              value={formData.conversationRetention}
              onChange={e => setFormData({...formData, conversationRetention: parseInt(e.target.value)})}
            />
            <span className="hint">0 = no retention</span>
          </div>
        </div>
      </div>

      {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

      <div className="action-bar">
        <button className="btn-secondary" onClick={handleReset} disabled={saving}>Reset to Defaults</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  )
}
