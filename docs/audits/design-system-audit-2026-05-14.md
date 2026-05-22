# Design System Audit – Full App

**Date:** 2026-05-14
**Branch:** `feat/design-system-normalization`
**Spec:** `docs/design-system.md`

## Summary

- Files audited: 70
- Findings: 62 (2 blocking, 42 nit, 18 exception)
- Pages affected: Dashboard, Visibility, Brand Mentions, Citations, Prompt Insights, Citation Gaps, Action Center, Keyword Research, Content Studio, Recent Searches, Raw Responses, Run Analysis, Schedule, Settings

## Findings

### Chrome & Shell

#### `web/src/main.tsx`

- **[NIT] §5** – Hand-rolled button on always-dark fallback surface instead of `<Button invertOnDark>`
  - Where: line 27 – `className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 ..."`
  - Why: The shared `<Button>` component with `invertOnDark` provides the same styling with less duplication.
  - Suggested fix: `<Button invertOnDark onClick={() => window.location.reload()}>Reload Page</Button>`

- **[EXCEPTION] §1** – Explicit `dark:` variants on always-dark fallback surface
  - Where: lines 9–27 – `dark:bg-gray-900`, `dark:bg-gray-800`, `dark:border-gray-700`, etc.
  - Why: §1 documents that always-dark surfaces (fallback error screens) require explicit `dark:` variants. Correct.

#### `web/src/App.tsx`

- **[EXCEPTION] §1** – Explicit `dark:` variants on Login, Loading, and error states
  - Where: lines 61, 65, 106, 109, 188, 197 – `dark:bg-gray-900`, `dark:text-gray-400`, `dark:text-red-400`
  - Why: These are full-page chrome surfaces that need explicit dark treatment per §1. Correct.

- **[EXCEPTION] §2** – `dark:text-red-400` on error text
  - Where: line 197 – `className="text-xl text-red-600 dark:text-red-400"`
  - Why: This is on an always-dark error surface; the global accent override would produce `red-300` which is too light for this context. Intentional deviation.

#### `web/src/components/Layout/Sidebar.tsx`

- **[EXCEPTION] §1** – Explicit `dark:` variants throughout sidebar
  - Where: lines 271, 275, 278, 288, 301 – `dark:bg-gray-800`, `dark:border-gray-700`, `dark:text-gray-900`, etc.
  - Why: Sidebar is always-dark chrome per §7.1 table. Correct.

#### `web/src/components/Layout/TabContent.tsx`

- **[NIT] §5** – Hand-rolled button in QuickActions "Run Analysis"
  - Where: line 102 – `className="px-3 sm:px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 ..."`
  - Why: Should use `<Button invertOnDark>` since it sits on a surface that needs dark inversion.
  - Suggested fix: `<Button invertOnDark leadingIcon={<PlayIcon />} onClick={() => setActiveTab('execution')}>Run Analysis</Button>`

- **[NIT] §5** – Three hand-rolled secondary buttons in QuickActions
  - Where: lines 108, 113, 118 – `className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-900 ..."`
  - Why: Should use `<Button variant="secondary">`.
  - Suggested fix: Replace with `<Button variant="secondary" onClick={...}>View Brand Mentions</Button>`


### UI Primitives

#### `web/src/components/ui/Button.tsx`

- **[EXCEPTION] §1** – `dark:` variants in `invertOnDark` branch
  - Where: line 67 – `'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'`
  - Why: §5.4 documents that `invertOnDark` is the mechanism for buttons on always-dark surfaces. Correct.

#### `web/src/components/ui/Modal.tsx`

- **[EXCEPTION] §1** – Explicit `dark:` variants on modal chrome
  - Where: lines 59, 62, 67, 73, 125 – `dark:bg-gray-800`, `dark:border-gray-700`, `dark:text-gray-100`, etc.
  - Why: §7.1 documents modals need explicit `dark:` treatment. Correct.

- **[NIT] §5** – `ConfirmModal` uses hand-rolled button classes instead of `<Button>`
  - Where: line 128 – cancel button: `className="px-4 py-2 bg-gray-100 dark:bg-gray-700 ..."`
  - Where: line 133 – confirm button: `className={...px-4 py-2...${confirmButtonClass}}`
  - Why: Should use `<Button variant="ghost">` for cancel and `<Button variant="primary">` or `<Button variant="danger">` for confirm.
  - Suggested fix: Import and use `<Button>` component.

