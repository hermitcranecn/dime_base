import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import './App.css'

// Types
interface Owner {
  id: string
  email: string
  createdAt: string
  lastLogin?: string
}

interface Dime {
  id: string
  name: string
  ownerId: string
  status: 'active' | 'paused' | 'idle'
  personality: any
  lastActive: string
}

interface Message {
  id: string
  from: string
  content: string
  timestamp: string
}

interface AuthState {
  token: string | null
  owner: Owner | null
}

// Backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://194.146.13.133:3000`
const API_BASE = `${BACKEND_URL}/api`

function App() {
  const [socket, setSocket] = useState<any>(null)
  const [auth, setAuth] = useState<AuthState>({ token: null, owner: null })
  const [dime, setDime] = useState<Dime | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'auth' | 'register' | 'chat'>('auth')
  const [error, setError] = useState('')

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Load stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedOwner = localStorage.getItem('auth_owner')
    if (storedToken && storedOwner) {
      try {
        const owner = JSON.parse(storedOwner)
        setAuth({ token: storedToken, owner })
        setView('chat')
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_owner')
      }
    }

    // Connect socket
    const newSocket = io(BACKEND_URL)
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to dime_base')
    })

    newSocket.on('dime_message', (msg: Message) => {
      setMessages(prev => [...prev, msg])
    })

    return () => {
      newSocket.close()
    }
  }, [])

  // API helper with auth
  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const headers: any = { 'Content-Type': 'application/json', ...options.headers }
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`
    }
    return fetch(`${API_BASE}${path}`, { ...options, headers })
  }

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_owner', JSON.stringify(data.owner))
        setAuth({ token: data.token, owner: data.owner })
        setView('chat')
        // Connect socket with owner auth
        socket?.emit('auth', data.owner.id)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Failed to connect to server')
    }
    setLoading(false)
  }

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_owner', JSON.stringify(data.owner))
        setAuth({ token: data.token, owner: data.owner })
        setView('chat')
        // Connect socket with owner auth
        socket?.emit('auth', data.owner.id)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Failed to connect to server')
    }
    setLoading(false)
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_owner')
    setAuth({ token: null, owner: null })
    setDime(null)
    setMessages([])
    setView('auth')
  }

  // Create or get dime
  const createDime = async () => {
    if (!auth.owner) return

    setLoading(true)
    try {
      const res = await apiFetch('/agents/create', {
        method: 'POST',
        body: JSON.stringify({ ownerId: auth.owner.id, name: `${auth.owner.email.split('@')[0]}_dime` })
      })
      const data = await res.json()

      if (data.success) {
        setDime(data.data)
        socket?.emit('join_dime', data.data.id)
      } else if (data.data && data.data.id) {
        setDime(data.data)
        socket?.emit('join_dime', data.data.id)
      } else {
        setError(data.error || 'Failed to create dime')
      }
    } catch (err) {
      setError('Failed to connect to backend')
    }
    setLoading(false)
  }

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !dime) return

    const msg = input
    setInput('')

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      from: 'You',
      content: msg,
      timestamp: new Date().toISOString()
    }])

    try {
      const res = await apiFetch(`/agents/${dime.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ ownerId: dime.ownerId, message: msg })
      })
      const data = await res.json()

      if (data.response) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          from: dime.name,
          content: data.response,
          timestamp: new Date().toISOString()
        }])
      }
      if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to send message')
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>💰 dime_base</h1>
        <p>Digital Human Base Station</p>
        {auth.owner && (
          <div className="user-info">
            <span>{auth.owner.email}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        )}
      </header>

      {view === 'auth' && (
        <div className="auth-container">
          <div className="auth-tabs">
            <button 
              className={view === 'auth' ? 'active' : ''} 
              onClick={() => setView('auth')}
            >
              Login
            </button>
            <button 
              className={view === 'register' ? 'active' : ''} 
              onClick={() => setView('register')}
            >
              Register
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>
      )}

      {view === 'register' && (
        <div className="auth-container">
          <div className="auth-tabs">
            <button 
              className={view === 'auth' ? 'active' : ''} 
              onClick={() => setView('auth')}
            >
              Login
            </button>
            <button 
              className={view === 'register' ? 'active' : ''} 
              onClick={() => setView('register')}
            >
              Register
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      {view === 'chat' && (
        <div className="chat">
          {!dime ? (
            <div className="no-dime">
              <p>Create your Digital Me agent</p>
              <button onClick={createDime} disabled={loading}>
                {loading ? 'Creating...' : 'Create Dime'}
              </button>
            </div>
          ) : (
            <>
              <div className="dime-info">
                <span className="status-dot"></span>
                <strong>{dime.name}</strong>
                <span className="status">{dime.status}</span>
              </div>
              
              <div className="messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`message ${msg.from === 'You' ? 'sent' : 'received'}`}>
                    <strong>{msg.from}</strong>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>

              <div className="input-area">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App
