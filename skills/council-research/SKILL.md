---
name: council-research
description: Run parallel research for a feature or problem. Use when you need technical and product inputs before planning.
---

---
name: council-research
description: Run the council's research phase on a feature or problem — without committing to a plan. Spawns parallel specialized agents, each writing their own findings file. A synthesis agent then produces RESEARCH.md. Hands off to /council-plan when ready.
argument-hint: "<feature name or problem description>"
allowed-tools: [Read, Write, Bash, Glob, Agent, WebSearch, AskUserQuestion, Skill]
---

<objective>
Run Phase 1 of the council's planning process in isolation. The goal is to understand how the market solves a problem — surfaces prior art, technical tradeoffs, failure modes, and security risks — before any design or planning decisions are made.

Use this when you want deep research on a problem without immediately committing to a plan. The output (RESEARCH.md) is fully compatible with `/council-plan`, which will skip its own research phase if RESEARCH.md already exists.
</objective>

<advisors_reference>
Research agents are unnamed and objective-driven. The council's named advisors (TURING, LOVELACE, etc.) are not invoked here — they appear in the review phase of `/council-plan` and `/council-review`. This phase produces raw material for them.
</advisors_reference>

<process>

## Setup

**Step 0 — Parse input and establish feature name**
Read $ARGUMENTS. If provided, use it as the working feature name (slugify for directory: lowercase, hyphens). If not provided, ask the user:

> "What feature or problem should the council research?"

Derive `FEATURE_SLUG` (e.g., "user-authentication") and `FEATURE_DIR` = `.council/[FEATURE_SLUG]`.
Create the directory: `mkdir -p [FEATURE_DIR]/research/`.

In parallel, check and read all of the following if they exist: `.council/PROJECT.md`, `CLAUDE.md`, `AGENTS.md`. Read them silently — their combined contents will be passed to every research agent to prevent re-discovering the project's stack and conventions.

If `[FEATURE_DIR]/RESEARCH.md` already exists, tell the user:

> "I found existing research for this feature. I'll run new agents and merge the findings into RESEARCH.md."

**Step 0.1 — HTML companion contract**
The synthesized `RESEARCH.md` ships with a sibling `RESEARCH.html` for the user to read and share. Division of labor: the synthesis agent (Step 4) writes only the markdown. **The orchestrator then spawns the `council-html-companion` subagent** to render `RESEARCH.html` — see that skill's `<invocation>` section for the contract. Per-agent research files in `research/<slug>.md` stay markdown-only.

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
| `codebase-survey`         | What does the *current* codebase already do that touches this feature? Map files, modules, data models, and flows. Produce a Mermaid diagram of the relevant subsystem. |
| `market-solutions`        | What existing products solve this problem? How does each approach the solution? What are the differences between them? |
| `ux-patterns`             | What UX patterns and interface conventions are used for this type of feature? What do users already expect?            |
| `technical-approaches`    | What technical approaches exist to implement this? What are the tradeoffs of each?                                     |
| `failure-modes`           | What are the documented anti-patterns, known failures, and common mistakes teams make when building this?              |
| `security-and-compliance` | What security, privacy, or compliance risks are known for this type of feature?                                        |

`codebase-survey` is **mandatory** and runs first-class alongside the others. Its job is to anchor every later phase in what already exists — never let the council plan in the void.

Present this list to the user **before spawning any agent**:

```
## Proposed Research Agents

The council will spawn the following agents in parallel:

1. **codebase-survey** — map what already exists in this repo + diagram
2. **market-solutions** — [objective description]
3. **ux-patterns** — [objective description]
4. **technical-approaches** — [objective description]
5. **failure-modes** — [objective description]
6. **security-and-compliance** — [objective description]

Do you confirm this list? Would you like to add any agent with a specific objective you consider important for this feature?
```

Wait for user confirmation. If the user adds custom agents, include them. If the user removes any, remove them. Only after explicit confirmation proceed to Step 3.

---

## Step 3 — Spawn parallel research agents

Spawn all confirmed agents simultaneously. Each agent:

