# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dime_base** ("Digital Me Base Station") is a platform for creating and managing digital human agents (dimes). These are AI agents that represent real people, with persistent identity, personality, memory, and decision-making capabilities.

**Tech Stack:**
- Backend: Node.js + Express + TypeScript + Socket.io
- Frontend: React + Vite + TypeScript
- Database: SQLite (sql.js in MVP, PostgreSQL for production)
- Frameworks: OpenClaw (multi-agent gateway), ZeroClaw (Rust)
- AI: DeepSeek API for LLM integration

## Development Commands

### Backend

```bash
cd backend

# Development (with hot reload)
npm run dev

# Build
npm run build

# Start production
npm start

# Tests
npm test
```

### Frontend

```bash
cd frontend

# Development (Vite dev server)
npm run dev

# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

### Database

The backend creates and manage a SQLite database at `backend/data/dime_base.db` automatically. Database initialization happens on first server startup in `src/database.ts`.

## Architecture

### Backend Structure (`backend/src/`)

- **`index.ts`** - Express app entry point, route mounting, WebSocket initialization
- **`database.ts`** - SQLite initialization, schema creation, persistence helpers. Uses sql.js (pure JS SQLite)
- **`websocket.ts`** - Socket.io setup for real-time communication (user auth, dime room joins, dime-to-dime messaging)
- **`agents/`** - Core agent logic:
  - `dime.ts` - Agent type definitions (Personality, DecisionBoundary, Memory structures) and agent CRUD
  - `llm.ts` - LLM integration (DeepSeek API calls for reasoning/decisions)
  - `service.ts` - Higher-level agent coordination
- **`api/`** - REST endpoints:
  - `agents.ts` - Create/fetch/chat with agents
  - `world.ts` - Playground creation/entry, world state management
  - `economy.ts` - vCoin balance, transactions
- **`economy/`** - Economy logic (vCoin earning/spending)
- **`world/`** - World/playground state and agent location tracking

### Key Types & Interfaces

**Dime** (Agent):
- `id`, `ownerId`, `name`, `status` (active|paused|idle)
- `personality`: DimePersonality (communication style, detail level, decision style, risk tolerance, etc.)
- `decisionBoundary`: DimeDecisionBoundary (max purchase amount, group/share preferences, escalation rules)
- `memory`: DimeMemory (shortTerm: conversations/recent events/tasks; longTerm: long-term facts/experiences)

**WebSocket Events:**
- `auth` - Authenticate user
- `join_dime` - User joins a dime's room
- `message_to_dime` - Send message to dime
- `dime_to_dime` - Agent-to-agent communication
- `get_online_dimes` - Query connected agents
- `typing` - Typing indicator

### Database Schema

Tables created on init:
- `dimes` - Agent records (id, owner_id, name, personality JSON, decision_boundary JSON, memory JSON, status, timestamps)
- `playgrounds` - Virtual worlds (id, name, description, type, max_agents)
- `agent_locations` - Agent positions in playgrounds (dime_id, playground_id, x, y)
- `accounts` - User vCoin accounts (user_id, balance, tier)
- `transactions` - vCoin transaction history (id, user_id, type, amount, description, timestamp)

### Frontend Structure (`frontend/src/`)

- **`App.tsx`** - Main React app shell
- **`components/`** - Reusable React components
- **`pages/`** - Page components
- **`hooks/`** - Custom React hooks
- **`services/`** - API client, Socket.io client integration

## Environment Setup

Create `backend/.env`:

```bash
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_MODEL=deepseek-chat
PORT=3000
NODE_ENV=development
```

## Common Workflows

### Adding a New Agent Endpoint

1. Define request/response types in `agents/dime.ts`
2. Add handler in `api/agents.ts`
3. Import and mount route in `index.ts` (already done for existing routes)

### Modifying Agent Personality or Memory

- Personality schema: `agents/dime.ts` → `DimePersonality` interface
- Memory schema: `agents/dime.ts` → `DimeMemory` interface
- Database migration: Update `CREATE TABLE` in `database.ts`, handle schema versioning if needed

### Real-time Features

Use Socket.io via `websocket.ts`. The server maintains connected user map and dime-room associations. Import utilities like `notifyUser()` and `broadcastDimeEvent()`.

### Database Queries

All database access via `getDb()` from `database.ts`. Use `.run()` for inserts/updates, `.exec()` for reads. Call `saveDatabase()` after writes to persist to disk.

## Known Implementation Details

- **sql.js + SQLite**: In-memory DB persisted to disk. Works with Node.js but requires specific import handling (see `database.ts` for sql.js.d.ts workaround).
- **Agent memory**: Currently stored as JSON strings in DB. Not yet encrypted (future: implement encryption layer in memory handling).
- **Default playground**: "Main Plaza" created automatically on first DB init.
- **WebSocket namespacing**: Uses `user:{userId}` and `dime:{dimeId}` rooms for targeted messaging.

## Related Files

- `README.md` - User-facing overview and API endpoint list
- `QUICKSTART.md` - Quick start guide (Chinese version also available)
- `PROTOTYPE.md` - MVP feature roadmap
- `REQUIREMENTS.md` - Full requirements and feature specs
- `docker-compose.yml` - Docker setup for local development
