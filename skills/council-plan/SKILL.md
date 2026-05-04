---
name: council-plan
description: Create a structured implementation plan with council review. Use when preparing execution steps for a feature.
---

---
name: council:plan
description: The council collaboratively researches, sketches technical constraints, maps user flows, and creates a development plan. Produces RESEARCH.md, TECHNICAL_SKETCH.md, UX.md, PLAN.md, and ROADMAP.md in .council/[FEATURE_NAME]/, then runs a council review on the final plan.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Bash, Glob, Agent, WebSearch, AskUserQuestion]
---

<objective>
Guide the council through a structured 5-phase process to produce a complete, reviewed development plan. The council asks the user targeted questions at each phase before proceeding. No phase is skipped. UX mapping happens after technical constraints are known — not before.

The output is a set of files in `.council/[FEATURE_NAME]/` that serve as the authoritative source of truth for implementation.
</objective>

<advisors_reference>
The council is composed of 5 permanent advisors used throughout this process:

- **TURING** — Pragmatist Engineer. Focuses on operational simplicity and blast radius.
- **LOVELACE** — Product Strategist. Focuses on user outcomes and delivery speed.
- **TORVALDS** — Security Engineer. Focuses on attack surfaces and data exposure.
- **DIJKSTRA** — Systems Thinker. Focuses on consistency, scalability, and data model evolution.
- **HAMMURABI** — Code Quality Judge. Focuses on maintainability and future developer experience.
</advisors_reference>

<process>

## Setup

**Step 0 — Parse input and establish feature name**
Read $ARGUMENTS. If provided, use it as the working feature name (slugify for directory: lowercase, hyphens). If not provided, ask the user:

> "What is the name of the feature or problem the council should plan?"

Derive `FEATURE_SLUG` (e.g., "grooming-scheduling") and `FEATURE_DIR` = `.council/[FEATURE_SLUG]`.
Create the directory: `mkdir -p [FEATURE_DIR]`.

If `[FEATURE_DIR]/CONTEXT.md` exists, read it silently — it contains goals and constraints from a prior `/council:discuss` session and must be passed to every agent as additional context.

**Step 0.1 — Load project context**
In parallel, check and read all of the following if they exist: `.council/PROJECT.md`, `CLAUDE.md`, `AGENTS.md`. Read them silently — their combined contents are now available as shared project context for every agent spawned in this session. Do not show them to the user or comment on them unless something looks outdated.

If `.council/PROJECT.md` does not exist, tell the user:

  > "I don't have a PROJECT.md for this project yet. This file gives every council agent instant context about your stack and conventions — so we don't re-discover them on every plan.
  >
  > Run `council:init` now to create it (takes ~2 minutes), or skip and I'll proceed without it."

  Wait for the user's choice. If they choose to init, run the full `council:init` process, then continue with the plan. If they skip, proceed without PROJECT.md.

---

## Phase 1 — Research

**Goal:** Understand how the market solves this problem. Surface prior art, patterns, and tradeoffs before designing anything.

**Step 1.1 — Check for existing research**
Check if `[FEATURE_DIR]/RESEARCH.md` exists.

- **If it exists:** Read it and tell the user: "I found existing research for this feature. Skipping Phase 1 and proceeding to technical sketch." Proceed directly to Phase 2.
- **If it doesn't exist:** Run `/council:research [FEATURE_SLUG]`. Only proceed to Phase 2 after it completes and RESEARCH.md exists.

---

## Phase 2 — Technical Sketch

**Goal:** Identify what is technically feasible and what constraints exist before any user journey is mapped.

**Step 2.1 — Check for existing technical sketch**
Check if `[FEATURE_DIR]/TECHNICAL_SKETCH.md` exists.

- **If it exists:** Read it and tell the user: "I found an existing technical sketch for this feature. Skipping Phase 2." Proceed directly to Phase 3.
- **If it doesn't exist:** Proceed to Step 2.2.

**Step 2.2 — Technical sketch agent**
Spawn a single technical sketch agent. It receives: RESEARCH.md, the feature description, and project context (PROJECT.md, CLAUDE.md, AGENTS.md — whichever exist). It must produce a lean technical sketch — not a full plan, just enough to bound what UX can and cannot promise.

The agent writes to `[FEATURE_DIR]/TECHNICAL_SKETCH.md` with:

