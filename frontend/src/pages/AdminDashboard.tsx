import { useState, useEffect } from 'react'
import './pages.css'

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api`

interface Stats {
  totalUsers: number
  totalDimes: number
  activeUsers: number
  avgActivity: number
}

interface Playground {
  id: string
  name: string
  description: string
  type: string
  maxAgents: number
}

interface Owner {
  id: string
  email: string
  status: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [activeTab, setActiveTab] = useState<'stats' | 'playgrounds' | 'owners'>('stats')
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')
  const [showTokenInput, setShowTokenInput] = useState(true)

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchPlaygrounds(), fetchOwners()])
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchPlaygrounds = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/playgrounds`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setPlaygrounds(data.data || [])
    } catch (err) {
      console.error('Failed to fetch playgrounds:', err)
    }
  }

  const fetchOwners = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/owners`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setOwners(data.data || [])
    } catch (err) {
      console.error('Failed to fetch owners:', err)
    }
  }

  const createPlayground = async () => {
    const name = prompt('Playground name:')
    if (!name) return
    const description = prompt('Description:') || ''
    const type = prompt('Type (social/gaming/creative):') || 'social'
    const maxAgents = parseInt(prompt('Max agents:') || '50')

    try {
      const res = await fetch(`${API_BASE}/admin/playgrounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, type, maxAgents })
      })
      const data = await res.json()
      if (data.success) {
        setPlaygrounds(prev => [...prev, data.data])
      }
    } catch (err) {
      console.error('Failed to create playground:', err)
    }
  }

  const suspendOwner = async (ownerId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/owners/${ownerId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setOwners(prev => prev.map(o => o.id === ownerId ? { ...o, status: 'suspended' } : o))
      }
    } catch (err) {
      console.error('Failed to suspend:', err)
    }
  }

  const activateOwner = async (ownerId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/owners/${ownerId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setOwners(prev => prev.map(o => o.id === ownerId ? { ...o, status: 'active' } : o))
      }
    } catch (err) {
      console.error('Failed to activate:', err)
    }
  }

  if (showTokenInput) {
    return (
      <div className="page admin">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p className="subtitle">System administration and management</p>
        </div>
        <div className="token-input-container glass-panel">
          <h2>Admin Authentication</h2>
          <p>Enter your admin Bearer token to access admin features</p>
          <input
            type="password"
            placeholder="Bearer token..."
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          <button className="btn-primary" onClick={() => setShowTokenInput(false)}>Access Dashboard</button>
        </div>
      </div>
    )
  }

  if (loading) return <div className="page-loading">Loading admin data...</div>

  return (
    <div className="page admin">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">System administration and management</p>
        <button className="btn-secondary btn-small" onClick={() => setToken('')}>Logout</button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        <button
          className={`tab ${activeTab === 'playgrounds' ? 'active' : ''}`}
          onClick={() => setActiveTab('playgrounds')}
        >
          Playgrounds
        </button>
        <button
          className={`tab ${activeTab === 'owners' ? 'active' : ''}`}
          onClick={() => setActiveTab('owners')}
        >
          Owners
        </button>
      </div>

      {activeTab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon">🤖</div>
            <div className="stat-value">{stats.totalDimes}</div>
            <div className="stat-label">Total Dimes</div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{stats.avgActivity}%</div>
            <div className="stat-label">Avg Activity</div>
          </div>
        </div>
      )}

      {activeTab === 'playgrounds' && (
        <div className="glass-panel">
          <div className="panel-header">
            <h2>Playgrounds</h2>
            <button className="btn-primary" onClick={createPlayground}>+ New Playground</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Max Agents</th>
                </tr>
              </thead>
              <tbody>
                {playgrounds.map(pg => (
                  <tr key={pg.id}>
                    <td>{pg.name}</td>
                    <td><span className="badge">{pg.type}</span></td>
                    <td>{pg.maxAgents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'owners' && (
        <div className="glass-panel">
          <div className="panel-header">
            <h2>Owner Management</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {owners.map(owner => (
                  <tr key={owner.id}>
                    <td>{owner.email}</td>
                    <td>
                      <span className={`badge ${owner.status}`}>{owner.status}</span>
                    </td>
                    <td>
                      {owner.status === 'active' ? (
                        <button className="btn-danger btn-small" onClick={() => suspendOwner(owner.id)}>Suspend</button>
                      ) : (
                        <button className="btn-success btn-small" onClick={() => activateOwner(owner.id)}>Activate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
