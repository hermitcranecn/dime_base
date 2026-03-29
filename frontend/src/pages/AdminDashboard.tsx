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

interface AdminInfo {
  id: string
  ownerId: string
  role: 'super_admin' | 'admin'
  email: string
}

type TabType = 'stats' | 'playgrounds' | 'owners' | 'admins'

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [admins, setAdmins] = useState<AdminInfo[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('stats')
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')
  const [showTokenInput, setShowTokenInput] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // Initialization state
  const [needsInit, setNeedsInit] = useState(false)
  const [initEmail, setInitEmail] = useState('')
  const [initPassword, setInitPassword] = useState('')
  const [initLoading, setInitLoading] = useState(false)
  const [initError, setInitError] = useState('')
  const [rootToken, setRootToken] = useState('')
  const [showRootToken, setShowRootToken] = useState(false)

  useEffect(() => {
    // Check if initialization is needed (no admins exist)
    checkInitNeeded()
  }, [])

  useEffect(() => {
    if (token && !needsInit) {
      fetchData()
    }
  }, [token, needsInit])

  const checkInitNeeded = async () => {
    try {
      // Check if any admins exist
      const res = await fetch(`${API_BASE}/auth/check-admins`)
      const data = await res.json()

      if (data.adminsExist) {
        // Admins exist, show login
        setNeedsInit(false)
      } else {
        // No admins, needs initialization
        setNeedsInit(true)
      }
    } catch (err) {
      // If error, assume init is needed
      setNeedsInit(true)
    } finally {
      setLoading(false)
    }
  }

  const handleInitRoot = async (e: React.FormEvent) => {
    e.preventDefault()
    setInitError('')
    setInitLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/init-root`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: initEmail, password: initPassword })
      })

      const data = await res.json()

      if (data.success) {
        setRootToken(data.rootToken)
        setShowRootToken(true)
        // After showing token, user should login with their credentials
      } else {
        setInitError(data.error || 'Initialization failed')
      }
    } catch (err) {
      setInitError('Network error. Please try again.')
    } finally {
      setInitLoading(false)
    }
  }

  const handleTokenSubmit = () => {
    if (token.length > 0) {
      setShowTokenInput(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setShowTokenInput(true)
    setShowRootToken(false)
    setRootToken('')
  }

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchPlaygrounds(), fetchOwners(), fetchAdmins()])
    await checkAdminStatus()
    setLoading(false)
  }

  const checkAdminStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/check`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setIsSuperAdmin(data.isSuperAdmin)
      }
    } catch (err) {
      console.error('Failed to check admin status:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setStats(data.stats)
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
      if (data.success) setPlaygrounds(data.playgrounds || [])
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
      if (data.success) setOwners(data.owners || [])
    } catch (err) {
      console.error('Failed to fetch owners:', err)
    }
  }

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setAdmins(data.admins || [])
    } catch (err) {
      console.error('Failed to fetch admins:', err)
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
        setPlaygrounds(prev => [...prev, data.playground])
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

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return

    try {
      const res = await fetch(`${API_BASE}/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setAdmins(prev => prev.filter(a => a.id !== adminId))
      } else {
        alert(data.error || 'Failed to delete admin')
      }
    } catch (err) {
      console.error('Failed to delete admin:', err)
    }
  }

  // ============== INITIALIZATION SCREEN ==============
  if (needsInit) {
    if (showRootToken) {
      return (
        <div className="page admin">
          <div className="page-header">
            <h1>Root Admin Created</h1>
          </div>
          <div className="glass-panel init-success">
            <div className="warning-banner">
              <h3>IMPORTANT: Save Your Root Token</h3>
              <p>This token will never be shown again. Store it securely.</p>
            </div>
            <div className="token-display">
              <code>{rootToken}</code>
            </div>
            <div className="init-success-actions">
              <button className="btn-primary" onClick={() => {
                navigator.clipboard.writeText(rootToken)
                alert('Token copied to clipboard!')
              }}>
                Copy to Clipboard
              </button>
              <button className="btn-secondary" onClick={handleLogout}>
                Continue to Login
              </button>
            </div>
            <p className="token-warning">
              You will need this token to access the admin dashboard until you
              create additional admin accounts.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="page admin">
        <div className="page-header">
          <h1>Initialize System</h1>
          <p className="subtitle">Set up the first super admin account</p>
        </div>
        <div className="glass-panel init-form">
          <h2>Create Root Admin</h2>
          <p>Enter your email and password to create the first super admin.</p>
          <p className="warning-text">This is a one-time setup. The root token will only be shown once.</p>

          <form onSubmit={handleInitRoot}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={initEmail}
                onChange={e => setInitEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={initPassword}
                onChange={e => setInitPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            {initError && <div className="error-message">{initError}</div>}

            <button type="submit" className="btn-primary" disabled={initLoading}>
              {initLoading ? 'Initializing...' : 'Initialize Root Admin'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ============== TOKEN INPUT SCREEN ==============
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
            onKeyDown={e => e.key === 'Enter' && handleTokenSubmit()}
          />
          <button className="btn-primary" onClick={handleTokenSubmit}>Access Dashboard</button>
        </div>
      </div>
    )
  }

  // ============== LOADING ==============
  if (loading) return <div className="page-loading">Loading admin data...</div>

  // ============== ADMIN DASHBOARD ==============
  return (
    <div className="page admin">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">System administration and management</p>
        <button className="btn-secondary btn-small" onClick={handleLogout}>Logout</button>
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
        {isSuperAdmin && (
          <button
            className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Admins
          </button>
        )}
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

      {activeTab === 'admins' && isSuperAdmin && (
        <div className="glass-panel">
          <div className="panel-header">
            <h2>Admin Management</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id}>
                    <td>{admin.email}</td>
                    <td><span className={`badge ${admin.role}`}>{admin.role}</span></td>
                    <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-danger btn-small" onClick={() => deleteAdmin(admin.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="help-text">
            Only super admins can manage other admins. You cannot delete yourself.
          </p>
        </div>
      )}
    </div>
  )
}
