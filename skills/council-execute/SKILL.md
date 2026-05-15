---
name: council-execute
description: Execute a plan and track roadmap progress. Use when implementing tasks from an existing PLAN.md.
allowed-tools: [Read, Write, Edit, Bash, Glob, Agent, AskUserQuestion, Skill]
---

<objective>
Execute the development plan produced by `council-plan`. Tasks are dispatched to focused subagents (one task → one agent), in dependency order. Independent tasks may be dispatched in parallel. The orchestrator never writes code itself — its job is to brief subagents, validate their output, update `ROADMAP.md`, and keep the user in the loop. The ROADMAP.md is updated after every task — not at the end. If a task is blocked, ambiguous, or fails, execution pauses and the user is consulted before proceeding. The council does not improvise beyond the plan without explicit user approval.
</objective>

<execution_model>

## Why subagents

Implementation work is delegated to focused subagents (`subagent_type: general-purpose`) for three reasons:

1. **Context isolation** — each subagent gets only the slice's PLAN entry + relevant repo context. The orchestrator's session stays lean for coordination.
2. **Scope discipline** — a subagent with a narrow brief and explicit boundaries is less likely to wander into adjacent refactors.
3. **Parallelism** — independent slices (no shared files, no shared state) can run concurrently. See [[council-dispatching-parallel-agents]] for the dispatch pattern.

The orchestrator is the **planner + reviewer + bookkeeper**. It never edits source files directly during a task's implementation step — it briefs the subagent and reviews what came back. The only files the orchestrator writes directly are `ROADMAP.md` updates and (rarely) post-task adjustments the user explicitly approves.

## Orchestrator responsibilities

- Read PLAN.md and ROADMAP.md.
- Identify the next executable task (or set of parallel-safe tasks).
- Run the reuse check (Step 2.5) **before** spawning — duplication is cheaper to catch in the brief than after the subagent runs.
- Brief the subagent with a self-contained prompt (see `<subagent_brief_template>`).
- Wait for the subagent to return its summary.
- Verify the changes match the acceptance criteria (read the diff, run the verification command).
- Update ROADMAP.md.
- Report to the user and ask whether to continue.

## Subagent responsibilities

- Implement exactly what the brief describes — no scope creep.
- Run any verification commands the brief specifies.
- Return a structured summary (files modified, criteria verified, complexity flags, reuse decisions, anything unexpected).
- Stop and report if the brief is ambiguous or the codebase contradicts the plan — do not improvise.

</execution_model>

<process>

## Setup

**Step 0 — Locate plan files**
Read $ARGUMENTS as `FEATURE_SLUG`. Derive `FEATURE_DIR` = `.council/[FEATURE_SLUG]`.

Check that the following files exist:
- `[FEATURE_DIR]/PLAN.md` (or PLAN-01.md etc.)
- `[FEATURE_DIR]/ROADMAP.md`

If any file is missing, stop and tell the user:

> "Plan files not found in [FEATURE_DIR]. Run `/council-plan [FEATURE_SLUG]` first to create the plan."

If FEATURE_SLUG was not provided, list all directories inside `.council/` and ask the user which one to execute.

**Step 1 — Load and present current state**
Read ROADMAP.md. Show the user the current progress table. Identify:
- Tasks already ✅ Done (skip)
- Tasks ❌ Blocked (surface to user before starting)
- Tasks ⬜ Pending (execution queue)
- The next task (or parallel-safe batch) according to dependency order

**Step 1.5 — Parallel-safe batching (optional)**
Before asking the user to proceed, scan the next pending tasks. A batch of tasks is **parallel-safe** only if **all** of the following hold:
- Their `Files` lists are disjoint (no overlapping paths).
- None depends on another in the batch (per PLAN dependency notes).
- They touch different subsystems (no shared state, no shared migrations).

If a parallel-safe batch of 2+ tasks exists, propose it. Otherwise propose the single next task.

Ask the user:

> "Ready to start execution. Next: [T0X] — [Task title]
> _(or: parallel batch [T0X, T0Y, T0Z] — disjoint files, no shared state)_
> Shall I proceed?"

Wait for confirmation before dispatching any subagent.

---

## Execution Loop

For each task (or parallel-safe batch) in the execution queue:

**Step 2 — Pre-task check (orchestrator)**
Before dispatching, read the task definition from PLAN.md. Verify the task has: Files + Action + Verify + Done specified (Reuses field is also required — if missing or `none` without justification, treat as ambiguous). If any of these is missing or the acceptance criteria is ambiguous, stop and ask the user one specific question to resolve the ambiguity. Do not dispatch a subagent with a vague brief.

**Step 2.5 — Reuse check (orchestrator, MANDATORY before dispatch)**
The orchestrator runs this — not the subagent. Catching duplication in the brief is cheaper than catching it after the subagent has written code.

1. Read TECHNICAL_SKETCH.md's **Reuse Map** and **New things created** tables. Cross-reference what the slice's "Reuses" field declares.
2. Grep the repo for the concept the task will create. At minimum:
   - The noun the new asset represents (e.g., `appointment`, `slot`, `booking`).
   - Adjacent verbs (`create`, `list`, `validate`, `update`).
   - The closest synonym you can think of (if creating `Booking`, also grep `Reservation`, `Slot`, `Appointment`).
