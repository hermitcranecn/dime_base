# dime_base - Digital Me Base Station

| Field | Value |
|-------|-------|
| **Version** | 1.2 |
| **Date** | 2026-03-26 |
| **Status** | Requirements Specification |
| **Owner** | dime_base Team |

---

## 1. Overview

### 1.1 Project Description

**dime_base** (Digital Me Base Station) is a platform for creating and managing "Digital Me" (dime) agents—AI-powered virtual representatives that act on behalf of their human owners in shared virtual environments.

### 1.2 Core Value Proposition

- **For Users**: A digital twin that interacts, learns, and represents them in virtual worlds
- **For Society**: A new form of social interaction in a post-labor economy where AI companions provide meaning and connection
- **For Developers**: An extensible platform for building virtual world experiences

### 1.3 Key Definitions

| Term | Definition |
|------|------------|
| **Dime** | A Digital Me—AI agent representing a human owner |
| **Owner** | The human who creates and controls a Dime |
| **Playground** | A themed virtual space where Dimes interact |
| **vCoin** | Virtual currency used within the dime_base economy |
| **Decision Boundary** | Owner-defined rules limiting Dime autonomy |

---

## 2. MVP Scope

### 2.1 In Scope (Current Implementation)

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| MVP-1 | Agent Creation | Create Dime with personality questionnaire | ✅ |
| MVP-2 | Agent Chat | Natural language conversation via LLM | ✅ |
| MVP-3 | Decision Making | Contextual decisions with reasoning | ✅ |
| MVP-4 | Personality System | 7 configurable personality traits | ✅ |
| MVP-5 | Memory | Short-term conversation history (in-memory) | ✅ |
| MVP-6 | Agent Status | active, paused, idle states | ✅ |
| MVP-7 | Virtual Playgrounds | Create, enter, exit playground spaces | ✅ |
| MVP-8 | vCoin Economy | Earn, spend, donate virtual currency | ✅ |
| MVP-9 | Real-time Events | WebSocket for agent interactions | ✅ |
| MVP-10 | REST API | Full API for all core features | ✅ |

### 2.2 Out of Scope (Future)

| ID | Feature | Priority |
|----|---------|----------|
| FUT-1 | User Authentication | High |
| FUT-2 | Persistent Storage (SQLite/PostgreSQL) | High |
| FUT-3 | Encrypted Memory (AES-256) | High |
| FUT-4 | Rate Limiting | High |
| FUT-5 | Third-Party SDK | Medium |
| FUT-6 | Wearable Integration (ZeroClaw) | Medium |
| FUT-7 | External IM Integration (Telegram, WeChat) | Medium |
| FUT-8 | Real Payment Gateway | Medium |
| FUT-9 | Horizontal Scaling (Redis, K8s) | Medium |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Web App    │  │ Mobile App  │  │  Wearable   │  │   Earbuds   │      │
│  │ (React)    │  │  (Future)   │  │  (Future)   │  │  (Future)   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Auth API   │  │ Agent API   │  │ World API   │  │ Economy API │      │
│  │  (Future)  │  │ /api/agents│  │ /api/world  │  │/api/economy │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                          Socket.io (Real-time)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Agent Core   │         │  World Core   │         │ Economy Core  │
│               │         │               │         │               │
│ • Identity    │         │ • Playground  │         │ • vCoin       │
│ • Personality│         │ • Location    │         │ • Earn/Spend  │
│ • Memory     │         │ • Events      │         │ • Donate      │
│ • Decision   │         │               │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
        │                           │                       │
        └───────────────────────────┼───────────────────────┘
                                    ▼
                    ┌───────────────────────────────┐
                    │      LLM Integration          │
                    │      (DeepSeek API)          │
                    └───────────────────────────────┘
