---
name: kidoncio:plan
description: The council collaboratively researches, maps user flows, and creates a development plan for a feature or problem. Produces RESEARCH.md, UX.md, PLAN.md, and ROADMAP.md in .kidoncio/[FEATURE_NAME]/, then runs a council review on the final plan.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Bash, Glob, Agent, WebSearch, AskUserQuestion]
---

<objective>
Guide the council through a structured 4-phase process to produce a complete, reviewed development plan. The council asks the user targeted questions at each phase before proceeding. No phase is skipped. No plan is created before research and UX are done.

The output is a set of files in `.kidoncio/[FEATURE_NAME]/` that serve as the authoritative source of truth for implementation.
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

Derive `FEATURE_SLUG` (e.g., "grooming-scheduling") and `FEATURE_DIR` = `.kidoncio/[FEATURE_SLUG]`.
Create the directory: `mkdir -p [FEATURE_DIR]`.

---

## Phase 1 — Research

**Goal:** Understand how the market solves this problem. Surface prior art, patterns, and tradeoffs before designing anything — using parallel specialized agents, each focused on a distinct research angle.

**Step 1.1 — Council interviews the user**
Before researching, a single agent (acting as the unified council voice) must ask the user clarifying questions. The agent must NOT proceed until the user answers. Ask all questions in a single message:

Questions the agent must always ask:

1. What is the business context? (Who is the end user and what problem do they have today?)
2. Is there a current solution (even manual or improvised) that users already use?
3. Are there known technical constraints? (technology, required integrations, time limitations)
4. Is there any product or market experience you admire that solves a similar problem?
5. What defines "success" for this feature — what metric or behavior would change?

Wait for user response before proceeding.

**Step 1.2 — Define research agents and confirm with user**
Based on the feature description and the user's answers, derive a list of focused research agents. Each agent has a single, specific objective — not a broad sweep. The default agents are:

| Agent                     | Objective                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `market-solutions`        | What existing products solve this problem? How does each approach the solution? What are the differences between them? |
| `ux-patterns`             | What UX patterns and interface conventions are used for this type of feature? What do users already expect?            |
| `technical-approaches`    | What technical approaches exist to implement this? What are the tradeoffs of each?                                     |
| `failure-modes`           | What are the documented anti-patterns, known failures, and common mistakes teams make when building this?              |
| `security-and-compliance` | What security, privacy, or compliance risks are known for this type of feature?                                        |

Present this list to the user **before spawning any agent**:

```
## Proposed Research Agents

The council will spawn the following agents in parallel:

1. **market-solutions** — [objective description]
2. **ux-patterns** — [objective description]
3. **technical-approaches** — [objective description]
4. **failure-modes** — [objective description]
5. **security-and-compliance** — [objective description]

Do you confirm this list? Would you like to add any agent with a specific objective you consider important for this feature?
```

Wait for user confirmation. If the user adds custom agents, include them. If the user removes any, remove them. Only after explicit confirmation proceed to Step 1.3.

Create the research directory: `mkdir -p [FEATURE_DIR]/research/`.

**Step 1.3 — Spawn parallel research agents**
Spawn all confirmed agents simultaneously. Each agent runs independently and receives:

- The feature description
- The user's answers from Step 1.1
- Its own specific objective (not the full list — each agent only knows its own goal)
- The instruction: "Be specific. Name actual products, cite actual patterns, reference real-world incidents or documented cases. No generic observations. No filler."

Each agent writes its findings to `[FEATURE_DIR]/research/[agent-slug].md`:

```markdown
# Research: [Objective Title]

**Agent:** [agent-slug]
**Objective:** [The specific research objective]

## Findings

[Specific findings — named products, patterns, incidents, tradeoffs. Each point must be concrete and attributable.]

## Implications for This Context

[How these findings apply specifically to this feature, given the user's constraints and tech stack]

## References and Sources

[Named sources, products, documentation, or incident reports consulted]
```

**Step 1.4 — Synthesize into RESEARCH.md**
After all agents complete, a single synthesis agent reads all `[FEATURE_DIR]/research/*.md` files and produces `[FEATURE_DIR]/RESEARCH.md`:

```markdown
# Research: [Feature Name]

## Executive Summary

[3-5 bullet points: the most important findings across all research agents]

## Market and Prior Art

[From market-solutions agent — named products and their approaches]

## UX Patterns

[From ux-patterns agent]

## Technical Approaches and Tradeoffs

[From technical-approaches agent]

## Anti-Patterns and Known Failures

[From failure-modes agent]

## Security and Compliance Risks

[From security-and-compliance agent]

## [Custom Agent Title, if any]

[From custom agents added by user]

## Consolidated Insights for This Context

[Cross-cutting insights that emerge from reading all agents together — things no single agent would have seen alone]
```

**Step 1.5 — Present and validate**
Show the user:

- Which research files were created in `[FEATURE_DIR]/research/`
- The executive summary from RESEARCH.md

Ask:

> "The council completed research with [N] agents. Is there any direction that doesn't make sense for your context, or something important that was missed that would be worth spawning an additional agent for?"

