# Cintela agent context

This is the canonical repository context for coding agents. Read it before
changing the product. `CLAUDE.md` points here so the same rules apply across
agents.

## Product goal

Cintela is an explainable change and opportunity radar for Swedish companies.
It combines official data, source-aware history and user-defined company
segments to support one focused flow:

`find the right company -> understand what changed -> act at the right time`

Search and company facts are the entry point. Long-term product value comes
from trustworthy change detection, prioritisation, context and repeatable
workflows. Every conclusion must remain traceable to facts, dates, sources and
an explicit calculation. Do not turn Cintela into a generic CRM, contact
database, outreach suite or collection of unrelated open-data integrations.

The primary early audience is a Swedish B2B owner, sales leader or seller who
works with a defined industry or geographic market and currently relies on
manual company lists and registry checks.

The active product and technical direction lives in `TODO.txt`. Treat it as a
roadmap, not as permission to implement adjacent features during an unrelated
task.

## Product-owner preferences

The product owner expects:

- compact, professional and calm interfaces with strong enough contrast;
- consistent padding, typography, control heights and responsive behaviour;
- subtle borders, shadows, hover states and motion rather than large boxes or
  decorative UI;
- clear visual hierarchy without explanatory copy that the interface does not
  need;
- Swedish user-facing language without mixed English labels;
- stable animations without layout jumps, twitching, temporary scrollbars or
  controls moving between list and card views;
- carefully handled vertical/mobile layouts, not a shrunken desktop layout;
- status chips that are legible and semantic but do not look like buttons;
- obvious actions with familiar SVG icons and concise text;
- reusable foundations that can be changed once and update every usage;
- simple, readable code with explicit names and no clever workaround that a
  new developer must reverse-engineer.

When a request is visually ambiguous, prefer less text, less chrome and a
denser but still breathable layout. Preserve existing interaction patterns
unless the task explicitly changes them.

## Repository map

- `web/`: Next.js App Router frontend, TypeScript and Tailwind.
- `api/`: FastAPI routers, Pydantic response contracts and service queries.
- `worker/`: restartable SCB and Bolagsverket ingestion pipelines.
- `db/`: the only active PostgreSQL migration chain and data-model guide.
- `tests/`: API contracts, service behaviour, ingestion and database tests.
- `docs/`: focused data-source and performance notes.

Important sources of truth:

- UI system: `web/src/components/ui/README.md` and `/components` in the app.
- Shared visual tokens: `web/src/lib/uiStyles.ts` and
  `web/src/app/globals.css`.
- Shared motion: `web/src/lib/uiMotion.ts`.
- Theme definitions: `web/src/lib/appTheme.ts`.
- Database layering and import semantics: `db/README.md`.
- API response contracts: `api/schemas.py`.
- Product direction: `TODO.txt`.

## Component-first frontend work

The live `/components` page is the visual contract. Inspect it and the
implementation in `web/src/components/ui/ComponentLibrary.tsx` before building
UI. Reuse an existing primitive when its semantics fit. If it almost fits,
add a clearly named, optional variant to the primitive. If no component fits,
create one in `web/src/components/ui/` and add every reusable state to the
component catalog before using it on a product page.

Do not create page-local copies of an existing control or repeat long Tailwind
class strings to obtain a slightly different version.

Current shared building blocks include:

- layout: `Page`, `PageHeader`, `SectionHeading`, `Surface`, `Section`, `Inset`;
- navigation: `Tabs`, `BackLink`, `TextLink`, `AppSidebar`, `AppTopBar`;
- controls: `Button`, `ActionControl`, `SelectMenu`, `DropdownMenu`,
  `ToggleButton`, `ListViewToggle`, `SearchBar`, `Pagination`;
- labels: `FilterChip`, `InfoChip`, `CountChip`, `StatusChip`;
- content: `List`, `StructuredDetails`, `SummaryGrid`, `InfoCard`, `DataRow`,
  `KpiCard`, `HorizontalBarList`, `SourceNote`;
- states: `EmptyState`, `Feedback`, `Skeleton`, `ConfirmDialog`, `Dialog`;
- motion: `AnimatedCollapse`, `AnimatedContent`, `CollapsibleSection`;
- utilities: `MaskedIcon`, `ChevronIcon`, `CopyToClipboardButton`,
  `SearchExamples`.

Frontend rules:

1. Use semantic tokens such as `text-app-text` and `bg-app-panel`; never add a
   literal product colour to one page.