- **[NIT] §5** – `AlertModal` uses hand-rolled button class
  - Where: line 175 – `className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 ..."`
  - Why: Should use `<Button invertOnDark>`.

#### `web/src/components/ui/Spinner.tsx`

- No findings. Uses `currentColor` inheritance correctly.

#### `web/src/components/ui/ThemeToggle.tsx`

- **[EXCEPTION] §1** – Explicit `dark:` variants
  - Where: line 40 – `dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700`
  - Why: §7.1 documents ThemeToggle needs explicit `dark:` treatment. Correct.

#### `web/src/components/ui/Icons.tsx`

- No findings. All icons follow 24×24 viewBox, `currentColor`, `strokeWidth={1.5}` convention per §6.1.

#### `web/src/components/ui/chartTheme.ts`

- **[EXCEPTION] §2** – `rgb()`/`rgba()` colour values
  - Where: lines 25–29, 33–37 – hardcoded rgb/rgba values
  - Why: §7.5 documents that Chart.js chrome colours must be specified as raw values since canvas doesn't use Tailwind. Correct.

#### `web/src/components/ui/MarkdownProcessor.tsx`

- **[EXCEPTION] §6** – `•` character in list prefix detection
  - Where: line 88 – `const listPrefixes = ['- ', '* ', '• ', ...]`
  - Why: This is parsing logic for markdown content, not a UI glyph. Correct.


### ErrorBoundary + ErrorDisplay

#### `web/src/components/ErrorBoundary/ErrorBoundary.tsx`

- **[NIT] §5** – Hand-rolled "Try Again" button
  - Where: line 72 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"`
  - Why: Should use `<Button>`. This sits on a light surface (bg-white card) so no `invertOnDark` needed.
  - Suggested fix: `<Button onClick={this.handleRetry}>Try Again</Button>`

#### `web/src/components/ErrorDisplay/ErrorDisplay.tsx`

- **[NIT] §5** – Hand-rolled "Try Again" button in CardError variant
  - Where: line 137 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"`
  - Why: Should use `<Button>`.
  - Suggested fix: `<Button onClick={onRetry}>Try Again</Button>`

### About Modal + Tabs

#### `web/src/components/About/AboutModal.tsx`

- No findings. Uses `<Modal>` correctly.

#### `web/src/components/About/AboutTab.tsx`

- No findings.

#### `web/src/components/About/ArchitectureTab.tsx`

- **[EXCEPTION] §6** – Emoji used as decorative content labels
  - Where: lines 26–51, 71 – `icon: '🔍'`, `icon: '🏷️'`, `icon: '📊'`, `👤 User`, etc.
  - Why: §6.5 explicitly documents that decorative emoji in About tabs are the allowed exception. Correct.

#### `web/src/components/About/LicensesTab.tsx`

- **[EXCEPTION] §6** – Emoji used as decorative content labels
  - Where: lines 92–117 – `icon: '🔍'`, `icon: '🏢'`, `icon: '📈'`, `icon: '🎯'`, `icon: '👁️'`
  - Why: §6.5 documented exception. Correct.

### Dashboard

#### `web/src/components/Dashboard/StatCard.tsx`

- No findings. Takes `ReactNode` icon + `tone` prop correctly per §11.1 fix.

#### `web/src/components/Dashboard/ProviderChart.tsx`

- **[EXCEPTION] §2** – `rgba()` dataset colours
  - Where: lines 41–44 – `'rgba(200, 162, 200, 0.85)'`, etc.
  - Why: §7.5 documents saturated branded palettes stay fixed across themes. Correct.

- Chart correctly uses `useTheme()` + `getChartTheme(isDark)` with `isDark` in `useEffect` deps (line 20, dep array includes `isDark`). ✓

#### `web/src/components/Dashboard/BrandChart.tsx`

- **[EXCEPTION] §2** – `rgba()` dataset colours with light/dark palettes
  - Where: lines 16–25 – `BRAND_PALETTE_LIGHT` and `BRAND_PALETTE_DARK`
  - Why: §7.5 documents neutral data series need separate light/dark palettes. Correctly implemented.

