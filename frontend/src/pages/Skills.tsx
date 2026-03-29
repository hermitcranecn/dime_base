import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

interface Props {
  ownerId: string
  dimeId?: string
}

export default function Skills({ ownerId, dimeId }: Props) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  useEffect(() => {
    fetchSkills()
  }, [])

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
        <h1>Skills Marketplace</h1>
        <p className="subtitle">Browse and manage your dime's abilities</p>
      </div>

      <div className="skills-info-banner glass-panel">
        <div className="info-icon">💡</div>
        <div className="info-content">
          <h3>Manage Equipped Skills in Config</h3>
          <p>To configure equipped skills, go to the <Link to="/config">Dime Configuration</Link> page.</p>
        </div>
      </div>

      <section className="skills-section">
        <h2>Available Skills</h2>
        <p className="section-desc">Skills enhance your dime's capabilities. Purchase from the marketplace to equip.</p>

        {availableSkills.length === 0 ? (
          <div className="empty-state glass-panel">
            <div className="empty-icon">🛒</div>
            <p>No skills available yet. Check back later!</p>
          </div>
        ) : (
          <div className="skills-grid">
            {availableSkills.map(skill => (
              <div
                key={skill.id}
                className="skill-card glass-panel"
                onClick={() => setSelectedSkill(skill)}
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
                <h4>Parameters</h4>
                {selectedSkill.parameters.map((param, i) => (
                  <div key={i} className="param-row">
                    <label>
                      {param.name}
                      {param.required && <span className="required">*</span>}
                    </label>
                    <span className="param-hint">{param.description}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedSkill(null)}>Close</button>
              {dimeId && (
                <Link to="/marketplace" className="btn-primary" style={{display: 'inline-block', textDecoration: 'none'}}>
                  Get from Marketplace
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
