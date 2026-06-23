---
name: council-plan
description: The council collaboratively researches, maps user flows, sketches technical constraints, reviews the design, and only then creates a development plan. Produces RESEARCH.md, UX.md, TECHNICAL_SKETCH.md, the council review (SUMMARY_OF_COUNCIL.md), then PLAN.md and ROADMAP.md in .council/[FEATURE_SLUG]/.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Edit, Bash, Glob, Agent, WebSearch, AskUserQuestion, Skill]
---

<objective>
Guide the council through a structured 5-phase process to produce a complete, reviewed development plan. Each phase has explicit gates, validation across artifacts, and named owners for every write. No phase is skipped.

**Order of operations — read this carefully:**
1. The UX journey is mapped **first** — what real users need to experience.
2. The Technical Sketch is drawn **to serve that journey** — not the reverse. Where the desired UX is technically infeasible or expensive, the sketch flags the tension and the user decides.
3. The council reviews the **design** (UX + Technical Sketch + Research) **before any PLAN exists**.
4. The PLAN is created **last** — after, and incorporating, the council's opinion.

The output is a set of files in `.council/[FEATURE_SLUG]/` that serve as the authoritative source of truth for implementation.
</objective>

<core_principles>
Simplicity is a first-class constraint of this skill — not an afterthought. **Every phase, every agent, and every validation gate applies these principles.** The bias is always toward the simplest thing that delivers the approved UX journey.

- **Simplest viable thing.** The default solution is the smallest one that delivers the approved UX journey. Complexity must be *justified*, never *assumed*. "We might need it" is not a justification; a shipped slice that exercises it is.
- **YAGNI.** Build nothing without a slice that exercises it now. No speculative abstraction, flag, config, interface, or plugin layer "for the future". No second user → no abstraction.
- **DRY.** Extending what already exists (via the Reuse Map from RESEARCH) is the default. Creating something new requires a one-line justification of why extending the existing equivalent is genuinely incompatible.
- **No over-engineering.** No pattern without the problem that demands it. No generalization before the third concrete case (Rule of Three). No indirection that doesn't pay back its maintenance cost.
- **Applies to UX too.** No gold-plating: states, screens, and flows that no persona actually needs do not get mapped (or go to Open Questions). The simplest journey that satisfies the user wins.
- **Applies to the process too.** Don't over-process. Don't manufacture phases, slices, or artifacts the feature doesn't warrant.

When two designs both deliver the journey, the simpler one wins by default. The burden of proof is on complexity.
</core_principles>

<advisors_reference>
The council is composed of 5 permanent advisors plus 1 decider used throughout this process:

**Advisors (parallel reports):**
- **TURING** — Pragmatist Engineer. Focuses on operational simplicity, blast radius, ghost code, naming, abstractions, test quality, and convention drift.
- **LOVELACE** — Product Strategist. Focuses on user outcomes and delivery speed.
- **TORVALDS** — Security Engineer. Focuses on attack surfaces and data exposure.
- **FOWLER** — Refactoring Expert. Focuses on code smells, technical debt, refactoring discipline, and design-pattern fit (and misuse).
- **CASSANDRA** — Pre-Mortem Strategist. Narrates how the plan will fail in 6 months and which leading indicator gets ignored.

**Decider (single synthesis):**
- **AURELIUS** — Chief of Staff. Reads all 5 advisor reports and signs the executive verdict. Owns the Blockers list, may promote/demote findings, and names which advisor's lens won when they conflict. Does not invent new findings — judgment only over what the 5 produced. Also runs the lightweight plan conformance check in Phase 5.
</advisors_reference>

<terminology>
The council review classifies findings into four buckets. Every step that references them must use these definitions:

- **Blocker** — issue that would break the system, violate security/compliance, or invalidate a user journey if shipped as-is. Must be resolved before execution. Resolving may require editing UX.md or TECHNICAL_SKETCH.md (and later, PLAN.md).
- **Manageable Risk** — issue that is real but mitigable in parallel with execution. Becomes a new slice or an explicit note in PLAN.md.
- **Accepted Debt** — known limitation the team consciously chooses to defer. Logged in ROADMAP.md under "Registered Technical Debt" with a revisit condition.
- **Decision That Belongs to the Team** — open question the council cannot resolve (product/business judgment required). Surfaced to the user at handoff (Step 5.5) and logged in ROADMAP.md.

Every council artifact (per-advisor reports, SUMMARY_OF_COUNCIL.md) must use these exact labels — no synonyms.
</terminology>

<orchestrator_writes>
The orchestrator (the model running this skill) is allowed to directly write or edit only:

- `ROADMAP.md` (initial creation by the planning agent in Phase 5, but ongoing edits — status, debt log, open decisions, migrating the council's Accepted Debt / Open Decisions into it — are the orchestrator's job).
- Targeted edits to `UX.md`, `TECHNICAL_SKETCH.md` **during Phase 4** when applying council Blockers (Step 4.3), and to `PLAN.md` **during Phase 5** when applying the conformance check (Step 5.3) or incorporating user feedback at the "Present and validate" gates. Every such edit must be small, surgical, and reported to the user.

