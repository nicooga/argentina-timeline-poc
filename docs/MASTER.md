# Master Documentation — Historia Argentina Timeline

> **For AI agents and maintainers.** Read this before touching anything.  
> Last updated: 2026-04-22.

---

## 1. What this project is

An interactive, browser-based **timeline of Argentine history (1810–1916)** built as a proof-of-concept. Users can explore historical periods and point events, zoom and pan the timeline axis, filter by semantic category (political, military, economic, social, diplomatic), and study causal relationships between events.

The project is evolving from a pure frontend to a **full-stack app** with a backend that introduces AI-assisted features (see §8).

---

## 2. Repository layout

### Current state

The repository root *is* the frontend. All source lives directly under the root:

```
argentina-timeline-poc.claude/   ← repo root = frontend
├── src/                         ← React components + styles
├── timelineHistoriaArgentina.ts ← Dataset
├── types.ts
├── eventLanes.ts
├── causality.ts
├── docs/
│   ├── MASTER.md                ← this file
│   └── VIEWER_LAYOUT.md         ← CSS layout spec (must read before touching viewer CSS)
├── CLAUDE.md                    ← agent entrypoint
├── AGENTS.md                    ← layout trap summary for AI agents
├── vite.config.ts
├── package.json
└── index.html
```

### Planned state (monorepo)

A sibling `backend/` folder will be added **at the same level as the current repo root**, or the repo root will be restructured so both live side-by-side:

```
project-root/
├── frontend/   ← current codebase, moved here
└── backend/    ← new AI-powered backend service
```

Until the restructure happens, agents should treat the current root as `frontend/` conceptually.

---

## 3. Tech stack

### Frontend (current)

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Language | TypeScript ~5.7 (strict) |
| Router | React Router DOM v7 |
| Build tool | Vite 6 |
| Styling | Plain CSS with CSS variables — no CSS framework |
| Fonts | IBM Plex Serif, Inter, JetBrains Mono (Google Fonts) |
| State | React hooks only (`useState`, `useRef`, `useMemo`, etc.) — no Redux/Context |
| Analytics | Google Analytics (G-ELH66CZYY6) |
| Deployment | GitHub Pages via GitHub Actions (auto-deploy on push to `master`) |

### Backend (planned)

No decisions are locked yet, but the natural fit given the AI direction:

| Layer | Likely choice |
|-------|--------------|
| Runtime | Node.js (stays in the JS ecosystem) or Python |
| Framework | Hono / Fastify (Node) or FastAPI (Python) |
| AI provider | Anthropic Claude API |
| Transport | REST or lightweight streaming JSON |

---

## 4. Frontend routing

```
/            → WelcomeScreen   (landing page, link to Instagram, "Enter" button)
/visor       → App             (full-screen timeline viewer)
*            → redirect to /
```

`basename` is `/repo-name/` on GitHub Pages (read from `GITHUB_REPOSITORY` env var at build time) and `/` in local dev.

---

## 5. Data model

All types live in `types.ts`. The dataset is in `timelineHistoriaArgentina.ts`.

### `Timeline`
```ts
{ periods: Period[];  events: TimelineEvent[] }
```

### `Period`
```ts
{
  title: string       // display name
  start: Date         // UTC at noon (see §5.4)
  end: Date
  color: string       // hex, used for the colored bar
  items: string[]     // bullet-point description
  links?: string[]    // optional external URLs
}
```

### `TimelineEvent`
```ts
{
  title: string             // unique identifier & display name
  summary?: string          // short hover/panel text
  items: string[]           // bullet-point description
  date: Date                // UTC at noon
  lanes: EventLaneId[]      // one or more semantic categories
  causes?: string[]         // titles of prior events that caused this
  consequences?: string[]   // titles of events this triggers
  importance?: "primary" | "secondary" | "contextual"
  links?: string[]
}
```

### `EventLaneId` — semantic categories

| ID | Color | Icon |
|----|-------|------|
| `"politico"` | #4c6ef5 | Landmark |
| `"militar"` | #c92a2a | Shield |
| `"economico"` | #EAB308 | Coins |
| `"social"` | #9c36b5 | Users |
| `"diplomatico"` | #2b8a3e | Globe |

### Date handling

