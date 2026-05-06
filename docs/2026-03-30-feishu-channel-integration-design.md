# Feishu Channel Integration Design

**Version**: 1.0
**Date**: 2026-03-30
**Status**: For Review

---

## 1. Overview

**Goal**: Connect owner to dime via Feishu IM as the primary interface. Owner never touches email/password — Feishu is their identity and experience.

**Principles**:
- One owner = one dime = one Feishu channel
- Feishu bot IS the dime's interface
- All owner-facing features (chat, config, marketplace) work via Feishu
- Web admin panel available via Feishu OAuth login

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Owner (Feishu)                          │
│                                                                 │
│   Finds dime_base Bot in Feishu                                │
│   Scans QR to link (or sends first message)                    │
│   Chats with their dime via DM                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Feishu Protocol
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    dime_base Platform                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FeishuAdapter ←→ Gateway ←→ MessageRouter               │  │
│  │     (receives/sends)    (routes)   (dime lookup)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Dime Service (chatWithDime, LLM, Memory)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  owner_channels table (open_id → owner_id → dime_id)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**One Feishu app for all dimes**: All owners install the same dime_base bot. dime_base routes messages by `open_id`.

---

## 3. Feishu App Setup

**What**: A single Feishu Lark App with Bot capability, created under the developer's Feishu account.

**Capabilities enabled**:
- Bot (1:1 messaging)
- Message permissions (read/send messages)

**How it works**:
- Owner adds the app via Feishu (search or QR)
- Owner approves "Allow this app to send you messages"
- dime_base tracks owner identity via `open_id`

---

## 4. Owner Registration & Linking

### 4.1 New Owner (Channel-First)

```
Owner opens Feishu
         ↓
Finds dime_base Bot
         ↓
Sends first message (any message)
         ↓
dime_base:
  - Creates owner (UUID)
  - Creates dime for this owner
  - Links owner_id ↔ feishu open_id in owner_channels (external_id = open_id)
         ↓
Bot replies with onboarding:
  "Hi! I'm your digital me. Answer a few questions to set my personality..."
         ↓
Personality questionnaire via conversation
         ↓
Dime is ready
```

**No email, no password, no web registration.**

### 4.2 QR Code Linking Flow (Alternative)

```
Owner (logged into dime_base web)
         │
         │ clicks "Connect Feishu"
         ▼
dime_base generates session_id + QR code
         ↓
Owner scans QR with Feishu
         ↓
Feishu opens bot chat
Owner sends any message
         ↓
Bot extracts open_id, sends to dime_base:
  POST /link/verify { session_id, open_id }
         ↓
dime_base links owner_id ↔ open_id
         ↓
Web poll returns "Linked!"
```

**Use case**: If owner already has a dime (registered differently) and wants to link Feishu.

### 4.3 Existing Owner (Web Login)

```
Owner visits dime_base web
         ↓
Clicks "Login with Feishu"
         ↓
Feishu OAuth approval page
         ↓
On approval, dime_base:
  - Gets open_id from Feishu
  - Checks if owner exists (by open_id)
  - If new: creates owner + dime (same as 4.1)
  - If existing: logs in
         ↓
JWT issued for web session
```

---

## 5. Authentication

### 5.1 Feishu Identity = Owner Identity

Owner has **no email/password**. Identity is their Feishu `open_id`.

- `open_id` is stable per app + user combination
- Stored in `owner_channels.external_id`
- Never changes unless owner reinstalls the app

### 5.2 Web Login (Feishu OAuth)

Owners who want to access web admin panel use Feishu OAuth:

```
GET /auth/feishu          → Redirect to Feishu OAuth
GET /auth/feishu/callback → Code exchange → get open_id
                            → Issue JWT
```

### 5.3 API Authentication for Bots/Services

- Feishu webhook requests verified via signature
- Internal API calls use JWT (for web clients)

---

## 6. Database Schema

### 6.1 New Table: `owner_channels`

```sql
CREATE TABLE owner_channels (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL UNIQUE,
  channel_type TEXT NOT NULL,       -- "feishu"
  external_id TEXT NOT NULL,        -- Feishu open_id
  external_name TEXT,               -- Display name in Feishu
  status TEXT DEFAULT 'active',      -- "active" | "paused" | "unlinked"
  created_at TEXT NOT NULL,
  last_message_at TEXT,
  UNIQUE(channel_type, external_id)
);
```

### 6.2 Modified: `owners` Table

Remove `email` and `password_hash` columns (or keep nullable for future fallback).

```sql
CREATE TABLE owners (
  id TEXT PRIMARY KEY,
  -- email TEXT,                    -- Nullable, for fallback only
  -- password_hash TEXT,            -- Nullable, for fallback only
  -- password_salt TEXT,
  created_at TEXT NOT NULL,
  last_login TEXT
);
```

### 6.3 Feishu Config (Environment)

```bash
FEISHU_APP_ID=cli_xxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
FEISHU_BOT_TOKEN=                  # Bot token, obtained via OAuth
```

---

