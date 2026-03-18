# dime_base - Digital Human Base Station

**dime_base** = **d**igital **h**uman **base** = 数字人类基站

The base station for all digital humans (dimes).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust (for ZeroClaw)
- Docker & Docker Compose

### Installation

```bash
# Clone and setup
cd dime_base

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Running

```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

Or with Docker:
```bash
docker-compose up -d
```

---

## 📁 Project Structure

```
dime_base/
├── openclaw/                    # OpenClaw Framework
│   └── extensions/dime/         # dime extension
│
├── zeroclaw/                   # ZeroClaw (Rust)
│
├── backend/                     # Node.js Backend
│   ├── src/
│   │   ├── agents/
│   │   │   ├── dime.ts        # Agent core
│   │   │   ├── llm.ts         # LLM integration
│   │   │   └── service.ts     # Agent service
│   │   ├── api/
│   │   │   ├── agents.ts      # Agent routes
│   │   │   ├── world.ts       # World routes
│   │   │   └── economy.ts     # Economy routes
│   │   ├── websocket.ts       # WebSocket handler
│   │   └── index.ts           # Entry point
│   └── package.json
│
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── App.tsx            # Main app
│   │   └── ...
│   └── package.json
│
├── REQUIREMENTS.md             # Full requirements
├── PROTOTYPE.md               # Prototype plan
├── QUICKSTART.md              # Quick start guide
└── docker-compose.yml         # Docker setup
```

---

## 🛠️ API Endpoints

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/create` | Create dime |
| GET | `/api/agents/:id` | Get dime |
| GET | `/api/agents/owner/:ownerId` | Get by owner |
| POST | `/api/agents/:id/chat` | Chat with dime |
| POST | `/api/agents/:id/decide` | Request decision |
| POST | `/api/agents/:id/status` | Update status |

### World

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/world/` | List playgrounds |
| POST | `/api/world/` | Create playground |
| POST | `/api/world/:id/enter` | Enter world |

### Economy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/economy/balance` | Get balance |
| POST | `/api/economy/earn` | Earn vCoins |
| POST | `/api/economy/donate` | Donate |

---

## 💰 Features

- **Digital Humans (Dimes)**: AI agents representing real humans
- **Personality System**: Customizable communication & decision styles
- **Memory**: Short-term + long-term memory with encryption
- **Multi-Agent**: Communication between dimes
- **Virtual World**: Playgrounds for interaction
- **Economy**: vCoin virtual currency system
- **Real-time**: WebSocket support

---

## 🔧 Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, Vite |
| Realtime | Socket.io |
| Database | SQLite (MVP) / PostgreSQL |
| Cache | Redis |
| AI | DeepSeek / OpenAI |
| Frameworks | OpenClaw, ZeroClaw |

---

## 📝 Environment Variables

Create `backend/.env`:

```bash
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_MODEL=deepseek-chat
PORT=3000
NODE_ENV=development
```

---

*💰 dime_base = Digital Human Base Station*