- Chart correctly uses `useTheme()` + `getChartTheme(isDark)` with `isDark` in `useEffect` deps. ✓


### Shared Tables

#### `web/src/components/Tables/TopCitationsTable.tsx`

- **[NIT] §5** – Hand-rolled "Export to Excel" button
  - Where: line 173 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button>`.

- **[NIT] §5** – Four hand-rolled pagination buttons with `disabled:opacity-50`
  - Where: lines 211, 218, 228, 235 – `className="px-2 sm:px-3 py-1 ... disabled:opacity-50 disabled:cursor-not-allowed"`
  - Why: Should use `<Button variant="ghost" size="sm">` for pagination.

- **[BLOCKING] §8** – `<select>` uses `focus:ring-2 focus:ring-blue-500` instead of canonical `focus:ring-gray-900`
  - Where: line 195 – `className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"`
  - Why: §8 specifies `focus:ring-2 focus:ring-gray-900` for all form inputs. Blue ring is non-canonical.
  - Suggested fix: Change `focus:ring-blue-500` to `focus:ring-gray-900`

- Expandable rows correctly use `ChevronDownIcon`/`ChevronRightIcon` with `aria-expanded` and `aria-label` (lines 284–285). ✓

#### `web/src/components/Tables/RecentSearchesTable.tsx`

- **[NIT] §5** – Hand-rolled "Retry Failed" button
  - Where: line 140 – `className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button size="sm">`.

- **[NIT] §5** – Hand-rolled "Export" button
  - Where: line 148 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button>`.

- **[NIT] §5** – Four hand-rolled pagination buttons with `disabled:opacity-50`
  - Where: lines 181–185 – `className="px-2 py-1 ... disabled:opacity-50"`
  - Why: Should use `<Button variant="ghost" size="sm">`.

- **[NIT] §9** – Table header uses `text-xs font-medium text-gray-500 uppercase` but missing `tracking-wider`
  - Where: line 195 – `className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"`
  - Why: §9 specifies `tracking-wider` on table headers.
  - Suggested fix: Add `tracking-wider` to each `<th>` className.

### Visibility

#### `web/src/components/Visibility/VisibilityDashboard.tsx`

- No findings. Uses global overrides correctly. ✓ auto confirmed.

#### `web/src/components/Visibility/VisibilityComponents.tsx`

- No findings. Indigo accent used correctly per §2.2.

#### `web/src/components/Visibility/PersonaComparisonChart.tsx`

- **[EXCEPTION] §2** – `rgba()`/`rgb()` dataset colours
  - Where: lines 71–72, 78–79 – `'rgba(16, 185, 129, 0.7)'`, `'rgb(239, 68, 68)'`, etc.
  - Why: §7.5 documents saturated branded palettes stay fixed. Correct.

- Chart uses `useTheme()` + `getChartTheme(isDark)` correctly (lines 27–28). ✓

#### `web/src/components/Personas/PersonaSelector.tsx`

- No findings.

#### `web/src/components/shared/PersonaSelector.tsx`

- No findings.


### Brands – Settings Core

#### `web/src/components/Brands/BrandsView.tsx`

- **[NIT] §5** – Hand-rolled "Configure Brand Tracking" button
  - Where: line 118 – `className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 self-start"`
  - Why: Should use `<Button>`.

- **[NIT] §5** – Hand-rolled filter toggle buttons (active state `bg-gray-900 text-white`)
  - Where: line 76 – `activeClass="bg-gray-900 text-white" inactiveClass="bg-gray-100 text-gray-700 hover:bg-gray-200"`
  - Why: These are tab-like toggles; while not exactly `<Button>`, the active state pattern could use the component.

#### `web/src/components/Brands/BrandConfigContent.tsx`

- **[NIT] §5** – Hand-rolled tab buttons and "Save Configuration" button
  - Where: lines 96–97 – tab buttons with `bg-gray-900 text-white` active state
  - Where: line 131 – `className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 ... disabled:opacity-50 ..."`
  - Why: Should use `<Button>` for the save action. Tab toggles are a grey area but the save button is clearly a primary action.

