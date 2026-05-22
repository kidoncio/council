---
name: council-plan
description: The council collaboratively researches, sketches technical constraints, maps user flows, and creates a development plan. Produces RESEARCH.md, TECHNICAL_SKETCH.md, UX.md, PLAN.md, and ROADMAP.md in .council/[FEATURE_SLUG]/, then runs a council review on the final plan.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Edit, Bash, Glob, Agent, WebSearch, AskUserQuestion, Skill]
---

<objective>
Guide the council through a structured 5-phase process to produce a complete, reviewed development plan. Each phase has explicit gates, validation across artifacts, and named owners for every write. No phase is skipped. UX mapping happens after technical constraints are known — not before.

The output is a set of files in `.council/[FEATURE_SLUG]/` that serve as the authoritative source of truth for implementation.
</objective>

<advisors_reference>
The council is composed of 5 permanent advisors plus 1 decider used throughout this process:

**Advisors (parallel reports):**
- **TURING** — Pragmatist Engineer. Focuses on operational simplicity, blast radius, ghost code, naming, abstractions, test quality, and convention drift.
- **LOVELACE** — Product Strategist. Focuses on user outcomes and delivery speed.
- **TORVALDS** — Security Engineer. Focuses on attack surfaces and data exposure.
- **DIJKSTRA** — Systems Thinker. Focuses on consistency, scalability, and data model evolution.
- **CASSANDRA** — Pre-Mortem Strategist. Narrates how the plan will fail in 6 months and which leading indicator gets ignored.

**Decider (single synthesis):**
- **AURELIUS** — Chief of Staff. Reads all 5 advisor reports and signs the executive verdict. Owns the Blockers list, may promote/demote findings, and names which advisor's lens won when they conflict. Does not invent new findings — judgment only over what the 5 produced.
</advisors_reference>

<terminology>
The council review classifies findings into four buckets. Every step that references them must use these definitions:

- **Blocker** — issue that would break the system, violate security/compliance, or invalidate a user journey if shipped as-is. Must be resolved before execution. Resolving may require editing PLAN.md, TECHNICAL_SKETCH.md, or UX.md.
- **Manageable Risk** — issue that is real but mitigable in parallel with execution. Becomes a new slice or an explicit note in PLAN.md.
- **Accepted Debt** — known limitation the team consciously chooses to defer. Logged in ROADMAP.md under "Registered Technical Debt" with a revisit condition.
- **Decision That Belongs to the Team** — open question the council cannot resolve (product/business judgment required). Surfaced to the user at handoff (Step 5.4) and logged in ROADMAP.md.

Every council artifact (per-advisor reports, SUMMARY_OF_COUNCIL.md) must use these exact labels — no synonyms.
</terminology>

<orchestrator_writes>
The orchestrator (the model running this skill) is allowed to directly write or edit only:

