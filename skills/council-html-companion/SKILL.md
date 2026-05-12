---
name: council-html-companion
description: Subagent contract for rendering HTML review companions next to council markdown artifacts. Use whenever a council-* skill (council-brainstorming, council-research, council-plan, council-review) needs to emit a sibling .html for a synthesized review file (BRAINSTORMING, RESEARCH, TECHNICAL_SKETCH, UX, PLAN, SUMMARY_OF_COUNCIL). Callers spawn a general-purpose subagent that invokes this skill, reads the markdown, and writes the HTML — they never inline the rules themselves.
allowed-tools: [Read, Write]
---

<objective>
Render a sibling `.html` review companion for a finalized council markdown artifact. The HTML is the **human review surface** — scannable, hierarchical, with plain-language summaries and a clear sense of where the artifact sits in the council workflow. Markdown stays source of truth for downstream agents (council-plan reads RESEARCH.md, council-execute reads PLAN.md); agents do not read the HTML.

This skill runs **inside a dedicated subagent**, not in the caller's main turn. Callers spawn a fresh `general-purpose` subagent, point it at the markdown path, and the subagent does the rendering work in isolation. This keeps 280+ lines of design and UX rules out of the parent context and parallelizes well when multiple artifacts ship at once (e.g. PLAN-01.html, PLAN-02.html).
</objective>

<invocation>

## How callers spawn this subagent

Callers MUST spawn a `general-purpose` subagent — never inline these rules into their own turn, never call this skill from the parent context. The subagent owns the full HTML render. The caller's job is only to pass the inputs and surface the resulting path to the user.

### Required inputs

| Field | Type | Example |
|-------|------|---------|
| `markdown_path` | absolute path | `/home/user/proj/.council/stamps/BRAINSTORMING.md` |
| `html_path` | absolute path (sibling, same basename) | `/home/user/proj/.council/stamps/BRAINSTORMING.html` |
| `artifact_type` | one of: `BRAINSTORMING` `RESEARCH` `TECHNICAL_SKETCH` `UX` `PLAN` `SUMMARY_OF_COUNCIL` | `BRAINSTORMING` |
| `feature_slug` | the slug used in the feature dir | `stamps` |
| `status_label` | short string for the header status badge | `Ready for planning` |
| `companion_index` | comma-separated list of sibling `.html` basenames that already exist in the same dir (empty string if none) | `RESEARCH.html,TECHNICAL_SKETCH.html` |

### Canonical `Agent()` call

Copy this verbatim, substituting only the six input values:

```
Agent({
  description: "Render <ARTIFACT_TYPE> HTML companion",
  subagent_type: "general-purpose",
  prompt: `
You are rendering an HTML review companion for a council markdown artifact.

Inputs:
- markdown_path: <MARKDOWN_PATH>
- html_path: <HTML_PATH>
- artifact_type: <ARTIFACT_TYPE>
- feature_slug: <FEATURE_SLUG>
- status_label: <STATUS_LABEL>
- companion_index: <COMPANION_INDEX>

Do exactly this and nothing more:

1. Invoke the skill: call Skill("council-html-companion"). Read every section.
2. Read the markdown file at markdown_path.
3. Hand-author a self-contained HTML file that:
   - Follows the <hard_rules>, <required_structure>, <design_system>, and <rendering_rules> sections of the skill verbatim.
   - Applies the <ux_writing> layer using the artifact_type to pick the TL;DR voice and breadcrumb position.
   - Renders the status_label inside the header status badge.
   - Renders the breadcrumb using the companion_index to decide which prior steps are live links versus muted text.
4. Write the file using the Write tool at html_path. Do not modify markdown_path. Do not pipe through pandoc.
5. Return a single line: "Wrote <html_path> (<N> sections, ~<M> min read)". No prose, no rule recap, no preamble.
  `
})
```

### Output contract

The subagent returns exactly one line. The caller surfaces the html_path to the user in its handoff message. If the markdown is later revised, the caller re-spawns this subagent with the same inputs — never edits the HTML directly.

### When to spawn

