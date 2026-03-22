# Session Report — 2026-03-22

## dime_base — Digital Human Base Station

---

## Commits Made (8 total)

| # | Commit | Description |
|---|--------|-------------|
| 1 | `74e5061` | Auto-create data directory on database init |
| 2 | `3579825` | Add missing `tsconfig.node.json` for Vite config |
| 3 | `e25b44a` | Add missing `index.css` for frontend |
| 4 | `87200f4` | Fix frontend to use relative API URLs via Vite proxy |
| 5 | `c4284a1` | Fix Socket.io auth call — use `emit('auth')` not `socket.auth()` |
| 6 | `1d622d0` | Fix LLM role mapping: convert `'owner'` to `'user'` for DeepSeek API |
| 7 | `4365a05` | Fix `addMemory` sender mapping: user role maps to `'user'` not `'owner'` |
| 8 | `9b28d21` | Add `'user'` to Message sender type to match LLM API expectations |

---

## Problems Fixed

### 1. Backend Persistence — In-Memory Maps → SQLite

All data was stored in in-memory `Map` objects. Server restart = all data lost.

**Solution:** Replaced with `sql.js` (pure JavaScript SQLite, no native compilation). Created `backend/src/database.ts` with 5 tables:

- `dimes` — Agent storage
- `playgrounds` — Virtual world spaces
- `agent_locations` — Agent positions
- `accounts` — vCoin balances
- `transactions` — Economy audit trail

Data persisted to `backend/data/dime_base.db`.

**Files changed:** `backend/src/database.ts` (new), `backend/src/agents/dime.ts`, `backend/src/api/world.ts`, `backend/src/api/economy.ts`, `backend/src/index.ts`

---

### 2. WebSocket Duplicate Event Handler

`websocket.ts` registered `message_to_dime` twice (lines 63 and 76). In Socket.io, only the first handler fires — dime-to-dime communication was dead.

**Solution:** Renamed the second handler to `dime_to_dime`.

---

### 3. Data Directory Missing

`database.ts` tried to write `backend/data/dime_base.db` but the directory didn't exist.

**Solution:** Added auto-creation of the data directory on init:
```typescript
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
```

---

### 4. sql.js Type Declarations

`sql.js` doesn't ship TypeScript types. The module had implicit `any` errors.

**Solution:** Created `backend/src/sql.js.d.ts` with type declarations. Used `require()` instead of ES import to avoid runtime conflicts.

---

### 5. Frontend Missing Files

Two files were missing from the repo:
- `frontend/tsconfig.node.json` — required by Vite 5 for compiling `vite.config.ts`
- `frontend/src/index.css` — imported by `main.tsx`

---

### 6. Frontend Wrong API URL

Hardcoded `http://localhost:3000` in `App.tsx`. When accessed from a remote browser, this pointed to the user's own machine, not the server.

**Solution:**
- REST calls: use relative URLs (`/api`) that route through Vite's proxy
- Socket.io: configurable `VITE_BACKEND_URL` env var (defaults to `http://localhost:3000`)
- Created `frontend/.env` on remote with `VITE_BACKEND_URL=http://194.146.13.133:3000`

---

### 7. Socket.io Auth Method

`App.tsx` called `socket.auth(userId)` — `socket.auth` is a Socket.io v3+ **property**, not a method. This caused `TypeError: socket?.auth is not a function`.

**Solution:** Changed to `socket.emit('auth', userId)` to match the server's event listener.

---

### 8. DeepSeek API Role Validation

DeepSeek API rejects `'owner'` as a message `role`. The code stored `sender: 'owner'` in conversation history, then sent it directly to the LLM, causing:

```
unknown variant `owner`, expected one of `system`, `user`, `assistant`, `tool`
```

**Solution:**
1. Changed `addMemory` in `dime.ts` to store `sender: 'user'` instead of `'owner'`
2. Added `'user'` to the `Message.sender` type union in the interface

---

## Dependency Changes

**`backend/package.json`**

| Action | Package | Reason |
|--------|---------|--------|
| Removed | `better-sqlite3` | Failed to compile — requires Python 3.8+, system has 3.7 |
| Removed | `redis` | Listed but never used |
| Added | `sql.js` ^1.14.1 | Pure JS SQLite, no native compilation |

---

## .gitignore Updates

Added:
- `backend/data/` — SQLite database files
- `backend/dist/` — TypeScript build output
- `frontend/.env` — Environment variables (contains API key)

---

## Server Configuration

### Remote Server: `194.146.13.133`

**Backend `.env`** (`backend/.env`):
```
DEEPSEEK_API_KEY=sk-85222d0c21614e8b962ad088bf94f2a3
DEEPSEEK_MODEL=deepseek-chat
PORT=3000
NODE_ENV=development
```

**Frontend `.env`** (`frontend/.env`):
```
VITE_BACKEND_URL=http://194.146.13.133:3000
```

---

## Running Services

| Service | URL | Command |
|---------|-----|---------|
| Backend | `http://194.146.13.133:3000` | `npx ts-node-dev --respawn src/index.ts` |
| Frontend | `http://194.146.13.133:5173` | `npx vite --host 0.0.0.0 --port 5173` |

---

## How to Test

1. Open `http://194.146.13.133:5173` in browser
2. Enter a user ID (e.g., `test_user`)
3. Click **Start** — creates an agent or retrieves existing one
4. Type messages and chat with your AI agent (powered by DeepSeek LLM)
