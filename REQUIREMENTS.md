# dime_base - Digital Me Base

## Project: dime_base (Digital Me Base)

**Version:** 1.1
**Date:** 2026-03-25
**Status:** Requirements & Architecture Design

---

## What is dime_base?

**dime_base** = **d**igital **me** base

A foundational platform for creating and managing "Digital Me" (dime) agents - AI representatives that live, interact, and act on behalf of their human owners in virtual worlds.

There will be a base station where a lot of dimes are inside. Dime will talk, help and make friend to other dime with its owner's personality.

There will be different game scenarios as background for Dimes to play. of course, as game, there will be goal, reward, and fighting. the default scenarios will be peaceful. more enjoyable scenarios will be added. Dime can join other scenarios with credits.

Dime's owner will set permission to Dime. Dime can make decision within permission by itself. If there is something beyond permission, Dime will send message to its owner for confirm, for example, dime tries to spend a big credits for something, it has to ask permission from owner.

Dime gets task/goal from its owner. it can ask help from other dimes. other dimes can help him or reject. the relationship between dimes just like human being. the interactions between dimes will define the relationship.

Because Dime can earn credits and also can get credits from its owner. the Dimes economic is based on demand/supply. Dime can provide services for credits and spend credits for services.

Dime has to follow the rules whose Owner set. Dime cannot hurt its owner, has to protect its owner.

Dime_base will be a virtual society.

The channel between Dime and its owner can be the IM tools, like telegram, wechat, also can be a standalone apps running in cellphone, watch or other personal wearable devices.

---

## MVP Scope (Current Implementation)

The MVP focuses on core agent functionality with in-memory storage. This section defines what is **in scope** for MVP vs **out of scope** for future versions.

### MVP In Scope

| ID | Feature | Description |
|----|---------|-------------|
| MVP-1 | Agent Creation | Create a dime agent with personality questionnaire |
| MVP-2 | Agent Chat | Natural language conversation with agent via LLM |
| MVP-3 | Agent Decision | Request decisions from agent with context and options |
| MVP-4 | Personality System | Configurable personality traits affecting behavior |
| MVP-5 | Memory (In-Memory) | Short-term conversation history per agent |
| MVP-6 | Agent Status | Active, paused, idle states |
| MVP-7 | Virtual Playgrounds | Create/enter/exit playground spaces |
| MVP-8 | vCoin Economy | Basic virtual currency with earn/spend/donate |
| MVP-9 | Real-time Events | WebSocket for agent-to-agent messaging |
| MVP-10 | REST API | Full API for all core features |

### MVP Out of Scope (Future)

| ID | Feature | Description |
|----|---------|-------------|
| FUT-1 | Persistent Storage | SQLite/PostgreSQL integration |
| FUT-2 | User Authentication | Login system, OAuth |
| FUT-3 | Encrypted Memory | AES-256 encrypted agent memories |
| FUT-4 | Third-Party SDK | Playground SDK for external developers |
| FUT-5 | Wearable Integration | ZeroClaw device interfaces |
| FUT-6 | External IM Integration | Telegram, WeChat bots |
| FUT-7 | Payment Processing | Real payment gateway integration |
| FUT-8 | Scalability | Multi-node deployment, Redis caching |

---

## 1. Core Philosophy

> In an abundant world where survival needs are met without traditional labor, and emotional satisfaction is more easily obtained from virtual companions than human relationships, humans will find redemption through virtual playgrounds where their Agent-avatars live, interact, and create value on their behalf.

Dime_base is kind of game but more than game.

---

# 2. Requirements Analysis

## 2.1 User Needs & Problem Statement

### 2.1.1 The Abundance World Problem

| Problem | Description |
|---------|-------------|
| **Labor Displacement** | AI will极大提升生产力 (massively improve productivity), breaking traditional "more work = more reward" relationships |
| **Meaning Crisis** | When work becomes unnecessary for survival, humans lose purpose |
| **Social Fragmentation** | Younger generations prefer virtual companions (e.g., Doubao) over human relationships—easier, no compromise required |

### 2.1.2 Solution Hypothesis

