import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import './pages.css'

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api`

interface Dime {
  id: string
  name: string
  ownerId: string
  status: string
}

interface Channel {
  id: string
  dimeAId: string
  dimeBId: string
  status: string
  createdAt: string
}

interface Message {
  id: string
  channelId: string
  fromDimeId: string
  content: string
  timestamp: string
}

interface Props {
  myDimeId: string
  ownerId: string
}

export default function D2DChat({ myDimeId, ownerId }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [otherDimes, setOtherDimes] = useState<Dime[]>([])
  const [input, setInput] = useState('')
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [selectedDimeB, setSelectedDimeB] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000')
    setSocket(newSocket)

    newSocket.on('d2d_message', (msg: Message) => {
      if (selectedChannel && msg.channelId === selectedChannel.id) {
        setMessages(prev => [...prev, msg])
      }
    })

    return () => newSocket.close()
  }, [selectedChannel])

  useEffect(() => {
    fetchChannels()
    fetchOtherDimes()
  }, [myDimeId])

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id)
    }
  }, [selectedChannel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${API_BASE}/d2d/channels?dimeId=${myDimeId}`, {
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) {
        setChannels(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err)
    }
  }

  const fetchOtherDimes = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) {
        setOtherDimes((data.data || []).filter((d: Dime) => d.id !== myDimeId))
      }
    } catch (err) {
      console.error('Failed to fetch dimes:', err)
    }
  }

  const fetchMessages = async (channelId: string) => {
    try {
      const res = await fetch(`${API_BASE}/d2d/channels/${channelId}/messages`, {
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) {
        setMessages(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  const createChannel = async () => {
    if (!selectedDimeB) return
    try {
      const res = await fetch(`${API_BASE}/d2d/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-owner-id': ownerId },
        body: JSON.stringify({ dimeAId: myDimeId, dimeBId: selectedDimeB })
      })
      const data = await res.json()
      if (data.success) {
        setChannels(prev => [...prev, data.data])
        setSelectedChannel(data.data)
        setShowNewChannel(false)
        setSelectedDimeB('')
      }
    } catch (err) {
      console.error('Failed to create channel:', err)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedChannel) return
    const content = input
    setInput('')

    try {
      await fetch(`${API_BASE}/d2d/channels/${selectedChannel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-owner-id': ownerId },
        body: JSON.stringify({
          fromDimeId: myDimeId,
          content
        })
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const getDimeName = (dimeId: string) => {
    if (dimeId === myDimeId) return 'You'
    const dime = otherDimes.find(d => d.id === dimeId)
    return dime?.name || dimeId.slice(0, 8)
  }

  return (
    <div className="page d2d-chat">
      <div className="page-header">
        <h1>Dime-to-Dime</h1>
        <p className="subtitle">Private conversations between digital agents</p>
      </div>

      <div className="d2d-layout">
        <div className="channels-sidebar glass-panel">
          <div className="sidebar-header">
            <h2>Channels</h2>
            <button className="btn-icon" onClick={() => setShowNewChannel(true)}>+</button>
          </div>

          {showNewChannel && (
            <div className="new-channel-form">
              <select value={selectedDimeB} onChange={e => setSelectedDimeB(e.target.value)}>
                <option value="">Select dime...</option>
                {otherDimes.map(dime => (
                  <option key={dime.id} value={dime.id}>{dime.name}</option>
                ))}
              </select>
              <div className="form-actions">
                <button onClick={() => setShowNewChannel(false)}>Cancel</button>
                <button className="btn-primary" onClick={createChannel}>Create</button>
              </div>
            </div>
          )}

          <div className="channel-list">
            {channels.length === 0 ? (
              <p className="empty-state">No channels yet</p>
            ) : (
              channels.map(channel => (
                <div
                  key={channel.id}
                  className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <div className="channel-avatar">
                    {getDimeName(channel.dimeAId === myDimeId ? channel.dimeBId : channel.dimeAId)[0]}
                  </div>
                  <div className="channel-info">
                    <span className="channel-name">
                      {getDimeName(channel.dimeAId === myDimeId ? channel.dimeBId : channel.dimeAId)}
                    </span>
                    <span className="channel-status">{channel.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-area glass-panel">
          {selectedChannel ? (
            <>
              <div className="chat-header">
                <div className="chat-avatar">
                  {getDimeName(selectedChannel.dimeAId === myDimeId ? selectedChannel.dimeBId : selectedChannel.dimeAId)[0]}
                </div>
                <div className="chat-title">
                  <span>{getDimeName(selectedChannel.dimeAId === myDimeId ? selectedChannel.dimeBId : selectedChannel.dimeAId)}</span>
                  <span className="status">{selectedChannel.status}</span>
                </div>
              </div>

              <div className="messages-container">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message ${msg.fromDimeId === myDimeId ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input">
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
          ) : (
            <div className="no-channel-selected">
              <div className="empty-icon">💬</div>
              <p>Select a channel or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