2. Keep controls in one row the same height. Truncate long labels and test them
   at narrow widths.
3. Use shared breakpoints and ensure overlays remain within the viewport.
4. Respect `prefers-reduced-motion`. Animate opacity/transform or measured
   collapse; do not animate layout through brittle timers.
5. A background request must not turn successfully loaded content into an
   error state. Show errors at the scope that failed.
6. Keep server and URL state explicit. Guard against stale async responses and
   abort obsolete requests.
7. Use icons from `web/public/icons/`; do not use text glyphs as chevrons or
   action icons.

## Code structure and naming

- Prefer small modules with one reason to change over large multipurpose files.
- Use domain names, not placeholders: `selectedCountyCodes`,
  `countRequestDeadline`, `registrationEffectiveAt`, not `data2`, `tmp` or
  `valueX`.
- Name booleans with `is`, `has`, `can` or a state that reads naturally.
- Name event handlers `handle...` or actions with a verb; name collections in
  the plural.
- Keep API query names in their public snake_case contract and frontend state
  in idiomatic camelCase. Centralise conversion instead of mixing both styles.
- Extract a helper when it captures a domain rule or removes real duplication,
  not merely to reduce line count.
- Comments should explain contracts, ordering, performance assumptions and
  non-obvious source semantics. Do not narrate obvious syntax.
- Do not silently default invalid public input. Use enums/Literal types and
  return the appropriate 4xx response.
- Preserve unrelated work in the dirty worktree. Inspect before editing and do
  not rewrite a file wholesale when a focused patch is sufficient.

## API and overload safety

CORS is browser policy, not API protection. Before production, endpoints with
user or admin data require authentication, authorisation and workspace
isolation. Never infer that an endpoint is safe merely because the UI hides it.

For every new or changed endpoint:

1. Define bounded input with FastAPI/Pydantic: enum values, lengths, numeric
   ranges, pagination limits and list-size limits.
2. Use parameterised SQL. User input must never select raw SQL fragments,
   identifiers or sort expressions; map allowed enums to reviewed SQL.
3. Add a response model and a contract test. Return real HTTP status codes.
4. Consider the cheapest and worst-case query plan, not only the happy path.
   Apply database statement timeouts and cap result windows.
5. Avoid N+1 queries and unbounded `COUNT`, `OFFSET`, wildcard scans, exports or
   fan-out calls. Add indexes only for measured access patterns.
6. Debounce or explicitly submit interactive searches, abort obsolete browser
   requests and ignore stale responses.
7. Treat exact totals as optional metadata when they are more expensive than
   the page. Use the `exact`/`estimated`/`none` contract honestly.
8. Plan rate limits, concurrency limits, caching and per-user quotas for costly
   routes. These are still required even when statement timeouts exist.
9. Never log search text, personal numbers, secrets or raw personal payloads.
   Telemetry may store query shape, duration and anonymised outcome.
10. Keep admin, raw-data and ingestion diagnostics role-protected and outside
    the normal product journey.

Search currently exposes at most 10,000 companies even when an exact total is
larger. The result page and total count are separate requests so useful results
are not blocked by an expensive count. Maintain request cancellation, stale
response guards and the bounded pagination contract when changing search.

## Data and database rules

The schemas have distinct responsibilities:

- `raw`: immutable decoded source records and import lineage;
- `src_scb` / `src_bolagsverket`: source-specific versioned observations;
- `core`: canonical identity, typed SCD2 history, industries and events;
- `app`: API-facing read models and product-owned state;
- `mart`: aggregate analysis without personal identifiers;
- `meta`: sources, runs, checkpoints, migrations and quality issues.

Do not overwrite history when a new file arrives. Keep source observation time,
source-as-of date and event effective date separate. Never infer an individual
company fact from aggregate statistics. Preserve leading zeroes in codes and
distinguish missing values from real zeroes.

`db/migrations/` is append-only after application. Do not edit an applied
migration; add a clearly named migration and update `db/README.md` when the
contract changes. Avoid speculative dimensions, marts or indexes without a
real consumer and measured benefit.

Early customer, offer and watch-list prototypes were deliberately removed.
Do not reintroduce them without a newly agreed product model.

## Verification

Run checks proportional to the change and report what was actually run:

```powershell
python -m pytest
npm run lint
npm run build
python -m db.migrate --check
```

For search or database work, add a regression test and measure representative
queries against realistic data. For UI work, verify both themes, narrow/vertical
mode, long Swedish labels, empty/loading/error states and reduced motion.