Only after the markdown is **finalized** (post-self-review, post-user-approval for that step in the caller's workflow). Never spawn this subagent against a draft markdown — the HTML reflects approved state, not in-progress content.

</invocation>

<scope>

## Which artifacts get HTML companions

HTML companions are emitted **only** for the six top-level synthesized review artifacts. Per-agent intermediate reports stay markdown-only — they are inputs to the synthesized files, not user review surfaces.

| Markdown (source of truth) | HTML companion (review) |
|----------------------------|-------------------------|
| `BRAINSTORMING.md` | `BRAINSTORMING.html` |
| `RESEARCH.md` | `RESEARCH.html` |
| `TECHNICAL_SKETCH.md` | `TECHNICAL_SKETCH.html` |
| `UX.md` | `UX.html` |
| `PLAN.md` (and `PLAN-01.md`, etc.) | `PLAN.html` (and `PLAN-01.html`, etc.) |
| `SUMMARY_OF_COUNCIL.md` | `SUMMARY_OF_COUNCIL.html` |

**No HTML for:** per-agent research files (`research/<agent-slug>.md`), per-advisor reports (`council/<ADVISOR>.md`), debate transcripts (`council/DEBATE.md`), execution-state files (`ROADMAP.md`), or project-level files (`MEMORY.md`, `PROJECT.md`, `CLAUDE.md`, `AGENTS.md`).

</scope>

<hard_rules>

1. **Self-contained.** One file. No external CSS, no external JS, no CDN, no `<img src="...">` to remote URLs. The user must be able to double-click the file or upload it to S3 and have it render identically.
2. **Mobile responsive.** A single `meta viewport` tag plus a `max-width` container plus media queries at `768px` and `480px`. Tables scroll horizontally on small screens.
3. **Dark mode aware.** Use `prefers-color-scheme: dark` with CSS variables so the file is readable on either theme without flicker.
4. **Print-friendly.** A `@media print` block hides nav/toggles and forces dark text on white.
5. **Markdown is the truth.** The HTML never invents content. Every section maps to the matching markdown section. If a markdown section is empty, the HTML section says so plainly — no filler.
6. **No emojis** unless the user explicitly requested them anywhere in the conversation. Color and SVG carry visual weight, not decoration.
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
  <span class="badge badge-status">[status_label]</span>
  <h1>[Document title]</h1>
  <p class="doc-meta">[YYYY-MM-DD] · [skill name] · ~[N] min read · <a href="[basename].md">view markdown source</a></p>
  <nav class="breadcrumb" aria-label="Council workflow">
    [Brainstorming] › [Research] › [Plan] › [Review]
  </nav>
</header>

<div class="progress-bar" aria-hidden="true"></div>

<nav class="toc">
  <h2>On this page</h2>
  <ol>
    <li><a href="#section-slug">Section title</a> <span class="toc-status badge badge-ok">Approved</span></li>
    …
  </ol>
</nav>

<main>
  <section id="[section-slug]">
    <h2>[Section title] <a class="anchor-link" href="#[section-slug]" aria-label="Link to section">#</a></h2>
    <p class="tldr">[One-sentence plain-language summary derived from the section.]</p>
    [Section content — see "Rendering rules per content type" below]
  </section>
  …
</main>

<footer>
  <p>Source of truth: <code>[basename].md</code>. Edit the markdown and regenerate this file via the council-html-companion subagent.</p>
</footer>
```

The TOC is a real anchor list with per-section status pills (`Approved` / `Pending review` / `Open question` — pick the closest match from the markdown). The breadcrumb shows the four-step council workflow; the current step is bolded (`<strong>`), previously-completed steps with an HTML sibling in `companion_index` become links to that sibling, and steps without a sibling render as muted plain text. Every `<section>` carries a slug `id` and an inline `<a class="anchor-link">` for deep-linking.

</required_structure>

<ux_writing>

The UX-writing layer makes the page **scannable, plain-spoken, and well-paced**. Apply these on top of the design system — they govern structure, voice, and labels, not visuals.

## (a) Scannability + hierarchy

- **Sticky header on desktop.** The `.doc-header` sticks to the top of the viewport at ≥ 768px so the status badge, title, and breadcrumb stay visible while scrolling.
- **TL;DR per section.** Every `<section>` opens with a `<p class="tldr">` — one sentence, derived from the section's content, that tells the user what this section says at a glance. Never invented content; if the markdown section is empty, the TL;DR reads "This section is empty in the source markdown."
- **TOC with status pills.** Each TOC entry has a small inline pill that mirrors the section's state (Approved / Pending review / Open question / Risk flagged / Not approved). The user spots trouble before scrolling.
- **Breadcrumb.** The four-step workflow (Brainstorming › Research › Plan › Review) sits inside the header. The current step is bolded; prior steps with sibling HTML become links; steps without a sibling render as `<span class="muted">…</span>`. The breadcrumb is omitted only when `companion_index` is empty AND the current step is Brainstorming (the very first artifact).
- **Anchor links.** Every `<h2>` gets a sibling `<a class="anchor-link" href="#id">#</a>` that becomes visible on hover (or always, on mobile). The user can copy a deep link to any section.
- **Long sections collapse.** Sections whose rendered body exceeds ~300 words wrap the body inside `<details open><summary>…</summary>…</details>`. The `<summary>` shows the section title plus `(~N words)`. Default open — the user collapses to skim, never to discover.

## (b) Plain-language summaries

- **TL;DR voice.** One sentence, active voice, plain English. Drop hedging ("appears to", "seems to"). Drop engineering passive ("is implemented by"). Lead with the *thing*, not the *meta* ("Three approaches considered; option B chosen" beats "This section discusses three architectural approaches").
- **Glossary — apply when rendering badges, TL;DRs, and verdict copy:**

| Source phrasing (avoid) | Rendered phrasing (prefer) |
|-------------------------|----------------------------|
| Implementation deferred | We are not building this yet — see Open Questions |
| Concerns raised | Risks flagged — see Risks section |
| Verdict: pending | Verdict: pending review |
| Not approved | Not approved yet |
| TBD | Not decided yet |
| N/A | Does not apply |
| PROCEED | Verdict: proceed |
| PROCEED WITH ADJUSTMENTS | Verdict: proceed with adjustments |
| REVISE BEFORE PROCEEDING | Verdict: revise before proceeding |

The glossary applies to text the subagent **writes** (TL;DRs, badges, button labels, callouts the subagent generates). It does NOT rewrite markdown content that's being faithfully transcribed into the HTML body — that stays verbatim.

- **Badge labels are sentence-case English words.** "Approved", "Pending review", "Open question" — never "APPROVED", "PEND", or status codes.
- **Verdict-as-sentence.** For SUMMARY_OF_COUNCIL the TL;DR is the verdict written as a complete sentence ("The council recommends proceeding with three adjustments.") not the bare verdict word.

## (c) Reading-time + progress hints

- **Estimated read time** in the header meta line, computed at 200 words per minute, rounded up, minimum 1 ("~3 min read"). Count words in the rendered HTML body text excluding `<pre>` blocks and table cells.
- **Per-section read time** appears as a small muted suffix on `<h2>` when the section itself takes ≥ 2 min ("Components (~2 min)"). Otherwise omitted.
- **Scroll progress bar.** The `.progress-bar` div at the top of `<main>` fills proportionally to scroll position using CSS `scroll-timeline` and `animation-timeline: scroll(root)`. No JavaScript. Browsers that don't support `scroll-timeline` see no bar at all — no fallback needed, it's purely additive.

## TL;DR voice by artifact type

| `artifact_type` | TL;DR voice for the doc-level summary |
|-----------------|---------------------------------------|
| `BRAINSTORMING` | "[Feature] aims to [user outcome]. Chose [approach] over [N] alternatives." |
| `RESEARCH` | "Surveyed [scope]; key finding: [one sentence]; main gap vs. need: [one sentence]." |
| `TECHNICAL_SKETCH` | "Touches [N] existing modules, adds [N] new pieces, reuses [N] utilities." |
| `UX` | "[N] personas, [N] journey steps; biggest friction: [one sentence]." |
| `PLAN` | "[N] slices, est. [N] LOC. Verify: [one sentence]." |
| `SUMMARY_OF_COUNCIL` | "Council verdict: [proceed / proceed with adjustments / revise]. [One-sentence reason.]" |

The doc-level TL;DR sits directly under the H1, inside `.doc-header`, before the meta line. Per-section TL;DRs sit at the top of each `<section>` body.

</ux_writing>

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
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: var(--font-sans); line-height: 1.6; scroll-behavior: smooth; }
main, .doc-header, nav.toc, footer { max-width: 880px; margin: 0 auto; padding: 0 1.25rem; }
h1, h2, h3 { line-height: 1.25; }
h1 { font-size: clamp(1.6rem, 4vw, 2.25rem); margin: 0.25em 0; }
h2 { font-size: 1.35rem; margin-top: 2rem; padding-bottom: .35rem; border-bottom: 1px solid var(--border); display: flex; align-items: baseline; gap: 0.4rem; }
h2 .section-time { font-size: 0.8rem; color: var(--text-muted); font-weight: 400; }
h3 { font-size: 1.1rem; margin-top: 1.5rem; }
section { padding: 0.5rem 0 1.25rem; scroll-margin-top: 6rem; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.muted { color: var(--text-muted); }
code { font-family: var(--font-mono); font-size: 0.9em; background: var(--code-bg); padding: 1px 5px; border-radius: 4px; }
pre { background: var(--code-bg); padding: 1rem; border-radius: var(--radius); overflow-x: auto; box-shadow: var(--shadow); }
pre code { background: transparent; padding: 0; }
.badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: none; letter-spacing: 0.01em; }
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
th { background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 0.85rem; letter-spacing: 0.01em; }
tr:last-child td { border-bottom: none; }
.table-scroll { overflow-x: auto; }
.doc-header { padding-top: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1rem; background: var(--bg); }
@media (min-width: 768px) { .doc-header { position: sticky; top: 0; z-index: 10; backdrop-filter: blur(6px); } }
.doc-meta { color: var(--text-muted); font-size: 0.9rem; margin: 0.25rem 0; }
.doc-tldr { font-size: 1.05rem; color: var(--text); border-left: 3px solid var(--accent); padding: 0.25rem 0 0.25rem 0.75rem; margin: 0.5rem 0 0.75rem; font-style: italic; }
.breadcrumb { font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 0; }
.breadcrumb strong { color: var(--text); font-weight: 600; }
.breadcrumb a { color: var(--accent); }
.breadcrumb .muted { color: var(--text-muted); opacity: 0.6; }
.breadcrumb .sep { padding: 0 0.35rem; color: var(--text-muted); }
nav.toc { padding-top: 1rem; padding-bottom: 1rem; }
nav.toc ol { columns: 2; column-gap: 1.5rem; padding-left: 1.25rem; }
nav.toc li { margin: 0.25rem 0; break-inside: avoid; display: flex; gap: 0.5rem; align-items: center; }
.toc-status { font-size: 0.7rem; padding: 1px 7px; }
.tldr { font-style: italic; color: var(--text-muted); border-left: 2px solid var(--border); padding: 0.15rem 0 0.15rem 0.6rem; margin: 0.25rem 0 1rem; }
.anchor-link { color: var(--text-muted); opacity: 0; font-weight: 400; font-size: 0.85em; transition: opacity 120ms; }
h2:hover .anchor-link, h2:focus-within .anchor-link { opacity: 1; }
@media (max-width: 768px) { .anchor-link { opacity: 0.5; } }
.progress-bar { position: sticky; top: 0; height: 3px; background: transparent; z-index: 11; }
@supports (animation-timeline: scroll()) {
  .progress-bar::before {
    content: ""; display: block; height: 100%; width: 100%;
    background: var(--accent); transform-origin: left center; transform: scaleX(0);
    animation: progress linear; animation-timeline: scroll(root);
  }
  @keyframes progress { to { transform: scaleX(1); } }
}
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
  .doc-header { position: static; }
}
@media print {
  body { background: white; color: black; }
  .doc-header { position: static; }
  .progress-bar { display: none; }
  nav.toc, .tabs > label, details summary { background: white !important; color: black !important; }
  a { color: black; text-decoration: underline; }
  .callout { break-inside: avoid; }
  svg.diagram { box-shadow: none; border: 1px solid #ccc; }
  .anchor-link { display: none; }
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
Each blocker becomes a `<div class="callout danger">` with a "Blocker —" prefix in `<strong>`. Manageable risks become `<div class="callout warn">` with a "Risk —" prefix. Accepted debt becomes `<div class="callout">` with an "Accepted —" prefix. Open questions become `<div class="callout">` with a "Question —" prefix. The visual hierarchy must match severity at a glance.

### Verdicts (SUMMARY_OF_COUNCIL)
Render the verdict as a top-of-section badge AND as the doc-level TL;DR sentence (per the glossary):
- PROCEED → `.badge-ok` "Verdict: proceed"
- PROCEED WITH ADJUSTMENTS → `.badge-warn` "Verdict: proceed with adjustments"
- REVISE BEFORE PROCEEDING → `.badge-danger` "Verdict: revise before proceeding"

### Per-advisor vote table (SUMMARY_OF_COUNCIL)
Render the "How each advisor voted" table with the Verdict column color-coded via `.badge-ok` / `.badge-warn` / `.badge-danger`. The "Held in debate?" column uses `.badge-ok` ("Held") or `.badge-status` ("Conceded"). Footer of the table links to the per-advisor markdown reports under `council/<ADVISOR>.md` (relative links — those files are markdown-only, no HTML companion).

### Diagrams (Mermaid in markdown → SVG in HTML)
SVG > ASCII > unicode-colored boxes. For every `mermaid` block in the source markdown, render an **inline SVG diagram** in the HTML — do not embed mermaid.js, do not link to mermaid.ink. Hand-author the SVG from the mermaid source:

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
Each slice is its own `<section>` with a heading like `T01 — [title]`. Inside: a small definition list for Touches / Reuses / Change / Verify, followed by the Gherkin block. The verify command goes in `<code>` so the user can copy it cleanly.

### Per-section approval status (BRAINSTORMING)
When sections are written one at a time with approval, mark each in the HTML with a small badge:
- Approved → `.badge-ok` reading "Approved"
- Pending → `.badge-status` reading "Pending review"
- Not approved → `.badge-warn` reading "Not approved yet"

### Reuse Map / New things created (TECHNICAL_SKETCH)
Render as tables wrapped in `.table-scroll`. In the "New things created" table, rows where `Exercised by slice` is empty get a `.badge-warn` "YAGNI risk" pill in that cell.

### Persona journeys (UX)
Each persona as its own `<section>` with a heading and a `.callout` summary block. The step table color-codes the State column: `.badge-ok` for success states, `.badge-warn` for friction/error states, `.badge-danger` for hard failures. Add a hand-authored inline SVG flow diagram per persona (entry → steps → success/error branches).

</rendering_rules>

<workflow>

The subagent's job, in order:

1. **Receive inputs.** Read `markdown_path`, `artifact_type`, `status_label`, `feature_slug`, `companion_index`, `html_path` from the spawning prompt.
2. **Read the markdown** at `markdown_path`. Treat its content as source of truth — do not paraphrase body content into the HTML.
3. **Render the HTML** following `<required_structure>`, applying `<ux_writing>` for header / breadcrumb / TL;DRs / read time, `<design_system>` for tokens and components, and `<rendering_rules>` for the per-artifact patterns. Compute word count and read-time from the rendered body text excluding `<pre>` and `<table>`.
4. **Write the file** at `html_path` using the Write tool. Do not touch `markdown_path`.
5. **Return one line**: `Wrote <html_path> (<N> sections, ~<M> min read)`. Nothing else.

When the markdown changes after user feedback, the caller re-spawns this subagent with the same inputs. The subagent overwrites the HTML — markdown and HTML never drift.

</workflow>

<anti_patterns>

- DON'T run this skill in the parent context. Always inside a spawned general-purpose subagent.
- DON'T link to remote stylesheets, fonts, or images. Self-contained means self-contained.
- DON'T embed mermaid.js or any other diagram runtime. Hand-author SVG.
- DON'T add JS frameworks. Use CSS-only tabs/accordions (the `.tabs` and `<details>` patterns above).
- DON'T duplicate content verbatim across sections — the HTML adds *visual* structure (diagrams, tables, badges, color) and *scaffolding* (TL;DRs, breadcrumb, read time); the body prose remains the markdown's wording.
- DON'T invent TL;DRs that aren't supported by the markdown content. If a section is empty, the TL;DR says so plainly.
- DON'T omit the breadcrumb (except when it's the very first artifact in the workflow and `companion_index` is empty).
- DON'T compute reading time from raw markdown character count — count words in the rendered HTML body text excluding `<pre>` and table cells.
- DON'T regenerate HTML before the markdown is approved. The HTML reflects approved state, not in-progress drafts.
- DON'T add company branding or logos unless the user explicitly attached them — keep the design neutral.
- DON'T use HTML where markdown is the input (e.g., a council-execute agent reading PLAN.md). Agents read markdown; HTML is for humans only.
- DON'T emit HTML for per-agent intermediate reports (`research/<slug>.md`, `council/<ADVISOR>.md`, `council/DEBATE.md`). Only the six synthesized files (BRAINSTORMING, RESEARCH, TECHNICAL_SKETCH, UX, PLAN, SUMMARY_OF_COUNCIL) get HTML companions.

</anti_patterns>
