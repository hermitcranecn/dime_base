# dime_base — Risk Register

**Maintained by:** Dime — the project skeptic (role defined in `VISION.md` §9)
**Started:** 2026-10-10 · **Companion to:** `VISION.md`, `PHILOSOPHY.md`

**The rule of this file:** every entry states an **assumption** · how it **turns back** ·
the cheapest way to **falsify** it. A risk with no falsifier is not a risk — it's a fear.
Give it a test or drop it.

**Status key:** `OPEN` (unverified) · `TESTING` · `CLOSED-pass` · `CLOSED-fail` · `GUARDED`

---

## Survival risks — the project lives or dies here

### R1 · The enrichment assumption *(load-bearing)*
- **Assumption:** a lived agent **durably** enriches its owner's real life.
- **Turn-back:** week 4 feels like week 1 — the novelty is spent, the "second life" is just
  a chat log, the moat evaporates.
- **Falsifier:** the §7 one-week experiment, judged honestly, with the answer fixed *in
  advance* — *"did my life get bigger?"*
- **Status:** `OPEN` — untested. **The whole project is a bet on this.**

### R2 · Novelty decay / slop
- **Assumption:** the dime's life keeps producing *surprising, coherent, owner-relevant*
  experience over **weeks**.
- **Turn-back:** the life becomes predictable repetition — the failure mode of nearly every
  "agent society" demo.
- **Falsifier:** instrument for repetition across weeks. The design must **manufacture**
  surprise (stakes, other dimes, real-world effect) — not hope for it.
- **Status:** `OPEN`

### R3 · Decision risk — the dial *(highest-leverage)*
- **Assumption:** a settable line between owner-control and dime-independence can be found
  that feels both *alive* and *owned*.
- **Turn-back:** both directions fail — too much control → a tool with no life; too much
  independence → a stranger, not yours.
- **Falsifier:** build the smallest dial with two settings; ask the owner which felt right.
- **Status:** `CLOSED-pass` — **decided 2026-10-10: default posture *Steward***, trajectory deferred
  past v1 (`VISION.md` §4). The two-directional guard stays live: the default must not be
  *Careful*, or the dime has no life and R3 fails the other way.

---

## Guardrails — if broken, we're building the wrong product

### R4 · Drift into "another AI companion"
- **Assumption:** utility + ownership stay load-bearing enough to keep this distinct from the
  AI-companion wave (Replika, Character.ai).
- **Turn-back:** the life becomes the point and the work falls away → crowded, ethically
  fraught market, wrong edge.
- **Guard:** delegation and the dial stay central; the dime must still *do real things and be
  bounded by you*.
- **Status:** `GUARDED`

### R5 · Society cold-start
- **Assumption:** a single owner + single dime is enriching *before* any crowd exists.
- **Turn-back:** "another life" is thin with no peers — and the instinct is to build the
  society early, which is the classic trap.
- **Guard:** hold the delegation-first sequencing; add density only once the single loop
  works.
- **Status:** `GUARDED`

### R6 · The unresolved "who for"
- **Assumption:** the audience (personal sandbox / invited circle / public product) can stay
  undefined for now.
- **Turn-back:** the three have **opposite** risk profiles (privacy, scale, distribution);
  building for one while aiming at another wastes the work.
- **Falsifier:** ask the owner. (Pending — deferred by the owner, 2026-10-10.)
- **Status:** `OPEN`

### R7 · Enrich vs. replace (escapism)
- **Assumption:** mixing the real and digital worlds enriches the real one.
- **Turn-back:** it slides into *substitution* — the digital life crowds out the real one. The
  founding philosophy even flirts with this ("meaning migrates to the virtual"); we take the
  opposite stance on purpose.
- **Guard:** `VISION.md` §6 — **enrich, don't replace.** A dime that makes its owner withdraw
  is a failure, however engaging.
- **Status:** `GUARDED`

---

## Design risks — from the dial audit (2026-10-10)

### R8 · Auto-widening runs away
- **Assumption:** a dime's freedom can widen automatically as trust is earned.
- **Turn-back:** a dime that grants itself more rope is unaccountable — the whole "yours" property
  dies.
- **Guard:** widening thresholds are the **owner's**, rate-limited, visible, and reversible; the
  dime may *request* freedom, never grant it. *(Deferred — not built in v1.)*
- **Status:** `GUARDED`

### R9 · One dial is blunt
- **Assumption:** a single axis expresses what owners actually want.
- **Turn-back:** owners want per-domain control (tight on money, loose on social); one dial quietly
  over-permits or underwhelms.
- **Guard:** ship one dial for v1; add per-domain overrides only if the experiment demands it. Don't
  build the matrix before we have one user.
- **Status:** `GUARDED`

### R10 · The gate's judgment errs
- **Assumption:** "irreversible / binding" can be classified correctly.
- **Turn-back:** classifying it is itself an LLM judgment; a miss lets the dime commit the owner
  *irreversibly* on its own.
- **Guard:** default to **ask** when unsure; log every gate decision for later audit. A false-ask
  is cheap; a false-decide is expensive.
- **Status:** `GUARDED`

---

## Watch-list (not yet a risk — track it)

- **Trust/safety before real-world action.** A dime acting on the owner's behalf can err;
  escalation + *protect-owner* must be real before it touches anything that matters. (Also the
  industry's unsolved problem — and the reason this could be more than a toy.)
- **Founder bandwidth.** A product that produces a *feeling* needs iteration on taste, not
  features. If this becomes a feature grind, it dies quietly.

---

*Update this file as we learn. Changing a `Status` is the most important commit we'll make.*
