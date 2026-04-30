---
name: council:discuss
description: Think through a feature or problem before planning. Acts as a thinking partner to explore goals, constraints, and approach — then writes CONTEXT.md for handoff to council:plan.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Bash, Glob, AskUserQuestion]
---

<objective>
Facilitate vision articulation before planning. This command is a thinking partner — it asks the user targeted questions to surface goals, constraints, and approach, then writes a CONTEXT.md file that `council:plan` will use as its starting point.

**Philosophy:** Goals first — everything else (approach, constraints, risks) derives from what the user wants to achieve. Do not ask about implementation before understanding what success looks like.

**Distinction from planning:** This workflow gathers USER input and intent. Planning takes that input and researches, maps journeys, and creates tasks. Discussion must come first — or not at all, and the user goes straight to `/council:plan`.
</objective>

<process>

## Setup

**Step 0 — Parse input and establish feature name**
Read $ARGUMENTS. If provided, use it as the feature name (slugify for directory: lowercase, hyphens). If not provided, ask the user:

> "What feature or problem do you want to think through before planning?"

Derive `FEATURE_SLUG` and `FEATURE_DIR` = `.council/[FEATURE_SLUG]`.
Create the directory: `mkdir -p [FEATURE_DIR]`.

If `FEATURE_DIR/CONTEXT.md` already exists, read it and tell the user:

> "I found a prior discussion context for this feature. I'll continue from where we left off."

---

## Step 1 — Present what we know (if anything)

If `FEATURE_DIR` contains existing files (RESEARCH.md, PLAN.md, etc.), briefly acknowledge them:

> "This feature already has [files]. This discussion will add context about goals and approach that will guide the planning session."

Otherwise, proceed directly to exploration.

---

## Step 2 — Explore goals

Ask the user in a single message:

> "Before we plan anything, let's make sure we're building the right thing.
>
> **What do you want to accomplish with this feature?**
>
> Don't worry about implementation details yet — describe what success looks like. What changes for the user or the business when this is done?"

Wait for the user's response. Do not proceed until they answer.

If the answer is vague, ask one focused follow-up:
- "What's the most important outcome — the one thing that, if it doesn't work, the feature has failed?"

Store the response as `goals`.

---

## Step 3 — Explore constraints and approach

In a single message, ask:

> "A few more questions to shape the discussion:
>
> 1. Are there technical constraints I should know about? (existing systems, libraries to use or avoid, integrations required)
> 2. Is there a current workaround users rely on? If so, what do they do today?
> 3. Is there any product or UX you've seen elsewhere that gets this right — something to aim for or learn from?
> 4. What's the riskiest part of this, in your gut?"

Wait for the user's response.

Store responses as `constraints`, `current_state`, `inspiration`, and `risks`.

---

## Step 4 — Synthesize and confirm

Synthesize what you heard into a structured summary. Present it to the user and ask them to confirm before writing anything:

```
Here's what I'm capturing:

**Goals:**
- [Goal 1 — synthesized from user's words, not paraphrased into abstraction]
- [Goal 2]

**Constraints:**
- [Constraint 1]

**Current state / workaround:**
- [What users do today]

**Risks:**
- [What the user flagged as risky]

**Inspiration / reference:**
- [Products or patterns mentioned]

Does this reflect what you have in mind? Anything to add or correct?
```

Wait for confirmation. Incorporate any corrections before writing CONTEXT.md.

---

## Step 5 — Write CONTEXT.md

Write `[FEATURE_DIR]/CONTEXT.md`:

```markdown
# Discussion Context: [Feature Name]

**Date:** [DATE]
**Status:** Ready for planning

## Goals

[Goal list — each goal is a user outcome, not a system behavior]

## Constraints

[Technical, time, integration constraints]

## Current State

[What users do today, if anything]

## Risks Flagged

[What the user identified as risky — before any analysis]

## Inspiration / Reference

[Products, patterns, or experiences the user wants to learn from or aim for]

## Open Questions

[Anything that came up in discussion that still needs an answer — for the planning phase to resolve]
```

---

## Step 6 — Handoff

Show the user:

```
Context saved to [FEATURE_DIR]/CONTEXT.md

**Goals captured:** [N]
**Open questions:** [N]

This context will guide the planning session — the council will use it to focus research and UX mapping on what actually matters to you.

→ Ready to plan? Run: /council:plan [FEATURE_SLUG]
```

</process>

<instructions>
- Goals first. Never ask about implementation before the user has articulated what success looks like.
- Ask all clarifying questions per step in a single message — not one at a time.
- The user's exact words matter. Synthesize, don't paraphrase into abstraction. "Users need to see their dog's history" is better than "historical data access is required."
- If the user wants to skip discussion and go straight to planning, route them there: "Got it — go ahead and run `/council:plan [FEATURE_SLUG]`. No discussion context will be available, and the council will ask their own clarifying questions."
- CONTEXT.md is always written before the session ends. If the user cuts the conversation short, write what you have.
- Use English (en-US) for all instructions. Respond to the user in their language.
</instructions>

<anti_patterns>
**Asking abstract questions first:**
- DON'T: "What's the scope of this feature?"
- DO: "What do you want to accomplish?"

**Assuming approach before goals:**
- DON'T: "What libraries will you use?"
- DO: Derive approach from goals discussed.

**Paraphrasing goals into engineering language:**
- DON'T: "Requirement: implement audit log for appointment CRUD"
- DO: "The user wants to know what happened to an appointment — who changed it and when"

**Skipping confirmation:**
- DON'T: Write CONTEXT.md after one round of questions without confirming.
- DO: Always confirm the synthesis before writing.

**Treating this as a planning session:**
- DON'T: Start researching, proposing architectures, or writing tasks.
- DO: Listen, ask, and capture. The council plans in `/council:plan`.
</anti_patterns>

