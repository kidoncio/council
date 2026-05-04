---
name: council-init
description: Initialize council project context. Use when starting council in a repo for the first time.
---

---
name: council-init
description: Initialize .council/PROJECT.md — a compact project snapshot injected into every council agent as shared context. Prevents agents from re-discovering the stack on every plan.
argument-hint: ""
allowed-tools: [Read, Write, Bash, Glob]
---

<objective>
Write `.council/PROJECT.md` — the smallest possible file that prevents council agents from having to infer the project's stack, structure, and conventions from scratch on every run. Brevity is correctness: every line that isn't load-bearing is a token wasted on every future plan.
</objective>

<process>

## Step 1 — Read existing sources

Run silently (do not error if missing):

```bash
find . -maxdepth 3 -type d \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -not -path '*/.council/*' -not -path '*/dist/*' \
  -not -path '*/.next/*' -not -path '*/build/*' \
  -not -path '*/.turbo/*' -not -path '*/coverage/*'
```

Read if they exist: `CLAUDE.md`, `AGENTS.md`, `.claude/CLAUDE.md`, `README.md`, `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`.

---

## Step 2 — Ask only what cannot be inferred

Ask in a single message, omitting anything already answered by the files:

Always ask:
1. One sentence: what is this project and who uses it?
2. Primary database and query layer/ORM?
3. External integrations that features regularly touch? (auth, payments, email, storage — or "none")

Ask only if not determinable from files:
- Main language/runtime
- API and UI framework
- Where do routes, models, UI components, and tests live?

Wait for response.

---

## Step 3 — Write .council/PROJECT.md

**Hard limit: 40 lines.** If it exceeds 40 lines, cut until it doesn't.

Format: no prose, no section headers with sub-paragraphs. Every piece of information is one line. Use a flat key/value or bullet style. Omit any field with no real content.

```markdown
# [Project Name]
[One sentence: what it is and who uses it.]

**Stack:** [language · runtime · framework(s)]
**DB:** [engine + ORM/query layer + migration tool]
**Integrations:** [service — purpose, ...] or none
**Auth:** [provider/approach]
**Tests:** [framework + pattern — e.g., "Vitest, unit + integration"]

**Structure:**
- [path] — [what lives here]
- [path] — [what lives here]
- (only paths a plan would need to know)

**Conventions:** (only if non-obvious from the stack)
- [convention]

**Context files:** [CLAUDE.md, AGENTS.md, etc. — agents should read these for deeper guidance]
```

Rules:
- No version numbers unless architecturally significant (e.g., "Next.js App Router" not "Next.js 14")
- No feature descriptions, no roadmap, no WIP state
- If CLAUDE.md or AGENTS.md exist and cover conventions thoroughly, write only "See CLAUDE.md" under Conventions instead of duplicating content
- Omit sections with no content — do not write "none" for every field

---

## Step 4 — Confirm

Tell the user: "PROJECT.md written to `.council/PROJECT.md` ([N] lines). Agents will use this as shared context on every plan. Update it when the stack changes significantly."

Do not print the file contents. Do not summarize what was written.

If called from `council-plan`, return to the plan flow immediately.

</process>

<instructions>
- The 40-line limit is a hard constraint, not a guideline. Cut ruthlessly.
- If CLAUDE.md already covers stack and conventions comprehensively, PROJECT.md can be as short as 5 lines pointing to it. Do not duplicate.
- Never ask a question answered by the files. Never write a section without real content.
- Use English (en-US) for all output. Respond to the user in their language.
</instructions>
