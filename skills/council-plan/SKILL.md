---
name: council-plan
description: Create a structured implementation plan with council review. Use when preparing execution steps for a feature.
---

---
name: council-plan
description: The council collaboratively researches, sketches technical constraints, maps user flows, and creates a development plan. Produces RESEARCH.md, TECHNICAL_SKETCH.md, UX.md, PLAN.md, and ROADMAP.md in .council/[FEATURE_NAME]/, then runs a council review on the final plan.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Bash, Glob, Agent, WebSearch, AskUserQuestion, Skill]
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

If `[FEATURE_DIR]/BRAINSTORMING.md` exists, read it silently — it contains goals, chosen approach, and the approved design from a prior `/council-brainstorming` session and must be passed to every agent as additional context.

**Step 0.1 — Load project context**
In parallel, check and read all of the following if they exist: `.council/PROJECT.md`, `CLAUDE.md`, `AGENTS.md`. Read them silently — their combined contents are now available as shared project context for every agent spawned in this session. Do not show them to the user or comment on them unless something looks outdated.

If `.council/PROJECT.md` does not exist, tell the user:

  > "I don't have a PROJECT.md for this project yet. This file gives every council agent instant context about your stack and conventions — so we don't re-discover them on every plan.
  >
  > Run `council-init` now to create it (takes ~2 minutes), or skip and I'll proceed without it."

  Wait for the user's choice. If they choose to init, run the full `council-init` process, then continue with the plan. If they skip, proceed without PROJECT.md.

**Step 0.2 — HTML companion contract**
Three reviewable markdown files produced in this session ship with sibling `.html` companions: `TECHNICAL_SKETCH.html`, `UX.html`, `PLAN.html` (one per plan file if split). The `SUMMARY_OF_COUNCIL.html` is owned by the `council-review` skill. The shared design system, structure, diagrams, and rules live in the `council-html-companion` skill — every agent that emits an HTML companion must invoke it (or be briefed with its rules verbatim by the orchestrator) before writing the HTML.

Per-agent intermediate files do **not** get HTML companions: per-advisor reports (`council/<ADVISOR>.md`), the debate transcript (`council/DEBATE.md`), and per-research-agent files (`research/<slug>.md`) stay markdown-only. `ROADMAP.md` is execution state, not a review artifact — no HTML.

---

## Phase 1 — Research

**Goal:** Understand how the market solves this problem. Surface prior art, patterns, and tradeoffs before designing anything.

**Step 1.1 — Check for existing research**
Check if `[FEATURE_DIR]/RESEARCH.md` exists.

- **If it exists:** Read it and tell the user: "I found existing research for this feature. Skipping Phase 1 and proceeding to technical sketch." Proceed directly to Phase 2.
- **If it doesn't exist:** Run `/council-research [FEATURE_SLUG]`. Only proceed to Phase 2 after it completes and RESEARCH.md exists.

---

## Phase 2 — Technical Sketch

**Goal:** Identify what is technically feasible and what constraints exist before any user journey is mapped.

**Step 2.1 — Check for existing technical sketch**
Check if `[FEATURE_DIR]/TECHNICAL_SKETCH.md` exists.

- **If it exists:** Read it and tell the user: "I found an existing technical sketch for this feature. Skipping Phase 2." Proceed directly to Phase 3.
- **If it doesn't exist:** Proceed to Step 2.2.

**Step 2.2 — Technical sketch agent**
Spawn a single technical sketch agent. It receives: RESEARCH.md (including the `Codebase Today` section + diagram + **Reusable Assets**), the feature description, project context (PROJECT.md, CLAUDE.md, AGENTS.md — whichever exist), and the instruction to invoke the `council-html-companion` skill before emitting any HTML.

The sketch is about **design and architecture** — not low-level implementation. The reader is a developer or PM scanning the page in 90 seconds. They should walk away knowing: *what shape this feature has, where it lives in the system, what it touches.* No code blocks beyond signatures or types. No step-by-step instructions.