- **[BLOCKING] §8** – Labels in form fields lack `htmlFor`/`id` pairing
  - Where: Throughout the component – labels exist but are not paired with inputs via `htmlFor`/`id`.
  - Why: §8 requires labels paired via `htmlFor`/`id` for accessibility.
  - Suggested fix: Add `htmlFor` to labels and matching `id` to inputs.

#### `web/src/components/Brands/BrandConfigPanel.tsx`

- No findings.

#### `web/src/components/Brands/BrandTagList.tsx`

- No findings.

#### `web/src/components/Brands/DomainList.tsx`

- No findings.

#### `web/src/components/Brands/IndustrySelector.tsx`

- No findings.

#### `web/src/components/Brands/ExtractionOptions.tsx`

- No findings.

#### `web/src/components/Brands/FirstPartyBrandsSection.tsx`

- **[NIT] §5** – Hand-rolled "Expand Brands" button with `disabled:opacity-50`
  - Where: line 38 – `className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 ... disabled:opacity-50 ..."`
  - Why: This is a saturated solid action button (allowed per §2) but uses ad-hoc disabled styling instead of `<Button>`.

#### `web/src/components/Brands/CompetitorBrandsSection.tsx`

- **[NIT] §5** – Two hand-rolled buttons with `disabled:opacity-50`
  - Where: lines 59, 70 – amber-100 and amber-600 buttons
  - Why: Should use `<Button>` for consistent disabled handling.

#### `web/src/components/Brands/PromptEditor.tsx`

- **[EXCEPTION] §6** – `✓` unicode glyph inside `<option>`
  - Where: line 31 – `{preset.name}{industryPrompts[key] ? ' ✓' : ''}`
  - Why: §6.5 documents this as the ceiling for unicode glyph usage – browsers cannot render React components inside `<option>`. Correct.

### Brands – Mentions & Detail

#### `web/src/components/Brands/BrandExpansionPanel.tsx`

- **[NIT] §5** – Hand-rolled action button with `disabled:opacity-50`
  - Where: line 110 – `className={...px-4 py-2 ${colorScheme.bg} text-white ... disabled:opacity-50}`
  - Why: Should use `<Button>`.

#### `web/src/components/Brands/CompetitorDiscoveryPanel.tsx`

- **[NIT] §5** – Hand-rolled "Accept" button with `disabled:opacity-50`
  - Where: line 64 – `className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 ... disabled:opacity-50"`
  - Why: Should use `<Button variant="primary">` (or a custom amber variant).

#### `web/src/components/Brands/BrandMentionsTable.tsx`

- **[NIT] §5** – Three hand-rolled sort toggle buttons
  - Where: lines 66, 74, 82 – `sortBy === 'rank' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'`
  - Why: Tab-like toggles using hand-rolled active/inactive states.

#### `web/src/components/Brands/BrandOverviewTab.tsx`

- No findings. `•` used as text separator (not a UI glyph).

#### `web/src/components/Brands/BrandDetailModal.tsx`

- No findings. `•` used as text separator.

#### `web/src/components/Brands/ProviderResponseCard.tsx`

- Correctly uses `ChevronDownIcon`/`ChevronRightIcon` with `aria-expanded` (lines 74, 231). ✓

#### `web/src/components/Brands/ProviderResponsesTab.tsx`

- **[NIT] §5** – Hand-rolled tab toggle with `bg-gray-900 text-white` active state
  - Where: line 54 – `? 'bg-gray-900 text-white'`
  - Why: Same pattern as other tab toggles.


### Citations

#### `web/src/components/Citations/CitationsView.tsx`

- No findings beyond those in CitationFilters/PaginationControls.

#### `web/src/components/Citations/CitationFilters.tsx`

- **[NIT] §5** – Hand-rolled "Search" button
  - Where: line 65 – `className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button>`.

#### `web/src/components/Citations/CitationRow.tsx`

- No findings.

#### `web/src/components/Citations/CitationTableHeader.tsx`

- No findings.

#### `web/src/components/Citations/CitationDetailModal.tsx`

- User-content screenshot correctly carries `dark:brightness-90 dark:contrast-95` (line 293). ✓

#### `web/src/components/Citations/CrawlHistory.tsx`

- User-content screenshot correctly carries `dark:brightness-90 dark:contrast-95` (line 136). ✓

