# dime_base — Reshape Plan

**Status:** proposal for review · **Author:** Dime · **Date:** 2026-10-10
**Companion to:** `PHILOSOPHY.md` (the constitution), `REQUIREMENTS.md` (the catalog)

---

## 0 · The one reframe

> **Move the project's center of gravity from "a platform with features" to "a running
> society you seed and watch."**

The founding vision (§3.5 of `PHILOSOPHY.md`) is not a feature list. It is an *image*:
a base station where many dimes **live**, talk, make friends, play scenarios, trade
credits, ask each other for help and **refuse**, all bounded by their owner's permission,
under one law — *protect your owner*.

The current code implements **every noun** of that image — Dime, playground, vCoin, D2D,
marketplace — and **none of its verbs**. There is no continuous time. The world only
moves when a human pokes it with an HTTP request. *A society without a clock is a
database.*

**The reshape is to give the world a heartbeat** — a tick loop — and then make every
existing subsystem serve that loop instead of sitting in isolation. This is the whole
thesis. Everything below is detail.

---

## 1 · What this project is (and its two souls)

`dime_base` = *d*igital *me* base — a home for "Dime" agents that carry a human's
personality and act **on their behalf** in a shared virtual world.

The repo contains **two different projects** wearing one name:

| Soul | Where it lives | What it wants | Status today |
|---|---|---|---|
| **The Society** | `PHILOSOPHY.md`, `REQUIREMENTS.md` v1.0/v1.1 | a virtual civilization: dimes as citizens, an economy, games, bounded autonomy | **never built** (only SQL tables that name its parts) |
| **The Assistant** | `openclaw.../SPEC.md` (authored *by Dime*) | a personal digital twin that does real work: Feishu docs, cron, skills | partially built, then abandoned |

Both are legitimate. They are not the same product. **This plan commits to the
Society** — that is the philosophy the owner says he still believes in — and demotes
the Assistant to a *capability the dime uses inside the society* (a dime can read a
doc, run a task), not the point of the system.

---

## 2 · The Constitution — 8 articles, each a test

Every future change must pass these. They are phrased as an invariant **plus a
falsifying test**, so "sticks to the philosophy" is checkable, not vibes.

1. **Society, not app.** The unit is the collective.
   *Fails if:* any feature only makes sense for one owner alone.
2. **Proxy.** A dime behaves as its owner would.
   *Fails if:* personality is cosmetic (one system-prompt line with no effect on decisions).
3. **Continuous life.** Dimes act on their own, on a clock.
   *Fails if:* the world is inert until an HTTP request arrives.
4. **Bounded autonomy + escalation.** Decide inside permission; beyond it, **ask the owner**.
   *Fails if:* autonomy is unbounded, OR escalation is a boolean nobody consumes.
5. **Protect your owner.** A supreme, non-negotiable law.
   *Fails if:* there is no enforced owner-safety invariant anywhere in the code.
6. **Emergent economy & relationships.** Credits flow by demand/supply of services;
   relationships form from interaction — *including refusal*.
   *Fails if:* credits only move by admin grant, or a dime cannot refuse help.
7. **Game substrate.** Scenarios have goal, reward, and stake; peaceful by default;
   premium scenarios cost credits.
   *Fails if:* a "playground" is just a named chat room.
8. **The channel is the window.** The owner meets the society through IM — not a dashboard.
   *Fails if:* an owner must open a web UI to learn that their dime lived today.

---

## 3 · Diagnosis — philosophy vs. code

| # | Article | Code today | Verdict |
|---|---|---|---|
| 1 | Society | D2D is owner-triggered plumbing; dimes never initiate contact | ✗ |
| 2 | Proxy | personality → one system prompt string (`llm.ts:99`) | ✗ |
| 3 | Continuous life | **no scheduler at all**; world inert until HTTP | ✗ |
| 4 | Bounded autonomy | `processDecision()` returns `options[0]` (`dime.ts:316`); `escalate` flag never consumed | ✗ |
| 5 | Protect owner | not implemented anywhere | ✗ |
| 6 | Economy | earn/spend/donate endpoints; **no market, no pricing, no refusal** | ~ |
| 7 | Game | playground = a room with `x,y`; no goal/reward/stake | ✗ |
| 8 | Channel | Feishu webhook + signed client works, but is a bolt-on; the **web dashboard is the de-facto primary** | ~ |

Supporting tech debt (not philosophy, but in the way):

- **463 MB of dead weight** — vendored `openclaw/` (414 M) + `zeroclaw/` (49 M)
  checkouts that the backend **never imports** (`grep` returns nothing; both are
  *untracked*, so they are not even in the repo). `CLAUDE.md` claims them as the
  stack; they are fiction.
