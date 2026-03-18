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

// Connect to backend
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [socket, setSocket] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const [dime, setDime] = useState<Dime | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'login' | 'chat'>('login')

  // Connect socket on mount
  useEffect(() => {
    const newSocket = io(SOCKET_URL)
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
      const res = await fetch(`${SOCKET_URL}/api/agents/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: userId, name: `${userId}_dime` })
      })
      const data = await res.json()
      
      if (data.success) {
        setDime(data.data)
        socket?.auth(userId)
        socket?.join_dime(data.data.id)
        setView('chat')
      } else if (data.data) {
        // Already exists, get it
        const getRes = await fetch(`${SOCKET_URL}/api/agents/owner/${userId}`)
        const getData = await getRes.json()
        setDime(getData)
        socket?.auth(userId)
        socket?.join_dime(getData.id)
        setView('chat')
      }
    } catch (err) {
      console.error(err)
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
      const res = await fetch(`${SOCKET_URL}/api/agents/${dime.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
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
    } catch (err) {
      console.error(err)
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