## 7. Gateway & Message Routing

### 7.1 Gateway Endpoint

```
POST /webhooks/feishu
```

Receives all messages from Feishu bot. Signature verified via Feishu request validation.

### 7.2 Message Router

```
open_id from Feishu message
         ↓
Lookup owner_channels by external_id
         ↓
Get owner_id
         ↓
Get dime by owner_id
         ↓
chatWithDime(dime_id, message)
         ↓
Response
         ↓
FeishuAdapter.send(open_id, response)
```

### 7.3 Handling Unregistered Owners

If `open_id` not in `owner_channels`:
- Treat as new owner → run registration flow (Section 4.1)
- Bot sends onboarding message

---

## 8. Owner Features via Feishu

### 8.1 Chat (Primary)

Owner sends message → Dime responds via LLM.

```
Owner: "Hi, how are you?"
Bot:   "Hey! I'm doing great, thanks for asking..."
```

### 8.2 Commands

All features accessible via slash commands in Feishu:

| Command | Description |
|---------|-------------|
| `/chat [message]` | Chat with dime (default when no command) |
| `/config` | Show current dime configuration |
| `/config set [key] [value]` | Update config setting |
| `/marketplace` | Browse marketplace |
| `/buy [item]` | Purchase item |
| `/sell [item]` | List item for sale |
| `/status` | Show dime status (active/paused) |
| `/help` | Show available commands |

**Command detection**: Messages starting with `/` are commands. All other messages are chat with dime.

### 8.3 Web Admin Panel

Owner can also login via Feishu OAuth to web admin for:
- Dime configuration (personality, decision boundary)
- Marketplace
- Playground management

Web is optional — Feishu is primary.

---

## 9. Feishu Adapter Interface

```typescript
// backend/src/channels/feishu.ts

export interface FeishuCredentials {
  appId: string;
  appSecret: string;
  botToken?: string;
}

export interface FeishuIncomingMessage {
  msg_type: string;          // "text", "image", "audio"
  content: string;           // JSON string with text/media
  open_id: string;           // Sender's open_id
  open_ids?: string[];       // For group messages
  chat_id: string;          // Conversation ID
  message_id: string;
  create_time: string;
}

export class FeishuAdapter implements ChannelAdapter {
  readonly type = 'feishu';

  async init(credentials: FeishuCredentials): Promise<void>;
  async start(): Promise<void>;       // Start webhook server
  async stop(): Promise<void>;

  parseMessage(payload: any): InboundMessage;
  verifySignature?(payload: any, headers: any): boolean;
  async send(msg: OutboundMessage): Promise<void>;
}
```

---

## 10. Error Handling

| Scenario | Handling |
|----------|----------|
| Feishu webhook fails | Return 200 to Feishu (avoid retry storm), log error |
| Owner not found | Trigger new owner registration flow |
| Dime not found | Create dime automatically |
| LLM call fails | Bot replies "I'm having trouble thinking right now, try again" |
| Feishu API rate limit | Queue messages, retry with backoff |

---

## 11. File Structure

```
backend/src/
├── channels/
│   ├── adapter.ts           # ChannelAdapter interface
│   ├── registry.ts          # ChannelRegistry
│   └── feishu.ts            # FeishuAdapter
├── gateway/
│   ├── index.ts             # Gateway class
│   └── router.ts            # MessageRouter
├── api/
│   ├── webhooks.ts          # POST /webhooks/:channelType
│   └── auth.ts              # Feishu OAuth endpoints
├── agents/
│   └── service.ts           # chatWithDime (unchanged interface)
└── database.ts              # Add owner_channels table
```

---

## 12. Implementation Phases

### Phase 1: Core (This Sprint)
1. Define `ChannelAdapter` interface
2. Implement `FeishuAdapter` (receive + send)
3. Add `owner_channels` table
4. Webhook endpoint `/webhooks/feishu`
5. Message routing (open_id → dime)
6. New owner registration via Feishu message
7. Basic chat flow

### Phase 2: Commands (Next Sprint)
1. Parse `/config`, `/marketplace`, `/status` commands
2. Web Feishu OAuth login
3. Link existing owner via QR

### Phase 3: Polish
1. Personality questionnaire via conversation
2. Error handling improvements
3. Rate limiting

---

## 13. Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| One bot or many? | One bot (app) for all owners |
| Registration via web? | No — channel-first, no email/password |
| Web login for Feishu owners? | Yes — Feishu OAuth |
| Config/marketplace via web? | Yes — Feishu OAuth + web, plus Feishu commands |
| Privacy (E2E encryption)? | Short term: acceptable (cloud). Long term: TBD |
| Telegram? | After Feishu, same architecture |
| WeChat? | After Feishu, higher complexity |

---

## 14. References

- Gateway-channel doc: `/home/hermitwang/Projects/dime_base/docs/gateway-channel.md`
- Existing dime_base auth: `backend/src/api/auth.ts`, `backend/src/agents/auth.ts`
- Existing D2D channel pattern: `backend/src/agents/d2d.ts`