3. If grep returns a function/type/table that covers the same concept:
   - **Stop.** Do not dispatch.
   - Report: "Found existing `X` at `path:line` that covers this. Options: (a) extend `X`, (b) wrap `X`, (c) genuinely create new because [technical reason]."
   - Wait for user decision before continuing.
4. If grep finds nothing relevant, record which searches you ran (the subagent's brief will cite them so it doesn't repeat the work), then proceed to Step 3.

Skipping this step is a defect, not a shortcut. Duplication detected after merge costs 10× more to remove.

**Step 3 — Dispatch subagent(s)**
Spawn one `Agent` call per task. Use `subagent_type: general-purpose`. For a parallel-safe batch, send all `Agent` tool calls in a **single message** so they run concurrently.

Use the `<subagent_brief_template>` below. The brief must be self-contained — the subagent has no memory of this conversation, no view of PLAN.md unless you give it the relevant excerpt, and no knowledge of the project's conventions unless you cite them.

**Step 4 — Verify against acceptance criteria (orchestrator)**
When the subagent returns:

1. Read its summary — what files changed, which criteria it claims passed.
2. **Trust but verify.** Skim the actual diff (`git diff` on the listed files). Check that:
   - The files modified match the `Files` field of the task.
   - No files outside the task's scope were touched.
   - No `DO NOT CHANGE` boundary was crossed.
3. Run the task's `Verify` command yourself (do not trust the subagent's claim that tests passed — re-run them).
4. For each Given/When/Then criterion in the task's acceptance criteria, explicitly state whether it was verified and how. If a criterion cannot be verified automatically (e.g., requires a manual UI test), say so.

If the subagent's output is incomplete, off-scope, or fails verification: do **not** silently fix it. Report the gap to the user and decide together (a) re-dispatch with a tighter brief, (b) finish manually with user approval, or (c) mark blocked.

**Step 5 — Update ROADMAP.md (orchestrator)**
After each task (success or blocked), update ROADMAP.md immediately:

- Mark the task as ✅ Done or ❌ Blocked.
- Add an entry to "Execution History":

```markdown
### [DATE] — [T0X] [Task Title]
**Status:** ✅ Done / ❌ Blocked
**Executed by:** subagent (general-purpose) / orchestrator (manual finish — reason)
**What was done:** [1-2 sentences of what was implemented]
**Modified files:** [list]
**Verified criteria:** [list which acceptance criteria passed, and how]
**Complexity flags:** [any functions with CC > 5 created or modified — name them and the branch count, as reported by the subagent]
**Reuse decisions:** [what existing assets the slice reused, what was newly created and why]
**Notes:** [anything unexpected the subagent surfaced]
```

- Update "Next Step" to the next pending task.

**Step 6 — Report to user and ask to continue**
After each task (or parallel batch) completes, show:

```
✅ [T0X] [Task Title] — done (via subagent)

Verified criteria:
- [criterion 1] ✅ (ran `npm test foo`)
- [criterion 2] ✅ / ⚠️ not verifiable without manual test

Files modified:
- path/to/file.ts
- path/to/other.ts

Next: [T0Y] — [Task Title]
Continue?
```

Do not start the next task without user confirmation. This ensures the user stays in control of the execution pace and can redirect if something looks wrong.

---

## Blocking Protocol

If at any point execution cannot proceed because:
- A dependency is missing or broken
- The codebase state contradicts the plan's assumptions
- The task description is insufficient for a self-contained brief (Files + Action + Verify + Done cannot be specified)
- A subagent reports the brief was ambiguous or the codebase didn't match expectations
- A security or data integrity risk is discovered that the plan did not account for
- The subagent's diff fails verification and the gap is not a trivial re-dispatch

**Immediately stop.** Update the task to ❌ Blocked in ROADMAP.md. Report to the user:

```
❌ [T0X] [Task Title] — blocked

Reason: [Specific reason — what was found, what's missing, what the risk is]
Source: [orchestrator pre-check / subagent report / verification failure]

Options:
1. [Proposed resolution that stays within plan scope]
2. [Alternative if option 1 isn't feasible]
3. Revise the plan before continuing (/council-plan [FEATURE_SLUG] to adjust)

Which path do we take?
```

Do not attempt workarounds silently. Every deviation from the plan requires explicit user approval.

---

## Completion

When all tasks are ✅ Done:

**Step 7 — Final ROADMAP update**
Update ROADMAP.md:
- Set **Overall status** to: `✅ Done`
- Add a final entry to Execution History summarizing the full execution

**Step 8 — Final report to user**

```
## Execution Complete: [Feature Name]

**Tasks completed:** [N]/[N]
**Tasks with caveats:** [list if any criteria were unverifiable]
**Registered technical debt:** [from ROADMAP.md — items that need follow-up]

Plan files in [FEATURE_DIR]:
- ROADMAP.md — updated with execution history and final status

Suggested next steps:
- Manual test of critical flows mapped in UX.md
- Review of open decisions registered in ROADMAP.md
- [any specific follow-up from blocked tasks]
```