- Runs independently and receives only its own objective (not the full agent list)
- Receives the feature description, the user's answers from Step 1, and project context (PROJECT.md, CLAUDE.md, AGENTS.md — whichever exist, combined and prefixed with: "Project context (do not re-research this):")
- Receives the instruction: "Be specific. Name actual products, cite actual patterns, reference real-world incidents or documented cases. No generic observations. No filler."
- **If a Mermaid diagram would help the reader** (any agent that finds structural relationships — flows, dependencies, data shapes, sequences), the agent MUST include one in its findings. Use `flowchart`, `sequenceDiagram`, `classDiagram`, or `erDiagram` — whichever fits.
- **Writes its findings directly** to `[FEATURE_DIR]/research/[agent-slug].md` using this exact format:

```markdown
# Research: [Objective Title]

**Agent:** [agent-slug]
**Objective:** [The specific research objective]

## Findings

[Specific findings — named products, patterns, incidents, tradeoffs. Each point must be concrete and attributable.]

## Diagram (if applicable)

```mermaid
[A diagram that makes the findings easier to scan: flowchart, sequenceDiagram, classDiagram, or erDiagram. Skip this section only if no structural relationship is involved.]
```

## Implications for This Context

[How these findings apply specifically to this feature, given the user's constraints and tech stack]

## References and Sources

[Named sources, products, documentation, or incident reports consulted. For codebase-survey: file paths with line numbers.]
```

Per-agent files (`research/<slug>.md`) stay markdown-only — no HTML companion. The synthesis step (Step 4) writes the single `RESEARCH.html` that the user actually reviews.

### Special instructions for `codebase-survey`

This agent does not search the web. It searches the *repository*. Its job:

1. **Locate** every file/module that already touches the feature area (use Grep, Glob, Read).
2. **Map** the data model: which tables, schemas, types, or DTOs are already defined.
3. **Trace** the existing flow: entry points → services → persistence. Note what works and what is missing.
4. **Produce a Mermaid diagram** showing the current subsystem (mandatory — not optional). Pick the diagram type that best fits:
   - `flowchart` for control flow / module dependencies
   - `sequenceDiagram` for request/response or event flow
   - `erDiagram` for data models
   - `classDiagram` for type hierarchies
5. **Cite file paths with line numbers** in every finding (e.g., `server/api/grooming/index.ts:42`).
6. **Surface gaps** — what is missing today vs. what the new feature needs.
7. **Reusable Assets section is MANDATORY.** Inventory what already exists that the new feature can extend or reuse — never let the council plan as if the repo is empty.

Output goes to `[FEATURE_DIR]/research/codebase-survey.md` with the standard format above, plus this **required** section appended after `## Implications for This Context`:

```markdown
## Reusable Assets

### Functions / Helpers / Composables
- `name` — `path:line` — what it does, why relevant to this feature

### Data Model
- `table_or_type` — `path:line` — current shape, columns/fields, what it represents

### Endpoints / Services / Repositories
- `endpoint_or_service` — `path:line` — current responsibilities

### Conventions in this area
- [Naming pattern, folder structure, layering rule observed in adjacent code — one line each]

### Parallel implementations to watch for
- [If two modules already do the same thing under different names, flag here. Empty if none.]
```

If this section is empty AND you have not searched broadly, you have not done the job. Empty is only acceptable after explicit search with grep/glob covering: the feature's domain terms, adjacent verbs (create/update/list), the data nouns involved, and at least one synonym. State the searches you ran in the section if it ends up empty.

The diagram section is **required**. The Reusable Assets section is **required**.

Each agent is responsible for writing its own file. The orchestrator does not write research files — it only waits for all agents to complete.

---

## Step 4 — Synthesize into RESEARCH.md (and RESEARCH.html)

After all agents complete and their files exist in `[FEATURE_DIR]/research/`, spawn a single synthesis agent. It receives: the paths to all `[FEATURE_DIR]/research/*.md` files (which it must read), the feature description, and project context (PROJECT.md, CLAUDE.md, AGENTS.md — whichever exist).

The synthesis agent writes only the markdown at `[FEATURE_DIR]/RESEARCH.md`. It does NOT write HTML — that's the orchestrator's job in the next step.