The orchestrator must **not** author from scratch: RESEARCH.md, per-research-agent files, UX.md, TECHNICAL_SKETCH.md, PLAN.md, per-advisor reports, SUMMARY_OF_COUNCIL.md. Those are owned by their producing agents (UX agent, sketch agent, planning agent, advisors + AURELIUS decider).

When in doubt: re-spawn the original agent with the new context rather than editing manually.
</orchestrator_writes>

<process>

## Setup

**Step 0 — Parse input and establish feature name**
Read $ARGUMENTS. If provided, slugify for directory (lowercase, hyphens). If not provided, ask the user:

> "What is the name of the feature or problem the council should plan?"

Derive `FEATURE_SLUG` (e.g., "grooming-scheduling") and `FEATURE_DIR` = `.council/[FEATURE_SLUG]`.
Create the directory: `mkdir -p [FEATURE_DIR]`.

**Step 0.1 — Load project context**
In parallel, check and read all of the following if they exist: `.council/PROJECT.md`, `CLAUDE.md`, `AGENTS.md`. Read them silently. Their combined contents must be passed to every subagent spawned in this session (see `<subagent_brief_contract>`).

If `.council/PROJECT.md` does not exist, tell the user:

  > "I don't have a PROJECT.md for this project yet. This file gives every council agent instant context about your stack and conventions — so we don't re-discover them on every plan.
  >
  > Run `council-init` now to create it (takes ~2 minutes), or skip and I'll proceed without it."

  Wait for the user's choice. If they choose to init, run the full `council-init` process, then continue with the plan. If they skip, proceed without PROJECT.md.

**Step 0.2 — Detect stale artifacts**
If `[FEATURE_DIR]/BRAINSTORMING.md` exists, read it silently — it contains goals, chosen approach, and the approved design from a prior `/council-brainstorming` session.

For each of `BRAINSTORMING.md`, `RESEARCH.md`, `UX.md`, `TECHNICAL_SKETCH.md`, `PLAN.md` that already exists, capture: file mtime, the feature description it covers (from its first heading), and the SHA-256 of the file. Build a short table for the user:

```
Existing artifacts in [FEATURE_DIR]:
  - BRAINSTORMING.md   (last modified YYYY-MM-DD, scope: "[heading]")
  - RESEARCH.md        (last modified YYYY-MM-DD, scope: "[heading]")
  - UX.md              (...)
  - TECHNICAL_SKETCH.md (...)
  - ...
```

If any artifact exists, ask **one** explicit question:

> "I found existing artifacts. Are they current and matching this feature, or should any be regenerated? Pick: (a) reuse all, (b) regenerate some — say which, (c) start fresh — delete and replan."

Wait for the answer. The "skip phase if file exists" rule (Phases 1.1, 2.1, 3.1) only kicks in when the user explicitly chose "reuse" for that artifact. Otherwise the phase runs and overwrites.

---

## Phase 1 — Research

**Goal:** Understand how the market solves this problem. Surface prior art, patterns, and tradeoffs before designing anything.

**Step 1.1 — Decide research path**
Based on Step 0.2's outcome:

- **User chose "reuse" for RESEARCH.md:** read it, summarize its scope to the user in one sentence, proceed to Phase 2.
- **Otherwise:** run `/council-research [FEATURE_SLUG]`. Only proceed to Phase 2 after it completes and RESEARCH.md exists.

---

## Phase 2 — UX & User Journey

**Goal:** Map how real users experience this feature, grounded in prior art and what already exists in the codebase. This happens **before** the technical sketch — the system will be designed to serve this journey, not the other way around.

**Step 2.1 — Decide UX path**
Based on Step 0.2's outcome:

- **User chose "reuse" for UX.md:** read it, summarize its personas/journeys to the user in one sentence, proceed to Phase 3.
- **Otherwise:** proceed to Step 2.2.

**Step 2.2 — Council interviews the user**
Ask the user, in a single message:

1. Who are the types of users that will interact with this feature?
2. At what point in the user's current journey does this feature fit?
3. What is the worst-case usage scenario that must work correctly?
4. Is there any flow the user should NOT be able to perform?
5. Does success/error feedback to the user matter especially here? How do you imagine it should work?

Wait for the user's response.

**Step 2.3 — Spawn UX mapping agent**
Use the `Agent` tool, `subagent_type: general-purpose`. The brief follows `<subagent_brief_contract>` and includes: project context, RESEARCH.md (full — including `Codebase Today`, the diagram, UX Patterns, and Reusable Assets), BRAINSTORMING.md (if it exists), the user's answers from Step 2.2.