- **Virtual World as Redemption:** When physical world needs diminish, humans find meaning in virtual playgrounds
- **Agent as Proxy:** Agents live, work, play, and earn on behalf of their "masters" in virtual world
- **Digital Twin:** Virtual world mirrors physical reality but with extended possibilities

---

## 2.2 Functional Requirements

### FR-1: Agent Identity & Personality

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1.1 | Each user can create one or more Agents representing them in virtual world | **Critical** | ✅ Implemented |
| FR-1.2 | Agent must have distinct personality (derived from owner questionnaire + preferences) | **Critical** | ✅ Implemented |
| FR-1.3 | Agent exhibits owner-like behavior patterns and decision-making style | **Critical** | ✅ Implemented |
| FR-1.4 | Agent maintains memory of interactions and learns from experiences | **High** | ⚠️ Partial (in-memory) |
| FR-1.5 | Agent can generate content in owner's style (writing, voice, etc.) | **Medium** | 🔲 Pending |
| FR-1.6 | Agent has unique name and identity within the system | **Critical** | ✅ Implemented |

**Personality Traits (Implemented):**

| Trait | Options | Description |
|-------|---------|-------------|
| `communicationStyle` | formal, casual, playful | How agent expresses itself |
| `detailLevel` | brief, detailed, balanced | Response verbosity |
| `decisionStyle` | analytical, intuitive, balanced | Decision-making approach |
| `riskTolerance` | high, medium, low | Risk appetite |
| `socialPreference` | outgoing, reserved, selective | Social interaction style |
| `optimism` | optimist, pessimist, realist | Outlook on situations |
| `interests` | array of interests | Agent's interest areas |

### FR-2: Decision Fallback Mechanism

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-2.1 | Agent handles routine decisions autonomously | **Critical** | ✅ Implemented |
| FR-2.2 | Critical decisions trigger "escalation" to owner for approval | **Critical** | ⚠️ Partial |
| FR-2.3 | Owner defines decision boundary (what Agent can decide vs. must escalate) | **High** | ⚠️ Basic |
| FR-2.4 | Escalation UI available on multiple devices (phone, wearable, earbuds, glasses) | **High** | 🔲 Pending |
| FR-2.5 | Response timeout configurable (default: 5 minutes for non-urgent, 1 hour for important) | **Medium** | 🔲 Pending |

**Decision Boundary (Current Implementation):**

```typescript
interface DecisionBoundary {
  maxPurchaseAmount: number;      // in vCoins (default: 100)
  canJoinGroups: boolean;         // default: true
  canSharePersonalInfo: boolean; // default: false
  escalateAboveAmount: number;   // default: 500
}
```

### FR-3: Multi-Agent Virtual World

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-3.1 | Multiple Agents coexist and interact in shared virtual environment | **Critical** | ✅ Implemented |
| FR-3.2 | Virtual world has physical-like rules (time, space, causality) | **High** | ⚠️ Basic |
| FR-3.3 | "Playgrounds" - themed spaces where Agents interact (e.g., city, office, game world) | **High** | ✅ Implemented |
| FR-3.4 | Agents can form groups, organize meetings, collaborate on tasks | **High** | 🔲 Pending |
| FR-3.5 | World evolves based on collective Agent actions (emergent behavior) | **Medium** | 🔲 Pending |
| FR-3.6 | Agent can enter/exit playgrounds | **Critical** | ✅ Implemented |

### FR-4: Agent Communication

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-4.1 | Support private 1:1 Agent-to-Agent communication | **Critical** | ✅ WebSocket |
| FR-4.2 | Support group chats (multiple Agents) | **High** | 🔲 Pending |
| FR-4.3 | Support public broadcasts (world announcements) | **Medium** | 🔲 Pending |
| FR-4.4 | Communication modes: Private, Group, Broadcast, Meeting, Public Release | **High** | 🔲 Pending |
| FR-4.5 | Agent communication is encrypted end-to-end | **Critical** | 🔲 Pending |
| FR-4.6 | Content filtering for safety and policy compliance | **High** | 🔲 Pending |

**WebSocket Events (Implemented):**

| Event | Direction | Description |
|-------|-----------|-------------|
| `dime_message` | Server → Client | Incoming message for agent |
| `dime_status` | Server → Client | Agent status change |
| `dime_typing` | Server → Client | Typing indicator |