- **Viable approaches** — 2-3 technical approaches that could implement this feature, each with a one-line tradeoff
- **Chosen direction** — the recommended approach and why (informed by the project's stack and constraints from PROJECT.md)
- **Hard constraints** — things the system cannot do or cannot easily change (e.g., "no real-time infra available", "auth model doesn't support multi-tenancy", "existing schema makes X expensive")
- **Integration points** — existing systems, APIs, or data models this feature must work with
- **What this rules out** — UX patterns or user promises that are technically infeasible given the constraints above

**Step 2.3 — Present and validate**
Show the user the chosen direction and hard constraints. Ask:

> "Does this technical direction make sense? Are there constraints I'm missing, or approaches you'd like to explore instead?"

Incorporate feedback into TECHNICAL_SKETCH.md before proceeding.

---

## Phase 3 — UX & User Journey

**Goal:** Map how real users experience this feature — informed by what the system can actually do.

**Step 3.1 — Council interviews the user**
A single agent asks the user:

1. Who are the types of users that will interact with this feature? (e.g., pet owner, receptionist, administrator)
2. At what point in the user's current journey does this feature fit?
3. What is the worst-case usage scenario that must work correctly? (e.g., user on poor connection, user who enters wrong data)
4. Is there any flow the user should NOT be able to perform? (permission restrictions, business rules)
5. Does success/error feedback to the user matter especially here? How do you imagine it should work?

Wait for user response before proceeding.

**Step 3.2 — UX mapping agent**
Spawn a single UX agent. It receives: the feature description, RESEARCH.md, TECHNICAL_SKETCH.md, and the user's answers. It must:

- Create **at least 2 distinct user personas** (different roles, tech savviness, or goals)
- Map the complete journey for each persona: entry point → steps → success state → error states → exit
- Respect the hard constraints from TECHNICAL_SKETCH.md — do not map flows that were ruled out
- Flag where the journey touches other system features (integration points)

The agent writes to `[FEATURE_DIR]/UX.md` with:

- At least 2 named personas (context + goal each)
- A journey per persona: entry point → step table (User Action / System Response / State ✅⚠️❌) → success state → error states → integration points
- Alternative flows and edge cases (bullet list)
- Business rules identified (bullet list)
- Open questions for the product owner

**Step 3.3 — Present and validate**
Show the user the persona journeys. Ask:

> "Do the personas and journeys reflect the reality of your users? Is there any critical flow that wasn't mapped, or any business rule that is wrong?"

Incorporate feedback into UX.md before proceeding.

---

## Phase 4 — Plan Creation

**Goal:** Translate research, technical constraints, and UX into a concrete, sequenced implementation plan.

**Step 4.1 — Planning agent**
Spawn a single planning agent. It receives: project context (PROJECT.md, CLAUDE.md, AGENTS.md — whichever exist), CONTEXT.md, RESEARCH.md, TECHNICAL_SKETCH.md, UX.md, the user's context, and these constraints:

> Create a development plan that a developer can follow without needing further clarification. Each task must be specific enough to estimate. The plan must respect the hard constraints from TECHNICAL_SKETCH.md and the business rules and edge cases surfaced in UX.md. Prefer sequencing that delivers a working slice end-to-end before adding complexity.
>
> **Task discipline:** If you can't specify Files + Action + Verify + Done, the task is too vague.

**Complexity threshold:** If the plan has more than 12 tasks or more than 3 distinct technical concerns (e.g., data model + API + UI + notifications), split into PLAN-01.md, PLAN-02.md, etc. Each file covers one coherent delivery slice.

The agent writes to `[FEATURE_DIR]/PLAN.md` (or PLAN-01.md etc.):

````markdown
# Plan: [Feature Name]

## Context

[1-2 paragraphs: what we're building, why, and what research/technical constraints/UX informed this plan]

## Dependencies and Prerequisites

[What must exist before this plan can start — data, auth, other features]

## In Scope

[Bullet list of what this plan covers]

## Out of Scope

[Bullet list of what is explicitly NOT covered — and why]

<boundaries>
## DO NOT CHANGE
- [file or area locked for this phase — e.g., database/migrations/*]
- [another locked area]

## SCOPE LIMITS

- [e.g., This plan creates API only - no UI]
- [e.g., Do not add new dependencies]
  </boundaries>

## Tasks

### [T01] [Task Title]

**Type:** Backend / Frontend / DB / Config / ...
**Description:** [What exactly to build]
**Files:** [Specific files to create or modify]
**Action:** [Exact change to make]
**Acceptance Criteria:**

```gherkin
Given [precondition / initial state]
When [action / trigger]
Then [expected outcome]
```
````

**Dependencies:** [Other tasks that must be done first, if any]
**Estimate:** [S / M / L — relative complexity]

### [T02] ...

## Technical Decisions

[Key architectural decisions made in this plan, with brief justification]

## Identified Risks

[Risks surfaced by research or UX that the implementation must account for]

The agent also writes `[FEATURE_DIR]/ROADMAP.md` with: overall status (🔴 Not started), a progress table (ID / Task / Status ⬜🔄✅❌ / Notes), status legend, empty Execution History section, and Next Step pointing to T01.

**Step 4.2 — Present to user**
Show the task list and ask:

> "Does the plan reflect what you want to build? Are there missing tasks, tasks out of order, or tasks that are clearly out of scope for this delivery?"

Incorporate feedback before proceeding to Phase 5.

---

## Phase 5 — Council Review

**Goal:** Run the plan through the full council review to surface issues before implementation begins.

**Step 5.1 — Invoke council review**
Read PLAN.md (and PLAN-01.md etc. if split) and invoke the `council:review` process, passing:
- The full PLAN.md content as the plan to review
- `[FEATURE_DIR]/council/` as the output directory for advisor files

The `council:review` process runs autonomously and produces all output files directly:
- Each of the 5 advisors writes their own `[FEATURE_DIR]/council/[ADVISOR].md` (report + Position After Debate)
- The debate agent writes `[FEATURE_DIR]/council/DEBATE.md`
- The synthesis agent writes `[FEATURE_DIR]/SUMMARY_OF_COUNCIL.md`

Wait for all files to exist before proceeding to Step 5.2. Do not write or modify any council files yourself — `council:review` owns all output in `[FEATURE_DIR]/council/` and `SUMMARY_OF_COUNCIL.md`.

**Step 5.2 — Apply adjustments to plan**
After `SUMMARY_OF_COUNCIL.md` exists, read it and apply its findings:

- Apply all **Blockers** as mandatory changes to PLAN.md before marking the plan ready
- Apply **Manageable Risks** as new tasks or notes in PLAN.md
- If a Blocker affects a user journey, update UX.md accordingly before marking the plan ready
- Log **Accepted Debt** in ROADMAP.md under a "Registered Technical Debt" section
- Copy **Decisions That Belong to the Team** as open questions in ROADMAP.md

Update ROADMAP.md status to: `🟡 Awaiting execution — plan reviewed by council`.

**Step 5.3 — Final handoff to user**
Present a summary:

```
## Plan Ready for Execution

📁 Files created in [FEATURE_DIR]:
- RESEARCH.md — market research and prior art
- TECHNICAL_SKETCH.md — feasibility constraints and chosen direction
- UX.md — personas and user journeys
- PLAN.md — reviewed implementation plan
- ROADMAP.md — progress tracker
- SUMMARY_OF_COUNCIL.md — council review summary

📁 Individual reports in [FEATURE_DIR]/council/:
- TURING.md, LOVELACE.md, TORVALDS.md, DIJKSTRA.md, HAMMURABI.md, DEBATE.md

✅ Reviewed by council — [N] adjustments applied to plan
⚠️ [N] open decisions that belong to the team (see ROADMAP.md)

To start execution: /council:execute [FEATURE_SLUG]
```

</process>

<instructions>
- The council always asks questions before acting. No phase starts without user input.
- Questions are asked in a single message per phase — not one at a time.
- The user's answers must visibly influence the output. If they don't, the agent is not listening.
- Files are always written to `.council/[FEATURE_SLUG]/` relative to the project root (current working directory).
- The planning agent must write tasks specific enough to implement without further clarification. If you can't specify Files + Action + Verify + Done, the task is too vague.
- The council review in Phase 5 uses the full 3-phase process from the `council:review` skill. Each advisor writes their own file, the debate agent writes DEBATE.md, and the synthesis agent writes SUMMARY_OF_COUNCIL.md. The orchestrator does not write any of these files — it only coordinates and waits.
- **Project context:** If any of `.council/PROJECT.md`, `CLAUDE.md`, or `AGENTS.md` were loaded in Step 0.1, pass their combined contents to every agent spawned in this session (research agents, technical sketch agent, UX agent, planning agent, council review agents). Prepend them to each agent's context as: "Project context (do not re-research this):\n[combined contents]". This replaces the need for agents to infer the stack from scratch.
- **Output tone — terse technical prose.** Drop articles, filler, hedging. Fragments OK. Bullets over paragraphs. Plan Context section: 2-3 bullet points, not paragraphs. Every sentence must carry information or be cut.
- Use English (en-US) for all instructions and generated files. Respond to the user in their language.
</instructions>

<plan_quality_rules>

## Acceptance Criteria Format

Use Given/When/Then (BDD) format:

```gherkin
Given [precondition / initial state]
When [action / trigger]
Then [expected outcome]
```

**Guidelines:**

- Each criterion should be independently testable
- Include error states and edge cases
- Avoid implementation details (describe behavior, not code)

## Boundaries Section

The `<boundaries>` block in PLAN.md prevents scope creep by making off-limits files and limits explicit. Always include it — even if minimal.

## Sizing Guidance

**Good plan size:** 2-3 tasks, ~50% context usage, single concern.

**When to split into multiple plans:**

- Different subsystems (auth vs API vs UI)
- More than 3 tasks
- Risk of context overflow
- TDD candidates (separate plans)

**Prefer vertical slices:**

```
PREFER: Plan 01 = User (model + API + UI)
        Plan 02 = Product (model + API + UI)

AVOID:  Plan 01 = All models
        Plan 02 = All APIs
```

## Anti-Patterns

**Vague actions:**

- "Set up the infrastructure"
- "Handle edge cases"
- "Make it production-ready"

**Unverifiable completion:**

- "It works correctly"
- "User experience is good"
- "Code is clean"

**Missing context:**

- "Use the standard approach"
- "Follow best practices"
- "Like the other endpoints"

**Tasks that invite high complexity:**

- Tasks that bundle more than one concern invite high cyclomatic complexity. If a task says "validate, persist, and notify", that is three tasks in disguise — split them or explicitly describe the expected decomposition.
- Acceptance criteria must describe observable behavior, not internal structure. "The function has low complexity" is not verifiable. "Given a valid input, the endpoint returns 200 within 200ms" is.

</plan_quality_rules>
