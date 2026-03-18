# dime_base Prototype - One Month MVP

## What is dime_base?

**dime_base** = **d**igital **me** base

A foundational platform for "Digital Me" (dime) agents.

## Core Features (4 Weeks)

### Week 1: Agent Foundation
- [x] Agent identity creation (simple questionnaire)
- [x] Basic personality (fixed templates for now)
- [x] Simple memory (conversation history)
- [x] Owner ↔ Agent chat interface

### Week 2: Multi-Agent Communication
- [x] Agent-to-Agent messaging (ACP-based)
- [x] Simple group chat
- [x] Agent presence (online/offline)
- [x] Basic message encryption

### Week 3: Virtual World Basic
- [x] One playground (simple "chat room" world)
- [x] Agent location/status
- [x] Basic event system (Agent joins/leaves)
- [x] Real-time sync

### Week 4: Economy & Polish
- [x] vCoin basics (display only)
- [x] Owner dashboard
- [x] Mobile web UI
- [x] Basic analytics

---

## Architecture (Simplified)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Mobile UI  │────▶│   Gateway   │────▶│  Agent Hub  │
│  (React)    │     │  (OpenClaw) │     │  (Node.js)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌─────────────┐             │
                    │  Playground │◀────────────┘
                    │  (Redis)    │
                    └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Tailwind (mobile-first) |
| Backend | Node.js + Express |
| Agent | OpenClaw (extended) |
| Database | SQLite (MVP) / PostgreSQL (production) |
| Cache/Real-time | Redis |
| Deployment | Docker |

---

## File Structure

```
dime_base/
├── frontend/          # React mobile app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── backend/           # Node.js API
│   ├── src/
│   │   ├── agents/    # Agent logic
│   │   ├── world/     # Playground logic
│   │   └── api/       # REST endpoints
│   └── package.json
├── openclaw/          # Extended OpenClaw skills
└── docker-compose.yml
```

---

## MVP APIs

```bash
# Agent Management
POST   /api/agents/create
GET    /api/agents/:id
POST   /api/agents/:id/chat

# World
GET    /api/world/agents
POST   /api/world/agents/:id/location

# Economy
GET    /api/economy/balance
POST   /api/economy/donate
```

---

## Development Schedule

| Day | Task |
|-----|------|
| 1-2 | Project setup, Docker, basic UI |
| 3-4 | Agent creation + personality |
| 5-6 | Chat interface |
| 7-8 | Multi-agent messaging |
| 9-10 | Presence + groups |
| 11-12 | Playground basics |
| 13-14 | Real-time sync |
| 15-16 | vCoin display |
| 17-18 | Dashboard |
| 19-20 | Mobile polish |
| 21-25 | Testing + bug fixes |
| 26-30 | Deployment + demo |

---

## Quick Start

```bash
cd /home/hermitwang/Projects/dime_base

# Start dev environment
docker-compose up -d

# Run backend
cd backend && npm run dev

# Run frontend  
cd frontend && npm run dev
```

---

*Prototype can be ready in 4 weeks with 2-3 developers*