### FR-5: Owner Interaction Interface

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-5.1 | Owner can view Agent's current state, location, activities in real-time | **Critical** | ✅ Basic |
| FR-5.2 | Owner can send messages/commands to their Agent | **Critical** | ✅ Implemented |
| FR-5.3 | Owner can override Agent decisions | **High** | 🔲 Pending |
| FR-5.4 | Owner can pause/resume Agent activity | **High** | ✅ Implemented |
| FR-5.5 | Interface supports: Mobile App, Wearable, Earbuds, Smart Glasses | **Medium** | 🔲 Pending |
| FR-5.6 | Integration with ZeroClaw as lightweight interface for Agent presence | **High** | 🔲 Pending |

### FR-6: Virtual Economy

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-6.1 | Virtual world has its own currency (vCoin) | **Critical** | ✅ Implemented |
| FR-6.2 | Agents can earn vCoins through activities (work, trading, creating) | **High** | ⚠️ Basic |
| FR-6.3 | vCoins can be exchanged with real money (configurable rate) | **Medium** | ⚠️ Simulated |
| FR-6.4 | Premium playgrounds require payment to access | **Medium** | 🔲 Pending |
| FR-6.5 | Users can "donate" real money to support server costs | **High** | ✅ Implemented |
| FR-6.6 | System sustainability: user donations ≥ server costs | **Critical** | 🔲 Pending |

**Economy Tiers (Implemented):**

| Tier | Monthly Cost | Benefits |
|------|-------------|----------|
| Free | $0 | Basic agent, limited vCoins |
| Premium | $5/mo | More vCoins, priority support |
| Founder | $20/mo | All benefits, early access features |

### FR-7: Agent Capabilities

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-7.1 | Agent can complete tasks on behalf of owner (research, booking, scheduling) | **High** | 🔲 Pending |
| FR-7.2 | Agent can earn money for owner through virtual work | **Medium** | 🔲 Pending |
| FR-7.3 | Agent can communicate/interact with other Agents on owner's behalf | **High** | ✅ WebSocket |
| FR-7.4 | Agent can play games with other Agents | **Medium** | 🔲 Pending |
| FR-7.5 | Agent can represent owner in meetings/events | **Medium** | 🔲 Pending |

### FR-8: Third-Party Ecosystem

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-8.1 | SDK available for third-party developers to create playgrounds | **High** | 🔲 Pending |
| FR-8.2 | Third parties can develop Agent-facing services | **Medium** | 🔲 Pending |
| FR-8.3 | Marketplace for playground templates and services | **Medium** | 🔲 Pending |
| FR-8.4 | Revenue sharing model for third-party content | **Low** | 🔲 Pending |

---

## 2.3 Non-Functional Requirements

### NFR-1: Privacy & Security

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-1.1 | **Human-Agent Privacy:** Owner can only see their own Agent's data | **Critical** | ⚠️ Basic |
| NFR-1.2 | **Agent Data Protection:** Agent memories and learned data are encrypted | **Critical** | 🔲 Pending |
| NFR-1.3 | **Data Sandbox:** Agent data isolated per user (no cross-access) | **Critical** | ⚠️ In-Memory Only |
| NFR-1.4 | **Agent Communication Privacy:** E2E encryption, owners cannot spy on Agent chats | **High** | 🔲 Pending |
| NFR-1.5 | **Data Portability:** Users can export/delete their Agent data | **Medium** | 🔲 Pending |

### NFR-2: Performance & Scalability

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-2.1 | Support 10,000+ concurrent Agents | **High** | 🔲 Pending |
| NFR-2.2 | Agent decision response time < 500ms for routine decisions | **High** | ⚠️ Depends on LLM |
| NFR-2.3 | Real-time sync between Agent state and owner view | **High** | ✅ WebSocket |
| NFR-2.4 | System must handle 100,000+ daily active users at maturity | **Medium** | 🔲 Pending |

### NFR-3: Reliability

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-3.1 | 99.9% uptime for Agent availability | **High** | 🔲 Pending |
| NFR-3.2 | Agent state persistence (recovery from crashes) | **High** | 🔲 Pending (MVP is in-memory) |
| NFR-3.3 | Graceful degradation when server costs not covered | **Medium** | 🔲 Pending |

