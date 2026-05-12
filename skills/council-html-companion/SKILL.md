---
name: council-html-companion
description: Reference spec for generating HTML companions next to council markdown artifacts. Use whenever a council-* skill (council-brainstorming, council-research, council-plan, council-review) needs to emit a sibling .html for a synthesized review file (BRAINSTORMING, RESEARCH, TECHNICAL_SKETCH, UX, PLAN, SUMMARY_OF_COUNCIL).
allowed-tools: [Read, Write]
---

<objective>
Define the canonical shape, design system, structure, and rules for the HTML companions emitted by every council skill. This skill is a **reference** — it does not itself generate files. When another council skill (or an agent it spawns) is about to write an HTML companion, it reads this spec first and follows the rules verbatim.

HTML is for the **human to read and review**. Markdown stays source of truth for downstream agents (council-plan reads RESEARCH.md, council-execute reads PLAN.md). Agents do not read the HTML.

Inspired by: *Using Claude Code: The Unreasonable Effectiveness of HTML* — markdown is hard to read once it's long; HTML carries diagrams, color, tables, and interactivity that make specs actually get read.
</objective>

<scope>

## When to emit an HTML companion

HTML companions are emitted **only** for the six top-level synthesized review artifacts. Per-agent intermediate reports stay markdown-only — they are inputs to the synthesized files, not user review surfaces.

**Emit HTML for these six files (and only these):**

| Markdown (source of truth) | HTML companion (review) |
|----------------------------|-------------------------|
| `BRAINSTORMING.md` | `BRAINSTORMING.html` |
| `RESEARCH.md` | `RESEARCH.html` |
| `TECHNICAL_SKETCH.md` | `TECHNICAL_SKETCH.html` |
| `UX.md` | `UX.html` |
| `PLAN.md` (and `PLAN-01.md`, etc.) | `PLAN.html` (and `PLAN-01.html`, etc.) |
| `SUMMARY_OF_COUNCIL.md` | `SUMMARY_OF_COUNCIL.html` |

**Do NOT emit HTML for:**
- Per-agent research files in `research/<agent-slug>.md` — markdown only.
- Per-advisor reports in `council/<ADVISOR>.md` (TURING, LOVELACE, TORVALDS, DIJKSTRA, HAMMURABI) — markdown only.
- The debate transcript `council/DEBATE.md` — markdown only.
- Execution-state files: `ROADMAP.md`.
- Project-level files: `MEMORY.md`, `PROJECT.md`, `CLAUDE.md`, `AGENTS.md`.

Rationale: the user reviews the *synthesis* of the council's work, not every intermediate artifact. The synthesized HTML is rich enough to carry diagrams, comparison tables, and verdicts. Intermediate reports remain plain markdown for agent consumption.

Always write the markdown first, then the HTML companion. If the user revises the spec after review, edit the markdown and regenerate the HTML — never let them drift.

</scope>

<hard_rules>

1. **Self-contained.** One file. No external CSS, no external JS, no CDN, no `<img src="...">` to remote URLs. The user must be able to double-click the file or upload it to S3 and have it render identically.
2. **Mobile responsive.** A single `meta viewport` tag plus a `max-width` container plus media queries at `768px` and `480px`. Tables scroll horizontally on small screens.
3. **Dark mode aware.** Use `prefers-color-scheme: dark` with CSS variables so the file is readable on either theme without flicker.
4. **Print-friendly.** A `@media print` block hides nav/toggles and forces dark text on white.
5. **Markdown is the truth.** The HTML never invents content. Every section maps to the matching markdown section. If a markdown section is empty, the HTML section says so plainly — no filler.
6. **No emojis** unless the user explicitly requested them anywhere in the conversation. The article advocates color/SVG, not decoration.
7. **No tracking, no analytics, no fonts from Google.** System font stack only.

</hard_rules>

<required_structure>

Every HTML companion must include:

### `<head>`
- `<meta charset="utf-8">`
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- `<title>` — the file's primary heading.
- A single inline `<style>` block (see Design System below).

### `<body>` skeleton

