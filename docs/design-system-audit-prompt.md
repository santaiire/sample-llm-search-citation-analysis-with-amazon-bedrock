# Design System Audit Prompt

A reusable prompt for auditing any React component (or batch of
components) in this repo against the rules captured in
[`docs/design-system.md`](./design-system.md). Use it whenever you
want a focused review of light / dark mode coverage, theming
correctness, or anomalies introduced by new code.

The prompt is designed to be:

- **Self-contained** – it tells the auditor what to read and what
  rules to apply.
- **Actionable** – every finding maps to a concrete fix, not a vague
  "could be better".
- **Strict but proportionate** – distinguishes real bugs from
  documented intentional exceptions.

---

## How to use

1. Decide the audit scope (single file, feature folder, full
   codebase – see "Scope" below).
2. Paste the prompt block below into a fresh AI assistant session,
   replacing `{{TARGET}}` with the file paths or glob to audit.
3. Provide the assistant with read access to `docs/design-system.md`
   and the target files. The prompt assumes the doc is the source
   of truth.
4. Review the produced report. Apply the proposed fixes through a
   normal PR.

> The prompt does **not** authorise the assistant to modify code on
> its own. It returns a structured findings report; the human (or a
> follow-up implementation prompt) decides what to fix.

---

## Prompt

> Copy everything between the fence below into the audit session.

````
You are auditing a React 18 + Tailwind CSS 3 codebase that uses a
class-based dark-mode strategy (`darkMode: 'class'` in
`tailwind.config.js`). The design system rules you must enforce are
documented in `docs/design-system.md` – read it before producing any
findings. Treat it as the source of truth: if something contradicts
what you would normally recommend, follow the doc.

## Scope

Audit only these files / globs:

  {{TARGET}}

For each file, evaluate it against every rule below. Do not modify
any files; produce a structured report only.

## What to check

For every file in scope, walk through these checks in order. Cite
the design-system section in parentheses for each finding so the
reader can confirm against the spec.

### 1. Theming model (§1)

- [ ] No hand-rolled `dark:` variant for a class that is already in
      the global override list (§1.2.1 + §1.2.2). Examples:
      `dark:bg-gray-800` on top of `bg-white`, `dark:bg-emerald-900/20`
      on top of `bg-emerald-50`. The override should do the work.
- [ ] On always-dark surfaces (sidebar, app rail, modal headers,
      fallback error screens, anything in `App.tsx` chrome), explicit
      `dark:` variants are present and correct.
- [ ] No reliance on the deprecated escape hatch
      `document.documentElement.classList.contains('dark')`. Use
      `useTheme().isDark`.

### 2. Colour palette (§2)

- [ ] Component uses Tailwind tokens, not hardcoded hex / rgb / rgba
      values in JSX, except inside Chart.js datasets (§7.5) and the
      few documented inline-style call sites (`KeywordDetailComponents`
      provider colour swatches).
- [ ] Accent surfaces follow the canonical pairing
      `bg-{tone}-50 text-{tone}-700` or `bg-{tone}-100 text-{tone}-800`
      with optional `border-{tone}-200`.
- [ ] No two accent tones mixed in the same component (Brand
      sections deliberately use emerald/amber/violet to differentiate
      first-party / competitor / custom – this is allowed; copying
      the pattern elsewhere is not).
- [ ] Saturated solids (`bg-{tone}-500/600/700`) appear only on
      primary action buttons paired with `text-white`.

### 3. Typography (§3)

- [ ] Page titles, section titles, body text, helper text, captions
      all use the canonical scale.
- [ ] Numeric stats use `text-3xl font-semibold` only on stat-card
      surfaces.
- [ ] AI markdown output is rendered through `.prose-markdown` (or
      via `MarkdownProcessor`), not custom typography.

### 4. Buttons (§5)

- [ ] Every button is the shared `<Button>` component. Hand-rolled
      `className="px-4 py-2 bg-gray-900 text-white …"` strings are
      a finding.
- [ ] Icon-only buttons (`variant="iconOnly"`) carry `aria-label`
      and a `title`.
- [ ] No more than one `variant="primary"` button in any visible
      group.
- [ ] Disabled states use the component's built-in opacity, not
      ad-hoc `disabled:opacity-50` strings.
- [ ] Buttons sitting on always-dark surfaces use `invertOnDark`
      where required.

### 5. Icons (§6)

- [ ] No emoji used as button labels, action icons, or expand /
      collapse affordances.
- [ ] No unicode arrows / symbols (`▲▼◀▶✕→✓⚠️🌍`) used as UI
      glyphs. The two documented exceptions are decorative emoji in
      the About tabs and a single `✓` inside a native `<select>`
      `<option>` in `PromptEditor.tsx` (browsers do not render React
      children inside `<option>`).
- [ ] All new icons live in `components/ui/Icons.tsx`, follow the
      stroke convention (24×24 viewBox, `currentColor`,
      `strokeWidth={1.5}`), and inherit colour from their parent's
      `text-*` class.

### 6. Charts (§7.5)

- [ ] Components rendering Chart.js use `useTheme()` and
      `getChartTheme(isDark)` from `components/ui/chartTheme.ts` to
      colour ticks, grid, legend, and tooltip.
- [ ] Imperative chart usage (`new Chart(ctx, …)`) includes `isDark`
      in the `useEffect` dependency array so the chart re-renders on
      theme toggle.
- [ ] Neutral data series (gray-only doughnuts / bars) have
      separate light- and dark-mode dataset palettes – no
      `gray-900` slice on a dark page.