```markdown
# Research: [Feature Name]

## Executive Summary

[3-5 bullet points: the most important findings across all research agents]

## Codebase Today (from codebase-survey)

[What already exists in this repo: the relevant files, modules, and data models. File paths with line numbers.]

### Current Architecture

```mermaid
[The diagram from codebase-survey.md — copy verbatim. This is the anchor for the rest of the document.]
```

### Gaps vs. What This Feature Needs

[Bullet list — what's missing today and must be built or changed.]

## Market and Prior Art

[From market-solutions agent — named products and their approaches]

## UX Patterns

[From ux-patterns agent]

## Technical Approaches and Tradeoffs

[From technical-approaches agent. Include any diagrams the agent produced.]

## Anti-Patterns and Known Failures

[From failure-modes agent]

## Security and Compliance Risks

[From security-and-compliance agent]

## [Custom Agent Title, if any]

[From custom agents added by user]

## Consolidated Insights for This Context

[Cross-cutting insights that emerge from reading all agents together — things no single agent would have seen alone. Tie market/UX patterns back to the codebase reality.]
```

After the synthesis agent finishes and `RESEARCH.md` exists, the orchestrator spawns the `council-html-companion` subagent to render `RESEARCH.html`. Inputs:

- `markdown_path` = `[FEATURE_DIR]/RESEARCH.md` (absolute)
- `html_path` = `[FEATURE_DIR]/RESEARCH.html` (absolute)
- `artifact_type` = `RESEARCH`
- `feature_slug` = `[FEATURE_SLUG]`
- `status_label` = `Research — review`
- `companion_index` = comma-separated list of other `*.html` files already present in `[FEATURE_DIR]` (e.g. `BRAINSTORMING.html` if a prior brainstorm produced one)

Wait for the subagent's one-line confirmation before continuing.

---

## Step 5 — Present and validate

Show the user:

- Which research files were created in `[FEATURE_DIR]/research/`
- The executive summary from RESEARCH.md

Ask:

> "The council completed research with [N] agents. Is there any direction that doesn't make sense for your context, or something important that was missed that would be worth spawning an additional agent for?"

If the user requests additional research, spawn the new agent(s) — each writes its own file to `research/[agent-slug].md` — then spawn a new synthesis agent to update `RESEARCH.md`, and finally re-spawn the `council-html-companion` subagent with the same inputs as Step 4 to regenerate `RESEARCH.html`. The two must stay in sync.

---

## Step 6 — Handoff

Show the user:

```
## Research Complete: [Feature Name]

Files created in [FEATURE_DIR]:
  - RESEARCH.md    — synthesized findings from [N] research agents (source of truth)
  - RESEARCH.html  — open in browser to review or share

Individual agent reports in [FEATURE_DIR]/research/ (markdown only):
  - [agent-slug].md × [N]

→ Ready to plan? The council will use this research as its starting point:
  /council-plan [FEATURE_SLUG]
```

</process>

<instructions>
- The council always asks questions before acting. Research does not start without user input.
- Questions are asked in a single message — not one at a time.
- The user's answers must visibly influence which agents are spawned and what they focus on.
- Each agent receives only its own objective — not the full agent list. Agents do not know what the others are researching.
- **Each research agent writes its own file.** The orchestrator does not write individual research files. Only the synthesis agent writes RESEARCH.md.
- Files are always written to `.council/[FEATURE_SLUG]/` relative to the project root (current working directory).
- If `RESEARCH.md` already exists, the synthesis agent merges new findings rather than overwriting. Preserve prior insights. Re-spawn the `council-html-companion` subagent to regenerate `RESEARCH.html` from the updated markdown.
- **HTML companion:** Only the synthesized `RESEARCH.md` gets a sibling `RESEARCH.html`, rendered by the orchestrator spawning the `council-html-companion` subagent (not by the synthesis agent itself). Per-agent `research/<slug>.md` files stay markdown-only.
- `/council-plan` will detect and use RESEARCH.md automatically — the planning phase will skip its own research step.
- **Output tone — terse technical prose.** Drop articles, filler, hedging. Fragments OK. Bullets over paragraphs. Named facts, products, incidents — no generic observations. Every sentence must carry information or be cut.
- Use English (en-US) for all instructions and generated files. Respond to the user in their language.
</instructions>
