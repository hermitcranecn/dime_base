import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import './App.css'

// Types
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

// Backend URL - use env var or construct from current origin + port 3000
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://localhost:3000`
const API_BASE = '/api'

function App() {
  const [socket, setSocket] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const [dime, setDime] = useState<Dime | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'login' | 'chat'>('login')
  const [error, setError] = useState('')

  // Connect socket on mount - use backend URL directly
  useEffect(() => {
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

  // Create or get dime
  const createDime = async () => {
    if (!userId.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/agents/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: userId, name: `${userId}_dime` })
      })
      const data = await res.json()

      if (data.success) {
        setDime(data.data)
        socket?.emit('auth', userId)
        socket?.emit('join_dime', data.data.id)
        setView('chat')
      } else if (data.data && data.data.id) {
        // Create failed but data contains the existing dime
        setDime(data.data)
        socket?.emit('auth', userId)
        socket?.emit('join_dime', data.data.id)
        setView('chat')
      } else {
        setError(data.error || 'Failed to create dime')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to connect to backend')
    }
    setLoading(false)
  }

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !dime) return

    const msg = input
    setInput('')

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      from: 'You',
      content: msg,
      timestamp: new Date().toISOString()
    }])

    try {
      const res = await fetch(`${API_BASE}/agents/${dime.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      console.error(err)
      setError('Failed to send message')
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>💰 dime_base</h1>
        <p>Digital Human Base Station</p>
      </header>

      {view === 'login' ? (
        <div className="login">
          {error && <div className="error">{error}</div>}
          <input
            type="text"
            placeholder="Enter your user ID"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createDime()}
          />
          <button onClick={createDime} disabled={loading}>
            {loading ? 'Loading...' : 'Start'}
          </button>
        </div>
      ) : (
        <div className="chat">
          <div className="dime-info">
            <span className="status-dot"></span>
            <strong>{dime?.name}</strong>
            <span className="status">{dime?.status}</span>
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
        </div>
      )}
    </div>
  )
}

export default App