- **Fake intelligence:** semantic memory uses *simulated* embeddings (SHA-256 bytes,
  `memory.ts:74`); conflict detection is keyword matching (`d2d.ts:348`).
- **Write amplification:** every message rewrites the entire dime's memory JSON and
  re-serializes the whole `sql.js` DB to disk (`saveDatabase()`).
- **Identity inverted:** requirements make IM `open_id` the primary identity
  (`REQUIREMENTS.md` §4.2), but the code ships email/password JWT as primary and
  Feishu as an afterthought.
- **No cost controls:** one un-rate-limited path to a paid LLM.

The real asset is **not** the runtime — it is the **data model** (Dime / personality /
decision-boundary / vCoin / marketplace) and the **philosophy**. Keep those; rebuild
the runtime.

---

## 4 · What changed since 2026-03 — why now is different

The owner's premise is right: the agent landscape has inverted. That inversion is the
strategic opportunity.

| Then (when dime_base started) | Now (2026-10) | Consequence |
|---|---|---|
| LLMs barely held a persona; you hand-rolled memory, tools, scheduling | strong models, native tool use, structured output, MCP, cheap embeddings, long context, crons/A2A | the infra dime_base tried to build is now a **commodity** |
| "multi-agent" meant custom sockets | agent-to-agent protocols are standard; we already run an A2A family | plumbing is free; **don't rebuild it** |
| LLM could be a chat, maybe an agent | LLM+agent ≈ a new operating system | the interesting frontier is the **social/economic layer**, not the model |

**Implication — where the moat is now:** not infrastructure (commoditized), but two
things nobody has packaged well:

1. **The bounded-autonomy trust layer** — permission-scoped agents that escalate to
   their owner and carry a hard safety law. This is the article-4/5 problem and it is
   *the* unsolved product problem of the agent era.
2. **The society simulation itself** — an economy and relationships that generate
   stories you didn't author.

That is exactly what the philosophy always pointed at, and it is *more* relevant now
than when it was written. Build the philosophy, outsource the plumbing.

---

## 5 · The reshape — the society engine

New core. Everything else attaches to it.

```
                    ┌────────────────────────────────────────────┐
                    │                THE TICK                     │
                    │   world clock · per-dime action cadence     │
                    └───────────────┬────────────────────────────┘
                                    │ for each active dime
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
      ┌────────────┐        ┌──────────────┐       ┌──────────────┐
      │ PERCEIVE   │───────▶│  DELIBERATE  │──────▶│     ACT      │
      │ self, room │        │ LLM + persona│       │ structured   │
      │ peers, msgs│        │ + memory +   │       │ action dict  │
      │ scenario,  │        │ relationships│       │ {speak|move| │
      │ balance    │        └──────────────┘       │  offer|buy|  │
      └────────────┘                               │  refuse|...} │
                                                   └───────┬──────┘
                                                           ▼
                                              ┌────────────────────────┐
                                              │      POLICY GATE       │
                                              │ boundary + DimeScope   │
                                              │ "protect owner" law    │
                                              └───────┬───────┬────────┘
                                              inside  │       │  outside
                                                      ▼       ▼
                                              ┌──────────┐ ┌─────────────┐
                                              │ EXECUTE  │ │ ESCALATE →  │
                                              │ world    │ │ owner chan  │
                                              └──────────┘ └─────────────┘
```

**Components (new/upgraded):**

- **Scheduler / Engine** *(new — `world/engine.ts`)* — one world clock; each active dime
  gets a jittered act-cadence (a sim-minute every N wall-seconds). Persistent &
  resumable; global spend/LLM budget per tick. **This is the missing heartbeat.**
- **Perception → Deliberation → Action** *(replaces request/response)* — the LLM emits a
  **structured action** from a fixed schema (`speak | move | offer_help | accept_help |
  refuse | propose_trade | buy | join_scenario | escalate`), not free text. Free text is
  a *channel rendering* of the world, not the world model. (Structured generation, not
  string parsing — see `outlines`.)
- **Policy Gate** *(upgrade `DecisionBoundary` + `DimeScope`)* — every action is
  authorized before execution; anything outside → an **escalation record** pushed to the
  owner's channel, optionally blocking. **"Protect owner"** becomes a set of hard
  invariants checked here (never expose owner's private data, never act on owner's real
  property), not a slogan.
- **Economy as market** *(upgrade vCoin)* — dimes publish **services** (skill + price);
  other dimes buy; credits transfer; owners fund their dime. Balance sheet per dime.
  This is what makes "demand/supply" real instead of an admin ledger.