All dates are stored as **UTC at noon** (`new Date(Date.UTC(year, month-1, day, 12, 0, 0))`) to avoid browser timezone drift. Display uses `toLocaleDateString("es-AR", { timeZone: "UTC", ... })`.

### Current dataset size

- **12 periods** — May Revolution (1810) through Yrigoyen's election (1916)
- **36 events** — with importance levels, semantic lanes, and causal links

---

## 6. Frontend component map

```
Router
├── WelcomeScreen          ← landing page
└── App (src/App.tsx)      ← entire viewer (2223 lines)
    ├── viewer-header-wrap
    │   └── toolbar (title, zoom, mode selector, lane toggles, help)
    ├── viewer-shell
    │   ├── viewer-main  (CSS Grid: row1=auto, row2=minmax(0,1fr))
    │   │   ├── row1: viewer-chart-wrap
    │   │   │   └── section.chart.chart--viewer
    │   │   │       └── .timeline-scroll (horizontal pan/zoom)
    │   │   │           └── .timeline-stack
    │   │   │               ├── .axis (decade bands + date ticks)
    │   │   │               ├── period bars
    │   │   │               ├── 5× TimelineSemanticEventLanes (dots)
    │   │   │               └── event-titles (collision-detected labels)
    │   │   └── row2: ViewerLower (src/ViewerLower.tsx)
    │   │       ├── col--list (collapsible periods + events list)
    │   │       └── col--detail (selected item's title + bullets)
    └── KeyboardHelpModal (shown on `?` key)
```

Supporting modules:
- `TimelineSemanticEventLanes.tsx` — renders event dots per lane
- `LaneGlyph.tsx` — SVG icons for each lane
- `eventLanes.ts` — lane enum, colors, lane-ordering helpers
- `causality.ts` — causal chain traversal (`causalHighlightSet`, `causalEdgesInSet`)

---

## 7. Key algorithms (don't break these)

### Period lane assignment (`assignPeriodLanes`)
Greedy: sort periods by start date, maintain lane end-times, assign each period to the first lane with no overlap, else open a new lane. Returns lane indices + lane count.

### Event label collision detection (`assignEventLabelLanes`)
Canvas-based pixel-width measurement of each title at the current zoom. Sorts events by date, assigns each to the first "depth lane" where the label (with a ±1.35% minimum gap) doesn't overlap any already-placed label. Runs on every zoom/resize change.

### Axis tick collision detection (`assignAxisMarkLanes`)
Same approach as event labels, but applied to year/month-day axis marks. Multi-lane stacking is intentional and correct; more zoom = narrower track in px = more rows needed. Not a bug.

### Causal chain traversal (`causalHighlightSet` in `causality.ts`)
- `"normal"` / `"exam"`: direct neighbors only (one hop up + one hop down)
- `"causal"`: full transitive closure — recursive walk of `causes` (upward) and `consequences` (downward), de-duped via visited set

### Zoom & scroll anchoring
`timelineZoom` (0.35–14×) is stored in state and applied as a CSS `--timeline-zoom` variable. On Ctrl+wheel and touch pinch, the code computes the cursor/pinch X position as a fraction of the track width and adjusts `scrollLeft` so that point stays fixed in the viewport.

---

## 8. Study modes

`studyMode` state: `"normal"` | `"exam"` | `"causal"`

- **Normal**: event summaries visible; causal neighbors highlighted on selection
- **Exam**: summaries hidden; only direct neighbors highlighted (tests recall)
- **Causal**: summaries visible; full transitive causal chain highlighted

---

## 9. CSS & layout — critical rules

> **Full spec:** [`docs/VIEWER_LAYOUT.md`](./VIEWER_LAYOUT.md)  
> **Quick trap table:** [`AGENTS.md`](../AGENTS.md)

The viewer is a **viewport-locked app** (`100dvh`) with no document scroll. The layout contract:

| Container | Role |
|-----------|------|
| `html.viewer-phase`, `body`, `#root` | Lock height to viewport; `overflow: hidden` |
| `.app--viewer` | Flex column filling `#root` |
| `.viewer-shell` | Flex column below toolbar; **no** `overflow-y: auto` |
| `.viewer-main` | CSS Grid — row1 `auto` (timeline), row2 `minmax(0,1fr)` (lower) |
| `.viewer-chart-wrap` | Row 1; height = content height, no cap |
| `.viewer-lower` | Row 2; `min-height: 0` so internal scroll works |

