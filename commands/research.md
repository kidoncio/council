---
name: council:research
description: Run the council's research phase on a feature or problem — without committing to a plan. Spawns parallel specialized agents, synthesizes findings into RESEARCH.md, and hands off to /council:plan when ready.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Bash, Glob, Agent, WebSearch, AskUserQuestion]
---

<objective>
Run Phase 1 of the council's planning process in isolation. The goal is to understand how the market solves a problem — surfaces prior art, technical tradeoffs, failure modes, and security risks — before any design or planning decisions are made.

Use this when you want deep research on a problem without immediately committing to a plan. The output (RESEARCH.md) is fully compatible with `/council:plan`, which will skip its own research phase if RESEARCH.md already exists.
</objective>

<advisors_reference>
Research agents are unnamed and objective-driven. The council's named advisors (TURING, LOVELACE, etc.) are not invoked here — they appear in the review phase of `/council:plan` and `/council:review`. This phase produces raw material for them.
</advisors_reference>

<process>

## Setup

**Step 0 — Parse input and establish feature name**
Read $ARGUMENTS. If provided, use it as the working feature name (slugify for directory: lowercase, hyphens). If not provided, ask the user:

> "What feature or problem should the council research?"

Derive `FEATURE_SLUG` (e.g., "user-authentication") and `FEATURE_DIR` = `.council/[FEATURE_SLUG]`.
Create the directory: `mkdir -p [FEATURE_DIR]`.

If `[FEATURE_DIR]/RESEARCH.md` already exists, tell the user:

> "I found existing research for this feature. I'll run new agents and merge the findings into RESEARCH.md."

---

## Step 1 — Council interviews the user

Before researching, ask the user clarifying questions in a single message. Do not proceed until they answer.

> "Before we research, I need to understand the context:
>
> 1. What is the business context? (Who is the end user and what problem do they have today?)
> 2. Is there a current solution — even manual or improvised — that users already use?
> 3. Are there known technical constraints? (existing stack, required integrations, time limitations)
> 4. Is there any product or market experience you admire that solves a similar problem?
> 5. What defines success for this feature — what metric or behavior would change?"

Wait for user response before proceeding.

---

## Step 2 — Define research agents and confirm with user

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

Wait for user confirmation. If the user adds custom agents, include them. If the user removes any, remove them. Only after explicit confirmation proceed to Step 3.

Create the research directory: `mkdir -p [FEATURE_DIR]/research/`.

---

## Step 3 — Spawn parallel research agents

Spawn all confirmed agents simultaneously. Each agent runs independently and receives:

- The feature description
- The user's answers from Step 1
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

---

## Step 4 — Synthesize into RESEARCH.md

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

---

## Step 5 — Present and validate

Show the user:

- Which research files were created in `[FEATURE_DIR]/research/`
- The executive summary from RESEARCH.md

Ask:

> "The council completed research with [N] agents. Is there any direction that doesn't make sense for your context, or something important that was missed that would be worth spawning an additional agent for?"

If the user requests additional research, spawn the new agent(s), append findings to a new file in `research/`, and update RESEARCH.md before proceeding to the handoff.

---

## Step 6 — Handoff

Show the user:

```
## Research Complete: [Feature Name]

📁 Files created in [FEATURE_DIR]:
- RESEARCH.md — synthesized findings from [N] research agents

📁 Individual agent reports in [FEATURE_DIR]/research/:
- [agent-slug].md × [N]

→ Ready to plan? The council will use this research as its starting point:
  /council:plan [FEATURE_SLUG]
```

</process>

<instructions>
- The council always asks questions before acting. Research does not start without user input.
- Questions are asked in a single message — not one at a time.
- The user's answers must visibly influence which agents are spawned and what they focus on.
- Each agent receives only its own objective — not the full agent list. Agents do not know what the others are researching.
- Files are always written to `.council/[FEATURE_SLUG]/` relative to the project root (current working directory).
- If `RESEARCH.md` already exists, merge new findings rather than overwriting. Preserve prior insights.
- `/council:plan` will detect and use RESEARCH.md automatically — the planning phase will skip its own research step.
- Use English (en-US) for all instructions and generated files. Respond to the user in their language.
</instructions>

