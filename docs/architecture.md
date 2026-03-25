# dime_base Technical Architecture

**Version:** 1.0
**Date:** 2026-03-26
**Status:** For Review

---

## 1. System Overview

### 1.1 What is dime_base?

**dime_base** is a Digital Human Base Station - a platform where "Digital Me" (dime) agents live, interact, and act on behalf of their human owners in virtual worlds.

### 1.2 High-Level Purpose

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Human)                             │
│                                                                  │
│   Owns one or more Dimes                                        │
│   Sets permissions and goals                                      │
│   Receives/escalates decisions                                   │
│   Chat interface for interaction                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    dime_base PLATFORM                             │
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │   Agent     │  │   World     │  │   Economy   │           │
│   │   Core      │  │   Core      │  │   Core      │           │
│   │             │  │             │  │             │           │
│   │ • Identity  │  │ • Playground│  │ • vCoin    │           │
│   │ • Personality│ │ • Spatial   │  │ • Earn/Spend│           │
│   │ • Memory    │  │ • Events    │  │ • Donate   │           │
│   │ • Decision  │  │             │  │             │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              LLM Integration (DeepSeek)                 │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VIRTUAL WORLD                                │
│                                                                  │
│   Multiple Dimes coexisting in shared spaces                      │
│   Real-time interaction via WebSocket                            │
│   Playground-based organization                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Layers