```
<header class="doc-header">
  <span class="badge badge-status">[Status]</span>
  <h1>[Document title]</h1>
  <p class="doc-meta">Generated YYYY-MM-DD · [skill name] · <a href="[basename].md">view markdown source</a></p>
</header>

<nav class="toc">
  <h2>On this page</h2>
  <ol>… anchor links to every <section> below …</ol>
</nav>

<main>
  <section id="[section-slug]">
    <h2>[Section title]</h2>
    [Section content — see "Rendering rules per content type" below]
  </section>
  …
</main>

<footer>
  <p>Source of truth: <code>[basename].md</code>. Edit the markdown and regenerate this file.</p>
</footer>
```

The TOC is a real anchor list. Every `<section>` has a slug `id`. Sticky position on desktop (`position: sticky; top: 0;` inside a sidebar) is fine but not required — a top-of-page TOC works on mobile.

</required_structure>

<design_system>

Use these tokens verbatim. Copy/paste — do not improvise palette per file. Consistency across artifacts is the point.

```css
:root {
  --bg: #fafaf9;
  --surface: #ffffff;
  --text: #1c1917;
  --text-muted: #57534e;
  --border: #e7e5e4;
  --accent: #4338ca;          /* indigo — primary */
  --accent-soft: #eef2ff;
  --ok: #15803d;
  --warn: #b45309;
  --danger: #b91c1c;
  --info: #0369a1;
  --code-bg: #f5f5f4;
  --shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --radius: 8px;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0c0a09;
    --surface: #1c1917;
    --text: #f5f5f4;
    --text-muted: #a8a29e;
    --border: #292524;
    --accent: #a5b4fc;
    --accent-soft: #1e1b4b;
    --ok: #4ade80;
    --warn: #fbbf24;
    --danger: #f87171;
    --info: #38bdf8;
    --code-bg: #292524;
    --shadow: 0 1px 3px rgba(0,0,0,.4);
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: var(--font-sans); line-height: 1.6; }
main, .doc-header, nav.toc, footer { max-width: 880px; margin: 0 auto; padding: 0 1.25rem; }
h1, h2, h3 { line-height: 1.25; }
h1 { font-size: clamp(1.6rem, 4vw, 2.25rem); margin: 0.25em 0; }
h2 { font-size: 1.35rem; margin-top: 2rem; padding-bottom: .35rem; border-bottom: 1px solid var(--border); }
h3 { font-size: 1.1rem; margin-top: 1.5rem; }
section { padding: 0.5rem 0 1.25rem; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code { font-family: var(--font-mono); font-size: 0.9em; background: var(--code-bg); padding: 1px 5px; border-radius: 4px; }
pre { background: var(--code-bg); padding: 1rem; border-radius: var(--radius); overflow-x: auto; box-shadow: var(--shadow); }
pre code { background: transparent; padding: 0; }
.badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.badge-status { background: var(--accent-soft); color: var(--accent); }
.badge-ok { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok); }
.badge-warn { background: color-mix(in srgb, var(--warn) 15%, transparent); color: var(--warn); }
.badge-danger { background: color-mix(in srgb, var(--danger) 15%, transparent); color: var(--danger); }
.callout { border-left: 4px solid var(--accent); background: var(--accent-soft); padding: 0.75rem 1rem; margin: 1rem 0; border-radius: 0 var(--radius) var(--radius) 0; }
.callout.warn { border-color: var(--warn); background: color-mix(in srgb, var(--warn) 10%, var(--surface)); }
.callout.danger { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 10%, var(--surface)); }
.callout.ok { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 10%, var(--surface)); }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: var(--surface); box-shadow: var(--shadow); border-radius: var(--radius); overflow: hidden; }
th, td { padding: 0.6rem 0.8rem; text-align: left; border-bottom: 1px solid var(--border); vertical-align: top; }
th { background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; }
tr:last-child td { border-bottom: none; }
.table-scroll { overflow-x: auto; }
.doc-header { padding-top: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1rem; }
.doc-meta { color: var(--text-muted); font-size: 0.9rem; margin: 0; }
nav.toc { padding-top: 1rem; padding-bottom: 1rem; }
nav.toc ol { columns: 2; column-gap: 1.5rem; padding-left: 1.25rem; }
nav.toc li { margin: 0.25rem 0; break-inside: avoid; }
footer { color: var(--text-muted); font-size: 0.85rem; padding: 2rem 1.25rem; text-align: center; border-top: 1px solid var(--border); margin-top: 2rem; }
svg.diagram { width: 100%; height: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; box-shadow: var(--shadow); display: block; margin: 1rem 0; }
.gherkin { background: var(--code-bg); padding: 1rem; border-radius: var(--radius); border-left: 4px solid var(--ok); margin: 0.75rem 0; }
.gherkin .gh-keyword { color: var(--accent); font-weight: 600; }
details { margin: 0.75rem 0; }
summary { cursor: pointer; padding: 0.5rem 0.75rem; background: var(--accent-soft); border-radius: var(--radius); font-weight: 500; }
.tabs { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin: 1rem 0; box-shadow: var(--shadow); }
.tabs > input[type="radio"] { display: none; }
.tabs > label { display: inline-block; padding: 0.6rem 1rem; cursor: pointer; background: var(--surface); border-bottom: 2px solid transparent; }
.tabs > input:checked + label { border-bottom-color: var(--accent); color: var(--accent); font-weight: 600; }
.tab-panel { display: none; padding: 1rem; background: var(--surface); }
.tabs > input:nth-of-type(1):checked ~ .tab-panel:nth-of-type(1),
.tabs > input:nth-of-type(2):checked ~ .tab-panel:nth-of-type(2),
.tabs > input:nth-of-type(3):checked ~ .tab-panel:nth-of-type(3),
.tabs > input:nth-of-type(4):checked ~ .tab-panel:nth-of-type(4),
.tabs > input:nth-of-type(5):checked ~ .tab-panel:nth-of-type(5),
.tabs > input:nth-of-type(6):checked ~ .tab-panel:nth-of-type(6) { display: block; }
@media (max-width: 768px) {
  nav.toc ol { columns: 1; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.2rem; }
}
@media print {
  body { background: white; color: black; }
  nav.toc, .tabs > label, details summary { background: white !important; color: black !important; }
  a { color: black; text-decoration: underline; }
  .callout { break-inside: avoid; }
  svg.diagram { box-shadow: none; border: 1px solid #ccc; }
}
```

