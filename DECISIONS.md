# dime_base — Decision Log

**Purpose:** a record of decisions *as decisions* — what we chose, why, what it assumes, and
**what would make us reverse it**. Kept so we can come back. Append-only: supersede, never delete.

**Status key:** `ACCEPTED` (decided — act on it) · `PROVISIONAL` (decided but unproven — hold
lightly, watch the revisit-trigger) · `SUPERSEDED` (replaced by a later entry) · `OPEN` (undecided)

> ⚠️ **Everything below is `PROVISIONAL`.** It was decided on a *vision* basis on **2026-10-10
> with no experiment run** — and the owner flagged doubt about the direction the same day. Treat
> these as our best current guesses, not settled fact. Each carries the trigger that would make us
> revisit it.

---

## D-0 · Design concept-first; defer the stack
**Status:** `PROVISIONAL` · 2026-10-10
- **Decision:** settle *what* before *how*; restart on state-of-the-art agent tech once the vision is fixed.
- **Assumes:** the bottleneck right now is product clarity, not technology.
- **Revisit if:** the design stalls with no buildable shape — then pick the stack to force concreteness.

## D-1 · Restart, don't patch
**Status:** `PROVISIONAL` · 2026-10-10
- **Decision:** rebuild fresh; keep only the philosophy + the data model; drop the legacy Node runtime and the vendored bloat.
- **Assumes:** the legacy code has *negative* value — it embodies the wrong shape.
- **Revisit if:** the data model proves load-bearing enough that a migration beats a clean build.

## D-2 · The synthesis — Delegate → Live → Reflect
**Status:** `PROVISIONAL` · 2026-10-10
- **Decision:** starts as delegation (utility day 1); the dime also lives and gains experience; the experience reflects back.
- **Assumes:** owners want **both** — a useful agent *and* a lived one — and the two reinforce.
- **Revisit if:** owners use only one half. E.g. they use the tool and ignore the reflection → the synthesis is wrong; retreat to delegation-only, or push harder on the life.

## D-3 · Purpose — enrich, don't replace
**Status:** `PROVISIONAL` · 2026-10-10
- **Decision:** the digital life must enrich the real one, never substitute for it.
- **Assumes:** people want their real life made *bigger*, not escaped.
- **Revisit if:** users demonstrably *prefer* substitution (escapism) — then we're against the market and must decide whether to follow.

## D-4 · The dial — Steward default
**Status:** `PROVISIONAL` · 2026-10-10
- **Decision:** owner holds compass + bounds + law; the dime runs its life *inside*; escalates on *kind*, not amount; trajectory deferred past v1.
- **Assumes:** "freedom within a fixed frame" feels both *alive* and *owned*.
- **Revisit if:** the §7 experiment shows Steward feels *dead* (too tight) or *unsafe* (too loose) — see `RISKS.md` R3.

## D-5 · The reflection — one Feishu message a day
**Status:** `PROVISIONAL` · 2026-10-10
- **Decision:** a single daily, dime-voiced message — a story + a hook, escalation inside; no dashboard.
- **Assumes:** one high-signal message beats a feed; the channel *is* the window.
- **Revisit if:** it decays into a log (`RISKS.md` R11) or the owner wants more surface — then add a diary / feed.

## D-6 · The stakes — the owner's real goal
**Status:** `PROVISIONAL` · 2026-10-10
- **Decision:** the dime pursues one real thing the owner cares about; that is what its life is *for*.
- **Assumes:** owners will hand over a real goal and enjoy watching it pursued.
- **Revisit if:** owners won't give a real goal, or the goal collapses into a task (`RISKS.md` R4 drift).

## D-7 · Audience
**Status:** `OPEN` · deferred 2026-10-10
- **Decision:** none yet — personal sandbox / invited circle / public product all remain live options.
- **Why deferred:** the three have opposite risk profiles (privacy, scale, distribution).
- **Must be decided:** before any real build. Trigger: the owner answers.

---

*To change course, add a new entry that supersedes an old one — never edit history.*