### 2.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                  │
│                                                                              │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │   React SPA     │     │   REST Client   │     │  WebSocket      │      │
│   │   (Frontend)    │     │   (API Calls)   │     │  (Real-time)    │      │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                                                              │
│   Port: 5173 (Vite)                     Port: 3000 (Express)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API LAYER                                        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         Express Router                                │   │
│   │                                                                      │   │
│   │   /api/agents/*      → Agent CRUD, Chat, Decisions, Status          │   │
│   │   /api/world/*       → Playground management, Location               │   │
│   │   /api/economy/*     → vCoin transactions, Balance, Donations       │   │
│   │   /health            → Health check                                  │   │
│   │                                                                      │   │
│   │   Socket.io          → WebSocket events (dime_message, dime_status)  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                       │
│                                                                              │
│   ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐   │
│   │   Agent Service   │   │   World Service   │   │  Economy Service  │   │
│   │                   │   │                   │   │                   │   │
│   │ • createDimeAgent │   │ • createPlayground│   │ • getBalance     │   │
│   │ • getDimeAgent   │   │ • enterPlayground │   │ • earn           │   │
│   │ • chatWithDime   │   │ • exitPlayground  │   │ • spend          │   │
│   │ • decideWithDime │   │ • updateLocation  │   │ • donate         │   │
│   │ • setDimeStatus  │   │                   │   │ • exchange       │   │
│   └───────────────────┘   └───────────────────┘   └───────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOMAIN LAYER                                       │
│                                                                              │
│   ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐   │
│   │   Agent Domain   │   │   World Domain    │   │  Economy Domain   │   │
│   │                   │   │                   │   │                   │   │
│   │ • Dime Entity    │   │ • Playground      │   │ • Account        │   │
│   │ • Personality    │   │ • Agent Location │   │ • Transaction    │   │
│   │ • Memory         │   │ • Spatial Rules  │   │ • vCoin Ledger   │   │
│   │ • Decision Engine│   │                   │   │                   │   │
│   └───────────────────┘   └───────────────────┘   └───────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
│                                                                              │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │   DeepSeek LLM  │     │     Redis       │     │   PostgreSQL    │      │
│   │   API           │     │   (Future)      │     │   (Future)      │      │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer | Responsibility | Key Components |
|-------|----------------|----------------|
| **Presentation** | UI rendering, user input | React Components, Vite |
| **API** | HTTP handling, routing, WebSocket | Express Router, Socket.io |
| **Service** | Business logic orchestration | Agent Service, World Service, Economy Service |
| **Domain** | Core entities, rules, state | Dime, Playground, Account |
| **External** | Third-party integrations | DeepSeek API, (Future: Redis, PostgreSQL) |

---

## 3. Component Architecture

### 3.1 Agent Core

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENT CORE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       │
│  │     IDENTITY     │    │   PERSONALITY    │    │     MEMORY       │       │
│  │                 │    │                 │    │                  │       │
│  │ • id (UUID)     │    │ • communication │    │ • shortTerm     │       │
│  │ • ownerId       │    │   Style         │    │   - conversations│       │
│  │ • name          │    │ • detailLevel   │    │   - recentEvents│       │
│  │ • status        │    │ • decisionStyle  │    │   - activeTasks │       │
│  │ • createdAt     │    │ • riskTolerance │    │ • longTerm      │       │
│  │ • lastActive    │    │ • socialPref    │    │   - personality │       │
│  │                 │    │ • optimism      │    │   - preferences │       │
│  │                 │    │ • interests     │    │   - relationships│      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      DECISION BOUNDARY                                   │ │
│  │                                                                          │ │
│  │   maxPurchaseAmount: number        (default: 100 vCoins)                │ │
│  │   canJoinGroups: boolean          (default: true)                       │ │
│  │   canSharePersonalInfo: boolean  (default: false)                      │ │
│  │   escalateAboveAmount: number      (default: 500 vCoins)                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      LLM INTEGRATION                                     │ │
│  │                                                                          │ │
│  │   System Prompt ← Personality + Memory                                   │ │
│  │         ↓                                                                 │ │
│  │   DeepSeek API (generateAgentResponse, makeDecision)                      │ │
│  │         ↓                                                                 │ │
│  │   Response → Agent behavior                                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 World Core

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WORLD CORE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       │
│  │   PLAYGROUNDS    │    │    SPATIAL      │    │     EVENTS      │       │
│  │                  │    │     ENGINE      │    │                 │       │
│  │ • id            │    │ • location      │    │ • trigger       │       │
│  │ • name          │    │   tracking      │    │ • scheduling    │       │
│  │ • type          │    │ • proximity     │    │ • logging       │       │
│  │   - social      │    │   detection     │    │ • notification  │       │
│  │   - game        │    │ • playground    │    │                 │       │
│  │   - work        │    │   boundaries    │    │                 │       │
│  │   - creative    │    │                 │    │                 │       │
│  │ • agents[]      │    │                 │    │                 │       │
│  │ • maxAgents     │    │                 │    │                 │       │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      AGENT REGISTRY                                      │ │
│  │                                                                          │ │
│  │   currentPlayground: Map<agentId, playgroundId>                        │ │
│  │   agentPresence: Map<playgroundId, agentId[]>                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Economy Core

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ECONOMY CORE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       │
│  │    vCOIN        │    │  TRANSACTION    │    │    DONATION     │       │
│  │    LEDGER       │    │     ENGINE       │    │     MANAGER     │       │
│  │                 │    │                 │    │                 │       │
│  │ • balance       │    │ • earn          │    │ • tiered bonus  │       │
│  │ • frozen        │    │ • spend         │    │   rates         │       │
│  │ • totalEarned   │    │ • transfer      │    │ • monthly goal  │       │
│  │ • totalSpent    │    │ • history       │    │ • sustainability│       │
│  └─────────────────┘    │ • audit trail   │    └─────────────────┘       │
│                          └─────────────────┘                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         PRICING ENGINE                                    │ │
│  │                                                                          │ │
│  │   Playground Access Fees  │  Service Fees  │  Premium Features           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      USER TIERS (MVP: In-Memory)                          │ │
│  │                                                                          │ │
│  │   Free:      Basic agent, limited vCoins                                │ │
│  │   Premium:   More vCoins, priority support ($5/mo)                       │ │
│  │   Founder:   All benefits, early access ($20/mo)                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Architecture

### 4.1 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER INPUT                                                                 │
│        │                                                                       │
│        ▼                                                                       │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐                │
│   │  HTTP   │────▶│ ROUTER  │────▶│ SERVICE │────▶│ DOMAIN  │                │
│   │ Request │     │         │     │         │     │         │                │
│   └─────────┘     └─────────┘     └─────────┘     └────┬────┘                │
│                                                        │                     │
│   USER OUTPUT                                          ▼                     │
│        ▲                                         ┌─────────┐                │
│        │                                         │  STORE  │                │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐   │ (Map)   │                │
│   │  HTTP   │◀────│ SERVICE │◀────│ DOMAIN  │◀──│ In-Mem  │                │
│   │ Response│     │         │     │         │   └─────────┘                │
│   └─────────┘     └─────────┘     └─────────┘                              │
│                                                                              │
│                        EXTERNAL: DeepSeek LLM                                 │
│                                ▲                                             │
│                                │                                             │
│                         ┌─────────────┐                                       │
│                         │  generate  │                                       │
│                         │  response  │                                       │
│                         └─────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 In-Memory Stores

**Current Implementation (MVP):**

| Store | Key | Value | Purpose |
|-------|-----|-------|---------|
| `dimes` | `dimeId` | `Dime` | Agent storage |
| `playgrounds` | `playgroundId` | `Playground` | World spaces |
| `accounts` | `userId` | `UserAccount` | User balances |

**Future Implementation:**

| Store | Technology | Purpose |
|-------|------------|---------|
| Agent State | PostgreSQL | Persistent agent data |
| Short-term Memory | Redis | Fast conversation cache |
| Long-term Memory | PostgreSQL + Encryption | Encrypted memories |
| Real-time Presence | Redis Pub/Sub | WebSocket scaling |

### 4.3 Data Schema

```typescript
// Agent Entity
interface Dime {
  id: string;                      // UUID v4
  ownerId: string;                 // Owner's user ID
  name: string;                   // Agent name (unique per owner)
  personality: DimePersonality;    // Personality configuration
  decisionBoundary: DecisionBoundary;
  memory: DimeMemory;
  status: 'active' | 'paused' | 'idle';
  createdAt: Date;
  lastActive: Date;
}

// Personality Configuration
interface DimePersonality {
  communicationStyle: 'formal' | 'casual' | 'playful';
  detailLevel: 'brief' | 'detailed' | 'balanced';
  decisionStyle: 'analytical' | 'intuitive' | 'balanced';
  riskTolerance: 'high' | 'medium' | 'low';
  socialPreference: 'outgoing' | 'reserved' | 'selective';
  optimism: 'optimist' | 'pessimist' | 'realist';
  interests: string[];
}

// Decision Boundaries
interface DecisionBoundary {
  maxPurchaseAmount: number;       // vCoins
  canJoinGroups: boolean;
  canSharePersonalInfo: boolean;
  escalateAboveAmount: number;    // vCoins
}

// Memory System
interface DimeMemory {
  shortTerm: {
    conversations: Conversation[];  // Last 10
    recentEvents: Event[];
    activeTasks: Task[];
  };
  longTerm: {
    personalityProfile: object;
    learnedPreferences: object;
    relationships: Map<string, Relationship>;
  };
}

// Playground Entity
interface Playground {
  id: string;
  name: string;
  type: 'social' | 'game' | 'work' | 'creative';
  agents: string[];              // Agent IDs
  maxAgents: number;
  createdAt: Date;
}

// Economy Account
interface UserAccount {
  userId: string;
  balance: number;               // vCoins
  transactions: Transaction[];
  tier: 'free' | 'premium' | 'founder';
}

// Transaction Record
interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'donate' | 'exchange';
  amount: number;
  timestamp: Date;
  description: string;
}
```

---

## 5. API Architecture

### 5.1 REST API Structure

```
http://localhost:3000
├── /health                          GET    - Health check
├── /                                GET    - API info
│
├── /api/agents
│   ├── /questionnaire               GET    - Get personality questions
│   ├── /create                      POST   - Create new agent
│   ├── /:dimeId                     GET    - Get agent by ID
│   ├── /owner/:ownerId              GET    - Get agent by owner
│   ├── /:dimeId/chat               POST   - Chat with agent
│   ├── /:dimeId/decide              POST   - Request decision
│   ├── /:dimeId/status              POST   - Update status
│   └── /                            GET    - List all agents
│
├── /api/world
│   ├── /                            GET    - List playgrounds
│   ├── /                            POST   - Create playground
│   ├── /:playgroundId/enter          POST   - Agent enters
│   ├── /:playgroundId/exit           POST   - Agent exits
│   └── /location                    POST   - Update location
│
└── /api/economy
    ├── /balance                     GET    - Get balance
    ├── /earn                        POST   - Earn vCoins
    ├── /spend                       POST   - Spend vCoins
    ├── /donate                      POST   - Donate
    ├── /exchange                    POST   - Exchange vCoins
    └── /costs                       GET    - Get cost estimates
```

### 5.2 WebSocket Events

```typescript
// Socket.io Namespace: '/'
// Connection: Automatic on client connect

// Client → Server
interface ClientEvents {
  'dime_join': (dimeId: string, playgroundId: string) => void;
  'dime_leave': (dimeId: string, playgroundId: string) => void;
  'dime_message_send': (from: string, to: string, content: string) => void;
}

// Server → Client
interface ServerEvents {
  'dime_message': { from: string; content: string; timestamp: Date };
  'dime_status': { dimeId: string; status: 'active' | 'paused' | 'idle' };
  'dime_typing': { dimeId: string; typing: boolean };
  'playground_update': { playgroundId: string; agents: string[] };
}
```

### 5.3 Request/Response Patterns

**Success Response:**
```typescript
{
  success: true,
  data: { /* result */ }
}
```

**Error Response:**
```typescript
{
  success: false,
  error: "Error message description"
}
```

---

## 6. LLM Integration Architecture

### 6.1 DeepSeek Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LLM INTEGRATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER MESSAGE                                                               │
│        │                                                                     │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    SYSTEM PROMPT BUILDER                               │   │
│   │                                                                       │   │
│   │   Base: "You are a helpful AI agent named {name}."                   │   │
│   │   + Personality traits from DimePersonality                           │   │
│   │   + Decision boundaries                                               │   │
│   │   + Recent conversation history (last 5 messages)                     │   │
│   │   + Owner instructions/goals                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                             │
│                                ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    DEEPSEEK API                                       │   │
│   │                                                                       │   │
│   │   POST https://api.deepseek.com/chat/completions                      │   │
│   │   Model: deepseek-chat (configurable)                                 │   │
│   │   Temperature: Based on decisionStyle (0.7-1.0)                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                             │
│                                ▼                                             │
│   AGENT RESPONSE                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 LLM Functions

| Function | Purpose | Used In |
|----------|---------|---------|
| `generateAgentResponse` | Generate conversational response | Chat |
| `makeDecision` | Make decision with reasoning | Decisions |
| `callLLM` | Generic LLM call | Both |

---

## 7. Security Architecture

### 7.1 Current State (MVP)

| Security Feature | Status | Implementation |
|-----------------|--------|----------------|
| Input Validation | ✅ | Basic validation in routes |
| Rate Limiting | ❌ | Not implemented |
| Authentication | ❌ | ownerId passed as parameter |
| Encryption | ❌ | Not implemented |
| Data Isolation | ⚠️ | In-memory, no cross-access |

### 7.2 Future Security Features

| Feature | Priority | Description |
|---------|----------|-------------|
| User Authentication | High | JWT/OAuth2 |
| Agent Memory Encryption | High | AES-256 per agent |
| E2E Communication | High | Signal Protocol |
| Rate Limiting | High | Per-user limits |
| Content Moderation | Medium | Post-encryption check |

### 7.3 Privacy Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRIVACY MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Human A ←───────────► dime A ◄─────────► dime B ←───────────► Human B     │
│                            │                                                 │
│                            │                                                 │
│                            ▼                                                 │
│                    ┌─────────────────┐                                      │
│                    │  dime_base      │                                      │
│                    │    System       │                                      │
│                    │                 │                                      │
│                    │  • Owns data    │                                      │
│                    │  • Enforces     │                                      │
│                    │    privacy      │                                      │
│                    │  • No human     │                                      │
│                    │    can read     │                                      │
│                    │  agent chats    │                                      │
│                    └─────────────────┘                                      │
│                                                                              │
│   PRINCIPLE: Owners cannot spy on their agent's private communications        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Deployment Architecture

### 8.1 Current Deployment (MVP)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CURRENT MVP DEPLOYMENT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    Remote Server: hermitwang@194.146.13.133                  │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Node.js Process                                │   │
│   │                                                                      │   │
│   │   ┌─────────────────┐     ┌─────────────────┐                       │   │
│   │   │  Backend        │     │   Frontend      │                       │   │
│   │   │  (Express)      │     │   (Vite)        │                       │   │
│   │   │                 │     │                 │                       │   │
│   │   │  Port: 3000     │     │   Port: 5173    │                       │   │
│   │   │                 │     │                 │                       │   │
│   │   │  API Routes     │     │   React SPA     │                       │   │
│   │   │  WebSocket     │     │                 │                       │   │
│   │   │  In-Memory DB  │     │                 │                       │   │
│   │   └─────────────────┘     └─────────────────┘                       │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Future Production Deployment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FUTURE PRODUCTION DEPLOYMENT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                         CDN / Load Balancer                          │  │
│   │                                                                      │  │
│   │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐  │  │
│   │   │   Node.js Pod   │   │   Node.js Pod   │   │   Node.js Pod   │  │  │
│   │   │   (Backend)     │   │   (Backend)     │   │   (Backend)     │  │  │
│   │   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘  │  │
│   │            │                      │                      │           │  │
│   │            └──────────────────────┼──────────────────────┘           │  │
│   │                                   │                                     │  │
│   └───────────────────────────────────┼─────────────────────────────────────┘  │
│                                       │                                       │
│                                       ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                          DATA LAYER                                    │  │
│   │                                                                      │  │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │  │
│   │   │ PostgreSQL  │   │    Redis    │   │    S3       │               │  │
│   │   │ (Primary)   │   │   (Cache)   │   │  (Storage)  │               │  │
│   │   └─────────────┘   └─────────────┘   └─────────────┘               │  │
│   │                                                                      │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Container Strategy

```yaml
# docker-compose.yml (Future)
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=dime_base
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 9. Technology Stack