#### `web/src/components/Citations/PaginationControls.tsx`

- **[NIT] §5** – Four hand-rolled pagination buttons with `disabled:opacity-50`
  - Where: lines 47–51 – `className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 ..."`
  - Why: Should use `<Button variant="ghost" size="sm">`.

### Insights

#### `web/src/components/Insights/PromptInsights.tsx`

- No findings. Fuchsia accent used correctly.

#### `web/src/components/Insights/CitationGaps.tsx`

- No findings. Rose accent used correctly.

#### `web/src/components/Insights/GapCard.tsx`

- No findings.

#### `web/src/components/Insights/PromptCard.tsx`

- No findings.

#### `web/src/components/Insights/Recommendations.tsx`

- **[NIT] §5** – Hand-rolled primary action button
  - Where: line 225 – `className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium ..."`
  - Why: Should use `<Button>`.

### KeywordResearch

#### `web/src/components/KeywordResearch/KeywordResearchView.tsx`

- No findings.

#### `web/src/components/KeywordResearch/KeywordExpansion.tsx`

- **[NIT] §5** – Hand-rolled "Expand Keywords" button with `disabled:opacity-50`
  - Where: line 121 – `className="w-full sm:w-auto px-6 py-2 bg-gray-900 text-white ... disabled:opacity-50 disabled:cursor-not-allowed ..."`
  - Why: Should use `<Button>`.

#### `web/src/components/KeywordResearch/CompetitorAnalysis.tsx`

- No findings.

#### `web/src/components/KeywordResearch/CompetitorAnalysisComponents.tsx`

- **[NIT] §5** – Hand-rolled "Analyze" button with `disabled:opacity-50`
  - Where: line 102 – `className="px-6 py-2 bg-gray-900 text-white ... disabled:opacity-50 disabled:cursor-not-allowed ..."`
  - Why: Should use `<Button>`.

#### `web/src/components/KeywordResearch/ResearchHistory.tsx`

- No findings. `•` used as text separator.

#### `web/src/components/KeywordResearch/KeywordResultsTable.tsx`

- No findings.


### ContentStudio + SelfReflection

#### `web/src/components/ContentStudio/ContentStudioView.tsx`

- **[NIT] §5** – Hand-rolled "Generate" button
  - Where: line 152 – `className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button>`.

- **[NIT] §5** – Hand-rolled secondary button with `disabled:opacity-50`
  - Where: line 183 – `className="px-4 py-2 bg-gray-100 text-gray-700 ... disabled:opacity-50 ..."`
  - Why: Should use `<Button variant="secondary">`.

#### `web/src/components/ContentStudio/ContentGenerator.tsx`

- **[NIT] §5** – Hand-rolled button
  - Where: line 211 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button>`.

#### `web/src/components/ContentStudio/ContentHistory.tsx`

- No findings.

#### `web/src/components/ContentStudio/ContentDetailModal.tsx`

- **[NIT] §5** – Hand-rolled blue action button with `disabled:opacity-50`
  - Where: line 153 – `className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 ... disabled:opacity-50"`
  - Why: This is a saturated solid button (allowed per §2) but should still use `<Button variant="danger">` pattern or a custom variant for consistency.

#### `web/src/components/ContentStudio/ContentIdeaCard.tsx`

- **[NIT] §5** – Hand-rolled button with `disabled:opacity-50`
  - Where: line 165 – `className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white ... disabled:opacity-50 disabled:cursor-not-allowed ..."`
  - Why: Should use `<Button>`.

#### `web/src/components/ContentStudio/HistoryListItem.tsx`

- **[NIT] §5** – Hand-rolled delete icon button with `disabled:opacity-50`
  - Where: line 162 – `className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ... disabled:opacity-50"`
  - Why: Should use `<Button variant="iconOnly">` with appropriate hover styling.

#### `web/src/components/SelfReflection/SelfReflectionPanel.tsx`

- **[NIT] §5** – Hand-rolled button
  - Where: line 43 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"`
  - Why: Should use `<Button>`.

### Searches

#### `web/src/components/Searches/SearchesView.tsx`

- No findings.

#### `web/src/components/Searches/SearchesViewComponents.tsx`