If the user requests additional research, spawn the new agent(s), append findings to a new file in `research/`, and update RESEARCH.md before proceeding to Phase 2.

---

## Phase 2 — UX & User Journey

**Goal:** Map how real users experience this feature end-to-end, before any technical decisions are locked.

**Step 2.1 — Council interviews the user**
A single agent asks the user:

1. Who are the types of users that will interact with this feature? (e.g., pet owner, receptionist, administrator)
2. At what point in the user's current journey does this feature fit?
3. What is the worst-case usage scenario that must work correctly? (e.g., user on poor connection, user who enters wrong data)
4. Is there any flow the user should NOT be able to perform? (permission restrictions, business rules)
5. Does success/error feedback to the user matter especially here? How do you imagine it should work?

Wait for user response before proceeding.

**Step 2.2 — UX mapping agent**
Spawn a single UX agent. It receives: the feature description, research findings from RESEARCH.md, and the user's answers. It must:

- Create **at least 2 distinct user personas** (different roles, tech savviness, or goals)
- Map the complete journey for each persona: entry point → steps → success state → error states → exit
- Identify friction points and edge cases in each journey
- Flag where the journey touches other system features (integration points)

The agent writes to `[FEATURE_DIR]/UX.md`:

```markdown
# UX & User Journey: [Feature Name]

## Personas

### Persona 1: [Name] — [Role]

**Context:** [Who they are, what they know, what they want]
**Goal:** [What success looks like for them]

### Persona 2: [Name] — [Role]

**Context:** [...]
**Goal:** [...]

## Journeys

### Journey: [Persona 1 Name] — [Scenario Title]

**Entry point:** [Where/how they arrive at this feature]

| Step | User Action | System Response | State        |
| ---- | ----------- | --------------- | ------------ |
| 1    | [...]       | [...]           | ✅ / ⚠️ / ❌ |

...

**Success state:** [What the user sees/feels when done]
**Error states:** [What can go wrong and how the system responds]
**Integration points:** [Other features/systems touched]

### Journey: [Persona 2 Name] — [Scenario Title]

[same structure]

## Alternative Flows and Edge Cases

[Bullet list of non-happy-path scenarios that must be handled]

## Business Rules Identified

[Bullet list of business rules surfaced by the journey mapping]

## Open Questions

[Questions that emerged that only the product owner can answer]
```

**Step 2.3 — Present and validate**
Show the user the persona journeys. Ask:

> "Do the personas and journeys reflect the reality of your users? Is there any critical flow that wasn't mapped, or any business rule that is wrong?"

Incorporate feedback into UX.md before proceeding.

---

## Phase 3 — Plan Creation

**Goal:** Translate research and UX into a concrete, sequenced implementation plan.

**Step 3.1 — Planning agent**
Spawn a single planning agent. It receives: RESEARCH.md, UX.md, the user's context, and these constraints:

> Create a development plan that a developer can follow without needing further clarification. Each task must be specific enough to estimate. The plan must respect the business rules and edge cases surfaced in UX.md. Prefer sequencing that delivers a working slice end-to-end before adding complexity.
>
> **Task discipline:** If you can't specify Files + Action + Verify + Done, the task is too vague.

**Complexity threshold:** If the plan has more than 12 tasks or more than 3 distinct technical concerns (e.g., data model + API + UI + notifications), split into PLAN-01.md, PLAN-02.md, etc. Each file covers one coherent delivery slice.

The agent writes to `[FEATURE_DIR]/PLAN.md` (or PLAN-01.md etc.):

````markdown
# Plan: [Feature Name]

## Context