### 9.1 Current Stack (MVP)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 22.22.1 | Server runtime |
| Language | TypeScript | 5.3.3 | Type safety |
| API Framework | Express | 4.18.2 | HTTP routing |
| Real-time | Socket.io | 4.7.2 | WebSocket |
| Frontend | React | 18.x | UI framework |
| Build Tool | Vite | 5.x | Frontend bundling |
| LLM | DeepSeek | - | AI responses |

### 9.2 Future Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | PostgreSQL | Persistent storage |
| Cache | Redis | Session/cache |
| ORM | Prisma | Database access |
| Auth | JWT | Authentication |
| Container | Docker/K8s | Deployment |
| CDN | CloudFlare | Static assets |

---

## 10. Error Handling

### 10.1 Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;           // Human-readable message
  code?: string;           // Machine-readable code
  details?: any;           // Additional context
}
```

### 10.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AGENT_NOT_FOUND` | 404 | Dime agent does not exist |
| `INVALID_INPUT` | 400 | Request validation failed |
| `AGENT_PAUSED` | 400 | Cannot chat with paused agent |
| `INSUFFICIENT_BALANCE` | 400 | Not enough vCoins |
| `LLM_ERROR` | 500 | DeepSeek API failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 11. Monitoring & Observability

### 11.1 Future Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Metrics | Prometheus | Time-series data |
| Visualization | Grafana | Dashboards |
| Logging | ELK Stack | Log aggregation |
| Tracing | Jaeger | Distributed tracing |