- `ROADMAP.md` (creation initially by planning agent, but ongoing edits — status, debt log, open decisions — are orchestrator's job).
- Targeted edits to `PLAN.md`, `TECHNICAL_SKETCH.md`, `UX.md` **after Phase 5** when applying council Blockers (Step 5.2) or when incorporating user feedback at the "Present and validate" gates. Every such edit must be small, surgical, and reported to the user.

The orchestrator must **not** author from scratch: RESEARCH.md, per-research-agent files, per-advisor reports, SUMMARY_OF_COUNCIL.md. Those are owned by their producing agents (advisors + AURELIUS decider).

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

For each of `BRAINSTORMING.md`, `RESEARCH.md`, `TECHNICAL_SKETCH.md`, `UX.md`, `PLAN.md` that already exists, capture: file mtime, the feature description it covers (from its first heading), and the SHA-256 of the file. Build a short table for the user:

```
Existing artifacts in [FEATURE_DIR]:
  - BRAINSTORMING.md  (last modified YYYY-MM-DD, scope: "[heading]")
  - RESEARCH.md       (last modified YYYY-MM-DD, scope: "[heading]")
  - ...
```

If any artifact exists, ask **one** explicit question:

> "I found existing artifacts. Are they current and matching this feature, or should any be regenerated? Pick: (a) reuse all, (b) regenerate some — say which, (c) start fresh — delete and replan."

Wait for the answer. The "skip phase if file exists" rule (Phase 1.1, 2.1) only kicks in when the user explicitly chose "reuse" for that artifact. Otherwise the phase runs and overwrites.

**Step 0.3 — HTML companion contract**
Only `PLAN.md` (or `PLAN-01.md`, `PLAN-02.md`, etc.) ships with sibling `.html` companions. The planning agent writes only the markdown. The orchestrator then spawns the `council-html-companion` subagent to render the HTML — see that skill's `<invocation>` section. All other artifacts stay markdown-only.

---

## Phase 1 — Research

**Goal:** Understand how the market solves this problem. Surface prior art, patterns, and tradeoffs before designing anything.

**Step 1.1 — Decide research path**
Based on Step 0.2's outcome:

- **User chose "reuse" for RESEARCH.md:** read it, summarize its scope to the user in one sentence, proceed to Phase 2.
- **Otherwise:** run `/council-research [FEATURE_SLUG]`. Only proceed to Phase 2 after it completes and RESEARCH.md exists.

---

## Phase 2 — Technical Sketch

**Goal:** Identify what is technically feasible and what constraints exist before any user journey is mapped.

**Step 2.1 — Decide sketch path**
Based on Step 0.2's outcome:

- **User chose "reuse" for TECHNICAL_SKETCH.md:** read it, summarize its chosen direction to the user in one sentence, proceed to Phase 3.
- **Otherwise:** proceed to Step 2.2.

**Step 2.2 — Spawn technical sketch agent**
Use the `Agent` tool, `subagent_type: general-purpose`. The brief must follow `<subagent_brief_contract>` and include: project context (PROJECT.md + CLAUDE.md + AGENTS.md), BRAINSTORMING.md (if exists), RESEARCH.md (full, including `Codebase Today` + diagram + Reusable Assets), the feature description.

Instruct the subagent to write `[FEATURE_DIR]/TECHNICAL_SKETCH.md` using the structure below. Length target: under 1 page when rendered.

**Architectural fit is the primary constraint — apply DRY and YAGNI.**
- **DRY:** Before proposing any new module/file/abstraction, consult the Reusable Assets inventory from RESEARCH.md. "Create new X" is acceptable only if extending the existing equivalent is genuinely incompatible — explain why in one line.
- **YAGNI:** Every new asset listed in `New things created` must be exercised by at least one slice this plan ships. No speculative abstractions.

````markdown
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

## Hard constraints
- [things the system cannot do or change easily — one line each]

## What this rules out for UX
- [UX promises that become infeasible given the constraints — one line each]

## Versioning
- **Version:** v1
- **Last revised:** [date]
- **Revision reason:** initial draft
````

**Step 2.3 — Orchestrator validation (cross-artifact)**
After the subagent finishes, the orchestrator reads TECHNICAL_SKETCH.md and verifies:

1. **YAGNI consistency:** every row in "New things created" has a non-empty "Exercised by slice" field. If empty, flag for revision before showing to the user.
2. **DRY consistency:** if "Existing alternative considered" is "none found" for more than one row, flag. This is a hint the codebase survey was incomplete — note it in the user-facing question (Step 2.4) and offer to re-run `/council-research`.
3. **Diagram present:** mermaid block is non-empty.

If any check fails, re-spawn the sketch subagent with a brief that explicitly cites the failed check. Do not edit the file manually for these issues.

**Step 2.4 — Present and validate**
Show the user the chosen direction, hard constraints, and any orchestrator validation flags from Step 2.3. Ask:

> "Does this technical direction make sense? Are there constraints I'm missing, or approaches you'd like to explore instead?
>
> Markdown: `[FEATURE_DIR]/TECHNICAL_SKETCH.md`"

**Incorporating feedback:** If the user's feedback is small (one constraint, one phrasing, one alternative to add/remove), the orchestrator edits TECHNICAL_SKETCH.md directly, bumps the **Version** to v2 (etc.), and fills "Revision reason". If the feedback requires re-thinking the chosen direction or invalidates the Reuse Map / New things created tables, re-spawn the sketch subagent with the feedback. Either way: re-run Step 2.3 validation before proceeding.

---

## Phase 3 — UX & User Journey

**Goal:** Map how real users experience this feature — informed by what the system can actually do.

**Step 3.1 — Council interviews the user**
Ask the user, in a single message:

1. Who are the types of users that will interact with this feature?
2. At what point in the user's current journey does this feature fit?
3. What is the worst-case usage scenario that must work correctly?
4. Is there any flow the user should NOT be able to perform?
5. Does success/error feedback to the user matter especially here? How do you imagine it should work?

Wait for the user's response.

**Step 3.2 — Spawn UX mapping agent**
Use the `Agent` tool, `subagent_type: general-purpose`. The brief follows `<subagent_brief_contract>` and includes: project context, RESEARCH.md, TECHNICAL_SKETCH.md (full — the agent must respect Hard Constraints and "What this rules out for UX"), the user's answers from Step 3.1.

Instruct the subagent to write `[FEATURE_DIR]/UX.md` with:

- At least 2 named personas (context + goal each)
- A journey per persona: entry point → step table (User Action / System Response / State ✅⚠️❌) → success state → error states → integration points
- Alternative flows and edge cases (bullet list)
- Business rules identified (bullet list)
- Open questions for the product owner
- Footer with versioning: `**Version:** v1 · **Last revised:** [date] · **Revision reason:** initial draft`

**Step 3.3 — Orchestrator validation (cross-artifact)**
After the subagent finishes, the orchestrator reads UX.md and cross-checks against TECHNICAL_SKETCH.md:

1. **Hard Constraint respect:** for each Hard Constraint in TECHNICAL_SKETCH.md, scan UX.md for any flow that would violate it. If found, flag.
2. **UX rule-outs:** for each entry in "What this rules out for UX", verify no journey in UX.md depends on it.
3. **Persona count:** at least 2 distinct personas.

If checks fail, re-spawn the UX subagent with a brief citing the failed check. Do not edit manually.

**Step 3.4 — Present and validate**
Show the user the persona journeys and any orchestrator validation flags. Ask:

> "Do the personas and journeys reflect the reality of your users? Is there any critical flow that wasn't mapped, or any business rule that is wrong?
>
> Markdown: `[FEATURE_DIR]/UX.md`"

**Incorporating feedback:** Same protocol as Step 2.4 — small edits direct, bump Version; large changes re-spawn UX subagent. If the feedback contradicts a Hard Constraint from TECHNICAL_SKETCH.md, the orchestrator must surface the contradiction explicitly to the user and offer to go back to Phase 2 to revise the sketch. Do not silently override a sketch constraint via UX feedback.

---

## Phase 4 — Plan Creation

**Goal:** Translate research, technical constraints, and UX into a concrete, sequenced implementation plan.

**Step 4.1 — Spawn planning agent**
Use the `Agent` tool, `subagent_type: general-purpose`. The brief follows `<subagent_brief_contract>` and includes: project context, BRAINSTORMING.md (if it exists), RESEARCH.md, TECHNICAL_SKETCH.md (full — including Reuse Map and New things created tables), UX.md (full).

Instruct the subagent with these constraints:

> Create a plan a developer can read in 2 minutes and execute without re-reading. Each task is one **vertical slice** — a thin end-to-end change a developer can finish, ship, and verify in isolation before the next slice starts.
>
> The plan is a *map*, not a manual. Don't restate what TECHNICAL_SKETCH.md or UX.md already said. Don't paste code. Don't write paragraphs where bullets work. If a task can't be verified the moment it lands (a test passes, an endpoint responds, a screen renders), split or rewrite it.

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

[Repeat. Aim for 3-7 slices total.]

## Decisions
[Bullets. Each: decision — one-line reason. Skip if covered in TECHNICAL_SKETCH.md.]

## Risks
[Bullets. Each: risk — mitigation. Skip if none surfaced.]
````

**Writing rules for the planning agent:**
- No prose paragraphs except inside Gherkin blocks.
- Drop Type / Estimate / Dependencies fields unless they carry information.
- **DRY:** every slice's `Reuses` field is mandatory. `None` is only valid when the slice creates an asset already justified in TECHNICAL_SKETCH's `New things created` table.
- **YAGNI:** slices build only what other slices in this plan or shipped code already need.

The planning subagent also writes `[FEATURE_DIR]/ROADMAP.md` with: overall status (`🔴 Not started`), a progress table (ID / Task / Status ⬜🔄✅❌ / Notes), status legend, empty `Execution History` section, empty `Registered Technical Debt` section, empty `Open Decisions` section, and **Next Step** pointing to T01.

**Step 4.2 — Orchestrator validation (cross-artifact, MANDATORY)**
This is the most important validation gate in the whole skill. The orchestrator reads PLAN.md (all PLAN-NN.md files) and cross-checks against TECHNICAL_SKETCH.md:

1. **Reuse Map cross-check:** for every slice with a `Reuses` field, verify the cited asset (path:line) appears in TECHNICAL_SKETCH's Reuse Map. If not, the planning agent invented a reuse or the sketch is incomplete — flag.
2. **New things created cross-check:** for every new file/module/abstraction a slice creates (inferable from `Touches` + `Change`), verify there is a corresponding row in TECHNICAL_SKETCH's "New things created" with `Exercised by slice = T0X` pointing to *this* slice. If not, the slice violates the architectural contract.
3. **`Exercised by slice` real-link check:** for every row in TECHNICAL_SKETCH's "New things created", verify the cited slice (e.g., T03) actually calls or creates that asset (look at slice's `Touches`, `Change`, `Reuses`). A row whose declared exercising slice doesn't actually exercise it is a YAGNI violation.
4. **UX coverage:** every persona journey in UX.md must be deliverable by some combination of slices. If a journey has no corresponding slice path, flag.
5. **Boundaries respect:** the `<boundaries>` block lists "Do not change". Verify no slice's `Touches` includes a locked file.
6. **Gherkin verifiability:** every `Done when` Gherkin block has concrete `Given`/`When`/`Then` — no "user experience is good", "code is clean", or other unverifiable statements.