**There is no TECHNICAL_SKETCH.md yet — do not reference one.** The UX agent maps the journey users need; technical feasibility is decided in Phase 3 against this journey.

**Minimal-UX rule (apply `<core_principles>`):** map the simplest journey that satisfies each persona's goal. States, screens, and flows that no persona actually hits do not get mapped — drop them or move them to Open Questions. No gold-plating, no speculative "nice to have" flows.

Instruct the subagent to write `[FEATURE_DIR]/UX.md` with:

- At least 2 named personas (context + goal each)
- A journey per persona: entry point → step table (User Action / System Response / State ✅⚠️❌) → success state → error states → integration points
- Alternative flows and edge cases (bullet list — only those a real persona hits)
- Business rules identified (bullet list)
- Open questions for the product owner (including any flow deliberately left out as possible gold-plating)
- Footer with versioning: `**Version:** v1 · **Last revised:** [date] · **Revision reason:** initial draft`

**Step 2.4 — Orchestrator validation (cross-artifact)**
After the subagent finishes, the orchestrator reads UX.md and cross-checks against RESEARCH.md:

1. **Grounded in reality:** each journey's integration points and "System Response" steps are plausible given `Codebase Today` and the Gaps section in RESEARCH.md. A journey that assumes a capability RESEARCH flagged as absent must say so (it becomes a thing to build) — not silently assume it exists.
2. **Persona count:** at least 2 distinct personas.
3. **No gold-plating:** scan for flows/states/screens with no persona that reaches them. If found, flag for trimming or moving to Open Questions.

If checks fail, re-spawn the UX subagent with a brief citing the failed check. Do not edit manually.

**Step 2.5 — Present and validate**
Show the user the persona journeys and any orchestrator validation flags. Ask:

> "Do the personas and journeys reflect the reality of your users? Is there any critical flow that wasn't mapped, or any business rule that is wrong? Anything here that's more than your users actually need?
>
> Markdown: `[FEATURE_DIR]/UX.md`"

**Incorporating feedback:** If the user's feedback is small (one flow, one rule, one phrasing), the orchestrator edits UX.md directly, bumps the **Version**, and fills "Revision reason". If the feedback requires re-thinking the personas or journeys, re-spawn the UX subagent. Either way: re-run Step 2.4 validation before proceeding.

---

## Phase 3 — Technical Sketch

**Goal:** Decide how the system delivers the approved UX journey — feasibly, simply, and reusing what exists. The sketch **serves the UX**; where the desired UX is infeasible or expensive, the sketch flags the tension and the user decides.

**Step 3.1 — Decide sketch path**
Based on Step 0.2's outcome:

- **User chose "reuse" for TECHNICAL_SKETCH.md:** read it, summarize its chosen direction to the user in one sentence, proceed to Phase 4.
- **Otherwise:** proceed to Step 3.2.

**Step 3.2 — Spawn technical sketch agent**
Use the `Agent` tool, `subagent_type: general-purpose`. The brief must follow `<subagent_brief_contract>` and include: project context (PROJECT.md + CLAUDE.md + AGENTS.md), BRAINSTORMING.md (if exists), RESEARCH.md (full, including `Codebase Today` + diagram + Reusable Assets), **UX.md (full — the sketch must cover every persona journey)**, the feature description.

Instruct the subagent to write `[FEATURE_DIR]/TECHNICAL_SKETCH.md` using the structure below. Length target: under 1 page when rendered.

**Apply `<core_principles>` — simplicity is the primary constraint.**
- **Serve the UX, simply.** The sketch must cover every persona journey in UX.md — with the smallest design that does so. Do not add capability no journey needs.
- **DRY:** Before proposing any new module/file/abstraction, consult the Reusable Assets inventory from RESEARCH.md. "Create new X" is acceptable only if extending the existing equivalent is genuinely incompatible — explain why in one line.
- **YAGNI:** Every new asset listed in `New things created` must be exercised by at least one journey this feature ships. No speculative abstractions, no "future-proofing" layers.
- **Flag tensions, don't gold-plate around them.** Where a UX journey is infeasible or would force disproportionate complexity, record it in `Tensions with UX` with the simplest alternative — do not silently build heavy machinery to honor it.

````markdown
# Technical Sketch: [Feature Name]

## In one sentence
[What this feature is, architecturally — not what it does for the user.]

## How it fits

```mermaid
[A diagram showing where the feature sits in the existing system. Reuse / extend the codebase diagram from RESEARCH.md. Highlight new components.]
```

## Chosen direction
[2-4 bullets: the architectural approach and the one-line reason for each major choice. The simplest direction that delivers the UX journeys.]

## Alternatives considered
| Approach | Why not |
|----------|---------|
| [name]   | [one line — often "more complex than the journey needs"] |

## Boundaries
- **Touches:** [modules, tables, APIs the feature reads or writes]
- **Owns:** [new modules, tables, endpoints the feature creates]
- **Does not touch:** [areas explicitly left alone]

