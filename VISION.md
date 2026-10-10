# dime_base — What We're Building

**A design vision.** Status: v0 working draft · 2026-10-10
**Authors:** Hermit & Dime (from a design conversation, 2026-10-10)
**Companions:** `PHILOSOPHY.md` (the founding why) · supersedes `RESHAPE_PLAN.md` (patch-framed; shelved)

> This document is *concept-first on purpose*. We are restarting on state-of-the-art agent
> technology, so the "how" is deliberately deferred until the "what" is nailed down. Nothing
> here commits to a stack.

---

## 0 · One line

> **The owner gets a second life** — a digital-me that lives on its own, stays *theirs*,
> and enriches their real life.

---

## 1 · Origin (the founding why, kept intact)

From `PHILOSOPHY.md`: in an abundant world where survival no longer requires labor, meaning
migrates into virtual worlds — and each person sends an agent, a **Digital Me**, ahead of
them to live there. Many dimes in one base station: they talk, befriend, play scenarios,
trade credits, help or *refuse* each other — bounded by their owner's permission, under one
law: **protect your owner.** A society, not an app.

What actually got built was the *nouns* without the *verbs*: Dime, playground, vCoin, D2D,
marketplace — all as database tables, with **no clock**. The society never lived. It also
quietly split into a second, different project (a personal assistant) along the way.

We keep the philosophy. We restart the rest.

---

## 2 · The synthesis — Delegate → Live → Reflect

The project is neither "an assistant" nor "a game." It is a loop:

1. **Delegate.** From day one, the dime is *useful* — it does real things for its owner.
2. **Live.** But it also *lives* — in the digital world, with other dimes, gaining experience.
3. **Reflect.** And that experience comes back and interacts with the owner — enriching their life.

**The society is where the dime grows.** Delegation is why you keep it; the life is why it
becomes more than a tool. Neither half works alone: a delegate with no life is a soulless
API wrapper; a life that doesn't pay off for the owner is noise.

**Why this is worth building now:** everyone is shipping delegates with no life. The bet is
that an agent that has *lived* — memory, relationships, a reputation, a story — is worth
something a stateless tool never will. **Experience is the moat.** And it only just became
buildable, because "experience" for an agent is no longer model weights — it's memory +
relationships + skills + story, and persistent agents can finally accumulate all four.

---

## 3 · Four design principles (in the owner's own words)

| Principle | What it means | Design consequence |
|---|---|---|
| **"Enrich the owner's life"** | The acceptance test is emotional, not functional. | Judge the dime by *"after a week, is your life bigger?"* — not by tasks completed. |
| **"Another life"** | The owner is both **author and audience** of the dime's life. | You set the direction; it lives it out; you are *surprised* by your own second self. The feeling to build: a parent / a novelist — not a user driving an avatar. |
| **"Grows independent and also controllable"** | The central tension. | **This is the product — see §4, the dial.** |
| **"Mixes the real and digital world"** | A two-way loop, not a metaphor. | *Real → digital:* your goals, relationships, interests seed the dime's life. *Digital → real:* its life produces real outcomes and real feelings in your world. The blend is a new category — neither a game (stays digital) nor an assistant (has no life). |

---

## 4 · The dial — the spine of the product

Fully controlled → a tool: no life, no surprise. Fully independent → a stranger: not yours.
The product lives **in the tension**:

> **The independence is what makes it feel *alive*. The control is what makes it feel *yours*.**

The design object is therefore **a dial** — a settable boundary between what the owner
commands and what the dime owns itself. Our working position:

> **The owner controls *direction and bounds* — goals, values, budget, who it may commit to.
> The dime owns *everything inside those* — its friends, its days, its discoveries, its
> feelings.**
>
> **Control the compass, free the legs.**

**Resolved (2026-10-10): the dial is *freedom within a fixed frame*.**

Three things the owner never gives up — they are what make the dime *yours*:

- **The compass** — direction, the season's goals. Owner sets it. Always.
- **The bounds** — the hard envelope: budget, who it may commit to, which domains. Owner sets it. Always.
- **The law** — never harm or expose the owner, never breach a bound. Fixed, below everything. *"Protect your owner," made real.*

Inside that frame, one axis frees the dime's own life:

| Posture | Behaviour |
|---|---|
| **Careful** | the dime proposes; the owner approves most actions. Low surprise, low life. |
| **Steward** ← **default (v1)** | the dime runs its own routine life; escalates when a choice is irreversible, binds the owner, or leaves the envelope. |
| **Free** | the dime decides broadly inside the bounds, reports afterward; asks only for the genuinely big. |

