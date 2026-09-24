# UI package

The `ui` directory is the application design system. Product pages should
compose these components instead of repeating Tailwind strings for layout,
spacing, typography or controls.

- `Page` owns the canvas, responsive page gutter, maximum width and page gap.
  Use `width="compact"` for centered destination lists and settings pages.
- `PageHeader` and `SectionHeading` own page navigation,
  heading hierarchy and metadata spacing.
- `Surface`, `Section` and `Inset` own panel radius, border, padding and surface tone.
- `Dialog` owns modal overlays, widths, typography, padding and footer spacing.
- `KpiCard` and `KpiGrid` own metric typography, spacing and responsive columns.
- `Tabs`, `Button`, `SelectMenu`, `DropdownMenu` and `SearchBar` own controls.
- `ListViewToggle` is the only card/compact switch used by product lists; it builds on `ToggleButton`.
- `SettingsMenu` owns the desktop sidebar's adjacent destination menu and nested light/dark selection. The mobile sidebar links directly to the settings page.
- `WorkspaceListSort` owns alphabetical and recency sorting for workspace lists.
- `Chip` owns selectable filters, metadata labels, count indicators and semantic statuses.
- `AnimatedCollapse` owns expand/collapse motion and accessibility for mounted content.
- `AnimatedContent` owns the short entrance motion used when page tabs swap blocks.
- `EmptyState` owns empty results; `Feedback` owns warnings and inline errors.
- `StructuredDetails` owns the responsive labelled grids used inside expanded cards.
- `SummaryGrid` owns the subtle, borderless fact area at the bottom of result cards.
- `DataTable` owns dense, horizontally scrollable tables for comparable time
  series, including optional column sorting and column-divider controls.
- `DataVisualization` gives the same table data a coordinated table/chart
  switch (with an optional default chart view), a compact series dropdown and straight-line, monotone-spline or
  grouped-bar renderers. Charts fit their container without scrolling; shared
  chart tokens keep axis text and line widths consistent at every size.
  Optional X-axis categories force bars and regroup the original observations;
  reversing X never changes values. The X-direction control uses the same segmented-toggle pattern as the table/chart switch. Fit uses the visible series' exact extrema
  (a small range for constant values), with the same control restoring zero-based
  scales. Point details support hover, focus and touch. Series use the shared
  dropdown; column lines use a pressed button. Category values can sum across periods. Series can use the table cell's exact interval label in point details while plotting a numeric representative value.
- `ui.stickyHeader` owns the shared sticky surface and lower-edge shadow.

Global sizes and visual tokens live in `src/lib/uiStyles.ts` and
`src/app/globals.css`. Color-theme state and available palettes live in
`src/lib/appTheme.ts`. Shared animation timings and sequencing live in
`src/lib/uiMotion.ts`. Change the relevant primitive or token once; avoid
adding page-specific overrides unless the layout genuinely has different
semantics.

Interactive controls use the shared 12 px `text-xs` token. Control labels or
other emphasized control copy use the 13 px `text-sm` token. Button, toggle
and select padding is defined by `uiControlSize`; page components must not
redeclare those density rules. Standard controls are 28 px (`h-7`) high.
Geist Sans is the application font, with Inter and system sans-serif fonts as
fallbacks.

The live reference is available at `/components`. Check the catalog before
adding a control. New reusable variants belong in the relevant primitive and
must be represented in the catalog; product pages should not create parallel
versions of an existing interaction.
