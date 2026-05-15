# Agent Guide

## Source Language And Architecture

All source architecture must be written in English: file names, folder names, identifiers, comments,
docs, tests, lint rule names, and commit/PR text. Spanish is allowed only for intentional runtime
copy, historical content, dataset text, and product labels shown to users.

Use bounded contexts named after product capabilities:

- `viewer`: route/page composition and viewer-side UI.
- `timeline`: timeline rendering, measured layout, axis, track, events, connectors, zoom controls.
- `timelineEdition`: editing, AI planning, repositories, and serialization.
- `shell`: router, welcome screen, theme, and global help chrome.

Prefer ubiquitous business language over placement names. Use names such as `ViewerPage`,
`Toolbar`, `ViewerIndex`, `SelectionDetail`, `Timeline`, `TimelineTrack`, `TimelineEventLabel`,
and `ZoomControls`. Avoid vague names such as `Lower`, `Panel2`, `Thing`, or names based only on
screen position.

## Naming Rules Enforced By Lint

Current lint rules are binding architecture rules, not optional style.

- A normal file with a default export must match that default export:
  `SomeComponent.tsx` default-exports `SomeComponent`.
- A directory component uses `SomeComponent/index.tsx` and default-exports `SomeComponent`.
- `index.ts` barrel files may use named exports and are exempt unless they contain a default export.
- Storybook default metadata is exempt from default-export naming.

Run lint after structural changes:

```bash
npm run lint
```

## Viewer Layout

Specs use `docs/<NAME>.SPEC.md`; start from [`docs/TEMPLATE.SPEC.md`](./docs/TEMPLATE.SPEC.md).

Read these before touching viewer or timeline layout:

- [`docs/VIEWER_LAYOUT.SPEC.md`](./docs/VIEWER_LAYOUT.SPEC.md): viewer viewport, grid, overflow,
  and scroll ownership.
- [`docs/TIMELINE_LAYOUT.SPEC.md`](./docs/TIMELINE_LAYOUT.SPEC.md): timeline stack, axis, labels,
  lanes, connectors, and layout tests.

Cursor keeps the viewer-layout rule active in [`.cursor/rules/viewer-layout.mdc`](./.cursor/rules/viewer-layout.mdc).

### Do Not Regress

| Topic | Avoid | Reason |
| --- | --- | --- |
| Overflow on one node | `overflow-x: hidden` or `auto` together with `overflow-y: visible` | Chromium coerces `overflow-y` to `auto`, causing a phantom vertical scrollbar. |
| Viewer `body` sizing | Only `height: 100dvh` without `min-height` | Global `body { min-height: 100vh; }` can exceed `100dvh` and create document scroll. |
| Chart width | Leaving generic `.chart-bleed { width: 100vw; }` in viewer mode | It overflows the usable width and can add scroll. |
| Shell scroll | `overflow-y: auto` on `.viewer-shell` | It turns the viewer into a scrollable page, which is not the model. |
| Timeline height | `max-height` plus `overflow-y: auto` on `.viewer-chart-wrap` | It clips the timeline; the grid row must size to content. |

## Files To Review When Touching The Viewer

- `src/viewer/ViewerPage/index.tsx`: viewer route orchestration.
- `src/viewer/Toolbar/index.tsx`: top viewer controls.
- `src/timeline/Timeline/index.tsx`: scrollable timeline surface.
- `src/timeline/TimelineAxis/index.tsx`: axis bands, ticks, and marks.
- `src/timeline/TimelineTrack/index.tsx`: periods, semantic event lanes, event labels, cursor.
- `src/App.css`: viewer and timeline layout styles.
- `src/index.css`: `html.viewer-phase`, `body`, and `#root` sizing.

## Timeline Axis Labels And Zoom

Axis marks come from `mergeAxisMarks` and are placed by `assignAxisMarkLanes`. The algorithm uses
the measured label width and usable `.timeline-stack` width. Less zoom means a wider track in
pixels, so the same dates are farther apart and need fewer vertical lanes. More zoom narrows the
visible track, so labels compete for space sooner and may move to higher lanes.

This is intentional and matches the event-label placement model. CSS for `.axis` and
`.tick--axis-mark` must reserve height consistent with `--axis-max-lane` and
`--axis-lane-step`, including the compact `.timeline-stack--compact .axis` variant.

## Other Entry Points

- New product or feature spec: copy [`docs/TEMPLATE.SPEC.md`](./docs/TEMPLATE.SPEC.md) to
  `docs/<NAME>.SPEC.md`.
- Timeline product invariants and tests: [`docs/TIMELINE_LAYOUT.SPEC.md`](./docs/TIMELINE_LAYOUT.SPEC.md).
- Isolated UI components: Storybook (`npm run storybook`, stories in `src/**/*.stories.tsx`).
- [`CLAUDE.md`](./CLAUDE.md) points back here.
- [`README.md`](./README.md) links to the specs and template.
