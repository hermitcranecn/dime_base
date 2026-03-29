# dime_base - Digital Me Base Station

| Field | Value |
|-------|-------|
| **Version** | 1.6 |
| **Date** | 2026-03-30 |
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
| **Skill** | A capability a Dime can publish and offer to other Dimes |
| **Conversation** | A recorded dialogue between Dimes or Owner-Dime |

---

## 2. MVP Scope

### 2.1 Implemented Features

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
| MVP-11 | Owner Registration | Email/password auth with JWT | ✅ |
| MVP-12 | RAG Knowledge Base | Local embedding-based knowledge retrieval | ✅ |

### 2.2 Implemented Features (v1.5)

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| REG-1 | Dime Configuration | Owner-configurable LLM, tone, mode, privacy | ✅ |
| PLAN-1 | D2D Communication | Dime-to-Dime chat, conversation recording, browse dimes | ✅ |
| PLAN-2 | Admin Dashboard | System config, playground management, monitoring | ✅ |
| PLAN-3 | Dime Skills | Skill publishing, marketplace integration, equipping | ✅ |
| PLAN-4 | Super Admin | Root token system, admin role management | ✅ |

### 2.3 Planned Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| PLAN-5 | Persistent Memory | Long-term memory with SQLite | High |
| PLAN-6 | IM Channel Integration | Feishu/Telegram/WeChat as primary owner-dime interface | High |

### 2.4 Future Considerations

| ID | Feature | Priority |
|----|---------|----------|
| FUT-1 | Encrypted Memory (AES-256) | High |
| FUT-2 | Rate Limiting | High |
| FUT-3 | Third-Party SDK | Medium |
| FUT-4 | Wearable Integration (ZeroClaw) | Medium |
| FUT-6 | Real Payment Gateway | Medium |
| FUT-7 | Horizontal Scaling (Redis, K8s) | Medium |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Web App    │  │  iOS App   │  │  Wearable   │  │   Earbuds   │      │
│  │ (React)    │  │  (Future)  │  │  (Future)   │  │  (Future)   │      │
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
| FR-1.1 | Each owner can create exactly one Dime | Critical | ✅ |
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

### 4.2 Owner Registration & Authentication

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-Auth.1 | Owners register via IM channel (Feishu first) — no email/password required | Critical | 🔲 |
| FR-Auth.2 | Owner receives unique Owner ID (UUID) | Critical | 🔲 |
| FR-Auth.3 | Owner identity is their IM platform user ID (e.g., Feishu open_id) | Critical | 🔲 |
| FR-Auth.4 | One Owner ID maps to one Dime | Critical | 🔲 |
| FR-Auth.5 | Web login via Feishu OAuth (for admin/config access) | High | 🔲 |
| FR-Auth.6 | Channel-first: Feishu is primary owner experience | Critical | 🔲 |

**Owner Identity:**

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | UUID v4 |
| createdAt | timestamp | Auto-generated |
| email | string | Nullable (fallback only) |
| passwordHash | string | Nullable (fallback only) |

**Authentication Flow (Channel-First):**
1. **New Owner via Feishu**: Owner sends message to dime_base bot → owner + dime auto-created → onboarding via conversation
2. **Web Login**: Owner clicks "Login with Feishu" → Feishu OAuth → JWT issued
3. **Use API**: Include `Authorization: Bearer <jwt>` header for authenticated requests

**Channel Linking:**
- One owner = one IM channel (one owner, one dime, one channel)
- If owner registers via Telegram later = treated as new owner with new dime

### 4.3 Decision Mechanism

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

### 4.7 Dime Configuration

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-DimeCfg.1 | Owner can select LLM backend (DeepSeek, OpenAI, Anthropic) | Critical | ✅ |
| FR-DimeCfg.2 | Owner can configure response tone (formal, casual, playful) | High | ✅ |
| FR-DimeCfg.3 | Owner can configure communication mode (verbose, brief, balanced) | High | ✅ |
| FR-DimeCfg.4 | Owner can set default language | Medium | 🔲 |
| FR-DimeCfg.5 | Owner can configure auto-response behavior | Medium | 🔲 |
| FR-DimeCfg.6 | Configuration changes take effect immediately | High | ✅ |

**DimeConfig Interface:**