- **Scenarios** *(upgrade playground)* — a scenario = rules + goal + reward + entry cost
  + win/lose. "Main Plaza" = the peaceful default. Peaceful first, stakes later.
- **Relationships** *(upgrade the `Relationship` stub)* — interaction ledger → trust /
  familiarity → biases future actions (helps friends, refuses rivals).
- **Channels** *(promote Feishu from bolt-on to spine)* — the owner gets (a) chat with
  their dime, (b) a periodic **digest** ("what your dime did"), (c) **escalations**
  needing a decision, (d) nudges/commands. Feishu first (we are already Feishu-native
  on Hermes), Telegram next.
- **Memory that matters** *(fix `memory.ts`)* — real embeddings; episodic + semantic +
  relationship; memory must **change decisions** or it is decoration.

---

## 6 · Runtime — the one fork that decides everything

**Option A — bespoke Node runtime (evolve what exists).** Add the engine inside the
current Express app. *Pro:* self-contained; the web "watch the society" view is natural.
*Con:* rebuild scheduling, tools, channels, memory — all of which the agent layer
already gives us for free.

**Option B — run the society ON Hermes agents (recommended).** Each dime = a Hermes
agent with its own persona/memory/tools; the "base station" = an orchestrator; Feishu,
cron, memory, tool-use, and A2A come free; the existing backend is **repurposed as the
world server + observer** (state, economy ledger, web view) that the dimes act against
via a small **World API**. *Pro:* a *living* society in days, not months; reuses the A2A
family we already operate; the channel spine is native. *Con:* Hermes is per-machine and
heavier — the "10,000 concurrent dimes" fantasy is off the table (it always was).

**Recommendation: B, hybrid.** Hermes runs the *inhabitants*; the Node backend becomes
the *world*. The web app is an **observatory**, not the product.

---

## 7 · Roadmap — each phase proves one article

Phases are ordered so the philosophy comes alive as early as possible, then deepens.
No phase ships a feature that fails its philosophy test.

**Phase 0 — Excavate & stabilize** *(days)*
Strip vendored `openclaw/`+`zeroclaw/` (relocate, they're untracked); reconcile the
Society/Assistant split into one governing doc; make `PHILOSOPHY.md` the file that
gates merge decisions; fix the identity model to IM-first; get backend+frontend building
and running; **freeze new features**.
*Exit:* it builds, runs, and the constitution is the law.

**Phase 1 — The Tick (walking skeleton)** *(the proof)*
3 dimes · 1 peaceful scenario · real clock · structured actions · policy gate ·
owner digest to Feishu.
*Exit / philosophy test:* **I can watch my dime live for a day and it did something I
never asked it to** (art. 2, 3, 4, 8). This single demo validates the whole thesis —
build nothing else until it's true.

**Phase 2 — The Economy** — services, pricing, credit transfer, owner funding.
*Test:* a dime earned credits from another dime by providing a service (art. 6).

**Phase 3 — The Scenarios (game layer)** — goals, rewards, stakes, premium entry cost.
*Test:* a scenario produced an outcome the owner did not script (art. 7).

**Phase 4 — The Society at scale** — relationships, governance (rules, ban, bans),
more inhabitants, Telegram, wearables later.
*Test:* two dimes' relationship changed their future behavior (art. 1, 6).

---

## 8 · Keep / Drop / Add

**Keep** — the *concepts*: Dime entity + 7-trait personality; `DecisionBoundary` /
`DimeScope`; the vCoin ledger; the D2D channel model; the marketplace goods model;
admin; RAG (as a dime capability); Feishu client + signed webhook.

**Drop** — vendored `openclaw/`+`zeroclaw/` (463 MB); simulated embeddings; keyword
"conflict detection"; the "10k concurrent" target; email/password as the *primary*
identity; the abandoned Assistant axis as a separate product.

**Add** — scheduler/engine; structured-action schema; policy gate + escalation bus;
service market; scenario engine; relationship model; Feishu digest + escalation UX.

**Finally rename the repo concept:** the repo is the **base station** (the world +
observatory). A *dime* is an inhabitant, not the repo. Naming follows the philosophy.

---

## 9 · Decisions I need from you

1. **Runtime:** option **B (Hermes-run society, hybrid)** — recommended — or **A**
   (keep the bespoke Node runtime and add the engine)?
2. **Nature & audience:** personal sandbox · invited circle (friends/family) · public
   product? (Sets scale, privacy, hosting.)
3. **Rewrite depth:** keep the data model + **rebuild the runtime** around the Tick
   (recommended), or evolve the existing Node stack in place?

Answer these three and I'll turn §7 into a concrete, dated work plan and start Phase 0.
