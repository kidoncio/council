<div align="center">

# Council

**A council of 5 AI advisors for [Claude Code](https://claude.ai/code). Plan with adversarial validation. Ship with confidence.**

[![npm version](https://img.shields.io/npm/v/@kidoncio/council?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@kidoncio/council)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/kidoncio/council?style=for-the-badge&logo=github&color=181717)](https://github.com/kidoncio/council)

<br>

```bash
npm install -g @kidoncio/council
```

<br>

_"Don't ship a plan that only one perspective reviewed."_

<br>

[Why Council](#why-council) · [The Council](#the-council) · [Getting Started](#getting-started) · [Commands](#commands) · [Output Files](#output-files)

</div>

---

## Why Council

Claude Code is powerful. But when you plan alone, you have one perspective.

You optimize for what you already know how to build. You don't see the attack surface your security engineer would catch. You don't hear the PM question whether you're solving the right problem. You don't feel the 3am incident that makes your architecture choice look naive in hindsight.

Council gives you five permanent advisors — each with a distinct worldview and a mandate to disagree — embedded directly in Claude Code as slash commands.

They don't agree easily. **That's the point.**

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

`postinstall` copies the commands to `~/.claude/commands/council/` automatically.

Confirm it worked:

```bash
council list
```

Then open Claude Code and run your first plan:

```
/council:plan add user authentication
```

---

## The Workflow

The commands are designed to run in sequence — but each one is independently useful.

```
/council:discuss    ← optional: articulate goals, constraints, open questions
        ↓
/council:research   ← optional: deep research before committing to a plan
        ↓
/council:plan       ← research → UX mapping → task plan → council review
        ↓
/council:execute    ← implement task by task, track progress in ROADMAP.md
```

`/council:plan` detects and reuses an existing `RESEARCH.md` automatically — no duplicate work.

Use the single-advisor commands any time for a focused opinion without convening the full council.

---

## Commands

### Planning

| Command             | What it does                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/council:discuss`  | Think through a feature before committing to a plan. Surfaces goals, constraints, and risks into `CONTEXT.md`. Handoff to `/plan` is automatic.     |
| `/council:research` | Spawn parallel research agents on a feature or problem. Produces `RESEARCH.md` without committing to a plan. Reused automatically by `/plan`.       |
| `/council:plan`     | 4-phase structured planning: research → UX mapping → task plan → adversarial council review. Produces a complete file set in `.council/[feature]/`. |
| `/council:execute`  | Reads `PLAN.md`, implements tasks in dependency order, and updates `ROADMAP.md` after each one. Pauses for input when blocked or ambiguous.         |

### Council Reviews

Convene one advisor or all five — your choice.

| Command                       | Advisor   | What they focus on                                          |
| ----------------------------- | --------- | ----------------------------------------------------------- |
| `/council:review`             | All five  | Independent reports → debate → unified verdict              |
| `/council:senior-engineer`    | TURING    | Operational complexity, blast radius, debuggability         |
| `/council:security-engineer`  | TORVALDS  | Attack surface, data exposure, specific CVE classes         |
| `/council:product-strategy`   | LOVELACE  | User outcomes, delivery speed, the right problem            |
| `/council:architecture`       | DIJKSTRA  | Consistency guarantees, failure modes, migration paths      |
| `/council:code-quality`       | HAMMURABI | Maintainability, cyclomatic complexity, 6-month inheritance |

---

## How the Review Works

`/council:review` runs a 3-phase adversarial process:

```
Phase 1 — Independent reports
Each advisor reviews the plan separately, with no knowledge of the others' findings.

Phase 2 — Debate
Advisors challenge each other's conclusions directly.
Consensus achieved too easily is a failure of the process.

Phase 3 — Unified verdict
A synthesized report that names the real trade-offs and what you must decide before committing.
```

The single-advisor commands skip the debate and give you one sharp opinion fast.

---

## Output Files

Plans are written to `.council/[feature-slug]/` inside your project. Everything is plaintext and lives in your repo — no external state, no accounts, no dashboard.

```
.council/
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

### npm (recommended)

```bash
npm install -g @kidoncio/council
```

To uninstall:

```bash
council uninstall
# or
npm uninstall -g @kidoncio/council
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