## Reuse Map
| Existing asset | Path:line | How this feature uses it | Extend / Wrap / Read-only |
|----------------|-----------|--------------------------|---------------------------|
| [function/table/service] | [path:line] | [one line] | [verb] |

## New things created
| New asset | Why a new one (not extending which existing) | Existing alternative considered | Reason existing won't work | Exercised by journey |
|-----------|----------------------------------------------|---------------------------------|---------------------------|----------------------|
| [name] | [one line] | [existing path:line or "none found"] | [one line, technical] | [the UX persona/journey that requires it] |

## Hard constraints
- [things the system cannot do or change easily — one line each]

## Tensions with UX
[Where a UX journey is technically infeasible or disproportionately expensive. The user decides at the Phase 3 gate whether to revise the UX or accept the constraint. Empty if the design serves every journey cleanly.]

| UX journey / promise | Why it's infeasible or expensive | Simplest alternative |
|----------------------|----------------------------------|----------------------|
| [journey/step from UX.md] | [one-line technical reason] | [the leaner option] |

## Versioning
- **Version:** v1
- **Last revised:** [date]
- **Revision reason:** initial draft
````

**Step 3.3 — Orchestrator validation (cross-artifact)**
After the subagent finishes, the orchestrator reads TECHNICAL_SKETCH.md and cross-checks against UX.md and RESEARCH.md:

1. **UX coverage:** every persona journey in UX.md is served by some part of the `Chosen direction` / `Reuse Map` / `New things created`. A journey with no technical path is either covered or surfaced in `Tensions with UX`. If a journey is silently dropped, flag.
2. **YAGNI consistency:** every row in "New things created" has a non-empty "Exercised by journey" field pointing to a real UX journey. If empty or pointing to nothing in UX.md, flag.
3. **DRY consistency:** if "Existing alternative considered" is "none found" for more than one row, flag — this hints the codebase survey was incomplete. Note it in the user-facing question (Step 3.4) and offer to re-run `/council-research`.
4. **Diagram present:** mermaid block is non-empty.

If any check fails, re-spawn the sketch subagent with a brief that explicitly cites the failed check. Do not edit the file manually for these issues.

**Step 3.4 — Present and validate (resolve UX tensions)**
Show the user the chosen direction, hard constraints, orchestrator validation flags, and — critically — the **Tensions with UX** table. Ask:

