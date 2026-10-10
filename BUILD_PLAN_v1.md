# dime_base — First-Build Plan v1: "One Living Dime"

**Status:** `PROVISIONAL` · **Date:** 2026-10-10
**Tests:** R1 (does a lived agent durably enrich its owner?) and R2 (does the life survive past week 1?)
**Governed by:** `DECISIONS.md` (all PROVISIONAL) and `RISKS.md`. Companion to `VISION.md` §7.

---

## 0 · The one question — fixed in advance

> **After 7 days, does the owner feel they got a second life?**

Everything below exists to answer that and nothing else. The answer is written *before* we run, so we
cannot rationalize it afterward.

---

## 1 · In one line

We don't build a society to test a society. We build **one dime · one real goal · one week** — the
smallest thing that still contains the whole loop (**Delegate → Live → Reflect**).

---

## 2 · Setup

| Element | v1 choice |
|---|---|
| **Owner** | Hermit (the only owner) |
| **Dime** | one agent carrying the owner's personality (proxy, art. 2) |
| **Stake** | **one real goal the owner cares about** — open-ended, pursuable in daily steps (D-6) |
| **World** | minimal: the dime + the tools it can use + its own notes. **No peers yet** — the society is the first *extension*, not the first experiment |
| **Channel** | Feishu |
| **Dial** | **Steward** (D-4) |
| **Duration** | 7 days |

---

## 3 · The loop — one day in the dime's life

Each day the dime runs one cycle, on its own:

1. **Perceive** — read its goal, its progress notes, its memory, what it did yesterday.
2. **Deliberate** — decide today's move toward the goal (LLM + personality; its *own* judgment, not a checklist).
3. **Act** — do real work: search, read, write notes/files, use tools. *This is the delegation half — the dime actually works.*
4. **Log** — append everything to a raw **event log** (the truth behind the reflection — R12).
5. **Gate** — if it wants an action that is irreversible, binds the owner, or leaves the envelope → **escalate** (Steward, §4 of VISION).

Then, in the evening:

6. **Reflect** — compose **one Feishu message, in the dime's voice**: one thing it did on its own (surprise), one thing that serves the owner, a real-world touch, and any escalation. Sent only if it clears the R11 guard — *a surprise, a real-world touch, or an escalation, else nothing goes out.*

The owner's reply steers the next day. That is the whole product, at week-one scale.

---

## 4 · What we build (deliberately minimal)

We are testing the **experience**, not the product architecture (D-0 / D-1). So we build almost nothing new:

- **The dime** — a single agent with a persona, memory, and tools.
- **The tick** — a once-a-day autonomous run of the loop above (scheduled).
- **A world-state** — its goal, its notes, its event log (plain files are fine).
- **The reflection** — a daily composer that turns the day's log into the Feishu message.
- **The gate** — the Steward escalation check.

**Stack — recommended `PROVISIONAL` (D-8):** run the dime on the agent runtime we already operate,
reusing memory, tools, scheduling, and the Feishu channel. Fastest path to a *living* dime, and **not**
a patch to the legacy dime_base. The product's own modern stack is a **separate, later** build (D-1),
started only if the experiment passes.

---

## 5 · What we do NOT build (scope guard)

No economy, no marketplace, no multiple dimes, no society, no admin, no web UI, no auth, no second
owner. **If it isn't needed to answer §0, it's out.** (Those are future layers — not now.)

---

## 6 · Success criteria (pre-registered)

**Primary — the only one that decides:** at day 7 the owner answers §0 with a clear **yes**.

**Secondary signals (corroborating):**
- he opened the reflection on most days;
- he replied / engaged at least twice during the week;
- the dime surfaced **at least one thing he didn't know or would have missed**;
- the dime did **at least one thing he never instructed** (proof of art. 3 — continuous life).

---

## 7 · Kill criteria (pre-registered)

Kill, or redesign **before** investing further, if by day 7 the anti-signals dominate:
- the reflections read like a **log** (R11), and he stops opening them;
- the dime **only did what he told it** — no surprise, no life;
- it felt like **"a tool with a diary"** — delegation with extra steps (R4 drift);
- he never gave it a **real goal**, or the goal collapsed into a checklist.

---

## 8 · How we judge

Tiny and honest: the owner writes **one line a day** (optional) and a **short answer at day 7** to §0.
No analytics theater. The verdict is his — but the *criteria* are fixed here, so the verdict is fair.

---

## 9 · Timeline

| Day | What |
|---|---|
| **D0** | set up: the dime, the goal, the tick, the reflection, the log |
| **D1–D7** | run — the dime lives; he reads |
| **D7** | judge against §6 / §7 |
| **D8** | verdict → scale, redesign, or stop |

---

## 10 · Constitution check

- **v1 exercises:** art. 2 (proxy) · art. 3 (continuous life) · art. 4 (bounded autonomy + escalation) · art. 5 (protect owner — the gate) · art. 8 (channel is the window).
- **v1 defers:** art. 1 (society — one dime) · art. 6 (economy) · art. 7 (game). *Deliberately.*

---

## 11 · Input needed from the owner (one thing)

**Pick the goal (the stake).** Candidates from the owner's real life:

1. **Domestic MCU competitive dossier** — a living intelligence file on the 15 vendors (ties to his real work + the opps pipeline).
2. **A market / portfolio thesis** — the dime tracks and pressure-tests one hypothesis he holds.
3. **A study-abroad logistics goal** — the dime advances a concrete piece of T's application process.

Or any real goal of his choosing. The only rule (§5.2): **open-ended, real, pursuable in small daily
steps, and something he would enjoy watching pursued.**

---

*This plan exists to be falsified. If day 7 says **no**, that is a success — we learned cheaply.*