**Architectural fit is the primary constraint — apply DRY and YAGNI.**
- **DRY:** Before proposing any new module/file/abstraction, the agent MUST consult the Reusable Assets inventory from RESEARCH.md. "Create new X" is only acceptable if extending the existing equivalent is genuinely incompatible — say why in one line.
- **YAGNI:** Every new asset listed in `New things created` must be exercised by at least one slice this plan ships. No speculative abstractions, options, interfaces, or extension points for "future" needs. If a slice doesn't call it, it doesn't belong in the sketch.

The agent writes to `[FEATURE_DIR]/TECHNICAL_SKETCH.md` with this structure:

```markdown
# Technical Sketch: [Feature Name]

## In one sentence
[What this feature is, architecturally — not what it does for the user.]

## How it fits

```mermaid
[A diagram showing where the feature sits in the existing system. Reuse / extend the codebase diagram from RESEARCH.md. Highlight new components.]
```

## Chosen direction
[2-4 bullets: the architectural approach and the one-line reason for each major choice.]

## Alternatives considered
| Approach | Why not |
|----------|---------|
| [name]   | [one line] |
| [name]   | [one line] |

## Boundaries
- **Touches:** [modules, tables, APIs the feature reads or writes]
- **Owns:** [new modules, tables, endpoints the feature creates]
- **Does not touch:** [areas explicitly left alone]

## Reuse Map
| Existing asset | Path:line | How this feature uses it | Extend / Wrap / Read-only |
|----------------|-----------|--------------------------|---------------------------|
| [function/table/service] | [path:line] | [one line] | [verb] |

## New things created
| New asset | Why a new one (not extending which existing) | Existing alternative considered | Reason existing won't work | Exercised by slice |
|-----------|----------------------------------------------|---------------------------------|---------------------------|--------------------|
| [name] | [one line] | [existing path:line or "none found"] | [one line, technical] | [T0X — the slice in this plan that calls it] |

If "Existing alternative considered" is "none found" for more than one row, go back to RESEARCH.md — the codebase survey was incomplete. If "Exercised by slice" is empty for any row, drop the asset — YAGNI.

## Hard constraints
- [things the system cannot do or change easily — one line each]

## What this rules out for UX
- [UX promises that become infeasible given the constraints — one line each]
```

**Length target: under 1 page when rendered.** If a section needs more, the sketch is leaking into the plan — cut it.

After writing the markdown, the agent **also writes `[FEATURE_DIR]/TECHNICAL_SKETCH.html`** by invoking the `council-html-companion` skill and following its rules. The HTML must include:
- Header with title, status badge ("Technical sketch — review"), date, link back to the markdown source.
- TOC over every section.
- The "How it fits" mermaid block rendered as a hand-authored inline SVG (boxes for components, arrows for relationships, color-code new components with `var(--accent)` fill and existing components with `var(--surface)` + border).
- **Alternatives considered** as a `.tabs` component or a comparison table — the chosen direction badged `.badge-ok`.
- **Reuse Map** and **New things created** rendered as tables wrapped in `.table-scroll`. The "New things created" rows with empty `Exercised by slice` get a `.badge-warn` "YAGNI risk" pill.
- **Hard constraints** and **What this rules out for UX** rendered as `.callout.warn` blocks.

**Step 2.3 — Present and validate**
Show the user the chosen direction and hard constraints. Ask:

> "Does this technical direction make sense? Are there constraints I'm missing, or approaches you'd like to explore instead?
>
> Markdown: `[FEATURE_DIR]/TECHNICAL_SKETCH.md`
> HTML for review: `[FEATURE_DIR]/TECHNICAL_SKETCH.html`"

Incorporate feedback into TECHNICAL_SKETCH.md before proceeding. After any edit, regenerate TECHNICAL_SKETCH.html so the review surface matches.

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
Spawn a single UX agent. It receives: the feature description, RESEARCH.md, TECHNICAL_SKETCH.md, the user's answers, and the instruction to invoke the `council-html-companion` skill before emitting any HTML. It must:

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