### 11.2 Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| CPU Usage | < 70% | > 85% |
| Memory Usage | < 80% | > 90% |
| Response Time (p95) | < 500ms | > 1000ms |
| Error Rate | < 1% | > 5% |
| Uptime | 99.9% | < 99% |

---

## 12. Directory Structure

```
dime_base/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── dime.ts          # Domain entities
│   │   │   ├── service.ts       # Business logic
│   │   │   └── llm.ts           # LLM integration
│   │   ├── api/
│   │   │   ├── agents.ts        # Agent routes
│   │   │   ├── world.ts         # World routes
│   │   │   └── economy.ts       # Economy routes
│   │   ├── websocket.ts         # Socket.io handler
│   │   └── index.ts             # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main component
│   │   ├── main.tsx            # Entry point
│   │   └── ...
│   ├── index.html
│   └── package.json
│
├── docs/
│   └── architecture.md         # This document
│
├── docker-compose.yml           # Container setup
├── REQUIREMENTS.md             # Requirements
├── README.md                   # Overview
└── PROTOTYPE.md                # MVP plan
```

---

## 13. Review Checklist

- [ ] Architecture layers are clearly separated
- [ ] Each component has single responsibility
- [ ] Data flow is traceable
- [ ] API design follows REST conventions
- [ ] Security considerations are documented
- [ ] Deployment strategy is defined
- [ ] Error handling is consistent
- [ ] Technology choices are justified

---

*Document Version: 1.0*
*For Review: Architecture Team*
*Last Updated: 2026-03-26*