**Five traps that have already burned us:**
1. `overflow-x: hidden/auto` + `overflow-y: visible` on the same node → Chromium forces `overflow-y: auto` → ghost scrollbar
2. `min-height: 100vh` on `body` without `min-height: 100dvh` → few-px document scroll
3. `.chart-bleed` with `100vw` inside the viewer → includes scrollbar width → horizontal overflow
4. `overflow-y: auto` on `.viewer-shell` → whole viewer scrolls like a page
5. `max-height` + `overflow-y: auto` on `.viewer-chart-wrap` → clips the timeline

After any layout change, verify: no document scrollbar, no ghost vertical scrollbar on chart/wrap, with and without selection, chrome expanded and collapsed, narrow (mobile) and wide (desktop), Chrome and Firefox.

---

## 10. Development workflow

```bash
# Install
npm install

# Dev server (hot reload, localhost:5173)
npm run dev

# Production build (tsc + vite build + copy index.html → 404.html for SPA routing)
npm run build

# Preview production build locally
npm run preview
```

Node 20+ required (matches CI).

Deployment is automatic: push to `master` → GitHub Actions builds and publishes to GitHub Pages.

---

## 11. Planned backend — AI features

The backend will live in a sibling `backend/` folder. Its purpose is to augment the frontend with AI-powered capabilities via the Claude API. Possible features (not all decided yet):

### 11.1 Conversational Q&A about the timeline
A RAG-style endpoint: the client sends a natural-language question; the backend retrieves relevant periods/events from the dataset (or a vector store), injects them as context, and returns a Claude-generated answer. The frontend displays it in the detail panel or a chat sidebar.

### 11.2 Causal chain narrative
Given a selected event, the backend walks the causal graph and asks Claude to produce a short prose explanation of the chain — more readable than bullet points alone.

### 11.3 Natural language filtering
User types "show me economic events after 1860" → backend parses intent with Claude → returns a filter spec `{ lanes: ["economico"], dateAfter: "1860-01-01" }` → frontend applies it.

### 11.4 Event enrichment / generation
Given a topic and date range, Claude generates a draft `TimelineEvent` object in the canonical JSON shape. A human reviews it before it enters the dataset. Useful for expanding coverage beyond 1916.

### 11.5 Study / quiz mode
In exam mode, the backend generates quiz questions about the selected event or period and evaluates free-text answers.

### 11.6 Planned API surface (sketch)

```
POST /api/ask           { question: string, context?: string[] } → { answer: string }
POST /api/explain-chain { eventTitle: string }                   → { narrative: string }
POST /api/parse-filter  { query: string }                        → FilterSpec
POST /api/draft-event   { topic: string, dateRange: [string, string] } → TimelineEvent
```

All endpoints should stream responses where possible (Claude supports streaming). The frontend uses `fetch` with `ReadableStream` or `EventSource`.

### 11.7 Data contract between frontend and backend

The backend must respect the same `TimelineEvent` / `Period` shape defined in `types.ts`. Shared types should be extracted into a `shared/` package or copied and kept in sync across both workspaces when the monorepo is set up.

---

## 12. File index (what to read first for common tasks)

| Task | Files |
|------|-------|
| Add / edit events or periods | `timelineHistoriaArgentina.ts`, `types.ts` |
| Touch viewer CSS | `docs/VIEWER_LAYOUT.md` → `src/App.css`, `src/index.css`, `src/ViewerLower.css` |
| Touch viewer DOM structure | `src/App.tsx`, `src/ViewerLower.tsx` |
| Change routing | `src/Router.tsx` |
| Change lane colors or icons | `eventLanes.ts`, `src/LaneGlyph.tsx` |
| Change causal logic | `causality.ts` |
| Change build / deploy | `vite.config.ts`, `.github/workflows/deploy.yml` |
| Add backend endpoint | `backend/` (not yet created) |
| Agent layout traps (quick) | `AGENTS.md` |
| Agent layout traps (full) | `docs/VIEWER_LAYOUT.md` |