After writing the markdown, the agent **also writes `[FEATURE_DIR]/UX.html`** by invoking the `council-html-companion` skill and following its rules. The HTML must include:
- Header with title, status badge ("UX — review"), date, link back to the markdown source.
- TOC.
- Each persona as its own `<section>` with a heading and a `.callout` summary block.
- The journey step table per persona, rendered as a standard table with the State column color-coded: green badge (`.badge-ok`) for success states, amber (`.badge-warn`) for friction/error states, red (`.badge-danger`) for hard failures.
- A hand-authored inline SVG flow diagram per persona — entry point → steps → success/error branches. Use design-system color variables so it adapts to dark mode.
- **Business rules** and **Open questions** rendered as `.callout` blocks.

**Step 3.3 — Present and validate**
Show the user the persona journeys. Ask:

> "Do the personas and journeys reflect the reality of your users? Is there any critical flow that wasn't mapped, or any business rule that is wrong?
>
> Markdown: `[FEATURE_DIR]/UX.md`
> HTML for review: `[FEATURE_DIR]/UX.html`"

Incorporate feedback into UX.md before proceeding. Regenerate UX.html after any edit.

---

## Phase 4 — Plan Creation

**Goal:** Translate research, technical constraints, and UX into a concrete, sequenced implementation plan.

**Step 4.1 — Planning agent**
Spawn a single planning agent. It receives: project context (PROJECT.md, CLAUDE.md, AGENTS.md — whichever exist), BRAINSTORMING.md (if it exists), RESEARCH.md, TECHNICAL_SKETCH.md, UX.md, the user's context, the instruction to invoke the `council-html-companion` skill before emitting any HTML, and these constraints:

> Create a plan a developer can read in 2 minutes and execute without re-reading. Each task is one **vertical slice** — a thin end-to-end change a developer can finish, ship, and verify in isolation before the next slice starts.
>
> The plan is a *map*, not a manual. Don't restate what TECHNICAL_SKETCH.md or UX.md already said. Don't paste code. Don't write paragraphs where bullets work. If a task can't be verified the moment it lands (a test passes, an endpoint responds, a screen renders), split or rewrite it.

**Vertical slice rule:** every task touches as little as needed and is testable on completion. A migration that breaks the app until the next task lands is **not** a vertical slice. Prefer: small change end-to-end → verify → next change.

**Complexity threshold:** more than 7 tasks or more than 2 distinct user-facing outcomes → split into PLAN-01.md, PLAN-02.md, etc. Each file covers one coherent delivery slice.

The agent writes to `[FEATURE_DIR]/PLAN.md` (or PLAN-01.md etc.). **Length target: under 2 pages rendered.** Use this exact structure:

````markdown
# Plan: [Feature Name]

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

### T01 — [Verb-first title, e.g., "Add grooming slot model"]

- **Touches:** [files / modules]
- **Reuses:** [existing function/helper/table/endpoint — path:line — from TECHNICAL_SKETCH Reuse Map. "None" only if the slice creates a genuinely new asset already justified in "New things created".]
- **Change:** [one sentence — what gets built. If creating new code, name the closest existing pattern this MUST follow (e.g., "follows the shape of `server/api/grooming/index.ts`").]
- **Verify:** [exact command, click, or test that proves it works]
- **Done when:**
  ```gherkin
  Given [state]
  When [action]
  Then [observable outcome]
  ```

### T02 — [...]

[Repeat. Aim for 3-7 slices total.]

## Decisions
[Bullets. Each: decision — one-line reason. Skip if covered in TECHNICAL_SKETCH.md.]

## Risks
[Bullets. Each: risk — mitigation. Skip if none surfaced.]
````

