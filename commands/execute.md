---
name: kidoncio:execute
description: Execute a plan created by kidoncio:plan. Reads PLAN.md and ROADMAP.md, implements tasks in order, and updates the roadmap after each task completes.
argument-hint: "<feature-slug>"
allowed-tools: [Read, Write, Edit, Bash, Glob, Agent, AskUserQuestion]
---

<objective>
Execute the development plan produced by `kidoncio:plan`. Tasks are implemented one at a time, in dependency order. The ROADMAP.md is updated after every task — not at the end. If a task is blocked, ambiguous, or fails, execution pauses and the user is consulted before proceeding. The council does not improvise beyond the plan without explicit user approval.
</objective>

<process>

## Setup

**Step 0 — Locate plan files**
Read $ARGUMENTS as `FEATURE_SLUG`. Derive `FEATURE_DIR` = `.kidoncio/[FEATURE_SLUG]`.

Check that the following files exist:
- `[FEATURE_DIR]/PLAN.md` (or PLAN-01.md etc.)
- `[FEATURE_DIR]/ROADMAP.md`

If any file is missing, stop and tell the user:

> "Plan files not found in [FEATURE_DIR]. Run `/kidoncio:plan [FEATURE_SLUG]` first to create the plan."

If FEATURE_SLUG was not provided, list all directories inside `.kidoncio/` and ask the user which one to execute.

**Step 1 — Load and present current state**
Read ROADMAP.md. Show the user the current progress table. Identify:
- Tasks already ✅ Done (skip)
- Tasks ❌ Blocked (surface to user before starting)
- Tasks ⬜ Pending (execution queue)
- The next task according to dependency order

Ask the user:

> "Ready to start execution. The next step is [T0X] — [Task title]. Shall I proceed?"

Wait for confirmation before starting any implementation.

---

## Execution Loop

For each task in the execution queue (respecting dependencies):

**Step 2 — Pre-task check**
Before implementing, read the task definition from PLAN.md. Verify the task has: Files + Action + Verify + Done specified. If any of these is missing or the acceptance criteria is ambiguous, stop and ask the user one specific question to resolve the ambiguity. Do not guess.

**Step 3 — Implement the task**
Implement the task as described. Constraints:
- Stay strictly within the task's described scope
- Do not refactor code outside the task's scope
- Do not add features not described in the task
- Respect all boundaries declared in the plan's `<boundaries>` section
- If you discover a dependency is missing or broken, stop immediately (see Step 5)

Apply these coding standards during implementation:

**Complexity discipline:**
- Keep functions focused on a single responsibility. If a function needs more than ~5 decision branches (if/else, switch cases, catch, ternary, `&&`/`||` in conditions), it is doing too much — extract the logic.
- Prefer early returns over deeply nested conditionals. Flat is readable; nested is fragile.
- If you find yourself writing a function longer than ~40 lines, stop and ask whether it has more than one responsibility.

**Documentation discipline:**
- Default to writing no comments. Well-named functions and variables document what code does.
- Add a comment only when the WHY is non-obvious: a workaround for a third-party bug, a subtle ordering constraint, a business rule with no obvious source in the code.
- Never write comments that restate what the code already says. `// increment counter` above `count++` is noise.
- If a block of code is complex enough to need explanation, that is a signal to simplify it first. If it genuinely cannot be simplified, add a short WHY comment.

**Step 4 — Verify against acceptance criteria**
After implementation, check the task's acceptance criteria from PLAN.md. For each Given/When/Then criterion, explicitly state whether it was verified and how. If a criterion cannot be verified (e.g., requires a UI test), explicitly state which criteria were verified and which were not.

**Step 5 — Update ROADMAP.md**
After each task (success or blocked), update ROADMAP.md immediately:

- Mark the task as ✅ Done or ❌ Blocked
- Add an entry to "Execution History":

```markdown
### [DATE] — [T0X] [Task Title]
**Status:** ✅ Done / ❌ Blocked
**What was done:** [1-2 sentences of what was implemented]
**Modified files:** [list]
**Verified criteria:** [list which acceptance criteria passed]
**Complexity flags:** [any functions with CC > 5 created or modified — name them and the branch count]
**Notes:** [anything unexpected found during implementation]
```

- Update "Next Step" to the next pending task

**Step 6 — Report to user and ask to continue**
After each task completes, show:

```
✅ [T0X] [Task Title] — done

Verified criteria:
- [criterion 1] ✅
- [criterion 2] ✅ / ⚠️ not verifiable without manual test

Next: [T0Y] — [Task Title]
Continue?
```

Do not start the next task without user confirmation. This ensures the user stays in control of the execution pace and can redirect if something looks wrong.

---

## Blocking Protocol

If at any point during execution a task cannot proceed because:
- A dependency is missing or broken
- The codebase state contradicts the plan's assumptions
- The task description is insufficient to implement correctly (Files + Action + Verify + Done cannot be specified)
- A security or data integrity risk is discovered that the plan did not account for

**Immediately stop.** Update the task to ❌ Blocked in ROADMAP.md. Report to the user:

```
❌ [T0X] [Task Title] — blocked

Reason: [Specific reason — what was found, what's missing, what the risk is]

Options:
1. [Proposed resolution that stays within plan scope]
2. [Alternative if option 1 isn't feasible]
3. Revise the plan before continuing (/kidoncio:plan [FEATURE_SLUG] to adjust)

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

<instructions>
- Execute one task at a time. Never batch multiple tasks in a single implementation step.
- Ask for user confirmation before starting each task. The user controls the pace.
- Never deviate from the plan silently. Any change requires user approval.
- ROADMAP.md is updated after every task — not at the end of execution.
- If you can't specify Files + Action + Verify + Done for a task, it is too vague — stop and clarify with the user.
- If the plan has multiple files (PLAN-01.md, PLAN-02.md), execute them in order. Confirm with the user before moving from one plan file to the next.
- Do not add error handling, logging, or features not described in the task. Scope discipline is the whole point.
- If a task touches security-sensitive code (auth, permissions, data access), pause after implementation and explicitly flag it for user review before moving on.
- Respect the `<boundaries>` section of the plan. Never modify files listed under DO NOT CHANGE.
- Use English (en-US) for all instructions. Respond to the user in their language.
</instructions>

<success_criteria>
- [ ] Plan files are loaded and current state is shown before any implementation
- [ ] User confirms before each task starts
- [ ] Each task is implemented strictly within its described scope
- [ ] Boundaries from the plan are respected — DO NOT CHANGE files are never touched
- [ ] ROADMAP.md is updated immediately after each task
- [ ] Blocked tasks are reported with options — never silently worked around
- [ ] Final report includes unverifiable criteria and open decisions
</success_criteria>