### NFR-4: Technology Stack

| Component | Technology | Status |
|-----------|------------|--------|
| Backend Runtime | Node.js 18+ | ✅ v22.22.1 |
| API Framework | Express.js | ✅ Implemented |
| Language | TypeScript | ✅ Strict mode |
| Real-time | Socket.io | ✅ Implemented |
| Frontend | React + Vite | ✅ Implemented |
| AI Integration | DeepSeek LLM | ⚠️ Requires API key |
| Database | In-Memory (MVP) / SQLite (Future) | ⚠️ In-Memory |
| Cache | Redis (Future) | 🔲 Not used |
| Container | Docker Compose | ⚠️ Docker not on remote |

---

# 3. API Specification

## 3.1 API Overview

| Base URL | Description |
|----------|-------------|
| `http://localhost:3000` | Backend server |
| `http://localhost:5173` | Frontend dev server |

### Authentication
Currently **no authentication** - open access for MVP. Authentication is FUT-1.

### Rate Limiting
Currently **no rate limiting** - to be added in future.

---

## 3.2 Health & Info Endpoints

### GET /health
Service health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-20T18:09:24.056Z",
  "service": "dime_base",
  "version": "1.0.0"
}
```

### GET /
API root information.

**Response:**
```json
{
  "name": "dime_base",
  "fullName": "Digital Human Base Station",
  "version": "1.0.0",
  "endpoints": {
    "agents": "/api/agents",
    "world": "/api/world",
    "economy": "/api/economy"
  }
}
```

---

## 3.3 Agent Endpoints (/api/agents)

### GET /api/agents/questionnaire
Get personality questionnaire questions.

**Response:**
```json
[
  {
    "key": "communicationStyle",
    "question": "How do you prefer to communicate?",
    "options": ["formal", "casual", "playful"]
  },
  ...
]
```

### POST /api/agents/create
Create a new dime agent.

**Request:**
```json
{
  "ownerId": "user123",
  "name": "MyDime",
  "personality": {
    "communicationStyle": "casual",
    "decisionStyle": "analytical"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "ownerId": "user123",
    "name": "MyDime",
    "personality": {...},
    "status": "active",
    "memory": {...},
    "createdAt": "2026-03-20T18:09:24.056Z"
  }
}
```

### GET /api/agents/:dimeId
Get agent by ID.

### GET /api/agents/owner/:ownerId
Get agent by owner ID.

### POST /api/agents/:dimeId/chat
Send message to agent (LLM-generated response).

**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "response": "Hello! I'm doing great, thanks for asking...",
  "dime": {
    "id": "uuid",
    "name": "MyDime",
    "status": "active",
    "lastActive": "2026-03-20T18:09:24.056Z"
  }
}
```

### POST /api/agents/:dimeId/decide
Request a decision from agent.

**Request:**
```json
{
  "context": "Should I join the gaming playground?",
  "options": ["Join now", "Wait for a friend", "Skip this time"],
  "urgency": "medium"
}
```

**Response:**
```json
{
  "decision": "Wait for a friend",
  "reasoning": "Based on your social preference...",
  "escalate": false
}
```

### POST /api/agents/:dimeId/status
Update agent status.

**Request:**
```json
{
  "status": "paused"
}
```

### GET /api/agents/
List all agents (admin endpoint).

---

## 3.4 World Endpoints (/api/world)

### GET /api/world/
List all playgrounds.

### POST /api/world/
Create a new playground.

**Request:**
```json
{
  "name": "Gaming Arena",
  "type": "game"
}
```

### POST /api/world/:playgroundId/enter
Agent enters a playground.

### POST /api/world/:playgroundId/exit
Agent exits a playground.

### POST /api/world/location
Update agent location.

---

## 3.5 Economy Endpoints (/api/economy)

### GET /api/economy/balance
Get user's vCoin balance.

### POST /api/economy/earn
Earn vCoins through activities.

### POST /api/economy/spend
Spend vCoins.

### POST /api/economy/donate
Donate real money (adds bonus vCoins).

### POST /api/economy/exchange
Convert vCoins to USD (simulated).

### GET /api/economy/costs
Get server cost estimates.

---

# 4. Data Models

## 4.1 Dime (Agent)

