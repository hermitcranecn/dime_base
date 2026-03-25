# dime_base Module Architecture

**Version:** 1.0
**Date:** 2026-03-26
**Status:** Architecture Reference

---

## 1. High-Level Module Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              dime_base                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│   │   FRONTEND   │────▶│   BACKEND   │────▶│  EXTERNAL   │                │
│   │   (React)    │◀────│  (Express)  │◀────│  (DeepSeek) │                │
│   └─────────────┘     └──────┬──────┘     └─────────────┘                │
│                              │                                             │
│         ┌────────────────────┼────────────────────┐                       │
│         ▼                    ▼                    ▼                        │
│   ┌───────────┐        ┌───────────┐        ┌───────────┐              │
│   │  AGENTS   │        │   WORLD   │        │  ECONOMY  │              │
│   │  MODULE   │◀──────▶│  MODULE   │        │  MODULE   │              │
│   └───────────┘        └───────────┘        └───────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Breakdown

dime_base has **3 core modules** + **1 frontend**:

| Module | Purpose | Main Files |
|--------|---------|------------|
| **Agents** | Digital person AI | `dime.ts`, `service.ts`, `llm.ts` |
| **World** | Virtual playgrounds | `world.ts` |
| **Economy** | vCoin transactions | `economy.ts` |
| **Frontend** | React UI | `App.tsx`, `main.tsx` |

---

## 3. How Agents Module Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENTS MODULE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐            │
│   │  dime.ts    │◀──────│ service.ts  │──────▶│    llm.ts   │            │
│   │  (Domain)   │       │ (Business)  │       │   (LLM)     │            │
│   │             │       │             │       │             │            │
│   │ • Dime      │       │ • create    │       │ • callLLM   │            │
│   │ • Memory    │       │ • get       │       │ • generate  │            │
│   │ • Person-   │       │ • chat      │       │ • decide    │            │
│   │   ality     │       │ • decide    │       │             │            │
│   │             │       │ • status    │       │             │            │
│   └─────────────┘       └──────┬──────┘       └─────────────┘            │
│                                │                                          │
│                                ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                      IN-MEMORY STORE (Map)                           │ │
│   │                                                                      │ │
│   │   dimes: Map<dimeId, Dime>                                          │ │
│   │                                                                      │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Flow Example: Chat with a Dime**

```
User sends "Hello"
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  REST API   │────▶│  service.ts │────▶│    llm.ts   │────▶│  DeepSeek   │
│ agents.ts   │     │ chatWith    │     │ generate    │     │    API      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                                        │
                           │                                        │
                           ▼                                        │
                    ┌─────────────┐                                 │
                    │  dime.ts    │                                 │
                    │ addMemory   │                                 │
                    └─────────────┘                                 │
                           │                                        │
                           ▼                                        │
                    ┌─────────────┐                                 │
                    │    Store    │◀────────────────────────────────┘
                    │ (Map)      │        Response stored
                    └─────────────┘
```

---

## 4. How World Module Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORLD MODULE                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       world.ts (API + Store)                          │   │
│   │                                                                      │   │
│   │   ┌─────────────────┐    ┌─────────────────┐                        │   │
│   │   │  REST Routes    │    │  Playground Store │                       │   │
│   │   │                 │    │                  │                        │   │
│   │   │ GET  /world/    │    │ playgrounds: Map │                        │   │
│   │   │ POST /world/    │    │ <id, Playground> │                       │   │
│   │   │ POST /enter     │    │                  │                        │   │
│   │   │ POST /exit      │    └─────────────────┘                        │   │
│   │   │ POST /location  │                                               │   │
│   │   └─────────────────┘                                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   Playground: {                                                             │
│     id, name, type,         Agent Registry:                                 │
│     agents[], maxAgents      currentPlayground: Map<agentId, playgroundId>   │
│   }                                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Agent enters playground:**

```
User says: Enter "Gaming Arena"
       │
       ▼
┌─────────────┐
│  world.ts   │
│ POST /enter │────▶ Find playground by ID
└─────────────┘           │
                          ▼
                   Add agentId to playground.agents[]
                          │
                          ▼
                   Update agent's currentPlayground
                          │
                          ▼
                   Return success + updated playground
```

---

## 5. How Economy Module Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ECONOMY MODULE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      economy.ts (API + Store)                          │   │
│   │                                                                      │   │
│   │   ┌─────────────────┐    ┌─────────────────┐                        │   │
│   │   │  REST Routes    │    │  Account Store   │                       │   │
│   │   │                 │    │                  │                        │   │
│   │   │ GET  /balance   │    │ accounts: Map   │                        │   │
│   │   │ POST /earn      │    │ <userId,        │                        │   │
│   │   │ POST /spend    │    │   Account>      │                        │   │
│   │   │ POST /donate   │    │                  │                        │   │
│   │   │ POST /exchange │    └─────────────────┘                        │   │
│   │   └─────────────────┘                                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   Account: { balance, transactions[], tier }                                │
│                                                                              │
│   Transaction: { id, type, amount, timestamp, description }                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Donate flow:**

```
User donates $5
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ economy.ts  │────▶│ Add bonus   │
│ POST /donate│     │ vCoins      │
└─────────────┘     │ based on    │
                    │ tier        │
                    └─────────────┘
                          │
                          ▼
                   Record transaction
                    type: "donate"
                          │
                          ▼
                   Update account.balance
```

---

