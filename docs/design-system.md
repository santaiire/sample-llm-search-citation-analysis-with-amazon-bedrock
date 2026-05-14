# Design System

Visual language for the Citation Analysis dashboard. This document is the
source of truth for colours, typography, spacing, components, icons, and
the dark/light theming strategy. It exists so contributors can build new
UI without inventing styles, and so reviewers have a checklist for
catching anomalies.

> **Stack:** Tailwind CSS 3 (`darkMode: 'class'`), React 18, no icon
> library, no component library beyond AWS Amplify Authenticator. All
> primitives live under `web/src/components/ui/`.

---

## 1. Theming model

### 1.1 Strategy

The app is class-based: dark mode is enabled by adding the class `dark`
to `<html>`. Theme preference is managed by `useTheme` (`light` /
`dark` / `system`) and toggled via the `ThemeToggle` button.

There are two ways a Tailwind class can become "dark-mode aware":

1. **Explicit `dark:` variant** – e.g. `bg-white dark:bg-gray-800`.
   Used in layout chrome (sidebar, header, fallback error screens) and
   anywhere we deliberately need a different colour in dark mode.
2. **Global override** – common Tailwind classes (`bg-white`,
   `bg-gray-50`, `text-gray-900`, `border-gray-200`, …) are remapped
   inside `web/src/index.css` under the `.dark` selector. This means
   most components do not need `dark:` variants at all.

> **Rule of thumb:** if your class is in the global override list below,
> do not add a `dark:` variant; trust the override. Only reach for
> `dark:` when a component sits on a surface where the global override
> is wrong (e.g. always-dark error fallbacks, gradient backgrounds, the
> primary action rail in `main.tsx` and `TabContent.tsx`).

### 1.2 Globally overridden classes

Defined in `web/src/index.css`:

| Light class            | Dark replacement |
| ---------------------- | ---------------- |
| `bg-white`             | gray-800         |
| `bg-gray-50`           | gray-900         |
| `bg-gray-100`          | gray-700         |
| `border-gray-200`      | gray-700         |
| `border-gray-100`      | gray-700         |
| `text-gray-900`        | gray-50          |
| `text-gray-700`        | gray-300         |
| `text-gray-600`        | gray-300         |
| `text-gray-500`        | gray-400         |
| `text-gray-400`        | gray-500         |
| `text-gray-300`        | gray-400         |
| `hover:bg-gray-50`     | gray-700         |
| `hover:bg-gray-100`    | gray-600         |
| `hover:bg-gray-200`    | gray-600         |
| `input/textarea/select` background, border, placeholder, focus ring | gray-700/-600/-400/-500 |

Markdown prose styles (`.prose-markdown`) and AWS Amplify Authenticator
have their own dark overrides in the same file.

### 1.3 CSS variables

The body uses two semantic tokens that switch with the theme:

```css
:root        { --color-bg-primary: 249 250 251; --color-text-primary: 17 24 39;  }
.dark        { --color-bg-primary: 17 24 39;     --color-text-primary: 249 250 251; }
```

These are exposed as `bg-skin-primary` / `text-skin-primary` utilities
for the body element only. Component-level styling uses Tailwind colour
utilities directly, not these variables.

---

## 2. Colour palette

### 2.1 Neutral scale (primary surface system)

| Token           | Light      | Dark equivalent (via override) |
| --------------- | ---------- | ------------------------------ |
| Background      | `gray-50`  | `gray-900` |
| Surface         | `white`    | `gray-800` |
| Surface raised  | `gray-100` | `gray-700` |
| Border          | `gray-200` | `gray-700` |
| Text primary    | `gray-900` | `gray-50`  |
| Text secondary  | `gray-600` | `gray-300` |
| Text muted      | `gray-400` | `gray-500` |
| Action primary  | `gray-900` | (kept dark; see Buttons) |

### 2.2 Accent palette

Accents are used sparingly: navigation icon tints, stat card badges,
status pills, and feedback states.

| Tone    | Usage                            | Tailwind family |
| ------- | -------------------------------- | --------------- |
| Blue    | Searches, info, neutral metrics  | `blue-*`        |
| Indigo  | Visibility metrics               | `indigo-*`      |
| Violet  | Brand mentions, citation counts  | `violet-*`      |
| Purple  | Citations                        | `purple-*`      |
| Fuchsia | Prompt insights                  | `fuchsia-*`     |
| Rose    | Citation gaps                    | `rose-*`        |
| Emerald | Success, "you", crawled pages    | `emerald-*` / `green-*` |
| Amber   | Warnings, keyword counts         | `amber-*` / `yellow-*` |
| Red     | Errors, destructive actions      | `red-*`         |
| Sky     | Recent searches                  | `sky-*`         |
| Slate   | Raw responses, low emphasis      | `slate-*`       |
| Teal    | Content studio                   | `teal-*`        |
| Orange  | Schedule                         | `orange-*`      |