For each failed check, re-spawn the planning subagent with a brief explicitly citing the failure (not a vague "please fix"). Do not edit PLAN.md manually for these issues.

**Step 4.3 — Render PLAN HTML**
After validation in Step 4.2 passes, the orchestrator spawns the `council-html-companion` subagent **once per PLAN file** to render each sibling `.html`. Inputs (substitute filename per call):

- `markdown_path` = `[FEATURE_DIR]/PLAN.md` (or `PLAN-NN.md`) (absolute)
- `html_path` = `[FEATURE_DIR]/PLAN.html` (or `PLAN-NN.html`) (absolute)
- `artifact_type` = `PLAN`
- `feature_slug` = `[FEATURE_SLUG]`
- `status_label` = `Plan — review`
- `companion_index` = comma-separated list of other `*.html` files already present in `[FEATURE_DIR]` (typically only sibling `PLAN-*.html`)

If split into PLAN-01, PLAN-02, etc., spawn sequentially so each call sees prior siblings.

**Step 4.4 — Present and validate**
Show the user the task list, the validation summary from Step 4.2, and ask:

> "Does the plan reflect what you want to build? Are there missing tasks, tasks out of order, or tasks that are clearly out of scope for this delivery?
>
> Markdown: `[FEATURE_DIR]/PLAN.md`
> HTML for review: `[FEATURE_DIR]/PLAN.html`"

