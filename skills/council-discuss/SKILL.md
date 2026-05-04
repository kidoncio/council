---
name: council-discuss
description: Discuss a feature before planning. Use when clarifying goals, constraints, and risks.
---

---
name: council-discuss
description: Think through a feature or problem before planning. Acts as a thinking partner to explore goals, constraints, and approach — then writes CONTEXT.md for handoff to council-plan.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Bash, Glob, AskUserQuestion]
---

<objective>
Facilitate vision articulation before planning. Ask the user targeted questions to surface goals, constraints, and approach, then write CONTEXT.md for `council-plan` to use as its starting point.

**When to use:** When the user wants to think before committing to a plan. If they're ready to plan directly, route them to `/council-plan`.

**Philosophy:** Goals first. Everything else derives from what success looks like. Never ask about implementation before the user has articulated the outcome.
</objective>

<process>

## Setup

**Step 0 — Parse input and establish feature name**
Read $ARGUMENTS. If provided, use as feature name (slugify: lowercase, hyphens). If not, ask:

> "What feature or problem do you want to think through before planning?"

Derive `FEATURE_SLUG` and `FEATURE_DIR` = `.council/[FEATURE_SLUG]`.
Run: `mkdir -p [FEATURE_DIR]`.

In parallel, check and read all of the following if they exist: `.council/PROJECT.md`, `CLAUDE.md`, `AGENTS.md`. Read them silently — use their combined contents to ask more precise questions about constraints and integration points throughout the discussion.

If `FEATURE_DIR/CONTEXT.md` exists, read it and say: "I found a prior discussion context. I'll continue from where we left off."

If `FEATURE_DIR` has other files (RESEARCH.md, PLAN.md, etc.), briefly acknowledge them before continuing.

---

## Step 1 — Explore goals

Ask in a single message:

> "Before we plan anything, let's make sure we're building the right thing.
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

## Step 3 — Synthesize and confirm

Present a structured summary and ask for confirmation before writing:

```
Here's what I'm capturing:

**Goals:** [synthesized from user's words — not abstracted into engineering language]
**Constraints:** [...]
**Current state / workaround:** [...]
**Risks:** [...]
**Inspiration / reference:** [...]

Does this reflect what you have in mind? Anything to add or correct?
```

Wait for confirmation. Incorporate corrections.

---

## Step 4 — Write CONTEXT.md

Write `[FEATURE_DIR]/CONTEXT.md` with: date, status ("Ready for planning"), and sections for Goals (user outcomes, not system behaviors), Constraints, Current State, Risks Flagged, Inspiration/Reference, and Open Questions. Use the user's exact words — do not paraphrase into abstraction.

---

## Step 5 — Handoff

Show:

```
Context saved to [FEATURE_DIR]/CONTEXT.md

Goals captured: [N] | Open questions: [N]

→ Ready to plan? Run: /council-plan [FEATURE_SLUG]
```

</process>

<instructions>
- Goals first. Never ask about implementation before the user has articulated what success looks like.
- Ask all questions per step in a single message — not one at a time.
- Use the user's exact words in CONTEXT.md. "Users need to see their dog's history" is better than "historical data access is required."
- If the user wants to skip discussion, route them: "Go ahead and run `/council-plan [FEATURE_SLUG]` — the council will ask its own clarifying questions."
- Always write CONTEXT.md before the session ends, even if the user cuts it short.
- Use English (en-US) for all output. Respond to the user in their language.
</instructions>

<anti_patterns>
- DON'T ask "What's the scope?" — DO ask "What do you want to accomplish?"
- DON'T ask about libraries or frameworks — DO derive approach from goals.
- DON'T write CONTEXT.md after one round without confirming the synthesis.
- DON'T research, propose architectures, or write tasks — that's council-plan's job.
</anti_patterns>