Pattern for badges and pills: `bg-{tone}-50 text-{tone}-700`
(`bg-{tone}-100` for stronger emphasis). Avoid mixing two accents in
the same component.

### 2.3 Semantic state colours

| State    | Background     | Text          | Border         |
| -------- | -------------- | ------------- | -------------- |
| Success  | `bg-green-50`  | `text-green-700` | `border-green-200` |
| Warning  | `bg-yellow-50` | `text-yellow-800` | `border-yellow-200` |
| Error    | `bg-red-50`    | `text-red-700` | `border-red-200` |
| Info     | `bg-blue-50`   | `text-blue-700` | `border-blue-200` |

---

## 3. Typography

The app uses the system font stack inherited from Tailwind defaults.

| Role            | Class                                  |
| --------------- | -------------------------------------- |
| Page title (h2) | `text-2xl font-semibold text-gray-900` |
| Section title (h3) | `text-lg font-semibold text-gray-900` |
| Card label      | `text-sm font-medium text-gray-700`    |
| Body            | `text-sm text-gray-600`                |
| Helper / caption| `text-xs text-gray-400`                |
| Numeric stat    | `text-3xl font-semibold text-gray-900` |
| Section label   | `text-xs font-semibold uppercase tracking-wider text-gray-400` |

> Markdown prose (AI responses, content studio output) uses the
> `.prose-markdown` class which has its own typographic scale defined
> in `index.css`. Do not re-style markdown output; extend
> `.prose-markdown` instead.

---

## 4. Spacing and layout

- The grid uses Tailwind's default 4 px base.
- Standard card padding: `p-6` (24 px) on desktop, `p-4` on dense lists.
- Standard gap between cards: `gap-4` to `gap-6`.
- Section margin between blocks: `mb-6 sm:mb-8`.
- Sidebar width: `w-64` (256 px), top bar height: `h-16` (64 px).
- Page content max width is unconstrained – it fills the viewport
  minus the sidebar, so internal widgets must remain readable up to
  ultra-wide displays.

Border radius: `rounded-lg` (8 px) is the default for cards, inputs,
and buttons. Larger surfaces (icon badges, modals) use `rounded-xl`.
Pills use `rounded-full`.

Borders are 1 px (`border`) and use the neutral border tokens above.

---

## 5. Buttons

Use the `<Button>` component from `web/src/components/ui/Button.tsx`.
Do not hand-roll button class strings.

### 5.1 Variants

| Variant      | When to use | Visual |
| ------------ | ----------- | ------ |
| `primary`    | The main action of a page or form. Only **one** primary per visible group. | `bg-gray-900 text-white hover:bg-gray-800` |
| `secondary`  | Alternate actions of equal weight. | `bg-white text-gray-900 border border-gray-200 hover:bg-gray-50` |
| `ghost`      | Tertiary actions, cancel buttons, links inside dense rows. | `text-gray-600 hover:text-gray-900 hover:bg-gray-100` |
| `danger`     | Destructive primary actions inside confirmation dialogs. | `bg-red-600 text-white hover:bg-red-700` |
| `iconOnly`   | Square button hosting only an icon (toolbar / list-row actions). Always provide `aria-label`. | `text-gray-400 hover:text-gray-600 hover:bg-gray-100` |

### 5.2 Sizes

| Size | Height | When to use |
| ---- | ------ | ----------- |
| `sm` | ~32 px (`px-3 py-1.5`) | Inside dense rows, table cells, list-row actions. |
| `md` | ~36-40 px (`px-4 py-2`, default) | Standard page-level actions. |

### 5.3 Composition

Use `leadingIcon` / `trailingIcon` props instead of hand-placing icons:

```tsx
<Button
  leadingIcon={<PlusIcon className="w-4 h-4" />}
  onClick={() => setShowCreate(true)}
>
  New Persona
</Button>
```

Disabled state: pass `disabled`. The component applies `opacity-50` and
`cursor-not-allowed` automatically. For loading, swap children for a
loading label (`'Saving…'`) – do not introduce custom spinners on
primary buttons.

### 5.4 Dark-mode inversion

`primary` buttons rely on the global override system, so
`bg-gray-900 / hover:bg-gray-800` works in both themes. For buttons
that sit on always-dark surfaces in light mode (the app rail,
fallback error screens), set `invertOnDark` so the dark theme inverts
them to a light pill (`dark:bg-gray-100 dark:text-gray-900`).