[1 paragraph: what we're building, why, and what research/UX informed this plan]

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

````

The agent also writes `[FEATURE_DIR]/ROADMAP.md`:

```markdown
# Roadmap: [Feature Name]

**Overall status:** 🔴 Not started

## Progress

| ID   | Task                    | Status       | Notes |
|------|------------------------|--------------|-------|
| T01  | [Task title]           | ⬜ Pending   |       |
| T02  | [Task title]           | ⬜ Pending   |       |
...

## Status Legend
- ⬜ Pending
- 🔄 In progress
- ✅ Done
- ❌ Blocked

## Execution History
[Entries added by kidoncio:execute as tasks complete]

## Next Step
[T01] — [Task title]
````

**Step 3.2 — Present to user**
Show the task list and ask:

> "Does the plan reflect what you want to build? Are there missing tasks, tasks out of order, or tasks that are clearly out of scope for this delivery?"

Incorporate feedback before proceeding to Phase 4.

---

## Phase 4 — Council Review

**Goal:** Run the plan through the full council review (same process as `/kidoncio:review`) to surface issues before implementation begins.

**Step 4.1 — Invoke council review**
Read PLAN.md (and PLAN-01.md etc. if split) and pass the full content to the council review process — the same 3-phase process defined in the `kidoncio` skill: 5 independent reports → debate → unified report.

The council review target is the PLAN.md content, not the original feature description.

**Step 4.2 — Write individual advisor files**
After the 5 independent reports are produced (Phase 1 of the council review), write one file per advisor in `[FEATURE_DIR]/council/`:

- `[FEATURE_DIR]/council/TURING.md`
- `[FEATURE_DIR]/council/LOVELACE.md`
- `[FEATURE_DIR]/council/TORVALDS.md`
- `[FEATURE_DIR]/council/DIJKSTRA.md`
- `[FEATURE_DIR]/council/HAMMURABI.md`

Each file follows this structure:

```markdown
# [ADVISOR NAME] — [Role] — Plan Review: [Feature Name]

## Overview

[How this advisor reads the plan]

## Pros

[Pros from their report]

## Cons & Risks

[Cons and risks from their report]

## Critical Questions

[Their critical questions]

## Verdict

[APPROVE / APPROVE WITH RESERVATIONS / REJECT] — [Justification]

## Position After Debate

[How their position evolved (or didn't) after the council debate — what they conceded, what they held firm on, and why]
```

**Step 4.3 — Write SUMMARY_OF_COUNCIL.md**
After the full council review (reports + debate + unified report), write `[FEATURE_DIR]/SUMMARY_OF_COUNCIL.md`:

```markdown
# Council Summary — [Feature Name]

**Review date:** [DATE]

## Individual Verdicts

| Advisor             | Verdict   | Position Held in Debate?        |
| ------------------- | --------- | ------------------------------- |
| PRAGMATIST_ENGINEER | [verdict] | ✅ Held / 🔄 Partially conceded |
| PRODUCT_STRATEGY    | [verdict] | [same]                          |
| SECURITY_ENGINEER   | [verdict] | [same]                          |
| ARCHITECTURE        | [verdict] | [same]                          |
| CODE_QUALITY        | [verdict] | [same]                          |

## Consolidated Diagnosis

[Top findings that survived the debate]

## Priority Map

### Blockers

[Items that block safe execution]

### Manageable Risks

[Items with proposed mitigations]

### Accepted Debt

[Items consciously deferred, with revisit condition]

## Decisions That Belong to the Team

[Irreconcilable disagreements — judgment calls for the product owner]

## Final Council Recommendation

[PROCEED / PROCEED WITH ADJUSTMENTS / REVISE BEFORE PROCEEDING]

**Conditions to proceed:**

1. [Specific, testable condition]
2. [...]

**Next 3 concrete steps:**

1. [Actionable step with owner type]
2. [...]
3. [...]
```

**Step 4.4 — Apply adjustments to plan**
After writing the council files:

- Apply all **Blockers** as mandatory changes to PLAN.md before marking the plan ready
- Apply **Manageable Risks** as new tasks or notes in PLAN.md
- Log **Accepted Debt** in ROADMAP.md under a "Registered Technical Debt" section
- Copy **Decisions That Belong to the Team** as open questions in ROADMAP.md

Update ROADMAP.md status to: `🟡 Awaiting execution — plan reviewed by council`.

**Step 4.5 — Final handoff to user**
Present a summary:

```
## Plan Ready for Execution

📁 Files created in [FEATURE_DIR]:
- RESEARCH.md — market research and prior art
- UX.md — personas and user journeys
- PLAN.md — reviewed implementation plan
- ROADMAP.md — progress tracker
- SUMMARY_OF_COUNCIL.md — council review summary

📁 Individual reports in [FEATURE_DIR]/council/:
- SENIOR_ENGINEER.md, PRODUCT_STRATEGY.md, SECURITY_ENGINEER.md, ARCHITECTURE.md, CODE_QUALITY.md

✅ Reviewed by council — [N] adjustments applied to plan
⚠️ [N] open decisions that belong to the team (see ROADMAP.md)

To start execution: /kidoncio:execute [FEATURE_SLUG]
```

</process>

<instructions>
- The council always asks questions before acting. No phase starts without user input.
- Questions are asked in a single message per phase — not one at a time.
- The user's answers must visibly influence the output. If they don't, the agent is not listening.
- Files are always written to `.kidoncio/[FEATURE_SLUG]/` relative to the project root (current working directory).
- The planning agent must write tasks specific enough to implement without further clarification. If you can't specify Files + Action + Verify + Done, the task is too vague.
- The council review in Phase 4 uses the full 3-phase process (reports → debate → unified report) from the `kidoncio:review` skill — do not abbreviate it.
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

Plans include explicit boundaries:

```markdown
<boundaries>
## DO NOT CHANGE
- database/migrations/* (schema locked for this phase)
- src/lib/auth.ts (auth system stable)

## SCOPE LIMITS

- This plan creates API only - no UI
- Do not add new dependencies
  </boundaries>
```

Boundaries prevent scope creep by making off-limits areas explicit.

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

<success_criteria>

- [ ] User is asked clarifying questions before each phase
- [ ] RESEARCH.md contains named products and specific technical tradeoffs
- [ ] UX.md contains at least 2 personas with complete journey maps including error states
- [ ] PLAN.md contains tasks with BDD acceptance criteria and estimates
- [ ] PLAN.md includes a boundaries section
- [ ] ROADMAP.md is initialized with all tasks in Pending status
- [ ] Full council review (3-phase) is run on the plan
- [ ] Blockers from council review are applied to PLAN.md before handoff
- [ ] User receives a clear summary of files created and next step
      </success_criteria>