```typescript
interface DimeConfig {
  llmBackend: 'deepseek' | 'openai' | 'anthropic';
  llmModel?: string;                    // Model variant
  responseTone: 'formal' | 'casual' | 'playful';
  communicationMode: 'verbose' | 'brief' | 'balanced';
  defaultLanguage: string;               // ISO 639-1
  autoResponseEnabled: boolean;
  autoResponseDelay: number;             // seconds
}
```

### 4.8 Dime-to-Dime Communication

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-D2D.1 | Dimes can search for other Dimes by name/interests | Critical | ✅ |
| FR-D2D.2 | Dimes can initiate 1:1 private conversations | Critical | ✅ |
| FR-D2D.3 | Dimes can have random "bump" conversations | High | 🔲 |
| FR-D2D.4 | All conversations are recorded and timestamped | Critical | ✅ |
| FR-D2D.5 | Owners can view, search, export conversation history | Critical | ✅ |
| FR-D2D.6 | Dimes can request help from other Dimes | High | 🔲 |
| FR-D2D.7 | Dimes can offer help/services to other Dimes | High | 🔲 |
| FR-D2D.8 | Dime can decline help requests | Medium | 🔲 |

**Conversation Record:**

```typescript
interface ConversationRecord {
  id: string;
  participants: string[];              // Dime IDs
  type: 'd2d' | 'd2d_random' | 'help_request' | 'help_response';
  messages: Message[];
  createdAt: Date;
  endedAt?: Date;
}
```

### 4.9 Admin System

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-Admin.1 | Admin dashboard (frontend) for system management | Critical | ✅ |
| FR-Admin.2 | Admin can manage system-wide configurations | Critical | ✅ |
| FR-Admin.3 | Admin can view resource usage and limits | High | ✅ |
| FR-Admin.4 | Admin can create and manage playgrounds | Critical | ✅ |
| FR-Admin.5 | Admin can view Dime activity logs | High | ✅ |
| FR-Admin.6 | Admin can view user/owner statistics | Medium | ✅ |
| FR-Admin.7 | Admin can ban/suspend Dimes or owners | High | ✅ |
| FR-Admin.8 | Admin backend API with role-based access | Critical | ✅ |
| FR-Admin.9 | Super admin with one-time root token | Critical | ✅ |
| FR-Admin.10 | Admin can manage other admins (super_admin only) | Critical | ✅ |

**Admin API Endpoints:**

```
/api/admin/system          → System configuration
/api/admin/playgrounds     → Playground management
/api/admin/dimes          → Dime monitoring
/api/admin/users          → User/owner management
/api/admin/logs           → Activity logs
/api/admin/stats          → Statistics
```

### 4.10 Digital Goods Marketplace

**One Marketplace, Two Players:**

| Player | Can Do | Constraint |
|--------|--------|------------|
| **Owner** | Browse, buy for dime | Own vCoin balance |
| **Dime** | Browse, buy for itself | Within `DimeScope` limits (set by owner) |

The dime has "free mind" — autonomous purchasing power within bounds set by owner.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-MP.1 | One unified marketplace for all digital goods | Critical | ✅ |
| FR-MP.2 | Owner can browse, purchase, and assign goods to dime | Critical | ✅ |
| FR-MP.3 | Dime can browse and purchase goods autonomously | High | ✅ |
| FR-MP.4 | Owner sets `DimeScope` (spending limits, category/type restrictions) | Critical | ✅ |
| FR-MP.5 | Purchase validation: owner = no limits, dime = check DimeScope | Critical | ✅ |
| FR-MP.6 | Developers can publish new digital goods | High | ✅ |
| FR-MP.7 | D2D gifting/selling between dimes (within owner permissions) | Medium | 🔲 |
| FR-MP.8 | Dime spending tracker with transaction history | High | ✅ |

**Goods Types:** `skill` | `icon` | `badge` | `theme` | `avatar` | `pack` | `other`

**Data Models:**

