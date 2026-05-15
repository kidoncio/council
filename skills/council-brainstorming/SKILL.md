---
name: council-brainstorming
description: Brainstorm a feature before planning. Use when turning a raw idea into an approved design with alternatives weighed and tradeoffs surfaced.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Bash, Glob, AskUserQuestion, Skill, Agent]
---

<objective>
Turn a raw idea into an approved design before planning. Surface goals, weigh 2-3 approaches with tradeoffs, present the design in sections with per-section approval, run a self-review, then gate on explicit user approval of the written spec. Output: `BRAINSTORMING.md` for handoff to `/council-plan` or `/council-research`.

**When to use:** When the feature is non-trivial enough that planning agents would otherwise re-litigate goals, alternatives, and tradeoffs. If the idea is fully formed and the user wants to skip straight to slicing tasks, route them to `/council-plan`.

**Philosophy:** Goals first. Alternatives before commitment. Every design section approved before moving on. The spec is not done until the user says it is.
</objective>

<process>

## Setup

**Step 0 — Parse input and establish feature name**
Read $ARGUMENTS. If provided, use as feature name (slugify: lowercase, hyphens). If not, ask:

> "What feature or problem do you want to brainstorm before planning?"

Derive `FEATURE_SLUG` and `FEATURE_DIR` = `.council/[FEATURE_SLUG]`.
Run: `mkdir -p [FEATURE_DIR]`.

In parallel, check and read all of the following if they exist: `.council/PROJECT.md`, `CLAUDE.md`, `AGENTS.md`. Read them silently — use their combined contents to ask sharper questions about constraints and integration points throughout the session.

If `[FEATURE_DIR]/BRAINSTORMING.md` exists, read it and say: "I found a prior brainstorming session. I'll continue from where we left off." Resume at the earliest unapproved section.

If `[FEATURE_DIR]` contains other files (RESEARCH.md, PLAN.md, etc.), briefly acknowledge them before continuing.

**Decomposition check.** If the request describes multiple independent subsystems ("build a platform with chat, billing, and analytics"), stop and flag it:

> "This looks like multiple independent features. Brainstorming works on one focused problem at a time. Which sub-problem do you want to tackle first?"

Wait for the user to pick before proceeding.

If `.council/PROJECT.md` does not exist, tell the user:

> "I don't have a PROJECT.md for this project yet. It gives every council agent instant context about your stack and conventions. Run `/council-init` now (~2 minutes), or skip and I'll proceed without it."

Wait for choice. If they init, run `/council-init` then continue. Otherwise proceed.

---

## Step 1 — Explore goals

Ask in a single message:

> "Before we explore approaches, let's lock the goal.
>
> **What do you want to accomplish with this feature?**
>
> Don't worry about implementation yet — what changes for the user or the business when this is done?"

Wait for response. If vague, ask one follow-up: "What's the one thing that, if it doesn't work, the feature has failed?"

---

## Step 2 — Explore constraints and context

Ask in a single message:

> 1. Are there technical constraints I should know about? (systems, libraries, integrations)
> 2. Is there a current workaround users rely on? What do they do today?
> 3. Any product or UX you've seen elsewhere that gets this right?
> 4. What's the riskiest part of this, in your gut?

Wait for response.

---

## Step 3 — Propose 2-3 approaches with tradeoffs

Based on goals + constraints, present 2-3 distinct architectural approaches. Lead with the recommended one. For each approach include:

- **Shape:** one sentence — what this approach is, architecturally.
- **Pros:** 2-3 bullets — concrete strengths.
- **Cons:** 2-3 bullets — concrete weaknesses and what they cost.
- **Fits when:** one line — the condition under which this is the right call.

No code, no file paths, no module names. Architectural shape only — file/function decisions belong in `/council-plan`'s Technical Sketch phase.

End with:

> "Recommendation: **[approach name]** because [one-line reason tied to the user's stated goals/constraints]. Which approach do you want to go with — or do you want me to revise one of these?"

Wait for the user's choice. If they pick or revise, capture it. If they ask for a fourth option, propose it and loop.

---

## Step 4 — Present design in sections, get per-section approval

For the chosen approach, present the design in these sections, scaling each to its complexity (a few sentences for simple, up to ~200-300 words for nuanced):

1. **Architecture** — the components and how they connect.
2. **Components** — what each piece owns, in one line per piece.
3. **Data flow** — how state moves through the system on the golden path.
4. **Error handling** — what fails, how the system responds.
5. **Testing** — what proves the feature works end-to-end.

After each section, ask in a single message:

> "Does this look right so far? Anything to revise before I move on?"

Wait for approval before the next section. If revisions invalidate an earlier section, return to it and re-confirm. Do not batch sections.

---

## Step 5 — Write `BRAINSTORMING.md`

Write `[FEATURE_DIR]/BRAINSTORMING.md` using this structure:

```markdown
# Brainstorming: [Feature Name]

Date: YYYY-MM-DD · Status: Ready for planning

## Goals
[User outcomes in the user's own words. Not system behaviors.]

## Constraints
[Bullets — technical, product, organizational.]

## Current State / Workaround
[What users do today, in their words.]

## Risks Flagged
[Bullets — the user's gut-risks and any surfaced during discussion.]

## Inspiration / Reference
[Products, patterns, prior art the user named.]

## Approaches Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| [name]   | [...] | [...] | Chosen / Rejected — [one line why] |

## Chosen Approach
[One paragraph — the shape and why it won.]

## Design

### Architecture
[Approved content from Step 4.]

### Components
[Approved content from Step 4.]

### Data Flow
[Approved content from Step 4.]

### Error Handling
[Approved content from Step 4.]

### Testing
[Approved content from Step 4.]

## Open Questions
[Bullets — anything unresolved that planning or research should answer.]
```

Use the user's exact words where possible. "Users need to see their dog's history" beats "historical data access is required." Terse technical prose throughout — drop articles, filler, hedging.

---

## Step 6 — Spec self-review (inline)

Re-read the written file with fresh eyes and fix inline (no separate review file):

1. **Placeholder scan:** any "TBD", "TODO", incomplete sections, vague requirements → fill or remove.
2. **Internal consistency:** does the design match the chosen approach? Do sections contradict each other?
3. **Ambiguity check:** could any requirement be read two valid ways? Pick one and make it explicit.
4. **Scope check:** is this focused enough for a single plan? If it spans multiple independent subsystems, flag in **Open Questions** and recommend decomposition.

Apply fixes directly to `BRAINSTORMING.md`. No need to re-review the spec itself — fix and move on.

---

## Step 7 — User review gate

Show:

> "Spec written.
>
> Markdown: `[FEATURE_DIR]/BRAINSTORMING.md`
>
> Open it and let me know if you want changes before we hand off to planning or research."

Wait for the user's response. If they request changes, edit `BRAINSTORMING.md` and re-run Step 6. Only proceed on explicit approval ("looks good", "ship it", "approved", etc.).

---

## Step 8 — Handoff (user chooses next step)

Show:

```
BRAINSTORMING approved.

Saved to: [FEATURE_DIR]/
  - BRAINSTORMING.md   (source of truth — downstream skills read this)

Next step — your call:
  → Ready to plan implementation slices?     /council-plan [FEATURE_SLUG]
  → Want deeper research (market, prior art,
    codebase survey) first?                  /council-research [FEATURE_SLUG]
```

Do not invoke either skill yourself — let the user choose.

</process>

<instructions>
- Goals first. Never propose approaches before the user has articulated what success looks like.
- Ask all questions per step in a single message — not one at a time.
- Present approaches with concrete tradeoffs, not generic pros/cons. Pros/cons must reference the user's stated goals or constraints.
- Per-section approval is non-negotiable. Do not write `BRAINSTORMING.md` until every design section has been approved.
- Use the user's exact words in `BRAINSTORMING.md`. Paraphrasing into engineering language hides intent.
- Never invoke `/council-plan` or `/council-research` directly — only suggest. The user chooses.
- Always write `BRAINSTORMING.md` before the session ends, even if the user cuts it short. Mark unapproved sections with "[NOT APPROVED]".
- **Output tone — terse technical prose.** Drop articles, filler, hedging. Fragments OK. Bullets over paragraphs. Every sentence must carry information or be cut.
- Use English (en-US) for all generated files. Respond to the user in their language.
</instructions>

<anti_patterns>
- DON'T skip the alternatives step because the request seems simple. "Simple" features are where unexamined assumptions cause the most wasted work.
- DON'T present approaches as a wall of text — use the structured Shape/Pros/Cons/Fits-when format.
- DON'T research the market or read codebase patterns — that's `/council-research`'s job.
- DON'T write task slices, file paths, or function signatures — that's `/council-plan`'s job.
- DON'T write `BRAINSTORMING.md` after one round without sectioned approval.
- DON'T paraphrase user goals into abstract engineering language. "Reduce churn by surfacing renewal dates" loses meaning when it becomes "implement renewal notification subsystem."
</anti_patterns>