- **[NIT] §5** – Hand-rolled "Search" button
  - Where: line 169 – `className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button>`.

- **[NIT] §5** – Hand-rolled pagination button with `disabled:opacity-50`
  - Where: line 267 – `className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 ..."`
  - Why: Should use `<Button variant="ghost" size="sm">`.

### RawResponses

#### `web/src/components/RawResponses/RawResponsesExplorer.tsx`

- **[NIT] §5** – Hand-rolled tab toggle with `bg-gray-900 text-white` active state
  - Where: line 241 – `? 'bg-gray-900 text-white'`
  - Why: Same tab-toggle pattern as elsewhere.

#### `web/src/components/RawResponses/Breadcrumb.tsx`

- No findings.

#### `web/src/components/RawResponses/FileViewer.tsx`

- No findings. `•` used as text separator.

#### `web/src/components/RawResponses/ImageViewer.tsx`

- User-content image correctly carries `dark:brightness-90 dark:contrast-95` (line 49). ✓

- **[NIT] §5** – Hand-rolled "Download" button
  - Where: line 97 – `className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button size="sm">`.


### Execution

#### `web/src/components/Execution/ExecutionMonitor.tsx`

- No findings.

#### `web/src/components/Execution/ExecutionStatus.tsx`

- No findings.

#### `web/src/components/Execution/ExecutionMonitorComponents.tsx`

- **[NIT] §5** – Hand-rolled button with `disabled:bg-gray-300 disabled:cursor-not-allowed`
  - Where: line 177 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed ..."`
  - Why: Should use `<Button>`. Note: uses `disabled:bg-gray-300` instead of the component's `disabled:opacity-50`.

#### `web/src/components/Execution/TriggerSection.tsx`

- **[NIT] §5** – Hand-rolled button with `disabled:bg-gray-300 disabled:cursor-not-allowed`
  - Where: line 112 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed ..."`
  - Why: Should use `<Button>`.

### Schedule

#### `web/src/components/Schedule/ScheduleManager.tsx`

- **[NIT] §5** – Two hand-rolled buttons
  - Where: line 182 – toggle active state `'bg-gray-900 text-white hover:bg-gray-800'`
  - Where: line 288 – `className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button>`.

### Settings

#### `web/src/components/Settings/SettingsView.tsx`

- **[NIT] §5** – Hand-rolled button with `disabled:opacity-50`
  - Where: line 338 – `className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 ... disabled:opacity-50 ..."`
  - Why: Should use `<Button>`.

- **[NIT] §8** – `<li>` items use `•` bullet character instead of proper list styling
  - Where: lines 364–367 – `<li>• Only enabled providers...`
  - Why: This is content text, not a UI glyph. However, using `<ul className="list-disc">` would be more semantic.

#### `web/src/components/Settings/UsersConfig.tsx`

- **[NIT] §5** – Hand-rolled button
  - Where: line 97 – `className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 ..."`
  - Why: Should use `<Button size="sm">`.

#### `web/src/components/Settings/UserModals.tsx`

- **[NIT] §5** – Two hand-rolled buttons with `disabled:opacity-50`
  - Where: lines 149, 334 – `className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 ... disabled:opacity-50 ..."`
  - Why: Should use `<Button>`.

- **[NIT] §8** – Labels lack `htmlFor`/`id` pairing
  - Where: lines 93, 109, 277 – `<label className="block text-sm font-medium text-gray-700 mb-1">` without `htmlFor`
  - Why: §8 requires labels paired via `htmlFor`/`id`.
  - Suggested fix: Add `htmlFor` to labels and `id` to corresponding inputs.

#### `web/src/components/Settings/QueryPromptsManager.tsx`

- Icon-only buttons correctly carry `aria-label` (lines 234, 243, 253). ✓
- Form labels correctly use `htmlFor` (lines 85, 100, 116). ✓
- No findings.

### Keywords

#### `web/src/components/Keywords/KeywordDetail.tsx`

- Charts use declarative `<Line>` and `<Bar>` from react-chartjs-2 with `useTheme()` + `getChartTheme(isDark)` in the render path (lines 173–174). Re-renders automatically on theme toggle. ✓

#### `web/src/components/Keywords/KeywordDetailComponents.tsx`