**Incorporating feedback:** Same protocol as Steps 2.4/3.4 — small edits direct (bump version), large changes re-spawn planning subagent. After any edit, re-run Step 4.2 validation and re-spawn the `council-html-companion` subagent for each affected PLAN file.

---

## Phase 5 — Council Review

**Goal:** Run the plan through the full council review to surface issues before implementation begins. Five advisors review the plan in parallel; AURELIUS reads all 5 reports and signs an executive verdict. No simulated debate — the divergent perspectives already live in the 5 reports, and AURELIUS owns the priority calls between them.

**Step 5.1 — Invoke council review with full context**
Invoke the `council-review` process. Pass these inputs (every advisor must receive all of them):

- The full content of PLAN.md (and PLAN-NN.md if split).
- The full content of TECHNICAL_SKETCH.md (so advisors can cross-check Reuse Map, Boundaries, Hard Constraints).
- The full content of UX.md (so TORVALDS sees user inputs, LOVELACE sees flows, CASSANDRA sees failure surfaces).
- The full content of RESEARCH.md (for prior art and codebase survey).
- BRAINSTORMING.md if it exists.
- The project context (PROJECT.md + CLAUDE.md + AGENTS.md).
- `[FEATURE_DIR]/council/` as the output directory.
- The terminology block (`<terminology>` above) — advisors must classify findings as Blocker / Manageable Risk / Accepted Debt / Decision That Belongs to the Team using exactly those labels.

`council-review` produces:
- `[FEATURE_DIR]/council/[ADVISOR].md` per advisor (report with Findings classification)
- `[FEATURE_DIR]/SUMMARY_OF_COUNCIL.md` (signed AURELIUS — the decider)

Wait for all files to exist.

**Step 5.2 — Verify AURELIUS produced an accountable decision**
Before applying findings, the orchestrator reads SUMMARY_OF_COUNCIL.md and the 5 advisor reports and verifies:

1. **Verdict is signed by AURELIUS** and the "Why this verdict" section is non-empty with 2-4 trade-off bullets naming advisors. If missing or fully generic, re-invoke `council-review` requiring AURELIUS to name the specific advisors weighted.
2. **Every Blocker, Risk, Accepted Debt, and Open Question cites which advisor(s) raised it.** Findings without attribution mean AURELIUS invented them — re-invoke.
3. **When AURELIUS overruled an advisor** (promoted a risk to blocker, demoted a blocker, or marked an advisor "Overruled" in the vote table), the one-line reason is visible inline. If hidden or absent, re-invoke.
4. **Findings use the canonical labels** from `<terminology>`. If the synthesis used synonyms ("must-fix", "warning", "future work"), re-invoke with the label requirement reinforced.
5. **No irreconcilable disagreement is silently dropped.** If two advisors held opposing classifications on the same finding, SUMMARY_OF_COUNCIL.md must either show AURELIUS's call with the reason or list it under "Open questions for you" — never paper over it.

Report verification result to the user in one paragraph: "Council reviewed, AURELIUS verdict: [verdict]. [N] blockers / [M] risks / [K] accepted debt / [J] open decisions. [One line on whether AURELIUS overruled any advisor and why.]"

**Step 5.3 — Apply findings and re-validate**
The orchestrator now applies the council's findings. Ownership is explicit:

- **Blockers:** the orchestrator edits PLAN.md, TECHNICAL_SKETCH.md, and/or UX.md as needed. Each edit bumps the artifact's Version and fills "Revision reason" (e.g., "v2 — TORVALDS blocker: rate-limit endpoint"). If a Blocker requires a structural rewrite (not a small edit), re-spawn the responsible subagent (planning, sketch, or UX agent) with a brief citing the blocker.
- **Manageable Risks:** add as new slices in PLAN.md (with full Touches/Reuses/Change/Verify/Done) **or** as inline `**Risk:**` notes under the affected slice. Bump Version.
- **Accepted Debt:** append to ROADMAP.md under `## Registered Technical Debt` with: item, why deferred, condition to revisit. Cite the advisor who raised it.
- **Decisions That Belong to the Team:** append to ROADMAP.md under `## Open Decisions` with the question verbatim from SUMMARY_OF_COUNCIL.md.

**Re-validation gate (MANDATORY):** after applying changes, re-run Step 4.2's cross-artifact checks against the modified PLAN/SKETCH/UX. If new violations were introduced by the council adjustments, fix them in the same loop before exiting Phase 5.

**Re-render PLAN HTML** for every PLAN file that was modified.

Update ROADMAP.md status to: `🟡 Awaiting execution — plan reviewed by council (v[N])`.

**Step 5.4 — Final handoff to user**
Show this exact structure — the user must see the council's voice, not just file paths:

```markdown
## Plan Ready for Execution: [Feature Name]

**Council verdict:** [PROCEED / PROCEED WITH ADJUSTMENTS / REVISE BEFORE PROCEEDING]

**What changed in this round:**
- PLAN.md: v1 → v[N] — [one line on what was added/removed]
- TECHNICAL_SKETCH.md: v1 → v[N] — [if changed]
- UX.md: v1 → v[N] — [if changed]
- [or: no artifact changes — council had no Blockers]

**Open decisions for you to resolve before execution:**
- [Question 1 from "Decisions That Belong to the Team"]
- [Question 2]
- [or: none]

**AURELIUS overrules in this review:**
- [Advisor X's blocker demoted to risk — reason]
- [Advisor Y's risk promoted to blocker — reason]
- [or: none — AURELIUS aligned with advisor classifications]

**Registered technical debt:**
- [Item 1 with revisit condition]
- [or: none]

Files in [FEATURE_DIR]:
  - RESEARCH.md, TECHNICAL_SKETCH.md (v[N]), UX.md (v[N])
  - PLAN.md (v[N]) — also rendered as PLAN.html for review
  - ROADMAP.md — progress tracker, Registered Technical Debt, Open Decisions
  - SUMMARY_OF_COUNCIL.md — council review summary
  - council/TURING.md, LOVELACE.md, TORVALDS.md, DIJKSTRA.md, CASSANDRA.md

**If verdict is REVISE BEFORE PROCEEDING:** do not run `/council-execute`. Resolve the listed blockers (re-run /council-plan or edit PLAN.md manually with re-validation) before execution.

To start execution: /council-execute [FEATURE_SLUG]
```

**If the council verdict is `REVISE BEFORE PROCEEDING`,** the skill stops here. Do not advance to handoff-as-success. Tell the user explicitly that `/council-execute` should not be invoked yet, and list what needs to happen first.

