# kidoncio

A council of 5 AI advisors for [Claude Code](https://claude.ai/code). Plan features with adversarial validation, execute with discipline, and get sharp opinionated reviews from TURING, LOVELACE, TORVALDS, DIJKSTRA, and HAMMURABI.

## Commands

| Command | What it does |
|---------|-------------|
| `/kidoncio:discuss` | Think through a feature before planning — captures goals, constraints, and risks into `CONTEXT.md` |
| `/kidoncio:plan` | Full 4-phase planning: research → UX mapping → task plan → council review |
| `/kidoncio:execute` | Execute a plan task by task, with scope discipline and ROADMAP.md tracking |
| `/kidoncio:review` | Adversarial 3-phase review: 5 independent reports → debate → unified verdict |
| `/kidoncio:senior-engineer` | Ask TURING for a blunt operational take on any code or plan |
| `/kidoncio:security-engineer` | Ask TORVALDS to threat-model any feature, code, or plan |
| `/kidoncio:product-strategy` | Ask LOVELACE for a user-outcome driven critique |
| `/kidoncio:architecture` | Ask DIJKSTRA to analyze consistency, failure modes, and 3-year migrations |
| `/kidoncio:code-quality` | Ask HAMMURABI for a maintainability review with cyclomatic complexity analysis |

## Install

### npm (recommended)

```bash
npm install -g kidoncio
```

This runs `postinstall` automatically and copies the commands to `~/.claude/commands/kidoncio/`.

After install, run `kidoncio list` to confirm:

```bash
kidoncio list
```

To remove:

```bash
kidoncio uninstall
# or
npm uninstall -g kidoncio
```

### Manual — curl

```bash
curl -fsSL https://raw.githubusercontent.com/kidoncio/kidoncio-commands/main/install.sh | bash
```

### Manual — clone

```bash
git clone https://github.com/kidoncio/kidoncio-commands.git
cd kidoncio-commands
./install.sh
```

To remove:

```bash
./uninstall.sh
```

## Workflow

The commands are designed to work in sequence:

```
/kidoncio:discuss        ← optional: articulate goals before planning
       ↓
/kidoncio:plan           ← research + UX mapping + task plan + council review
       ↓
/kidoncio:execute        ← implement task by task, update ROADMAP.md
```

The single-advisor commands (`senior-engineer`, `security-engineer`, etc.) can be used at any time for a focused opinion.

## The Council

Five permanent advisors with distinct worldviews. They don't agree easily.

- **TURING** — Pragmatist Engineer. 15 years of production scars. "What happens when this breaks at 3am?"
- **LOVELACE** — Product Strategist. Former PM. "Are we solving the right problem? What does the user actually feel?"
- **TORVALDS** — Security Engineer. Threat modeler. "What's the worst thing a malicious user can do with this?"
- **DIJKSTRA** — Systems Thinker. Staff engineer. "What does this look like at 100x load? What's the migration path?"
- **HAMMURABI** — Code Quality Judge. Principal engineer. "Would a new engineer understand this in 6 months with no context?"

## Output files

Plans are written to `.kidoncio/[feature-slug]/` in your project:

```
.kidoncio/
└── my-feature/
    ├── CONTEXT.md          ← discussion output (from /discuss)
    ├── RESEARCH.md         ← market research and prior art
    ├── UX.md               ← personas and user journeys
    ├── PLAN.md             ← implementation tasks with BDD acceptance criteria
    ├── ROADMAP.md          ← progress tracker (updated by /execute)
    ├── SUMMARY_OF_COUNCIL.md
    └── council/
        ├── TURING.md
        ├── LOVELACE.md
        ├── TORVALDS.md
        ├── DIJKSTRA.md
        └── HAMMURABI.md
```

## Requirements

- [Claude Code](https://claude.ai/code) CLI installed
- Node.js 18+ (for npm install)
- `curl` (for the curl install method)

## License

MIT