```typescript
type GoodsType = 'skill' | 'icon' | 'badge' | 'theme' | 'avatar' | 'pack' | 'other';

interface DigitalGoods {
  id: string;
  developerId: string;              // Owner who published, or 'system'
  type: GoodsType;
  name: string;
  description: string;
  iconUrl?: string;
  previewUrl?: string;
  price: number;                     // 0 = free
  pricingType: 'one-time' | 'subscription' | 'free';
  category: string;                   // e.g., 'productivity', 'social', 'gaming'
  parameters?: GoodsParameter[];      // For skills: input schema
  requirements?: {
    minLevel?: number;
    requiredGoods?: string[];
  };
  stats: {
    purchases: number;
    rating: number;
    uses: number;
  };
  publishedAt: Date;
}

interface DimeScope {                 // Owner's delegated authority to dime
  dimeId: string;
  maxSpendPerTransaction: number;   // Max vCoins per purchase
  dailyLimit: number;                // Max vCoins per day
  monthlyBudget: number;             // Monthly allowance
  allowedCategories: string[];       // Empty = all allowed
  allowedTypes: GoodsType[];         // Empty = all allowed
  canReceiveGifts: boolean;
  canSendGifts: boolean;
  canSellToOthers: boolean;
}

interface DimeGoods {                 // Goods owned by a dime
  id: string;
  goodsId: string;
  dimeId: string;
  purchasedBy: 'owner' | 'dime';    // Who made the purchase
  status: 'owned' | 'equipped' | 'active';
  config: Record<string, any>;       // Per-dime configuration
  purchasedAt: Date;
  equippedAt?: Date;
}
```

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

### Phase 4: Mobile (iOS App)
- [ ] iOS App development (Swift/SwiftUI)
- [ ] Push notifications for Dime events
- [ ] Real-time chat interface
- [ ] Decision escalation UI
- [ ] App Store submission

---

## 15. IM Channel Integration (Primary Owner Interface)

### 15.1 Overview


### 15.2 Channel Architecture

```
Owner (Feishu) ─── DM ───▶ dime_base Bot
                               │
                               ▼
                    ┌──────────────────┐
                    │     Gateway      │
                    │  POST /webhooks/ │
                    │      feishu      │
                    └────────┬─────────┘
                             │ routes to
                             ▼
                    ┌──────────────────┐
                    │  MessageRouter   │
                    │ open_id → dime   │
                    └────────┬─────────┘
                             │ chatWithDime()
                             ▼
                    ┌──────────────────┐
                    │  Dime Service    │
                    └──────────────────┘
```

**One Feishu app for all owners**: All owners install the same dime_base bot. dime_base routes messages by `open_id`.

### 15.3 Owner Identity Model

| Concept | Detail |
|---------|--------|
| **Identity** | Feishu `open_id` (no email/password) |
| **Registration** | Owner sends first message → auto-creates owner + dime |
| **Linking** | `owner_channels` table: `open_id` → `owner_id` → `dime_id` |
| **Web Login** | Feishu OAuth (for admin/config access) |

### 15.4 Owner Features via Feishu

| Feature | Via | Command |
|---------|-----|---------|
| Chat with dime | DM (default) | None — just talk |
| Dime config | Feishu command | `/config`, `/config set [key] [value]` |
| Marketplace | Feishu command | `/marketplace`, `/buy [item]`, `/sell [item]` |
| Dime status | Feishu command | `/status` |
| Help | Feishu command | `/help` |

**Command detection**: Messages starting with `/` = command. Everything else = chat with dime.

### 15.5 Supported Channels

| Channel | Priority | Region | Status |
|---------|----------|--------|--------|
| **Feishu** | Primary | China | 🔲 |
| Telegram | Secondary | Global | 🔲 |
| WeChat | Future | China | 🔲 |

### 15.6 Privacy

| Aspect | Approach |
|--------|----------|
| **Short term** | Messages stored on cloud server (acceptable for MVP) |
| **Long term** | E2E encryption, dime runs on owner's device (TBD) |

### 15.7 Database Schema

```sql
CREATE TABLE owner_channels (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL UNIQUE,
  channel_type TEXT NOT NULL,       -- "feishu"
  external_id TEXT NOT NULL,        -- Platform user ID (open_id)
  external_name TEXT,
  status TEXT DEFAULT 'active',     -- "active" | "paused" | "unlinked"
  created_at TEXT NOT NULL,
  last_message_at TEXT
);
```

---

*Document Version: 1.6*
*Last Updated: 2026-03-30*