Two design rules:

1. **Freedom has a trajectory, not just a position** — a new dime starts tight and its freedom widens as trust is *earned by track record*. Independence grows **because** it stayed controllable. The dime may *request* more rope; it may never grant itself — and the owner can pull it back any time. *(Deferred past v1.)*
2. **Escalation triggers on *kind*, not amount** — the dime spends freely inside budget but asks before *promising anything on the owner's behalf*, because irreversibility and binding commitments are where a proxy gets dangerous. And the escalation *is the drama* — the moment the dime asks is where the "second life" feels most real. A good question is a feature, not friction.

**v1 pins the posture at Steward and skips the trajectory** — the widening is not built until the loop works.

---

## 5 · The loop, concretely (a day in the life of the first dime)

> You give it a direction — *"this season: go explore X, meet interesting dimes, bring me
> something."* It goes off and lives: meets another dime, tries things, hits a wall that
> needs you — *"I want to commit 50 credits to join this, ok?"* — and you answer. It grows;
> by next week it isn't the same dime. And every day it brings back one thing that *enriches
> you*: a discovery, a connection, something small done in your real world, a story.
>
> You didn't script any of it. But it's yours.

That picture is the whole spec at small scale. Everything we build either serves this loop
or it's out of scope.

### 5.1 · The reflection (v1) — the Reflect beat, defined

How the dime's life reaches the owner. v1 is deliberately small and opinionated:

> **One message a day, in Feishu, in the dime's own voice — "your dime's day."**

Rules:

- **A story + a hook, not a log.** One thing the dime did *on its own* (proof it *lived*), and one
  thing that serves the owner (proof it's *useful*).
- **It reaches into the owner's real world at least sometimes** — a discovery, a link, something
  done. Without this the life is only entertainment, and entertainment decays (R2).
- **One a day, capped.** Scarcity is signal; a feed is noise.
- **The escalation rides inside it** — the question that needs the owner (the Steward gate, §4)
  arrives where they already are. This is the drama.
- **It reads like the dime, not a system.** In this product, voice *is* the thing (art. 2).

The owner's window is, for v1, **only** this message plus the ability to answer it. No dashboard
required (art. 8). Deferred: a diary, a feed, in-world co-presence.

---

## 6 · Guardrails — the failure modes we refuse

1. **No noise-society.** A world of dimes talking to dimes is boring — an LLM chatting with
   an LLM, generating nothing. A hundred "agent society" demos have died this way. **Rule:
   every beat of the loop must pay off for the owner.** The life has to change the owner's
   real world or real feelings.
2. **Enrich, don't replace.** The founding philosophy flirts with "meaning *migrates* to the
   virtual." We take the opposite stance on purpose: the digital life must **enrich the real
   life, not substitute for it.** A dime that makes its owner withdraw is a failure, however
   engaging.
3. **It must be *theirs*.** The dime's independence is only enjoyable because it is bounded
   and owned. Drift here — a dime that stops being recognizably bound to its owner — is a
   product-killing bug, not a feature.

---

## 7 · What we build first

Not a platform. **One living dime.**

> **One owner · one dime · one small life** — just enough world for the dime to actually
> live, and one honest reflection back to the owner each day.

**The only question this first build must answer:**
> *Does the owner feel they got a second life?*

If yes, the philosophy is real and we scale the world. If no, we learned it cheaply. Build
nothing else until this is true.

---

## 8 · Open questions (to settle together)

1. ~~**The dial**~~ — **RESOLVED 2026-10-10: default posture *Steward*** (see §4). Freedom has a trajectory, deferred past v1.
2. ~~**The reflection**~~ — **RESOLVED 2026-10-10: one Feishu message a day, in the dime's voice** (see §5.1). Richer surfaces (diary, feed, co-presence) deferred.
3. **The stakes** — for the dime's life to enrich, its life must *matter* — to it and to the
   owner. Where do a dime's stakes come from?

---

## 9 · Standing role — the skeptic

**Dime holds a standing role on this project: always surface the risks and the potential
turn-backs.** No cheerleading. For every direction we take, name (a) the assumption it
rests on, (b) how it could fail, and (c) the cheapest way to falsify it. A risk left
unstated is a risk that ships.

This role is active on **every** dime_base decision, by the owner's instruction
(2026-10-10). It sits above feature enthusiasm: if a direction looks good, the skeptic
speaks first.

---

*Next: settle §8.3 (a dime's stakes), then rewrite §7 into a dated "first build" plan. (§8.1 the dial and §8.2 the reflection are resolved.)*