```typescript
interface Dime {
  id: string;                    // UUID
  ownerId: string;               // Owner's user ID
  name: string;                  // Agent name
  personality: DimePersonality;  // Personality traits
  decisionBoundary: DecisionBoundary;
  memory: DimeMemory;
  status: 'active' | 'paused' | 'idle';
  createdAt: Date;
  lastActive: Date;
}
```

## 4.2 Personality

```typescript
interface DimePersonality {
  communicationStyle: 'formal' | 'casual' | 'playful';
  detailLevel: 'brief' | 'detailed' | 'balanced';
  decisionStyle: 'analytical' | 'intuitive' | 'balanced';
  riskTolerance: 'high' | 'medium' | 'low';
  socialPreference: 'outgoing' | 'reserved' | 'selective';
  optimism: 'optimist' | 'pessimist' | 'realist';
  interests: string[];
}
```

## 4.3 Memory

```typescript
interface DimeMemory {
  shortTerm: ShortTermMemory;
  longTerm: LongTermMemory;
}

interface ShortTermMemory {
  conversations: Conversation[];   // Last 10 conversations
  recentEvents: Event[];          // Recent world events
  activeTasks: Task[];            // Current tasks
}

interface LongTermMemory {
  personalityProfile: object;     // Learned personality traits
  learnedPreferences: object;    // Owner preferences
  relationships: Map<string, Relationship>;  // Other agent relationships
}
```

## 4.4 Playground

```typescript
interface Playground {
  id: string;
  name: string;
  type: 'social' | 'game' | 'work' | 'creative';
  agents: string[];              // Agent IDs currently in playground
  maxAgents: number;
  createdAt: Date;
}
```

## 4.5 User Account

```typescript
interface UserAccount {
  userId: string;
  balance: number;               // vCoin balance
  transactions: Transaction[];
  tier: 'free' | 'premium' | 'founder';
}

interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'donate' | 'exchange';
  amount: number;
  timestamp: Date;
  description: string;
}
```

---

# 5. User Stories

## US-1: Create Agent
**As a** user
**I want to** create a digital agent with my personality
**So that** it can represent me in virtual worlds

**Acceptance Criteria:**
- [ ] User can fill out personality questionnaire
- [ ] User can provide custom name for agent
- [ ] Agent is created with unique ID
- [ ] Agent responds to messages

## US-2: Chat with Agent
**As a** user
**I want to** chat with my agent naturally
**So that** I can interact with my digital representation

**Acceptance Criteria:**
- [ ] User can send text messages to agent
- [ ] Agent responds using LLM with personality-appropriate style
- [ ] Conversation history is maintained

## US-3: Agent Makes Decisions
**As a** user
**I want to** ask my agent to make decisions
**So that** it can act on my behalf with appropriate boundaries

**Acceptance Criteria:**
- [ ] User provides context and options
- [ ] Agent considers personality traits in decision
- [ ] Agent provides decision and reasoning
- [ ] High-stakes decisions can be escalated

## US-4: Virtual Economy
**As a** user
**I want to** earn and spend virtual currency
**So that** I can participate in the agent economy

**Acceptance Criteria:**
- [ ] User has vCoin balance
- [ ] User can earn vCoins
- [ ] User can spend vCoins
- [ ] User can donate to support server

## US-5: Agent Interactions
**As a** user
**I want to** see my agent interact with other agents
**So that** my agent can build relationships

**Acceptance Criteria:**
- [ ] Agents can be in same playground
- [ ] WebSocket events notify of agent activities
- [ ] Real-time status updates

---

# 6. Testing Requirements

## 6.1 Unit Tests
- Agent creation with personality
- Decision logic with personality traits
- Memory management (add/retrieve)
- Economy transactions (earn/spend/transfer)

## 6.2 Integration Tests
- API endpoint responses
- WebSocket event delivery
- LLM integration (with mock)

## 6.3 Test Coverage Target
| Component | Target |
|-----------|--------|
| Agent Core | ≥80% |
| API Routes | ≥80% |
| Economy | ≥80% |
| **Overall** | ≥70% |

---

# 7. Architecture Design

