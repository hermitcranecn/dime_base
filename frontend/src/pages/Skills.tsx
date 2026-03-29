import { useState, useEffect } from 'react'
import './pages.css'

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api`

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

interface Props {
  ownerId: string
  dimeId?: string
}

export default function Skills({ ownerId, dimeId }: Props) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [equippedSkills, setEquippedSkills] = useState<EquippedSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSkills()
    if (dimeId) fetchEquippedSkills()
  }, [dimeId])

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
    setLoading(false)
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

  if (loading) return <div className="page-loading">Loading skills...</div>

  return (
    <div className="page skills">
      <div className="page-header">
        <h1>Skills</h1>
        <p className="subtitle">Configure your dime's abilities</p>
      </div>

      {dimeId && equippedSkills.length > 0 && (
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
        <p className="section-desc">Skills enhance your dime's capabilities. Purchase from the marketplace to equip.</p>

        {availableSkills.length === 0 ? (
          <div className="empty-state glass-panel">
            <div className="empty-icon">🛒</div>
            <p>No skills available yet. Check the marketplace!</p>
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
              {dimeId && (
                <button
                  className="btn-primary"
                  onClick={() => configureSkill(selectedSkill.id, configValues)}
                >
                  Save Configuration
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