Use the same tokens for every file. If a future skill needs a new component, add it here first, then reuse.

</design_system>

<rendering_rules>

### Tables
Wrap in `<div class="table-scroll">` so mobile users can scroll horizontally. Headers use the `--accent-soft` background defined in the design system.

### Approaches / alternatives comparison (BRAINSTORMING, TECHNICAL_SKETCH)
Use the `.tabs` component when there are 2-4 approaches and the user wants to flip between them. Use a side-by-side table when fewer or when comparison density matters more than depth. Color-code the chosen approach with `.badge-ok`; rejected ones with `.badge-danger` (one-word verdict, not decoration).

### Risks, blockers, debt (SUMMARY_OF_COUNCIL)
Each blocker becomes a `<div class="callout danger">` with a checkbox-styled prefix. Manageable risks become `<div class="callout warn">`. Accepted debt becomes `<div class="callout">` (default tone). Open questions become `<div class="callout">` with a question mark prefix. The visual hierarchy must match severity at a glance.

### Verdicts (SUMMARY_OF_COUNCIL)
Render the verdict as a top-of-section badge:
- PROCEED → `.badge-ok`
- PROCEED WITH ADJUSTMENTS → `.badge-warn`
- REVISE BEFORE PROCEEDING → `.badge-danger`

### Per-advisor vote table (SUMMARY_OF_COUNCIL)
Render the "How each advisor voted" table with the Verdict column color-coded via `.badge-ok` / `.badge-warn` / `.badge-danger`. The "Held in debate?" column uses `.badge-ok` ("Held") or `.badge-status` ("Conceded").

### Diagrams (Mermaid in markdown → SVG in HTML)
The article is explicit: SVG > ASCII > unicode-colored boxes. For every `mermaid` block in the source markdown, render an **inline SVG diagram** in the HTML — do not embed mermaid.js, do not link to mermaid.ink. Hand-author the SVG from the mermaid source:

- `flowchart` → boxes (`<rect>`) connected by arrows (`<line>` + `<polygon>` arrowhead marker). Group with `<g>` and label with `<text>`.
- `sequenceDiagram` → vertical lanes + horizontal arrows + labeled boxes for messages.
- `erDiagram` → entity boxes with field lists, lines with crow's-foot terminators.
- `classDiagram` → boxed compartments (name / fields / methods).

Use the CSS variables (`var(--surface)`, `var(--accent)`, `var(--text)`, `var(--border)`) on fill/stroke so the SVG adapts to dark mode. Add `class="diagram"` on the root `<svg>` for the shared styling.

Keep diagrams small (≤ 800px wide). If a diagram is genuinely too complex for hand-authored SVG, fall back to a `<pre>` with the mermaid source AND a one-paragraph plain-English description above it — never leave a diagram-shaped hole.

### Code snippets
Always inside `<pre><code>`. No syntax highlighting library — keep it self-contained. If language matters, add a `data-lang="ts"` attribute and prepend it as a small label via CSS `::before` on the `<pre>`.

### Gherkin acceptance criteria (PLAN slices)
Each Given/When/Then block uses the `.gherkin` class. Wrap keywords (`Given`, `When`, `Then`, `And`) in `<span class="gh-keyword">` so they stand out.

### Slice / task cards (PLAN)
Each slice is its own `<section>` with a heading like `T01 — [title]`. Inside: a small definition list for Touches / Reuses / Change / Verify, followed by the Gherkin block. The verify command should be in `<code>` so the user can copy it cleanly.

### Per-section approval status (BRAINSTORMING)
When sections are written one at a time with approval, mark each in the HTML with a small badge:
- Approved → `.badge-ok` reading "Approved"
- Pending → `.badge-status` reading "Pending review"
- Not approved → `.badge-warn` reading "Not approved"

### Reuse Map / New things created (TECHNICAL_SKETCH)
Render as tables wrapped in `.table-scroll`. In the "New things created" table, rows where `Exercised by slice` is empty get a `.badge-warn` "YAGNI risk" pill in that cell.

### Persona journeys (UX)
Each persona as its own `<section>` with a heading and a `.callout` summary block. The step table color-codes the State column: `.badge-ok` for success states, `.badge-warn` for friction/error states, `.badge-danger` for hard failures. Add a hand-authored inline SVG flow diagram per persona (entry → steps → success/error branches).

</rendering_rules>

<workflow>

When a council skill needs to emit an HTML companion:

1. Write the markdown file first (per that skill's own spec).
2. After the markdown is finalized (post-self-review, post-user-approval), invoke this skill via the `Skill` tool — or, if working inside an Agent the parent has already briefed with the rules, just apply them.
3. Read this SKILL.md.
4. Generate the HTML companion at the sibling path with the same basename (`<NAME>.html` next to `<NAME>.md`).
5. Use the Write tool. Do not pipe through pandoc or any external converter — the HTML is hand-authored from the markdown content so the design system, diagram quality, and badges stay consistent.
6. Surface the file path to the user in the handoff: `Review: [path]/[basename].html (open in browser)`.

When the markdown changes after user feedback, regenerate the HTML from the updated markdown. Never let the two drift.

</workflow>

<anti_patterns>

- DON'T link to remote stylesheets, fonts, or images. Self-contained means self-contained.
- DON'T embed mermaid.js or any other diagram runtime. Hand-author SVG.
- DON'T add JS frameworks. Use CSS-only tabs/accordions (the `.tabs` and `<details>` patterns above).
- DON'T duplicate content verbatim — the HTML adds *visual* structure (diagrams, tables, badges, color); the markdown stays terse prose.
- DON'T regenerate HTML before the markdown is approved. The HTML reflects approved state, not in-progress drafts.
- DON'T add company branding or logos unless the user explicitly attached them — keep the design neutral.
- DON'T use HTML where markdown is the input (e.g., a council-execute agent reading PLAN.md). Agents read markdown; HTML is for humans only.
- DON'T emit HTML for per-agent intermediate reports (`research/<slug>.md`, `council/<ADVISOR>.md`, `council/DEBATE.md`). Only the six synthesized files (BRAINSTORMING, RESEARCH, TECHNICAL_SKETCH, UX, PLAN, SUMMARY_OF_COUNCIL) get HTML companions.

</anti_patterns>
