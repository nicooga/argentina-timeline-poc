# Argentine History Timeline

Interactive web viewer for exploring Argentine history. The app displays historical periods as
bands on a temporal axis and point events organized by semantic lanes, with zoom, navigation,
selection details, and causal relationships.

This is a frontend proof of concept built with React, TypeScript, and Vite.

## Requirements

- Node.js 20 or newer
- npm

## Development

```bash
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

The viewer uses the deployed API by default:

```bash
https://ukpswhaxmg.us-east-1.awsapprunner.com
```

Use another backend with:

```bash
VITE_TIMELINES_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Use the legacy local repository with:

```bash
VITE_TIMELINES_API_BASE_URL=local npm run dev
```

## Storybook

The repo includes [Storybook](https://storybook.js.org/) for reviewing isolated UI components
without starting the full viewer.

```bash
npm run storybook
```

Storybook serves the UI at `http://localhost:6006` by default. Static Storybook output is generated
with:

```bash
npm run build-storybook
```

Stories follow the `src/**/*.stories.@(ts|tsx)` pattern. Files named `*.story.*` are not loaded.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Run TypeScript, build `dist/`, and copy `index.html` to `404.html`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint, including local architecture naming rules. |
| `npm run test` | Run Vitest in watch mode. |
| `npm run test:ci` | Run the test suite once. |
| `npm run test:e2e` | Run the execution-plan E2E smoke test against a real backend. |
| `npm run storybook` | Start Storybook at `http://localhost:6006`. |
| `npm run build-storybook` | Build the static Storybook site. |

## Routes

| Route | Screen |
| --- | --- |
| `/` | Welcome screen. |
| `/:timelineSlug` | Full-screen timeline viewer. |
| `*` | Redirects to `/`. |

The router basename comes from `import.meta.env.BASE_URL`, so GitHub Pages can serve the app under
`/<repo>/` while local development uses `/`.

## Stack

- React 19
- TypeScript 5.7
- React Router DOM 7
- Vite 6
- Storybook 10
- Vitest
- ESLint
- Plain CSS with custom properties

## Architecture

Source architecture is English. Spanish remains only for intentional user-facing copy, historical
content, and product labels shown in the UI.

```text
src/
├── App.tsx                         # Thin route component that renders ViewerPage
├── App.css                         # Viewer and timeline layout styles
├── main.tsx                        # React entry point
├── shell/                          # Router, welcome screen, theme, global help chrome
├── viewer/                         # Viewer route composition and viewer-side UI
│   ├── ViewerPage/                 # Route orchestration, loading, preview, AI/editor wiring
│   ├── Toolbar/                    # Top viewer controls
│   ├── ViewerIndex/                # Period/event index navigation
│   ├── SelectionDetail/            # Selected period/event details
│   └── EventEditor/                # Event create/edit modal
├── timeline/                       # Timeline rendering and pure layout helpers
│   ├── Timeline/                   # Scrollable timeline surface
│   ├── TimelineAxis/               # Axis bands, ticks, and marks
│   ├── TimelineTrack/              # Period rows, event lanes, event labels, cursor
│   ├── TimelineEvent/              # Semantic lane event dot
│   ├── TimelineEventLabel/         # Event label marker
│   ├── TimelineEventVerticalConnector/
│   ├── TimelineEventDiagonalConnector/
│   └── ZoomControls/
└── timelineEdition/                # Editing, AI plans, repositories, serialization
```

Root-level domain/data files include `types.ts`, `eventLanes.ts`, `causality.ts`, and
`timelineHistoriaArgentina.ts`.

## Naming Rules

ESLint enforces source naming conventions:

- A normal file with a default export must match that default export:
  `SomeComponent.tsx` default-exports `SomeComponent`.
- A directory component uses `SomeComponent/index.tsx` and default-exports `SomeComponent`.
- `index.ts` barrel files may use named exports and are exempt unless they contain a default export.
- Storybook default metadata is exempt.

Prefer bounded-context and ubiquitous-language names such as `ViewerPage`, `Toolbar`,
`ViewerIndex`, `SelectionDetail`, `TimelineTrack`, and `TimelineEventLabel`.

## Domain Model

The main domain types live in [`types.ts`](./types.ts):

- `Timeline`: a collection of `periods` and `events`.
- `Period`: a historical span with start/end dates, color, notes, and optional links.
- `TimelineEvent`: a dated event with semantic lanes, importance, causes, consequences, notes,
  and optional links.

The current dataset lives in [`timelineHistoriaArgentina.ts`](./timelineHistoriaArgentina.ts).
Dates are modeled as UTC noon values to avoid browser time-zone shifts.

## Semantic Lanes

Events can belong to one or more semantic lanes:

- `politico`
- `militar`
- `economico`
- `social`
- `diplomatico`

Visual configuration and lane order live in [`eventLanes.ts`](./eventLanes.ts).

## Specs

Specs live in `docs/<NAME>.SPEC.md`. Read these before changing viewer or timeline layout:

- [`docs/VIEWER_LAYOUT.SPEC.md`](./docs/VIEWER_LAYOUT.SPEC.md): viewport, grid, overflow, scroll ownership.
- [`docs/TIMELINE_LAYOUT.SPEC.md`](./docs/TIMELINE_LAYOUT.SPEC.md): axis, labels, lanes, connectors, layout tests.
- [`docs/AI_EXECUTION_PLAN_UI.SPEC.md`](./docs/AI_EXECUTION_PLAN_UI.SPEC.md): execution-plan UI behavior.
- [`docs/TEMPLATE.SPEC.md`](./docs/TEMPLATE.SPEC.md): template for new specs.
- [`docs/MASTER.md`](./docs/MASTER.md): maintainer context.

Practical rule: the viewer must occupy the viewport without document-level vertical scroll. Vertical
scroll belongs inside panels; horizontal scroll belongs to the timeline.

## Tests

The current suite covers pure timeline layout functions and timeline edition services:

```bash
npm run test:ci
```

Vitest finds tests with the `src/**/*.test.ts` pattern configured in [`vite.config.ts`](./vite.config.ts).

The execution-plan E2E smoke test lives in
[`src/timelineEdition/executionPlan.e2e.test.ts`](./src/timelineEdition/executionPlan.e2e.test.ts).
It is skipped by default because it uses a real backend and may trigger Bedrock calls. To run it:

```bash
TIMELINES_E2E_API_BASE_URL=http://127.0.0.1:8000 npm run test:e2e
```

## Quality

Before opening a PR or changing layout behavior:

```bash
npm run lint
npm run test:ci
npm run build
```

If CSS touches the viewer, manually verify wide and narrow viewports, with and without an active
selection, and confirm there is no global vertical scroll or phantom scrollbar in the chart.

## Deployment

GitHub Actions workflows handle CI and deploy:

- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)
- [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

The build uses `GITHUB_REPOSITORY` to configure `base` as `/<repo>/` during GitHub Pages deploys.
Local builds use `/`.

## Agent Guide

Operational instructions for assistants live in [`AGENTS.md`](./AGENTS.md). Cursor keeps the
permanent viewer-layout rule in [`.cursor/rules/viewer-layout.mdc`](./.cursor/rules/viewer-layout.mdc).