**Writing rules for this agent:**
- No prose paragraphs. Bullets only, except inside Gherkin blocks.
- "Touches" lists files; "Reuses" cites existing assets the slice must call/extend (from TECHNICAL_SKETCH Reuse Map); "Change" is one sentence; "Verify" is something a human can run.
- Don't restate context — the reader has TECHNICAL_SKETCH.md and UX.md a click away.
- Drop Type / Estimate / Dependencies fields unless they carry information. They usually don't.
- **DRY:** A slice's `Reuses` field is mandatory. `None` is only valid when the slice creates an asset already justified in TECHNICAL_SKETCH's `New things created` table.
- **YAGNI:** Slices build only what other slices in this plan or shipped code already need. No scaffolding for unshipped features. If a task exists to "prepare for" something later, cut it — add it to the later plan.
- A slice that creates a new file/module/abstraction without a corresponding entry in TECHNICAL_SKETCH's "New things created" table is **invalid** — either extend the existing equivalent or add the justification upstream and try again.

The agent also writes `[FEATURE_DIR]/ROADMAP.md` with: overall status (🔴 Not started), a progress table (ID / Task / Status ⬜🔄✅❌ / Notes), status legend, empty Execution History section, and Next Step pointing to T01. **ROADMAP.md does not get an HTML companion** — it's an execution-state file, not a review artifact.

After writing PLAN.md (or PLAN-01.md, etc.), the agent **also writes a sibling `PLAN.html`** (and `PLAN-01.html`, etc.) by invoking the `council-html-companion` skill and following its rules. The HTML must include:
- Header with title, status badge ("Plan — review"), date, link back to the markdown source.
- TOC linking to each slice.
- In/Out of scope and `<boundaries>` rendered as side-by-side `.callout` blocks (in-scope `.callout.ok`, out-of-scope `.callout.warn`, boundaries `.callout.danger`).
- Each **slice** rendered as its own `<section>` (heading `T01 — [title]`) with:
  - A definition list for **Touches**, **Reuses**, **Change**, **Verify**. The Verify command in `<code>` so the user can copy it cleanly.
  - The Gherkin acceptance criteria block using the `.gherkin` class with `Given`/`When`/`Then`/`And` keywords wrapped in `<span class="gh-keyword">`.
  - A small badge near the heading indicating dependency type (e.g., `.badge-status` "Independent" if `Depends on` is empty, `.badge-warn` "Sequential" if it depends on another slice).
- A hand-authored inline SVG showing slice sequencing — boxes for each Tnn with arrows for dependencies. Independent slices in a row; sequential chains as a vertical flow.
- **Decisions** and **Risks** rendered as `.callout` blocks (risks `.callout.warn`).

**Step 4.2 — Present to user**
Show the task list and ask:

> "Does the plan reflect what you want to build? Are there missing tasks, tasks out of order, or tasks that are clearly out of scope for this delivery?
>
> Markdown: `[FEATURE_DIR]/PLAN.md`
> HTML for review: `[FEATURE_DIR]/PLAN.html`"

Incorporate feedback before proceeding to Phase 5. Regenerate PLAN.html after any edit.

---

## Phase 5 — Council Review

**Goal:** Run the plan through the full council review to surface issues before implementation begins.

**Step 5.1 — Invoke council review**
Read PLAN.md (and PLAN-01.md etc. if split) and invoke the `council-review` process, passing:
- The full PLAN.md content as the plan to review
- `[FEATURE_DIR]/council/` as the output directory for advisor files

The `council-review` process runs autonomously and produces all output files directly:
- Each of the 5 advisors writes their own `[FEATURE_DIR]/council/[ADVISOR].md` (report + Position After Debate)
- The debate agent writes `[FEATURE_DIR]/council/DEBATE.md`
- The synthesis agent writes `[FEATURE_DIR]/SUMMARY_OF_COUNCIL.md`

Wait for all files to exist before proceeding to Step 5.2. Do not write or modify any council files yourself — `council-review` owns all output in `[FEATURE_DIR]/council/` and `SUMMARY_OF_COUNCIL.md`.

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