## 6. How WebSocket Fits In

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WEBSOCKET (Real-time)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                         ┌─────────────┐                 │
│   │   Client    │◀───────────────────────▶│  websocket  │                 │
│   │  (Browser)  │      Socket.io          │    .ts      │                 │
│   └─────────────┘                         └──────┬──────┘                 │
│                                                    │                       │
│                     ┌──────────────────────────────┘                       │
│                     │                                                      │
│                     ▼                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                        ROOMS                                          │ │
│   │                                                                      │ │
│   │   user:${userId}    → One room per user (private messages)          │ │
│   │   dime:${dimeId}    → One room per agent (agent events)             │ │
│   │                                                                      │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   Events:                                                                   │
│   • Client → Server: auth, join_dime, message_to_dime, dime_to_dime         │
│   • Server → Client: dime_message, dime_status, typing, online_dimes       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Request Flow: Full Example

**"Chat with my Dime"**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: HTTP Request                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   POST http://localhost:3000/api/agents/abc123/chat                        │
│   Body: { "message": "Hello!" }                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Express Router                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   index.ts routes request to:                                               │
│   agents.ts → router.post('/:dimeId/chat', chatHandler)                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Service Layer                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   service.ts → chatWithDime({ dimeId: 'abc123', message: 'Hello!' })       │
│                                                                              │
│   1. Get dime from store: dimes.get('abc123')                              │
│   2. Add user message to memory                                             │
│   3. Build conversation history                                             │
│   4. Call LLM                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: LLM Integration                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   llm.ts → generateAgentResponse(personality, history, 'Hello!')            │
│                                                                              │
│   1. Build system prompt with personality traits                            │
│   2. Send to DeepSeek API                                                  │
│   3. Return AI response                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Response                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   { "response": "Hello! How can I help you today?",                        │
│     "dime": { "id": "abc123", "name": "MyDime", "status": "active" } }   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Module Interaction Summary

```
          ┌──────────────────────────────────────────────────────────────┐
          │                         FRONTEND                              │
          │                  (React + Vite on port 5173)                 │
          └────────────────────────────┬─────────────────────────────────┘
                                     │ HTTP / WebSocket
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express on port 3000)                    │
│                                                                            │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                         index.ts                                   │  │
│   │                    (Entry point, mounts routers)                   │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                    │                    │                  │             │
│                    ▼                    ▼                  ▼             │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│   │    agents.ts      │  │    world.ts      │  │   economy.ts     │   │
│   │    (REST API)     │  │    (REST API)    │  │    (REST API)   │   │
│   └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬────────┘   │
│             │                       │                      │              │
│             ▼                       ▼                      ▼              │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                        service.ts                                 │  │
│   │                 (Business Logic Layer)                           │  │
│   │                                                                  │  │
│   │   createDimeAgent()   │   createPlayground()   │   earn()       │  │
│   │   getDimeAgent()      │   enterPlayground()    │   spend()      │  │
│   │   chatWithDime()      │   exitPlayground()     │   donate()     │  │
│   │   decideWithDime()    │   updateLocation()     │   exchange()   │  │
│   └───────────────────────┴───────────────────────┴─────────────────┘  │
│             │                       │                      │              │
│             ▼                       ▼                      ▼              │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                         dime.ts                                   │  │
│   │                    (Domain Entities)                              │  │
│   │                                                                  │  │
│   │   Dime Entity      │  Playground Entity  │  Account Entity       │  │
│   │   Personality      │  Agent Registry     │  Transaction          │  │
│   │   Memory           │                     │                       │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│                                    ▼                                      │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                    IN-MEMORY STORES (Map)                         │  │
│   │                                                                  │  │
│   │   dimes: Map<string, Dime>                                       │  │
│   │   playgrounds: Map<string, Playground>                            │  │
│   │   accounts: Map<string, Account>                                  │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│                                    ▼                                      │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                         llm.ts                                   │  │
│   │                   (External Integration)                          │  │
│   │                                                                  │  │
│   │                  DeepSeek API                                    │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Key Design Patterns

| Pattern | Where Used | Benefit |
|---------|-----------|---------|
| **Layered Architecture** | API → Service → Domain | Separation of concerns |
| **Repository Pattern** | In-memory Maps | Data access abstraction |
| **Service Layer** | service.ts | Business logic reusable |
| **Factory/Builder** | `createDime()` | Object creation encapsulated |
| **Adapter Pattern** | llm.ts | External API wrapped |

---

## 10. File Structure Reference

```
dime_base/
├── backend/
│   └── src/
│       ├── index.ts              # Entry point, Express setup
│       ├── websocket.ts          # Socket.io real-time handler
│       │
│       ├── agents/
│       │   ├── dime.ts          # Domain: Dime entity, Memory, Personality
│       │   ├── service.ts       # Business: createDime, chat, decide
│       │   └── llm.ts           # External: DeepSeek API integration
│       │
│       ├── api/
│       │   ├── agents.ts        # REST routes: /api/agents/*
│       │   ├── world.ts         # REST routes: /api/world/*
│       │   └── economy.ts        # REST routes: /api/economy/*
│       │
│       └── (in-memory stores)
│
├── frontend/
│   └── src/
│       ├── App.tsx              # Main React component
│       └── main.tsx             # React entry point
│
└── docs/
    ├── architecture.md          # Technical architecture document
    └── module-architecture.md   # This file
```

---

## 11. Communication Flow Summary

| Component | Communicates With | Via |
|-----------|------------------|-----|
| Frontend | Backend REST API | HTTP |
| Frontend | Backend WebSocket | Socket.io |
| agents.ts | service.ts | Direct function call |
| service.ts | dime.ts | Direct function call |
| service.ts | llm.ts | Direct function call |
| llm.ts | DeepSeek API | HTTP (node-fetch) |
| world.ts | In-memory store | Map operations |
| economy.ts | In-memory store | Map operations |

---

*Document Version: 1.0*
*Last Updated: 2026-03-26*
