<div align="center">

# Council

**Five AI advisors for [Claude Code](https://claude.ai/code). Catch the problems you didn't think to look for — before you build.**

[![npm version](https://img.shields.io/npm/v/@kidoncio/council?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@kidoncio/council)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/kidoncio/council?style=for-the-badge&logo=github&color=181717)](https://github.com/kidoncio/council)

<br>

```bash
npm install -g @kidoncio/council
```

<br>

_"The argument you had before building is the one you don't have in production."_

<br>

[Why Council](#why-council) · [The Council](#the-council) · [Getting Started](#getting-started) · [Commands](#commands) · [Output Files](#output-files)

</div>

---

## Why Council

You've shipped a feature that looked solid in the plan — and then watched it fall apart for a reason nobody thought to check.

The auth flow that seemed fine until a security engineer pointed out it leaks session tokens. The architecture that worked great until someone asked what happens at 10x load. The product decision that made sense until a user couldn't figure out what the feature was for.

Council gives you five permanent advisors — each with a distinct worldview and a mandate to disagree — embedded directly in Claude Code as slash commands. They review your plan before you build it: independently, then against each other, then together.

The problems they surface are the ones that cost the most to fix after the fact. **That's the point.**

---

## The Council

Five advisors. Five lenses. All permanently disagreeing with at least one of the others.

| Advisor       | Role                | Their question                                                        |
| ------------- | ------------------- | --------------------------------------------------------------------- |
| **TURING**    | Pragmatist Engineer | _"What happens when this breaks at 3am?"_                             |
| **LOVELACE**  | Product Strategist  | _"Are we solving the right problem?"_                                 |
| **TORVALDS**  | Security Engineer   | _"What's the worst thing a malicious user can do with this?"_         |
| **DIJKSTRA**  | Systems Thinker     | _"What does this look like at 100x load in 3 years?"_                 |
| **HAMMURABI** | Code Quality Judge  | _"Would a new engineer understand this in 6 months with no context?"_ |

Each advisor has a philosophy, a blind spot, and a debate style. They produce independent reports, argue with each other, and converge on a verdict only when the argument is actually settled.

---

## Getting Started

```bash
npm install -g @kidoncio/council
```

`postinstall` copies the commands to `~/.claude/commands/council/` automatically. Confirm it worked:

```bash
council list
# → Lists all installed council commands
```

Then open Claude Code and run your first plan:

```
/council:plan add user authentication
```

---

## Commands

### Setup

| Command          | What it does                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/council:init`  | Reads your project's existing files (`CLAUDE.md`, `AGENTS.md`, `README.md`, `package.json`, etc.) and asks a few targeted questions to write `.council/PROJECT.md` — a stable snapshot of your stack, structure, and conventions that every subsequent council agent uses as shared context. Run once per project. |

### Planning

The commands are designed to run in sequence — but each one is independently useful. You end up with a plan your whole team can poke holes in, backed by research and a full adversarial review.

| Command             | What it does                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/council:discuss`  | Think through a feature before committing to a plan. Surfaces goals, constraints, and risks into `CONTEXT.md`. Handoff to `/plan` is automatic.     |
| `/council:research` | Spawn parallel research agents on a feature or problem. Produces `RESEARCH.md` without committing to a plan. Reused automatically by `/plan`.       |
| `/council:plan`     | 4-phase structured planning: research → UX mapping → task plan → adversarial council review. Produces a complete file set in `.council/[feature]/`. |
| `/council:execute`  | Reads `PLAN.md`, implements tasks in dependency order, and updates `ROADMAP.md` after each one. Pauses for input when blocked or ambiguous.         |

`/council:plan` detects and reuses an existing `RESEARCH.md` automatically — no duplicate work. If `.council/PROJECT.md` exists, it is injected into every agent's context automatically.

### Council Reviews

Convene one advisor or all five — your choice.

| Command                      | Advisor   | What they focus on                                          |
| ---------------------------- | --------- | ----------------------------------------------------------- |
| `/council:review`            | All five  | Independent reports → debate → unified verdict              |
| `/council:senior-engineer`   | TURING    | Operational complexity, blast radius, debuggability         |
| `/council:security-engineer` | TORVALDS  | Attack surface, data exposure, specific CVE classes         |
| `/council:product-strategy`  | LOVELACE  | User outcomes, delivery speed, the right problem            |
| `/council:architecture`      | DIJKSTRA  | Consistency guarantees, failure modes, migration paths      |
| `/council:code-quality`      | HAMMURABI | Maintainability, cyclomatic complexity, 6-month inheritance |

---

## How the Review Works

`/council:review` runs a 3-phase adversarial process:

```
Phase 1 — Independent reports
Each advisor reviews the plan separately, with no knowledge of the others' findings.

Phase 2 — Debate
Advisors challenge each other's conclusions directly.
TORVALDS flags an auth bypass; LOVELACE argues it's out of scope for v1;
the verdict names the trade-off and forces you to decide.
Consensus achieved too easily is a failure of the process.

Phase 3 — Unified verdict
A synthesized report that names the real trade-offs and what you must decide before committing.
```

The single-advisor commands skip the debate and give you one sharp opinion fast.

---

## Output Files

Plans are written to `.council/[feature-slug]/` inside your project. Everything is plaintext and lives in your repo — version it, diff it, hand it to a teammate. No external state, no accounts, no dashboard.

```
.council/
├── PROJECT.md           ← project snapshot: stack, structure, conventions (from /init)
└── my-feature/
    ├── CONTEXT.md           ← goals and constraints (from /discuss)
    ├── RESEARCH.md          ← synthesized research (from /research or /plan)
    ├── UX.md                ← personas and user journeys
    ├── PLAN.md              ← tasks with BDD acceptance criteria
    ├── ROADMAP.md           ← live progress tracker (updated by /execute)
    ├── SUMMARY_OF_COUNCIL.md
    ├── research/            ← individual agent reports (from /research)
    │   ├── market-solutions.md
    │   ├── ux-patterns.md
    │   ├── technical-approaches.md
    │   ├── failure-modes.md
    │   └── security-and-compliance.md
    └── council/
        ├── TURING.md
        ├── LOVELACE.md
        ├── TORVALDS.md
        ├── DIJKSTRA.md
        └── HAMMURABI.md
```

---

## Install

### Global — available in every project

```bash
npm install -g @kidoncio/council
```

`postinstall` copies the commands to `~/.claude/commands/council/` automatically.

To uninstall:

```bash
council uninstall
# or
npm uninstall -g @kidoncio/council
```

### Project — scoped to one repo

Install into `.claude/commands/council/` inside the current directory. Commit it to version-control your council commands alongside the project.

```bash
npx @kidoncio/council install --local
```

To uninstall:

```bash
npx @kidoncio/council uninstall --local
```

### curl

```bash
curl -fsSL https://raw.githubusercontent.com/kidoncio/council/main/install.sh | bash
```

### Clone

```bash
git clone https://github.com/kidoncio/council.git
cd council
./install.sh
```

To uninstall:

```bash
./uninstall.sh
```

---

## Requirements

- [Claude Code](https://claude.ai/code) CLI
- Node.js 18+
- `curl` (for the curl install method)

---

## License

MIT

---

<div align="center">

**Five advisors. One plan. Ship with confidence.**

</div>