Files created in [FEATURE_DIR]:
  Markdown (source of truth — agents read these):
  - RESEARCH.md            — market research and prior art
  - TECHNICAL_SKETCH.md    — feasibility constraints and chosen direction
  - UX.md                  — personas and user journeys
  - PLAN.md                — reviewed implementation plan
  - ROADMAP.md             — progress tracker (no HTML — execution state)
  - SUMMARY_OF_COUNCIL.md  — council review summary

  HTML (open in browser to review or share):
  - RESEARCH.html, TECHNICAL_SKETCH.html, UX.html, PLAN.html, SUMMARY_OF_COUNCIL.html

Individual reports in [FEATURE_DIR]/council/:
  - TURING.md, LOVELACE.md, TORVALDS.md, DIJKSTRA.md, HAMMURABI.md, DEBATE.md
  - matching .html companions for each

Reviewed by council — [N] adjustments applied to plan
[N] open decisions that belong to the team (see ROADMAP.md)

To start execution: /council-execute [FEATURE_SLUG]
```

</process>

<instructions>
- The council always asks questions before acting. No phase starts without user input.
- Questions are asked in a single message per phase — not one at a time.
- The user's answers must visibly influence the output. If they don't, the agent is not listening.
- Files are always written to `.council/[FEATURE_SLUG]/` relative to the project root (current working directory).
- The planning agent must write tasks specific enough to implement without further clarification. If you can't specify Files + Action + Verify + Done, the task is too vague.
- The council review in Phase 5 uses the full 3-phase process from the `council-review` skill. Each advisor writes their own file, the debate agent writes DEBATE.md, and the synthesis agent writes SUMMARY_OF_COUNCIL.md. The orchestrator does not write any of these files — it only coordinates and waits.
- **Project context:** If any of `.council/PROJECT.md`, `CLAUDE.md`, or `AGENTS.md` were loaded in Step 0.1, pass their combined contents to every agent spawned in this session (research agents, technical sketch agent, UX agent, planning agent, council review agents). Prepend them to each agent's context as: "Project context (do not re-research this):\n[combined contents]". This replaces the need for agents to infer the stack from scratch.
- **HTML companions:** Only the synthesized review artifacts get a sibling `.html` — TECHNICAL_SKETCH, UX, PLAN (and PLAN-01, etc.), and SUMMARY_OF_COUNCIL. Per-advisor reports, the debate transcript, per-research-agent files, and ROADMAP.md stay markdown-only. The shared design system lives in the `council-html-companion` skill — every agent that emits HTML invokes it first (or is briefed with its rules) so styling, diagrams, and badges stay consistent across artifacts. Markdown stays source of truth — HTML never carries content the markdown doesn't.
- **Output tone — terse technical prose.** Drop articles, filler, hedging. Fragments OK. Bullets over paragraphs. Plan Context section: 2-3 bullet points, not paragraphs. Every sentence must carry information or be cut.
- **DRY and YAGNI are first-class constraints.** Reuse over rebuild (DRY); ship only what a slice in this plan exercises (YAGNI). Both are enforced upstream in TECHNICAL_SKETCH (Reuse Map + "New things created" with `Exercised by slice`) and downstream per slice (`Reuses` field).
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

**Good plan:** 3-7 vertical slices. Each slice mergeable and verifiable on its own.

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

A horizontal layer task is rarely testable until the next layer lands. That defeats the slice rule.

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

**YAGNI violations:**

- "Add a plugin system / abstraction layer / interface for future X" — when no current slice has a second concrete user. Build the concrete case; extract on the second need.
- "Set up generic config / options / flags" that no slice flips.

**DRY violations:**

- A new helper/service whose `Reuses` field is `None` and whose concept (noun + verb) already exists elsewhere in the repo. The sketch's Reuse Map missed it — go back and fix the sketch, not the slice.

</plan_quality_rules>