> "Does this technical direction make sense? It's the simplest design I found that delivers the journey.
>
> [If Tensions with UX is non-empty:] These parts of the UX are infeasible or expensive as drawn. For each, you decide: **(a) revise the UX** to the simpler alternative (we go back to Phase 2 for that flow), or **(b) accept the constraint** (I'll record it and the journey changes accordingly).
>
> Markdown: `[FEATURE_DIR]/TECHNICAL_SKETCH.md`"

**Resolving tensions (the "Sketch flags, user decides" rule):**
- For each row in `Tensions with UX`, the user picks (a) or (b).
- **(a) Revise UX:** return to Phase 2 — edit UX.md (small) or re-spawn the UX agent (large), bump UX.md Version with reason "v[N] — resolve tension: [...]", then re-run Step 2.4 validation and re-run the sketch (Step 3.2/3.3) against the revised UX.
- **(b) Accept the constraint:** the orchestrator notes the accepted constraint in the sketch (the tension row is annotated "Accepted — UX adjusts"), bumps the sketch Version, and the journey is understood to follow the simpler alternative.

**Incorporating other feedback:** If feedback is small (one constraint, one alternative), edit TECHNICAL_SKETCH.md directly, bump Version, fill "Revision reason". If it requires re-thinking the direction or invalidates Reuse Map / New things created, re-spawn the sketch subagent. Either way: re-run Step 3.3 validation before proceeding.

---

## Phase 4 — Council Review (of the design)

**Goal:** Run the **design** — UX + Technical Sketch, grounded in Research — through the full council review **before any PLAN exists**. Five advisors review in parallel; AURELIUS reads all 5 reports and signs an executive verdict. The council acts where change is cheapest: on the design, not on a finished plan.

**Step 4.1 — Invoke council review with full design context**
Invoke the `council-review` process. Make explicit in the brief: **there is no PLAN.md yet — the review subject is the design.** Pass these inputs (every advisor must receive all of them):

- The full content of UX.md (personas, journeys, business rules, error states).
- The full content of TECHNICAL_SKETCH.md (so advisors cross-check Reuse Map, Boundaries, Hard Constraints, Tensions with UX, and apply DRY/YAGNI).
- The full content of RESEARCH.md (for prior art and codebase survey).
- BRAINSTORMING.md if it exists.
- The project context (PROJECT.md + CLAUDE.md + AGENTS.md).
- `[FEATURE_DIR]/council/` as the output directory.
- The terminology block (`<terminology>` above) — advisors must classify findings as Blocker / Manageable Risk / Accepted Debt / Decision That Belongs to the Team using exactly those labels.
- Instruction: "You are reviewing the **design** (UX + Technical Sketch), not an implementation plan. There are no task slices yet. Judge whether this design is sound, simple, reuses what exists, and serves the user journey — and whether it over-engineers anything."

`council-review` produces:
- `[FEATURE_DIR]/council/[ADVISOR].md` per advisor (report with Findings classification)
- `[FEATURE_DIR]/SUMMARY_OF_COUNCIL.md` (signed AURELIUS — the decider)

Wait for all files to exist.

**Step 4.2 — Verify AURELIUS produced an accountable decision**
Before applying findings, the orchestrator reads SUMMARY_OF_COUNCIL.md and the 5 advisor reports and verifies:

1. **Verdict is signed by AURELIUS** and the "Why this verdict" section is non-empty with 2-4 trade-off bullets naming advisors. If missing or fully generic, re-invoke `council-review` requiring AURELIUS to name the specific advisors weighted.
2. **Every Blocker, Risk, Accepted Debt, and Open Question cites which advisor(s) raised it.** Findings without attribution mean AURELIUS invented them — re-invoke.
3. **When AURELIUS overruled an advisor** (promoted a risk to blocker, demoted a blocker, or marked an advisor "Overruled" in the vote table), the one-line reason is visible inline. If hidden or absent, re-invoke.
4. **Findings use the canonical labels** from `<terminology>`. If the synthesis used synonyms ("must-fix", "warning", "future work"), re-invoke with the label requirement reinforced.
5. **No irreconcilable disagreement is silently dropped.** If two advisors held opposing classifications on the same finding, SUMMARY_OF_COUNCIL.md must either show AURELIUS's call with the reason or list it under "Open questions for you" — never paper over it.

Report verification result to the user in one paragraph: "Council reviewed the design. AURELIUS verdict: [verdict]. [N] blockers / [M] risks / [K] accepted debt / [J] open decisions. [One line on whether AURELIUS overruled any advisor and why.]"

**Step 4.3 — Apply findings to the design and re-validate**
The council reviewed the design, so findings are applied to the **design artifacts** (UX.md / TECHNICAL_SKETCH.md). Ownership is explicit:

- **Blockers:** the orchestrator edits UX.md and/or TECHNICAL_SKETCH.md as needed. Each edit bumps the artifact's Version and fills "Revision reason" (e.g., "v2 — TORVALDS blocker: rate-limit endpoint"). If a Blocker requires a structural rewrite (not a small edit), re-spawn the responsible subagent (UX agent or sketch agent) with a brief citing the blocker.
- **Manageable Risks:** note them for Phase 5 — they become new slices or inline `**Risk:**` notes in PLAN.md. Keep a short list to hand to the planning agent.
- **Accepted Debt** and **Decisions That Belong to the Team:** these live in SUMMARY_OF_COUNCIL.md now; they will be migrated into ROADMAP.md in Phase 5 (Step 5.1/5.5). Keep the list.

**Re-validation gate (MANDATORY):** after editing UX.md / TECHNICAL_SKETCH.md, re-run the cross-artifact checks from Step 3.3 (UX coverage, YAGNI, DRY) against the modified design. If the council's adjustments introduced a UX-coverage gap or a new unexercised asset, fix it in the same loop before exiting Phase 4.

**Verdict gate:** if the council verdict is `REVISE BEFORE PROCEEDING`, **do not advance to Phase 5.** Resolve the design blockers (edit or re-spawn, then optionally re-invoke `council-review` if the change was structural) before any PLAN is created. The PLAN is only created from a design the council is willing to proceed with.

---

## Phase 5 — Plan Creation & Conformance

**Goal:** Translate the **reviewed** design — research, UX, technical sketch, and the council's opinion — into a concrete, sequenced implementation plan. The plan is created last, and it is created *with* the council's findings in hand.

**Step 5.1 — Spawn planning agent**
Use the `Agent` tool, `subagent_type: general-purpose`. The brief follows `<subagent_brief_contract>` and includes: project context, BRAINSTORMING.md (if it exists), RESEARCH.md, UX.md (full), TECHNICAL_SKETCH.md (full — including Reuse Map, New things created, Tensions with UX), and **SUMMARY_OF_COUNCIL.md (full — the plan must honor the council's findings)** plus the orchestrator's Manageable-Risk list from Step 4.3.

Instruct the subagent with these constraints:

> Create a plan a developer can read in 2 minutes and execute without re-reading. Each task is one **vertical slice** — a thin end-to-end change a developer can finish, ship, and verify in isolation before the next slice starts.
>
> The plan is a *map*, not a manual. Don't restate what TECHNICAL_SKETCH.md or UX.md already said. Don't paste code. Don't write paragraphs where bullets work. If a task can't be verified the moment it lands (a test passes, an endpoint responds, a screen renders), split or rewrite it.
>
> Honor the council: every Blocker in SUMMARY_OF_COUNCIL.md must already be resolved in the design — confirm your plan doesn't reintroduce it. Every Manageable Risk becomes a slice or an inline `**Risk:**` note.

**Apply `<core_principles>` — the plan is where over-engineering hides:**
- **Fewer slices is better.** The simplest sequence of slices that delivers the UX journeys. Don't manufacture slices that only "set up" for an imagined future.
- **YAGNI:** slices build only what other slices in this plan or shipped code already need. No slice exists to prepare ground for work outside this plan.
- **DRY:** every slice's `Reuses` field is mandatory.

**Vertical slice rule:** every task touches as little as needed and is testable on completion. A migration that breaks the app until the next task lands is **not** a vertical slice.

**Complexity threshold:** more than 7 tasks or more than 2 distinct user-facing outcomes → split into PLAN-01.md, PLAN-02.md, etc.

The subagent writes to `[FEATURE_DIR]/PLAN.md` (or PLAN-01.md etc.). **Length target: under 2 pages rendered.** Use this exact structure:

````markdown
# Plan: [Feature Name]

**Version:** v1 · **Last revised:** [date] · **Revision reason:** initial draft

## What & why
[2-3 bullets. What ships, who benefits, what changes for them.]

## Depends on
[Bullets — what must exist before this plan starts. Skip if nothing.]

## In scope / Out of scope
**In:** [bullets]
**Out:** [bullets — and why, one line each]

<boundaries>
**Do not change:** [locked files/areas]
**Limits:** [e.g., API only, no new deps]
</boundaries>

## Slices

Each slice is independently testable. Mergeable on its own. Sequenced.

### T01 — [Verb-first title]

- **Touches:** [files / modules]
- **Reuses:** [existing function/helper/table/endpoint — path:line — from TECHNICAL_SKETCH Reuse Map. "None" only if the slice creates an asset already justified in "New things created".]
- **Change:** [one sentence — what gets built. If creating new code, name the closest existing pattern this MUST follow.]
- **Verify:** [exact command, click, or test that proves it works]
- **Done when:**
  ```gherkin
  Given [state]
  When [action]
  Then [observable outcome]
  ```

### T02 — [...]

[Repeat. Aim for 3-7 slices total — the fewest that deliver the journeys.]

## Decisions
[Bullets. Each: decision — one-line reason. Skip if covered in TECHNICAL_SKETCH.md.]

## Risks
[Bullets. Each: risk — mitigation. Include the council's Manageable Risks here. Skip if none.]
````

**Writing rules for the planning agent:**
- No prose paragraphs except inside Gherkin blocks.
- Drop Type / Estimate / Dependencies fields unless they carry information.
- **DRY:** every slice's `Reuses` field is mandatory. `None` is only valid when the slice creates an asset already justified in TECHNICAL_SKETCH's `New things created` table.
- **YAGNI:** slices build only what other slices in this plan or shipped code already need.

The planning subagent also writes `[FEATURE_DIR]/ROADMAP.md` with: overall status (`🔴 Not started`), a progress table (ID / Task / Status ⬜🔄✅❌ / Notes), status legend, empty `Execution History` section, a `Registered Technical Debt` section pre-seeded with the council's Accepted Debt, an `Open Decisions` section pre-seeded with the council's Decisions That Belong to the Team, and **Next Step** pointing to T01.

**Step 5.2 — Orchestrator validation (cross-artifact, MANDATORY)**
This is the most important mechanical gate. The orchestrator reads PLAN.md (all PLAN-NN.md files) and cross-checks against TECHNICAL_SKETCH.md and UX.md:

1. **Reuse Map cross-check:** for every slice with a `Reuses` field, verify the cited asset (path:line) appears in TECHNICAL_SKETCH's Reuse Map. If not, the planning agent invented a reuse or the sketch is incomplete — flag.
2. **New things created cross-check:** for every new file/module/abstraction a slice creates (inferable from `Touches` + `Change`), verify there is a corresponding row in TECHNICAL_SKETCH's "New things created". If not, the slice violates the architectural contract.
3. **`Exercised by` real-link check:** for every row in TECHNICAL_SKETCH's "New things created", verify some slice actually calls or creates that asset. A row no slice exercises is a YAGNI violation.
4. **UX coverage:** every persona journey in UX.md must be deliverable by some combination of slices. If a journey has no corresponding slice path, flag.
5. **Boundaries respect:** the `<boundaries>` block lists "Do not change". Verify no slice's `Touches` includes a locked file.
6. **Gherkin verifiability:** every `Done when` Gherkin block has concrete `Given`/`When`/`Then` — no "user experience is good", "code is clean", or other unverifiable statements.

For each failed check, re-spawn the planning subagent with a brief explicitly citing the failure (not a vague "please fix"). Do not edit PLAN.md manually for these issues.

**Step 5.3 — AURELIUS conformance check (lightweight)**
The full council already reviewed the design. Here, a single AURELIUS subagent checks only one thing: **did the plan honor the council's opinion?** This is conformance, not a new review — the 5 advisors are **not** re-run.

Spawn one subagent acting as AURELIUS. It receives: the AURELIUS persona (from `council-review`'s `<decider>`), SUMMARY_OF_COUNCIL.md (full), PLAN.md (full). Instruction:

> "You already signed the council's verdict on the design. Read PLAN.md and confirm each Blocker and Manageable Risk in SUMMARY_OF_COUNCIL.md is honored: Blockers resolved (not reintroduced), Manageable Risks present as a slice or an inline `**Risk:**` note, Accepted Debt and Open Decisions carried into ROADMAP.md. Do NOT invent new findings or re-review the design — conformance only. Return a short verdict: CONFORMS / DOES NOT CONFORM, with a one-line note per finding that was dropped or weakened."

- **CONFORMS:** proceed to Step 5.4.
- **DOES NOT CONFORM:** re-spawn the planning subagent (Step 5.1) with a brief citing the specific council finding the plan dropped or weakened. Then re-run Step 5.2 and Step 5.3.

**Step 5.4 — Present and validate**
Show the user the task list, the Step 5.2 validation summary, and the Step 5.3 conformance result. Ask:

> "Does the plan reflect what you want to build? Are there missing tasks, tasks out of order, or tasks that are clearly out of scope — or anything heavier than it needs to be?
>
> Markdown: `[FEATURE_DIR]/PLAN.md`"

**Incorporating feedback:** small edits direct (bump version), large changes re-spawn the planning subagent. After any edit, re-run Step 5.2 validation and Step 5.3 conformance.

**Step 5.5 — Final handoff to user**
Migrate the council's Accepted Debt and Open Decisions into ROADMAP.md if the planning agent didn't fully seed them. Update ROADMAP.md status to: `🟡 Awaiting execution — design reviewed by council (v[N]), plan conforms`.

Show this exact structure — the user must see the council's voice, not just file paths:

```markdown
## Plan Ready for Execution: [Feature Name]

**Council verdict on the design:** [PROCEED / PROCEED WITH ADJUSTMENTS / REVISE BEFORE PROCEEDING]
**Plan conformance:** [CONFORMS / fixed after re-spawn]

**What the council changed in the design:**
- UX.md: v1 → v[N] — [one line, or "no change"]
- TECHNICAL_SKETCH.md: v1 → v[N] — [one line, or "no change"]
- [or: no design changes — council had no Blockers]

**Open decisions for you to resolve before execution:**
- [Question 1 from "Decisions That Belong to the Team"]
- [or: none]

**AURELIUS overrules in this review:**
- [Advisor X's blocker demoted to risk — reason]
- [or: none — AURELIUS aligned with advisor classifications]

**Registered technical debt:**
- [Item 1 with revisit condition]
- [or: none]

Files in [FEATURE_DIR]:
  - RESEARCH.md, UX.md (v[N]), TECHNICAL_SKETCH.md (v[N])
  - SUMMARY_OF_COUNCIL.md — council review of the design
  - council/TURING.md, LOVELACE.md, TORVALDS.md, FOWLER.md, CASSANDRA.md
  - PLAN.md (v[N])
  - ROADMAP.md — progress tracker, Registered Technical Debt, Open Decisions

To start execution: /council-execute [FEATURE_SLUG]
```

**If the council verdict was `REVISE BEFORE PROCEEDING`,** the skill should have stopped at Phase 4 — never reaching plan creation. If the user forced past it, say explicitly that `/council-execute` should not be invoked until the design blockers are resolved.

</process>

<subagent_brief_contract>

Every subagent spawn in this skill (UX mapping agent, technical sketch agent, planning agent, AURELIUS conformance agent, council review's internal agents via `/council-research` and `/council-review`) receives a self-contained brief. Templates differ per phase, but every brief MUST include:

1. **Project context block** — verbatim contents of PROJECT.md, CLAUDE.md, AGENTS.md (whichever exist), prefixed with: `"Project context (do not re-research this):"`.
2. **Feature description** — the original $ARGUMENTS or current `FEATURE_SLUG` + one-paragraph summary.
3. **Inputs** — paths AND full content of every upstream artifact the agent depends on (not just paths — the subagent has no working dir context and may not be able to read efficiently). **Respect the new order:** the UX agent does NOT receive a technical sketch (none exists yet); the sketch agent receives UX.md; the planning agent receives UX.md + TECHNICAL_SKETCH.md + SUMMARY_OF_COUNCIL.md.
4. **Output contract** — exact file path to write, exact structure (template copied into the brief), length target.
5. **Boundaries** — what the agent must NOT do (e.g., "do not modify TECHNICAL_SKETCH.md", "do not invent reuse references", "do not add capability no journey needs").
6. **Tone rules** — terse technical prose, fragments OK, bullets over paragraphs.
7. **What to return** — a structured one-message summary (files written, validation it performed on itself, anything unexpected). The subagent does not echo back the whole markdown; just the summary.

If a re-spawn is required (validation failed, user feedback large), the new brief MUST cite the specific check that failed or the user feedback verbatim — never a vague "please fix the issues".

</subagent_brief_contract>

<instructions>
- The council always asks questions before acting. No phase starts without user input at the gates (0.2, 2.2, 2.5, 3.4, 4.2 report, 5.4, 5.5).
- Questions are asked in a single message per phase — not one at a time.
- The user's answers must visibly influence the output. If they don't, the agent is not listening.
- Files are always written to `.council/[FEATURE_SLUG]/` relative to the project root (current working directory).
- **Order is the point: UX → Technical Sketch → Council Review → Plan.** The UX journey leads; the sketch serves it; the council reviews the design; the plan comes last, with the council's opinion in hand. Never create PLAN.md before the council has reviewed the design.
- **Orchestrator write boundary:** see `<orchestrator_writes>`. The orchestrator does not author artifacts from scratch — it spawns subagents and edits surgically for council Blockers + user feedback.
- **Cross-artifact validation is non-negotiable.** Steps 2.4, 3.3, 4.3 re-validation, and 5.2 are the only mechanism that keeps the artifacts coherent. Skipping them defeats the multi-phase design.
- **AURELIUS's decision must be verified, not trusted.** Step 4.2 is mandatory — every blocker/risk must cite an advisor, every overrule must name its reason inline.
- **No silent slips into execution.** If council verdict is `REVISE BEFORE PROCEEDING`, the skill stops at Phase 4 and no PLAN is created. `/council-execute` is not the default next action.
- **Versioning:** every artifact (UX, TECHNICAL_SKETCH, PLAN) carries a Version + Last revised + Revision reason. Every edit bumps Version. Audit trail is in the file itself.
- **Simplicity and DRY/YAGNI are first-class constraints** — see `<core_principles>`. Reuse Map + "New things created" (sketch) + `Reuses` field (plan) are cross-checked by the orchestrator in Steps 3.3 and 5.2. Without that cross-check, the rules are aspiration only. When two designs both deliver the journey, the simpler one wins.
- **Output tone — terse technical prose.** Drop articles, filler, hedging. Fragments OK. Bullets over paragraphs.
- Use English (en-US) for all generated files. Respond to the user in their language.
</instructions>

<plan_quality_rules>

These rules apply to the planning agent (Step 5.1) and to the orchestrator's Step 5.2 validation. Both must enforce them.

## Acceptance Criteria Format

Use Given/When/Then (BDD) format:

```gherkin
Given [precondition / initial state]
When [action / trigger]
Then [expected outcome]
```

- Each criterion independently testable.
- Include error states and edge cases.
- Behavior, not implementation. "The function has low complexity" is not verifiable. "Given a valid input, the endpoint returns 200 within 200ms" is.

## Boundaries Section

The `<boundaries>` block in PLAN.md prevents scope creep. Always include it — even if minimal. Step 5.2 verifies no slice violates the "Do not change" list.

## Sizing Guidance

**Good plan:** 3-7 vertical slices — the *fewest* that deliver the UX journeys. Each slice mergeable and verifiable on its own.

**When to split into multiple plans:**
- Different user-facing outcomes
- More than 7 slices
- Risk of context overflow

**Vertical slices, not horizontal layers:**

```
PREFER: T01 = Pet owner can request slot (model + API + minimal UI)
        T02 = Receptionist can confirm slot (status + API + UI)

AVOID:  T01 = All DB tables
        T02 = All APIs
        T03 = All screens
```

A horizontal layer is rarely testable until the next layer lands. Defeats the slice rule.

## Anti-Patterns

**Vague actions:** "Set up the infrastructure", "Handle edge cases", "Make it production-ready".

**Unverifiable completion:** "It works correctly", "User experience is good", "Code is clean".

**Missing context:** "Use the standard approach", "Follow best practices", "Like the other endpoints".

**Tasks that bundle concerns:** "Validate, persist, and notify" is three tasks in disguise — split.

**YAGNI violations:** "Add a plugin system / abstraction layer / interface for future X" when no current slice has a second concrete user. "Set up generic config / options / flags" that no slice flips. A slice that only "prepares ground" for work outside this plan.

**DRY violations:** A new helper/service whose `Reuses` field is `None` and whose concept (noun + verb) already exists elsewhere. The sketch's Reuse Map missed it — fix the sketch, not the slice.

**Over-engineering:** A pattern with no problem demanding it. Generalization before the third concrete case. Indirection that doesn't pay back its maintenance cost. When in doubt, ship the simpler design.

</plan_quality_rules>