- **[EXCEPTION] §2** – Inline `style={{ backgroundColor }}` for provider colour swatches
  - Where: line 214 – `style={{ backgroundColor: colors.border }}`
  - Why: §2 documents this as an allowed exception for provider colour swatches in KeywordDetailComponents. Correct.

- **[EXCEPTION] §2** – `rgb()`/`rgba()` provider colour constants
  - Where: lines 11–24 – `border: 'rgb(168, 85, 247)'`, `bg: 'rgba(168, 85, 247, 0.5)'`, etc.
  - Why: §7.5 documents saturated branded palettes stay fixed. Correct.

- Expandable rows correctly use `aria-expanded` (line 322). ✓

#### `web/src/components/Keywords/KeywordDetailChartOptions.ts`

- No findings. Correctly accepts `ChartTheme` parameter.

#### `web/src/components/Keywords/KeywordsManager.tsx`

- No findings.

#### `web/src/components/Keywords/KeywordsManagerComponents.tsx`

- **[NIT] §5** – Four hand-rolled buttons
  - Where: line 55 – toggle: `'bg-gray-900 text-white hover:bg-gray-800'`
  - Where: line 88 – `className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"`
  - Where: line 119 – same pattern
  - Where: line 229 – `className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"`
  - Why: Should use `<Button>`.


## Cross-cutting observations

### 1. Hand-rolled button pattern (NIT §5) – 27 files

The most pervasive finding. The shared `<Button>` component exists and implements all documented variants, sizes, disabled states, and `invertOnDark` — but ~27 files still use inline `className="px-4 py-2 bg-gray-900 text-white ..."` strings. This is a consistency issue, not a dark-mode bug (the global override handles `bg-gray-900` in both themes).

**Recommendation:** A single refactor pass replacing all hand-rolled button strings with `<Button>` would eliminate ~40 of the 42 NITs in this report. Consider a codemod or lint rule (`no-restricted-syntax` targeting the pattern).

### 2. Ad-hoc `disabled:opacity-50` (NIT §5) – 18 files

Files that hand-roll buttons also hand-roll disabled states. The `<Button>` component already applies `disabled:opacity-50 disabled:cursor-not-allowed` in its base classes. Some files additionally use `disabled:bg-gray-300` which deviates from the component's approach.

### 3. Tab-toggle pattern not covered by `<Button>`

Several components use a toggle-button group where the active tab gets `bg-gray-900 text-white` and inactive gets `bg-gray-100 text-gray-700`. This pattern appears in:
- `BrandsView` (filter buttons)
- `BrandConfigContent` (settings/prompt tabs)
- `BrandMentionsTable` (sort toggles)
- `ProviderResponsesTab`
- `RawResponsesExplorer`
- `ScheduleManager`
- `KeywordsManagerComponents`

**Recommendation:** Consider adding a `ToggleGroup` or `TabBar` primitive to `components/ui/` that encapsulates this pattern. It's not exactly a `<Button>` but it's repeated enough to warrant extraction.

### 4. Form label pairing (§8) – incomplete

Only `QueryPromptsManager` and `ContentStudioView` use `htmlFor`/`id` pairing. Most other form-bearing components (`UserModals`, `BrandConfigContent`, `ScheduleManager`) have labels without `htmlFor`. This is an accessibility gap.

### 5. Table header `tracking-wider` (§9) – inconsistent

`RecentSearchesTable` headers are missing `tracking-wider`. `TopCitationsTable` has it. All table headers should include it per §9.

### 6. Focus ring colour (§8) – one deviation

`TopCitationsTable` uses `focus:ring-blue-500` on a `<select>` instead of the canonical `focus:ring-gray-900`. This is the only instance found.

### 7. Theme support status confirmed

All 14 pages in the §7.1 catalogue maintain their "✓ auto" status. No new code introduces classes outside the global override list. The always-dark surfaces (Sidebar, Modal, main.tsx fallback, App.tsx chrome) correctly carry explicit `dark:` variants.

## Verification commands

```bash
cd web && npm run type-check
cd web && npm test -- --run
cd web && npm run build
npx eslint web/src/components/Tables/TopCitationsTable.tsx web/src/components/Tables/RecentSearchesTable.tsx
```