## 7.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Mobile App  │  │  Web App    │  │   Earbuds   │  │  ZeroClaw   │      │
│  │ (Future)    │  │   (React)   │  │  (Future)   │  │  (Future)   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Auth API    │  │ Agent API   │  │ World API   │  │ Economy API │      │
│  │ (Future)    │  │  /api/agents│  │ /api/world  │  │ /api/economy│      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Agent Core   │         │  World Core    │         │  Economy Core │
│               │         │                │         │               │
│ • Decision    │         │ • Playground   │         │ • vCoin        │
│ • Memory      │         │ • Spatial      │         │ • Exchange     │
│ • Personality │         │ • Events       │         │ • Donations    │
│ • LLM         │         │                │         │                │
└───────────────┘         └───────────────┘         └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER (MVP: In-Memory)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Dime Store  │  │ Playground  │  │ Account     │  │ Message     │      │
│  │ (Map)       │  │ Store (Map) │  │ Store (Map) │  │ Store (Map) │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                       │
│  │ DeepSeek    │  │   Redis     │  │ PostgreSQL  │                       │
│  │ LLM API     │  │  (Future)   │  │  (Future)   │                       │
│  └─────────────┘  └─────────────┘  └─────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. Implementation Status

## 8.1 Completed (MVP)

| Component | File(s) | Status |
|-----------|---------|--------|
| Agent Core | `backend/src/agents/dime.ts` | ✅ |
| Agent Service | `backend/src/agents/service.ts` | ✅ |
| LLM Integration | `backend/src/agents/llm.ts` | ✅ |
| Agent API | `backend/src/api/agents.ts` | ✅ |
| World API | `backend/src/api/world.ts` | ✅ |
| Economy API | `backend/src/api/economy.ts` | ✅ |
| WebSocket | `backend/src/websocket.ts` | ✅ |
| Express Server | `backend/src/index.ts` | ✅ |
| Frontend App | `frontend/src/App.tsx` | ✅ |

## 8.2 Known Issues

| Issue | Severity | Workaround |
|-------|----------|------------|
| No authentication | High | Use ownerId parameter |
| In-memory only | Medium | Data lost on restart |
| No database | Medium | MVP limitation |
| No rate limiting | Low | LLM costs uncontrolled |

## 8.3 Dependencies Required

| Dependency | Purpose | Status |
|------------|---------|--------|
| DeepSeek API Key | LLM responses | ⚠️ User must provide |
| Node.js 18+ | Runtime | ✅ v22.22.1 |

---

# 9. Development Commands

## Backend

```bash
cd /home/hermitwang/Projects/dime_base/backend
npm install              # Install dependencies
npm run dev              # Start dev server (ts-node-dev)
npm run build            # Compile TypeScript
npm start                # Run production
```

## Frontend

```bash
cd /home/hermitwang/Projects/dime_base/frontend
npm install              # Install dependencies
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Build for production
```

## Remote Server

```bash
# SSH
ssh hermitwang@194.146.13.133

# Check status
curl http://localhost:3000/health

# View logs
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

---

# 10. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low user adoption | High | High | Focus on early community |
| Server cost > donations | Medium | High | Tiered pricing, cost optimization |
| Privacy breach | Low | Critical | Security audit, encryption |
| Regulatory issues | Medium | High | Legal review |
| LLM costs uncontrolled | High | Medium | Rate limiting, caching |
| Data loss (in-memory) | High | Medium | Implement persistence soon |

---

# 11. Success Metrics

| Metric | Target (MVP) | Target (1 Year) |
|--------|--------------|-----------------|
| Active Agents | 10+ | 10,000+ |
| Daily Active Users | 5+ | 5,000+ |
| Monthly Revenue | $0 | $50,000+ |
| User Satisfaction | >3.5/5 | >4.0/5 |
| System Uptime | 95% | 99.9% |

---

# 12. Next Steps

1. **Provide DeepSeek API Key** - Add to `backend/.env`
2. **Implement User Authentication** - Add login/registration
3. **Add Database Persistence** - Replace in-memory Maps with SQLite
4. **Write Unit Tests** - Set up Jest and write tests
5. **Add Rate Limiting** - Protect LLM costs
6. **Implement Real Persistence** - Redis + PostgreSQL

---

*Document Version: 1.1*
*Last Updated: 2026-03-25*
*Next Review: After MVP completion*