</process>

<subagent_brief_contract>

Every subagent spawn in this skill (technical sketch agent, UX mapping agent, planning agent, council review's internal agents via `/council-research` and `/council-review`) receives a self-contained brief. Templates differ per phase, but every brief MUST include:

1. **Project context block** — verbatim contents of PROJECT.md, CLAUDE.md, AGENTS.md (whichever exist), prefixed with: `"Project context (do not re-research this):"`.
2. **Feature description** — the original $ARGUMENTS or current `FEATURE_SLUG` + one-paragraph summary.
3. **Inputs** — paths AND full content of every upstream artifact the agent depends on (not just paths — the subagent has no working dir context and may not be able to read efficiently).
4. **Output contract** — exact file path to write, exact structure (template copied into the brief), length target.
5. **Boundaries** — what the agent must NOT do (e.g., "do not modify TECHNICAL_SKETCH.md", "do not write HTML", "do not invent reuse references").
6. **Tone rules** — terse technical prose, fragments OK, bullets over paragraphs.
7. **What to return** — a structured one-message summary (files written, validation it performed on itself, anything unexpected). The subagent does not echo back the whole markdown; just the summary.

If a re-spawn is required (validation failed, user feedback large), the new brief MUST cite the specific check that failed or the user feedback verbatim — never a vague "please fix the issues".

</subagent_brief_contract>

<instructions>
- The council always asks questions before acting. No phase starts without user input at the gates (0.2, 3.1, 2.4, 3.4, 4.4, 5.4).
- Questions are asked in a single message per phase — not one at a time.
- The user's answers must visibly influence the output. If they don't, the agent is not listening.
- Files are always written to `.council/[FEATURE_SLUG]/` relative to the project root (current working directory).
- **Orchestrator write boundary:** see `<orchestrator_writes>`. The orchestrator does not author artifacts from scratch — it spawns subagents and edits surgically for council Blockers + user feedback.
- **Cross-artifact validation is non-negotiable.** Steps 2.3, 3.3, 4.2, 5.3 are the only mechanism that keeps the artifacts coherent. Skipping them defeats the multi-phase design.
- **AURELIUS's decision must be verified, not trusted.** Step 5.2 is mandatory — every blocker/risk must cite an advisor, every overrule must name its reason inline. Synthesis without attribution means AURELIUS invented findings.
- **No silent slips into execution.** If council verdict is `REVISE BEFORE PROCEEDING`, the skill stops at Step 5.4 with explicit instructions to the user. `/council-execute` is not the default next action.
- **Versioning:** every artifact (TECHNICAL_SKETCH, UX, PLAN) carries a Version + Last revised + Revision reason. Every edit bumps Version. Audit trail is in the file itself.
- **DRY and YAGNI are first-class constraints.** Reuse Map + "New things created" (sketch) + `Reuses` field (plan) are cross-checked by the orchestrator in Step 4.2. Without that cross-check, the rules are aspiration only.
- **HTML companions:** Only PLAN files get sibling `.html`. All other artifacts stay markdown-only. The orchestrator renders via `council-html-companion`.
- **Output tone — terse technical prose.** Drop articles, filler, hedging. Fragments OK. Bullets over paragraphs.
- Use English (en-US) for all generated files. Respond to the user in their language.
</instructions>

<plan_quality_rules>

These rules apply to the planning agent (Step 4.1) and to the orchestrator's Step 4.2 validation. Both must enforce them.

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

The `<boundaries>` block in PLAN.md prevents scope creep. Always include it — even if minimal. Step 4.2 verifies no slice violates the "Do not change" list.

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

A horizontal layer is rarely testable until the next layer lands. Defeats the slice rule.

## Anti-Patterns

**Vague actions:** "Set up the infrastructure", "Handle edge cases", "Make it production-ready".

**Unverifiable completion:** "It works correctly", "User experience is good", "Code is clean".

**Missing context:** "Use the standard approach", "Follow best practices", "Like the other endpoints".

**Tasks that bundle concerns:** "Validate, persist, and notify" is three tasks in disguise — split.

**YAGNI violations:** "Add a plugin system / abstraction layer / interface for future X" when no current slice has a second concrete user. "Set up generic config / options / flags" that no slice flips.

**DRY violations:** A new helper/service whose `Reuses` field is `None` and whose concept (noun + verb) already exists elsewhere. The sketch's Reuse Map missed it — fix the sketch, not the slice.

</plan_quality_rules>
