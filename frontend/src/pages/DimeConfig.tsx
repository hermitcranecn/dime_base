import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

interface Skill {
  id: string
  name: string
  description: string
  type: string
  version: string
  parameters: SkillParameter[]
  apiSpec?: {
    endpoint: string
    method: string
    headers?: Record<string, string>
  }
}

interface SkillParameter {
  name: string
  type: string
  required: boolean
  default?: string
  description?: string
}

interface EquippedSkill {
  id: string
  goodsId: string
  skillId: string
  status: string
  config: any
  skill: Skill
}

type ActiveSection = 'general' | 'skills' | 'privacy'

interface Props {
  dimeId: string
  ownerId: string
}

export default function DimeConfig({ dimeId, ownerId }: Props) {
  const [config, setConfig] = useState<DimeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeSection, setActiveSection] = useState<ActiveSection>('general')
  const [formData, setFormData] = useState<DimeConfig>({
    llmBackend: 'deepseek',
    temperature: 0.7,
    tone: 'casual',
    mode: 'assistant',
    privacy: { shareLocation: false, allowDataCollection: false },
    conversationRetention: 30
  })

  // Skills state
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [equippedSkills, setEquippedSkills] = useState<EquippedSkill[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchConfig()
  }, [dimeId])

  useEffect(() => {
    if (activeSection === 'skills') {
      fetchSkills()
      fetchEquippedSkills()
    }
  }, [activeSection, dimeId])

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

  const fetchSkills = async () => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/goods?type=skill`)
      const data = await res.json()
      if (data.success) {
        const skills = (data.data || []).map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          type: g.type,
          version: g.version || '1.0.0',
          parameters: g.parameters || [],
          apiSpec: g.apiSpec
        }))
        setAvailableSkills(skills)
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err)
    }
  }

  const fetchEquippedSkills = async () => {
    if (!dimeId) return
    try {
      const res = await fetch(`${API_BASE}/marketplace/dimes/${dimeId}/equipped`, {
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) {
        setEquippedSkills(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch equipped skills:', err)
    }
  }

  const configureSkill = async (skillId: string, config: Record<string, any>) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/dime-goods/${skillId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-owner-id': ownerId },
        body: JSON.stringify({ config })
      })
      const data = await res.json()
      if (data.success) {
        alert('Configuration saved!')
        fetchEquippedSkills()
      }
    } catch (err) {
      console.error('Failed to configure:', err)
    }
  }

  const getSkillIcon = (skillName: string) => {
    const name = skillName.toLowerCase()
    if (name.includes('weather')) return '🌤️'
    if (name.includes('translation') || name.includes('translator')) return '🗣️'
    if (name.includes('search')) return '🔍'
    if (name.includes('music')) return '🎵'
    if (name.includes('news')) return '📰'
    if (name.includes('calend')) return '📅'
    if (name.includes('email')) return '📧'
    if (name.includes('image') || name.includes('photo')) return '🖼️'
    return '⚡'
  }

  if (loading) return <div className="page-loading">Loading configuration...</div>

  return (
    <div className="page dime-config">
      <div className="page-header">
        <h1>Dime Configuration</h1>
        <p className="subtitle">Customize your digital agent's personality and behavior</p>
      </div>

      {/* Tabs */}
      <div className="config-tabs">
        <button
          className={`tab ${activeSection === 'general' ? 'active' : ''}`}
          onClick={() => setActiveSection('general')}
        >
          General
        </button>
        <button
          className={`tab ${activeSection === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveSection('skills')}
        >
          Skills
        </button>
        <button
          className={`tab ${activeSection === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveSection('privacy')}
        >
          Privacy
        </button>
      </div>

      {/* General Tab */}
      {activeSection === 'general' && (
        <>
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
        </>
      )}

      {/* Skills Tab */}
      {activeSection === 'skills' && (
        <div className="config-skills">
          {equippedSkills.length > 0 && (
            <section className="skills-section">
              <h2>Equipped Skills</h2>
              <div className="equipped-grid">
                {equippedSkills.map(es => (
                  <div key={es.id} className="equipped-card glass-panel">
                    <div className="skill-icon large">{getSkillIcon(es.skill?.name || '')}</div>
                    <div className="equipped-info">
                      <h3>{es.skill?.name}</h3>
                      <span className={`status ${es.status}`}>{es.status}</span>
                    </div>
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => {
                        setSelectedSkill(es.skill)
                        setConfigValues(es.config || {})
                      }}
                    >
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="skills-section">
            <h2>Available Skills</h2>
            <p className="section-desc">
              Browse skills in the <Link to="/marketplace">Marketplace</Link> to get more abilities for your dime.
            </p>

            {availableSkills.length === 0 ? (
              <div className="empty-state glass-panel">
                <div className="empty-icon">🛒</div>
                <p>No skills available in marketplace yet.</p>
                <Link to="/marketplace" className="btn-primary" style={{display: 'inline-block', marginTop: '16px'}}>
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <div className="skills-grid">
                {availableSkills.map(skill => (
                  <div
                    key={skill.id}
                    className="skill-card glass-panel"
                    onClick={() => {
                      setSelectedSkill(skill)
                      setConfigValues({})
                    }}
                  >
                    <div className="skill-icon">{getSkillIcon(skill.name)}</div>
                    <div className="skill-info">
                      <h3>{skill.name}</h3>
                      <p className="skill-desc">{skill.description}</p>
                    </div>
                    <div className="skill-meta">
                      <span className="version">v{skill.version}</span>
                      {skill.parameters.length > 0 && (
                        <span className="param-count">{skill.parameters.length} params</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {selectedSkill && (
            <div className="modal-overlay" onClick={() => setSelectedSkill(null)}>
              <div className="modal glass-panel modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="skill-icon large">{getSkillIcon(selectedSkill.name)}</div>
                  <div>
                    <h2>{selectedSkill.name}</h2>
                    <p className="modal-type">Skill • v{selectedSkill.version}</p>
                  </div>
                </div>

                <p className="modal-desc">{selectedSkill.description}</p>

                {selectedSkill.apiSpec && (
                  <div className="api-spec">
                    <h4>API Spec</h4>
                    <div className="api-endpoint">
                      <span className="method">{selectedSkill.apiSpec.method}</span>
                      <code>{selectedSkill.apiSpec.endpoint}</code>
                    </div>
                  </div>
                )}

                {selectedSkill.parameters.length > 0 && (
                  <div className="params-section">
                    <h4>Configuration Parameters</h4>
                    {selectedSkill.parameters.map((param, i) => (
                      <div key={i} className="param-row">
                        <label>
                          {param.name}
                          {param.required && <span className="required">*</span>}
                        </label>
                        <input
                          type="text"
                          placeholder={param.default || param.description || param.name}
                          value={configValues[param.name] || param.default || ''}
                          onChange={e => setConfigValues({ ...configValues, [param.name]: e.target.value })}
                        />
                        <span className="param-hint">{param.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setSelectedSkill(null)}>Cancel</button>
                  <button
                    className="btn-primary"
                    onClick={() => configureSkill(selectedSkill.id, configValues)}
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Privacy Tab */}
      {activeSection === 'privacy' && (
        <>
          <div className="config-grid">
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
          </div>

          {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

          <div className="action-bar">
            <button className="btn-secondary" onClick={handleReset} disabled={saving}>Reset to Defaults</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