```tsx
<Button invertOnDark onClick={reload}>Reload Page</Button>
```

### 5.5 Anti-patterns

- Inline `className="px-4 py-2 bg-gray-900 text-white …"` strings.
  Use `<Button>` so the design system stays consistent.
- Mixing sizes in the same row.
- More than one primary button visible at once.
- `iconOnly` button without `aria-label` / `title`.

---

## 6. Icons

### 6.1 Source and style

We ship our own icon set instead of pulling a library. Icons live in
`web/src/components/ui/Icons.tsx` and follow a single Heroicons-style
convention:

- 24 × 24 viewBox.
- Stroke only, `fill="none"`, `stroke="currentColor"`.
- `strokeLinecap="round"`, `strokeLinejoin="round"`,
  `strokeWidth={1.5}`.
- Default size `w-5 h-5` (20 px), sized via the `className` prop.
- Colour is inherited from `currentColor`, so place the icon inside an
  element whose `text-*` colour you want.

Available icons: `PauseIcon`, `PlayIcon`, `PencilIcon`, `TrashIcon`,
`PlusIcon`, `CloseIcon`, `ChevronRightIcon`, `ChevronDownIcon`,
`SearchIcon`, `LinkIcon`, `GlobeIcon`, `KeyIcon`, `WarningIcon`.

The sidebar (`Layout/Sidebar.tsx`) has a separate set of inline icons
(`DashboardIcon`, `BrandIcon`, `CitationsIcon`, …). They follow the
same convention; consolidating them into `Icons.tsx` is a future
refactor.

### 6.2 Adding a new icon

1. Pick or trace a Heroicons outline path.
2. Add a function component to `Icons.tsx` matching the existing
   pattern (props: `className`, `title`).
3. Re-export it from `components/ui/index.ts`.
4. Use it via `<MyIcon className="w-4 h-4" />`.

### 6.3 Sizing reference

| Context | Class |
| ------- | ----- |
| Inline with body text | `w-3 h-3` or `w-3.5 h-3.5` |
| Icon-only buttons     | `w-4 h-4` |
| Sidebar nav items     | `w-5 h-5` |
| Stat card badges      | `w-6 h-6` |
| Empty-state illustrations | `w-12 h-12` |

### 6.4 Accessibility

- Decorative icons need no label; the wrapping `<svg>` defaults to
  `aria-hidden`.
- When the icon is the only visible content (icon-only buttons,
  sidebar collapse, expand chevrons that double as the click
  target), the host element must carry `aria-label` and the icon's
  `title` prop should be set or the host element should have a
  `title` attribute.
- Use `aria-expanded` on disclosure buttons that toggle a chevron.

### 6.5 No emoji as UI

Emoji are not used as UI affordances anywhere. Reasons:

1. Inconsistent rendering across operating systems.
2. No way to recolour for dark mode or hover states.
3. Screen readers announce the unicode name, not the action.

The only places emoji appear are decorative content **inside** the
About section (`components/About/ArchitectureTab.tsx`,
`components/About/LicensesTab.tsx`) where they label conceptual
sections, not interactive controls. Treat that as the ceiling for
emoji usage.

---

## 7. Components inventory

### 7.1 Primitives (`components/ui/`)

| Component       | Purpose |
| --------------- | ------- |
| `Button`        | Canonical button. Variants + sizes. Use everywhere. |
| `Modal`, `ConfirmModal`, `AlertModal` | Overlays with focus trap and escape handling. |
| `Spinner`       | Loading indicator (`sm`/`md`/`lg`). |
| `ThemeToggle`   | Light / dark / system theme switcher. |
| `Icons.tsx`     | Shared SVG icon set. |
| `MarkdownProcessor` | Helpers for rendering AI markdown safely. |

### 7.2 Layout

`components/Layout/Sidebar.tsx` is the only navigation chrome. It owns
nav sections, badges, and the "running" pulse indicator. New top-level
features should be added there as a new entry, not as a new chrome
component.

### 7.3 Feature components

Organised by feature folder under `components/<Feature>`. Each feature
folder has an `index.ts` that re-exports its public surface. Internal
components keep `*.spec.tsx` next to the file. See
`.kiro/steering/structure.md` for the layout map.

---

## 8. Forms

- Wrap form fields in `<form>` and submit via a `primary` button.
- Labels: `block text-sm font-medium text-gray-700 mb-1` paired via
  `htmlFor` / `id`.
- Inputs / textareas / selects: `w-full p-2 border border-gray-200
  rounded-lg text-sm focus:ring-2 focus:ring-gray-900`. Dark-mode
  styling is applied globally.