</process>

<subagent_brief_template>

Use this template when calling the `Agent` tool with `subagent_type: general-purpose`. Fill every placeholder — the subagent has no memory of this conversation.

```
# Task [T0X]: [Task Title]

You are implementing one task from a plan. Stay strictly within the scope described below.

## Context

- Repo root: [absolute path]
- Feature: [FEATURE_SLUG] — see `[FEATURE_DIR]/PLAN.md` for full plan if needed.
- Project conventions: `.council/PROJECT.md`, `CLAUDE.md`, `AGENTS.md` (read whichever exist before you start).
- Technical sketch: `[FEATURE_DIR]/TECHNICAL_SKETCH.md` — pay attention to its **Reuse Map** and **New things created** tables.

## Task definition (copied from PLAN.md)

**Files:** [exact list from PLAN]
**Action:** [exact description from PLAN]
**Reuses:** [exact list from PLAN — extend these, do not re-implement]
**Verify:** [exact command(s) from PLAN]
**Done:** [exact acceptance criteria from PLAN]

## Boundaries (DO NOT CROSS)

- Do **not** modify any file outside the `Files` list above.
- Do **not** refactor adjacent code, even if it looks improvable.
- Do **not** add features, options, flags, or abstractions not described in **Action**.
- Do **not** add error handling, logging, retries, or validation beyond what the action requires.
- Do **not** create new files, functions, types, or modules without first reusing what's in the **Reuses** list. The orchestrator already grepped for [list of greps the orchestrator ran in Step 2.5] and found [results / nothing relevant]; trust that and do not re-grep unless you find a specific reason to suspect a missed equivalent.
- Files listed under `<boundaries>` in PLAN.md as DO NOT CHANGE: [copy the list].

## Coding standards

- Match the layering, naming, and error/return shape of adjacent code.
- Keep functions focused — flag any function with more than ~5 decision branches.
- Default to no comments. Only add a comment when the WHY is non-obvious. Never restate what the code says.
- Use early returns over nested conditionals.

## What to return

After implementing and running the **Verify** command, return a single message with this structure:

```
## Summary
[1-2 sentences of what you implemented]

## Files modified
- path/to/file.ts — [one-line description]
- path/to/other.ts — [one-line description]

## Verification
- Ran: [exact command]
- Result: [pass / fail with exact error]
- Per-criterion:
  - [criterion 1]: ✅ verified by [how] / ⚠️ not automatically verifiable because [reason]
  - [criterion 2]: ...

## Reuse decisions
- Extended `X` at `path:line` instead of creating new — [why]
- Created new `Y` because [technical reason no existing equivalent fits]

## Complexity flags
- `functionName` at `path:line` has N decision branches — [justification or note for follow-up]
- (or: none)

## Notes
- [Anything unexpected: codebase didn't match plan assumption, ambiguity you had to resolve, security-sensitive area touched, follow-up debt]
- (or: nothing unexpected)
```

If the task brief is ambiguous, the codebase contradicts a plan assumption, or you cannot verify a criterion, **do not improvise**. Stop, do not commit speculative changes, and return a `## Notes` section explaining what blocks you. The orchestrator will decide.
```

</subagent_brief_template>

<instructions>
- **The orchestrator does not write source code.** Dispatch to a subagent. The orchestrator only edits `ROADMAP.md` and (with explicit user approval) finishes work the subagent left incomplete.
- Execute one task at a time, OR a parallel-safe batch of independent tasks. Never batch tasks that share files or state.
- For parallel dispatch, send all `Agent` tool calls in a **single message** so they run concurrently.
- Ask for user confirmation before dispatching each task or batch. The user controls the pace.
- Never deviate from the plan silently. Any change requires user approval.
- ROADMAP.md is updated after every task — not at the end of execution.
- If you can't specify Files + Action + Verify + Done for a task, the brief would be too vague to dispatch — stop and clarify with the user before spawning anything.
- If the plan has multiple files (PLAN-01.md, PLAN-02.md), execute them in order. Confirm with the user before moving from one plan file to the next.
- **Trust but verify.** The subagent's summary describes what it intended to do. Always skim the diff and re-run the verify command yourself before marking ✅ Done.
- If a task touches security-sensitive code (auth, permissions, data access), pause after the subagent returns and explicitly flag it for user review before moving on.
- Respect the `<boundaries>` section of the plan. Never let a subagent modify files listed under DO NOT CHANGE — repeat the list verbatim in the brief.
- **Reuse is not optional.** The orchestrator runs the reuse grep in Step 2.5 *before* dispatch. Findings (positive or negative) are passed into the subagent's brief so the subagent does not re-do the search blindly.
- **Architectural fit is not optional.** The brief cites the reference file(s) the slice should match. Divergence in the subagent's output requires user approval.
- **Output tone — terse technical prose.** Drop articles, filler, hedging. Fragments OK. ROADMAP execution history entries: bullets, no narrative. "What was done" = one tight sentence. Every word must earn its place.
- Use English (en-US) for all instructions. Respond to the user in their language.
</instructions>