```

### 3.2 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Backend Runtime | Node.js | 22.x | Server |
| API Framework | Express.js | 4.18 | HTTP routing |
| Language | TypeScript | 5.3 | Type safety |
| Real-time | Socket.io | 4.7 | WebSocket |
| Frontend | React + Vite | 18.x / 5.x | UI |
| LLM | DeepSeek | - | AI responses |
| Storage | In-Memory (MVP) | - | Data |

---

## 4. Functional Requirements

### 4.1 Agent Identity & Personality

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1.1 | Each owner can create one or more Dimes | Critical | ✅ |
| FR-1.2 | Dime personality derived from owner questionnaire | Critical | ✅ |
| FR-1.3 | Dime exhibits owner-like behavior and decisions | Critical | ✅ |
| FR-1.4 | Dime maintains memory of interactions | High | ⚠️ |
| FR-1.5 | Dime generates content in owner's style | Medium | 🔲 |
| FR-1.6 | Each Dime has a unique name and ID | Critical | ✅ |

**Personality Traits:**

| Trait | Type | Options |
|-------|------|---------|
| communicationStyle | enum | formal, casual, playful |
| detailLevel | enum | brief, detailed, balanced |
| decisionStyle | enum | analytical, intuitive, balanced |
| riskTolerance | enum | high, medium, low |
| socialPreference | enum | outgoing, reserved, selective |
| optimism | enum | optimist, pessimist, realist |
| interests | string[] | Array of interest keywords |

### 4.2 Decision Mechanism

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-2.1 | Dime handles routine decisions autonomously | Critical | ✅ |
| FR-2.2 | Critical decisions escalate to owner | Critical | ⚠️ |
| FR-2.3 | Owner defines decision boundaries | High | ⚠️ |
| FR-2.4 | Escalation notifications to owner | High | 🔲 |
| FR-2.5 | Configurable response timeouts | Medium | 🔲 |

**Decision Boundary Configuration:**

```typescript
interface DecisionBoundary {
  maxPurchaseAmount: number;      // vCoins (default: 100)
  canJoinGroups: boolean;         // default: true
  canSharePersonalInfo: boolean; // default: false
  escalateAboveAmount: number;   // vCoins (default: 500)
}
```

### 4.3 Virtual World

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-3.1 | Multiple Dimes coexist in shared spaces | Critical | ✅ |
| FR-3.2 | Playgrounds provide themed environments | High | ✅ |
| FR-3.3 | Dimes can enter/exit playgrounds | Critical | ✅ |
| FR-3.4 | Agents form groups and collaborate | High | 🔲 |
| FR-3.5 | World events affect Dime behavior | Medium | 🔲 |

**Playground Types:** social, game, work, creative

### 4.4 Agent Communication

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-4.1 | Private 1:1 Dime-to-Dime messaging | Critical | ✅ |
| FR-4.2 | Group chats | High | 🔲 |
| FR-4.3 | Public broadcasts | Medium | 🔲 |
| FR-4.4 | End-to-end encryption | Critical | 🔲 |

**WebSocket Events:**

| Event | Direction | Description |
|-------|-----------|-------------|
| dime_message | Server → Client | Incoming message |
| dime_status | Server → Client | Status change |
| dime_typing | Server → Client | Typing indicator |
| playground_update | Server → Client | Playground state change |

### 4.5 Owner Interface

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-5.1 | View Dime state/location in real-time | Critical | ⚠️ |
| FR-5.2 | Send messages/commands to Dime | Critical | ✅ |
| FR-5.3 | Override Dime decisions | High | 🔲 |
| FR-5.4 | Pause/resume Dime activity | High | ✅ |
| FR-5.5 | Multi-device support | Medium | 🔲 |

### 4.6 Virtual Economy

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-6.1 | vCoin as virtual currency | Critical | ✅ |
| FR-6.2 | Earn vCoins through activities | High | ⚠️ |
| FR-6.3 | Exchange vCoins (simulated) | Medium | ⚠️ |
| FR-6.4 | Premium playground access | Medium | 🔲 |
| FR-6.5 | Real money donations | High | ✅ |

**User Tiers:**

| Tier | Monthly Cost | Benefits |
|------|-------------|----------|
| Free | $0 | Basic agent, limited vCoins |
| Premium | $5 | Increased vCoins, priority support |
| Founder | $20 | All benefits, early access |

---

## 5. Data Models

### 5.1 Dime

```typescript
interface Dime {
  id: string;                      // UUID v4
  ownerId: string;                  // Owner's user ID
  name: string;                    // Unique per owner
  personality: DimePersonality;    // Configuration
  decisionBoundary: DecisionBoundary;
  memory: DimeMemory;
  status: 'active' | 'paused' | 'idle';
  createdAt: Date;
  lastActive: Date;
}
```

### 5.2 Personality

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

### 5.3 Memory

```typescript
interface DimeMemory {
  shortTerm: {
    conversations: Conversation[];   // Last 10
    recentEvents: Event[];
    activeTasks: Task[];
  };
  longTerm: {
    personalityProfile: object;
    learnedPreferences: object;
    relationships: Record<string, Relationship>;
  };
}
```

### 5.4 Playground

```typescript
interface Playground {
  id: string;
  name: string;
  type: 'social' | 'game' | 'work' | 'creative';
  agents: string[];
  maxAgents: number;
  createdAt: Date;
}
```

### 5.5 Account

```typescript
interface UserAccount {
  userId: string;
  balance: number;        // vCoins
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

## 6. API Specification

### 6.1 Base Configuration

| Environment | URL |
|-------------|-----|
| Backend | http://localhost:3000 |
| Frontend | http://localhost:5173 |

**Note:** Authentication is not implemented in MVP. The `ownerId` is passed as a request parameter.

### 6.2 Endpoints

#### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/` | API information |

#### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents/questionnaire` | Personality questions |
| POST | `/api/agents/create` | Create new Dime |
| GET | `/api/agents/:dimeId` | Get Dime by ID |
| GET | `/api/agents/owner/:ownerId` | Get Dime by owner |
| POST | `/api/agents/:dimeId/chat` | Chat with Dime |
| POST | `/api/agents/:dimeId/decide` | Request decision |
| POST | `/api/agents/:dimeId/status` | Update status |
| GET | `/api/agents/` | List all Dimes |

#### World

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/world/` | List playgrounds |
| POST | `/api/world/` | Create playground |
| POST | `/api/world/:id/enter` | Enter playground |
| POST | `/api/world/:id/exit` | Exit playground |
| POST | `/api/world/location` | Update location |

#### Economy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/economy/balance` | Get balance |
| POST | `/api/economy/earn` | Earn vCoins |
| POST | `/api/economy/spend` | Spend vCoins |
| POST | `/api/economy/donate` | Donate |
| POST | `/api/economy/exchange` | Exchange vCoins |
| GET | `/api/economy/costs` | Cost estimates |

---

## 7. User Stories

### US-1: Create Agent

**As a** user
**I want to** create a Dime with my personality
**So that** it can represent me in virtual worlds

**Acceptance Criteria:**
- [ ] Complete personality questionnaire
- [ ] Provide custom name
- [ ] Receive unique Dime ID
- [ ] Dime responds to messages

### US-2: Chat with Agent

**As a** owner
**I want to** chat with my Dime naturally
**So that** I can interact with my digital representation

**Acceptance Criteria:**
- [ ] Send text messages
- [ ] Receive personality-appropriate responses
- [ ] Conversation history maintained

### US-3: Request Decision

**As a** owner
**I want to** my Dime to make decisions
**So that** it acts autonomously within boundaries

**Acceptance Criteria:**
- [ ] Provide context and options
- [ ] Receive decision with reasoning
- [ ] High-stakes decisions escalate appropriately

### US-4: Virtual Economy

**As a** owner
**I want to** earn and spend vCoins
**So that** I participate in the economy

**Acceptance Criteria:**
- [ ] View vCoin balance
- [ ] Earn through activities
- [ ] Spend for playground access
- [ ] Donate to support server

### US-5: Agent Interactions

**As a** owner
**I want to** my Dime interacts with others
**So that** it builds relationships

**Acceptance Criteria:**
- [ ] Dimes share playground
- [ ] Real-time status updates
- [ ] WebSocket notifications

---

## 8. Non-Functional Requirements

### 8.1 Security

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-1.1 | Owner isolation (see only own data) | Critical | ⚠️ |
| NFR-1.2 | Encrypted agent memories | Critical | 🔲 |
| NFR-1.3 | E2E encrypted communication | High | 🔲 |
| NFR-1.4 | Data export/delete capability | Medium | 🔲 |

### 8.2 Performance

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-2.1 | 10,000+ concurrent Dimes | High | 🔲 |
| NFR-2.2 | Decision response < 500ms | High | ⚠️ |
| NFR-2.3 | Real-time sync | High | ✅ |
| NFR-2.4 | 100,000+ daily users (maturity) | Medium | 🔲 |

### 8.3 Reliability

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-3.1 | 99.9% uptime | High | 🔲 |
| NFR-3.2 | State persistence | High | 🔲 |
| NFR-3.3 | Graceful degradation | Medium | 🔲 |

---

## 9. Implementation Status

### 9.1 Completed Components

| Component | File | Status |
|-----------|------|--------|
| Agent Core | `backend/src/agents/dime.ts` | ✅ |
| Agent Service | `backend/src/agents/service.ts` | ✅ |
| LLM Integration | `backend/src/agents/llm.ts` | ✅ |
| Agent API | `backend/src/api/agents.ts` | ✅ |
| World API | `backend/src/api/world.ts` | ✅ |
| Economy API | `backend/src/api/economy.ts` | ✅ |
| WebSocket | `backend/src/websocket.ts` | ✅ |
| Express Server | `backend/src/index.ts` | ✅ |
| Frontend | `frontend/src/App.tsx` | ✅ |

### 9.2 Known Limitations

| Issue | Severity | Workaround |
|-------|----------|------------|
| No authentication | High | Trust ownerId parameter |
| In-memory storage | Medium | Data lost on restart |
| No rate limiting | Low | LLM costs uncontrolled |

---

## 10. Testing Requirements

### 10.1 Coverage Targets

| Component | Target |
|-----------|--------|
| Agent Core | ≥80% |
| API Routes | ≥80% |
| Economy | ≥80% |
| **Overall** | ≥70% |

### 10.2 Test Types

- **Unit Tests**: Agent creation, decision logic, memory management
- **Integration Tests**: API endpoints, WebSocket events, LLM (mocked)

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low adoption | High | High | Community building |
| Server costs exceed revenue | Medium | High | Tiered pricing |
| Privacy breach | Low | Critical | Security audit |
| Regulatory issues | Medium | High | Legal review |
| LLM cost overrun | High | Medium | Rate limiting |
| Data loss | High | Medium | Implement persistence |

---

## 12. Success Metrics

| Metric | MVP Target | 1-Year Target |
|--------|-----------|----------------|
| Active Dimes | 10+ | 10,000+ |
| Daily Active Users | 5+ | 5,000+ |
| Monthly Revenue | $0 | $50,000+ |
| User Satisfaction | >3.5/5 | >4.0/5 |
| System Uptime | 95% | 99.9% |

---

## 13. Development

### 13.1 Remote Server

```bash
ssh hermitwang@194.146.13.133

# Backend
cd /home/hermitwang/Projects/dime_base/backend
npm run dev  # Development (ts-node-dev)

# Frontend
cd /home/hermitwang/Projects/dime_base/frontend
npm run dev  # Vite dev server

# Check health
curl http://localhost:3000/health
```

### 13.2 Configuration

Environment file: `backend/.env`

| Variable | Required | Default |
|----------|----------|---------|
| DEEPSEEK_API_KEY | Yes | - |
| DEEPSEEK_MODEL | No | deepseek-chat |
| PORT | No | 3000 |
| NODE_ENV | No | development |

---

## 14. Roadmap

### Phase 1: Foundation (Current)
- [x] Core agent functionality
- [x] Basic economy
- [x] REST API
- [ ] User authentication

### Phase 2: Persistence
- [ ] SQLite integration
- [ ] Redis caching
- [ ] Data persistence

### Phase 3: Scale
- [ ] Multi-node deployment
- [ ] Horizontal scaling
- [ ] CDN integration

---

*Document Version: 1.2*
*Last Updated: 2026-03-26*
*Next Review: After Phase 1 completion*