- Helper text under inputs: `text-xs text-gray-400 mt-1`.
- Validation errors: `text-xs text-red-600 mt-1`.
- Cancel buttons live to the right of the submit button and use the
  `ghost` variant.

---

## 9. Tables

- Header row: `bg-gray-50` background, `text-xs font-medium uppercase
  tracking-wider text-gray-500`.
- Cell padding: `px-6 py-4`.
- Row separators: `divide-y divide-gray-200`.
- Sortable columns use a chevron icon next to the label and toggle
  `aria-sort`.
- Expandable rows use `ChevronRightIcon` (collapsed) and
  `ChevronDownIcon` (expanded), wrapped in a button with
  `aria-expanded`.

---

## 10. Favicon and identity

- App favicon: `web/public/assets/favicon.ico` (32×32 ICO).
- App name: "Citation Analysis Dashboard" (`web/index.html` `<title>`).
- Logo mark in sidebar: an inline bar-chart SVG inside an
  `bg-gray-900 dark:bg-white` rounded square (32×32).

If a new favicon is needed, replace `favicon.ico` and add modern
formats (`favicon.svg`, `apple-touch-icon.png`) referenced from
`web/index.html`. Keep the silhouette legible at 16×16.

---

## 11. Anomaly checklist

Use this list during code review of any UI change. Every item is a
real anomaly that has been fixed in the codebase – don't reintroduce
them.

- [ ] No emoji as a button label or interactive icon. Use icons from
      `components/ui/Icons.tsx`.
- [ ] No unicode arrows (`▲▼◀▶`) for expand/collapse. Use
      `ChevronDownIcon` / `ChevronRightIcon`, with `aria-expanded` on
      the button.
- [ ] No hand-rolled `className="px-4 py-2 bg-gray-900 …"` button
      strings. Use `<Button>`.
- [ ] No icon-only button missing `aria-label` / `title`.
- [ ] No hard-coded hex colours. Use Tailwind tokens.
- [ ] No mixed sizes in the same button group / list row.
- [ ] No new `dark:` variants for classes already covered by the
      global override (`bg-white`, `text-gray-900`, …).
- [ ] No `dark:` variants forgotten on always-dark surfaces (app rail,
      fallback error screens).
- [ ] No emoji-as-key prop signatures (e.g. `icon: '🔍'` mapping into
      a switch). Take a `ReactNode` icon component instead.
- [ ] All new icons follow the stroke convention: 24 × 24 viewBox,
      `currentColor`, `strokeWidth={1.5}`.
- [ ] No primary button without `transition-colors` (provided by
      `<Button>` automatically).
- [ ] No two primary buttons in the same visible group.

### 11.1 Recently fixed anomalies (May 2026)

For reference – these were the anomalies discovered during the
design-system pass:

| Component | Issue | Fix |
| --------- | ----- | --- |
| `Settings/QueryPromptsManager.tsx` | Emoji icons (`⏸▶✏️🗑`) on action buttons; non-canonical button styling for "+ New Persona". | Replaced with `PauseIcon`/`PlayIcon`/`PencilIcon`/`TrashIcon`. Buttons migrated to `<Button>` primary/ghost/iconOnly variants. |
| `Dashboard/StatCard.tsx` | `icon` prop typed as a `string` (emoji) and used as a key into an SVG lookup map – unrelated emoji silently fell back to a literal emoji render. | Refactored to take a `ReactNode` icon directly plus a `tone` prop (blue/violet/emerald/amber/gray). Call site `Layout/TabContent.tsx` updated to pass `SearchIcon`/`LinkIcon`/`GlobeIcon`/`KeyIcon`. |
| `Tables/TopCitationsTable.tsx`, `Keywords/KeywordDetailComponents.tsx`, `Brands/ProviderResponseCard.tsx` | Unicode `▲▼▶` for expand/collapse. | Replaced with `ChevronDownIcon` / `ChevronRightIcon`, plus `aria-expanded` and `aria-label` on the controls. |
| `Brands/BrandExpansionPanel.tsx` | `⚠️` emoji on duplicate-warning text. | Replaced with `WarningIcon`. |

---

## 12. Where to put new design system code

```
web/src/components/ui/
├── Button.tsx          # button variants + sizes
├── Icons.tsx           # shared icon set
├── Modal.tsx           # overlays
├── Spinner.tsx         # loading
├── ThemeToggle.tsx     # theme switcher
├── MarkdownProcessor.tsx
└── index.ts            # public re-exports
```

When in doubt, add the primitive here and re-export it from
`index.ts`. Feature folders should consume primitives, not redefine
them.