- [ ] Saturated branded palettes (e.g. provider colours from
      `KeywordDetailComponents.tsx`) stay fixed across themes – do
      not flag as a finding.

### 7. Images (§7.6)

- [ ] User-supplied screenshots and arbitrary captured images carry
      `dark:brightness-90 dark:contrast-95`.
- [ ] Profile photos of real people, the sidebar brand mark, and
      decorative SVG icons do **not** carry the dim filter.
- [ ] No `<img>` introduced where an SVG icon from the shared set
      would be appropriate.

### 8. Forms (§8)

- [ ] Labels are paired with inputs via `htmlFor` / `id`.
- [ ] Inputs / textareas / selects use the canonical
      `w-full p-2 border border-gray-200 rounded-lg text-sm
      focus:ring-2 focus:ring-gray-900` (dark mode handled
      globally).
- [ ] Helper text uses `text-xs text-gray-400 mt-1`.
- [ ] Validation errors use `text-xs text-red-600 mt-1` (overridden
      to `red-300` on dark via the global accent override).

### 9. Tables (§9)

- [ ] Header row: `bg-gray-50` + `text-xs font-medium uppercase
      tracking-wider text-gray-500`.
- [ ] Cells: `px-6 py-4` padding.
- [ ] Sortable columns include a chevron icon and `aria-sort`.
- [ ] Expandable rows use `ChevronRightIcon` / `ChevronDownIcon`
      with `aria-expanded`.

### 10. Anomaly checklist (§11)

Run the entire §11 checklist literally. Flag any item the file
violates.

### 11. Per-page coverage (§7.1)

If the audited file maps to a page in the §7.1 catalogue, confirm
the page's "Theme support" status still holds. If any new code in
the file would change "✓ auto" to needing explicit `dark:`
variants, call that out explicitly so the catalogue can be updated.

## Output format

Produce a Markdown report with this structure:

```markdown
# Design System Audit – {{TARGET}}

## Summary

- Files audited: <n>
- Findings: <n total>  (<n blocking>, <n nit>, <n exception>)
- Pages affected: <list>

## Findings

### {{file path}}

- **[BLOCKING] §<section>** – <one-line description of the issue>
  - Where: line <n> – <code excerpt>
  - Why it's a problem: <one sentence>
  - Suggested fix: <concrete change, ideally a diff>

- **[NIT] §<section>** – ...

- **[EXCEPTION] §<section>** – Documented intentional deviation; no
  action required. Briefly note why it's allowed.

## Cross-cutting observations

(Optional. Patterns repeated across files, candidate refactors,
docs updates the design-system.md should pick up.)

## Verification commands

If applying fixes, run these to confirm the audit pass:

  cd web && npm run type-check
  cd web && npm test -- --run
  cd web && npm run build
  npx eslint <touched files>
```

## Severity guidance

- **BLOCKING** – Real dark-mode bug, accessibility issue, or hard
  rule from the doc (e.g. emoji as a UI glyph). Must be fixed
  before merge.
- **NIT** – Style / consistency improvement (e.g. could use the
  shared `<Button>` instead of hand-rolled classes). Worth fixing
  but not a blocker.
- **EXCEPTION** – Apparent violation that the design system
  explicitly allows (e.g. About tab decorative emoji,
  `PromptEditor` `<option>` checkmark, profile photos staying
  unchanged in dark mode). Do not propose a fix; just confirm the
  exception applies.

## Ground rules

- Quote line numbers and code excerpts. Vague findings without
  evidence are not useful.
- If something looks off but is not covered by the design-system
  doc, flag it under "Cross-cutting observations" and propose
  whether the doc should be updated.
- Do not propose visual redesigns outside the spec. The prompt is
  about conforming code to the existing design system, not about
  re-imagining it.
- Do not modify any files. Output the report only.
````

---

## Scope presets

Pick a preset for `{{TARGET}}` based on what you want to audit:

| Preset | Glob | When to use |
| ------ | ---- | ----------- |
| Single file | `web/src/components/<Feature>/<File>.tsx` | Reviewing a specific change. |
| Single feature folder | `web/src/components/<Feature>/**/*.tsx` | Reviewing one feature end-to-end. |
| One page (route) | The components listed for that page in design-system §7.1 | Auditing one route in both themes. |
| All shared primitives | `web/src/components/ui/**/*.{ts,tsx}` and `web/src/components/shared/**/*.tsx` | Verifying primitives stay theme-aware. |
| All chart components | `web/src/components/**/*Chart*.tsx`, `web/src/components/**/*ChartOptions*.ts` | After Chart.js / `chartTheme.ts` changes. |
| Full app | `web/src/components/**/*.{ts,tsx}` plus `web/src/App.tsx`, `web/src/main.tsx` | Pre-release sweep. |

---

## Example invocation

```
{{TARGET}} = web/src/components/Brands/**/*.tsx
```

Produces a report listing every Brand-related file and its findings,
grouped by file. Useful if a future change to brand settings or
brand mentions needs a focused dark-mode validation.

---

## Tips for accurate audits

- Re-read the §11 anomaly checklist before starting; it is the
  fastest way to catch known regressions.
- When in doubt about whether a class is in the global override
  list, grep `web/src/index.css` for the exact selector.
- The file `docs/design-system.md` ends with §11.1 "Recently fixed
  anomalies" – use it to recognise patterns the codebase has
  already burned itself on and not flag the resolved cases.
- The audit is intentionally not a code-quality audit. Off-topic
  findings (e.g. cognitive complexity, missing tests) belong in a
  separate review, not here.
