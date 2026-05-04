import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { timelineHistoriaArgentina } from "../timelineHistoriaArgentina";
import {
  causalEdgesInSet,
  causalHighlightSet,
  eventByIdMap,
  type StudyMode,
} from "../causality";
import { EVENT_LANE_ORDER, LANE_UI, type EventLaneId } from "../eventLanes";
import type { Period, Selection, TimelineEvent } from "../types";
import { useNavigate } from "react-router-dom";
import { SITE_INSTAGRAM_URL, KeyboardHelpModal } from "./shell";
import { EventEditorModal, ViewerDetailPanel, ViewerIndexPanel } from "./viewer";
/* Títulos de eventos: único modo vertical (layout+CSS); ver `timeline/eventLabelLayout.ts`. */
import {
  axisMarkLaneOffsetPx,
  assignAxisMarkLanes,
  assignEventLabelLanes,
  groupOverlappingEvents,
  readRootRemPx,
  verticalColumnWidthPx,
  axisTickAriaLabel,
  chooseAxisScaleDetail,
  chooseTimelineZoomMax,
  computeAxisShowYearFlags,
  formatHistoricalDate,
  formatHistoricalYear,
  formatHistoricalYearDate,
  mergeAxisMarks,
  TimelineSemanticEventLanes,
  TimelineEventTitlesLane,
  utcYearStartMs,
  type EventCluster,
  type AxisMark,
} from "./timeline";
import { AxisTickMark } from "./AxisTickMark";
import {
  TimelineEditionService,
  createTimelineRepo,
  type TimelineSummary,
  type TimelineEventDraft,
} from "./timelineEdition";
import { useThemeMode, type ThemeMode } from "./shell/theme";
import "./App.css";

const timelineRepo = createTimelineRepo();
const timelineEditionService = new TimelineEditionService(timelineRepo);

function formatDate(d: Date): string {
  return formatHistoricalDate(d);
}

function formatShortDate(d: Date): string {
  return formatHistoricalYearDate(d);
}

/**
 * Posición horizontal en la pista (0–100% del ancho del contenedor).
 * Deja márgenes laterales para etiquetas del eje y títulos en diagonal junto al primer/último evento.
 */
const TIMELINE_TRACK_INSET_LEFT_PCT = 7;
const TIMELINE_TRACK_INSET_RIGHT_PCT = 4;

/** Repositorio público del visor (icono en la barra del visor). */
const VIEWER_SOURCE_REPO_URL =
  "https://github.com/nicooga/argentina-timeline-poc";

const THEME_MODE_OPTIONS: readonly { id: ThemeMode; label: string }[] = [
  { id: "system", label: "Sistema" },
  { id: "light", label: "Claro" },
  { id: "dark", label: "Oscuro" },
];

const STUDY_MODE_OPTIONS: readonly { id: StudyMode; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "exam", label: "Examen" },
  { id: "causal", label: "Causal" },
];

function ThemeModeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") {
    return (
      <svg
        className="viewer-header-icon-svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 4V2m0 20v-2m5.66-13.66 1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2m14.07 7.07-1.41-1.41M6.34 6.34 4.93 4.93M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
        />
      </svg>
    );
  }
  if (mode === "dark") {
    return (
      <svg
        className="viewer-header-icon-svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 13.5A8.5 8.5 0 0 1 10.5 3 7 7 0 1 0 21 13.5Z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="viewer-header-icon-svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 5h16v10H4V5Zm5 14h6m-3-4v4"
      />
    </svg>
  );
}

function StudyModeIcon({ mode }: { mode: StudyMode }) {
  if (mode === "exam") {
    return (
      <svg
        className="viewer-header-icon-svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 11h6m-6 4h4m-7 6h12a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2Zm8-19v5h5"
        />
      </svg>
    );
  }
  if (mode === "causal") {
    return (
      <svg
        className="viewer-header-icon-svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 5a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm8 8a3 3 0 1 1-3 3 3 3 0 0 1 3-3ZM10.6 9.4l2.8 3.2"
        />
      </svg>
    );
  }
  return (
    <svg
      className="viewer-header-icon-svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function pctOnTrack(time: number, min: number, max: number): number {
  if (max <= min) return TIMELINE_TRACK_INSET_LEFT_PCT;
  const u = (time - min) / (max - min);
  const span =
    100 - TIMELINE_TRACK_INSET_LEFT_PCT - TIMELINE_TRACK_INSET_RIGHT_PCT;
  return TIMELINE_TRACK_INSET_LEFT_PCT + u * span;
}

function eventPointerTitle(e: TimelineEvent, mode: StudyMode): string {
  if (mode === "exam") return e.title;
  const tail = e.summary ?? e.items[0];
  return tail && tail !== e.title ? `${e.title} — ${tail}` : e.title;
}

/** Texto legible sobre un fondo en hex (#rgb o #rrggbb). */
/** Primer período en orden de datos cuya ventana incluye la fecha del evento (inclusive). */
function firstPeriodContainingDate(
  periods: Period[],
  date: Date
): Period | null {
  const t = date.getTime();
  for (const p of periods) {
    if (t >= p.start.getTime() && t <= p.end.getTime()) return p;
  }
  return null;
}

/** Último evento en orden cronológico con fecha estrictamente anterior a `tMs`. */
function lastEventBeforeSorted(
  eventsSorted: TimelineEvent[],
  tMs: number
): TimelineEvent | null {
  let last: TimelineEvent | null = null;
  for (const e of eventsSorted) {
    if (e.date.getTime() < tMs) last = e;
    else break;
  }
  return last;
}

/** Primer evento en orden cronológico con fecha >= `tMs`. */
function firstEventFromSorted(
  eventsSorted: TimelineEvent[],
  tMs: number
): TimelineEvent | null {
  for (const e of eventsSorted) {
    if (e.date.getTime() >= tMs) return e;
  }
  return null;
}

/** Primer evento cronológico cuya fecha cae dentro del período (inclusive). */
function firstEventInPeriod(
  eventsSorted: TimelineEvent[],
  period: Period
): TimelineEvent | null {
  const t0 = period.start.getTime();
  const t1 = period.end.getTime();
  for (const e of eventsSorted) {
    const te = e.date.getTime();
    if (te >= t0 && te <= t1) return e;
  }
  return null;
}

/** Selección inicial del visor: primer evento en orden cronológico. */
function defaultEventSelection(events: TimelineEvent[]): Selection {
  if (events.length === 0) return null;
  const first = [...events].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )[0]!;
  return { kind: "event", item: first };
}

function foregroundForHex(hex: string): string {
  const navy = "#102033";
  const wheat = "#fff8ec";
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length !== 3 && raw.length !== 6) return "var(--text)";
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return "var(--text)";
  const luminance = (value: number) => {
    const r = (value >> 16) & 0xff;
    const g = (value >> 8) & 0xff;
    const b = value & 0xff;
    const lin = [r, g, b].map((c) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  };
  const contrast = (a: number, b: number) => {
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    return (hi + 0.05) / (lo + 0.05);
  };
  const bgL = luminance(n);
  const navyL = luminance(Number.parseInt(navy.replace(/^#/, ""), 16));
  const wheatL = luminance(Number.parseInt(wheat.replace(/^#/, ""), 16));
  return contrast(bgL, navyL) >= contrast(bgL, wheatL) ? navy : wheat;
}

/** Contenedor con scroll vertical bajo el foco (p. ej. listas de la leyenda). */
function findVerticalScrollContainer(el: HTMLElement | null): HTMLElement | null {
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const st = window.getComputedStyle(n);
    const oy = st.overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      n.scrollHeight > n.clientHeight + 2
    ) {
      return n;
    }
  }
  return null;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** Debe coincidir con altura de `.row-bar` y `margin-bottom` de `.period-row` en App.css */
const ROW_BAR_REM = 2.25;
const ROW_MARGIN_REM = 0.1;
/** Fallback si no hay `--period-compact-row-h` (alineado con `lo` en `lerpPeriodRowRemFromDriver`) */
const ROW_BAR_REM_COMPACT = 0.56;
const ROW_MARGIN_REM_COMPACT = 0;

/**
 * Convierte una dimensión del viewport (en rems de raíz) en valor para interpolar el alto del
 * período. Hasta ~56rem (móvil + tablet tipo iPad en portrait) el resultado vive en el mismo
 * rango que un teléfono, así el carril se ve casi tan bajo en tablet como en mobile; recién
 * después sube para portátiles / monitores.
 */
function periodRowDriverRem(vminLikeInRem: number): number {
  const v = vminLikeInRem;
  if (v <= 56) {
    return 12 + (v / 56) * 11.5;
  }
  if (v < 80) {
    const at56 = 12 + 11.5;
    return at56 + (v - 56) * 1.15;
  }
  const at80 = 12 + 11.5 + 24 * 1.15;
  return Math.min(at80 + (v - 80) * 1.08, 100);
}

function lerpPeriodRowRemFromDriver(
  driverInRem: number,
  pointerCoarse: boolean
): number {
  const lo = pointerCoarse ? 0.74 : 0.56;
  const hi = pointerCoarse ? 1.92 : 1.66;
  /* Por encima de ~20 el carril crece poco hasta ~68 (tablet queda casi en `lo` como el móvil) */
  const start = 20;
  const end = pointerCoarse ? 76 : 68;
  if (driverInRem <= start) return lo;
  if (driverInRem >= end) return hi;
  return lo + ((hi - lo) * (driverInRem - start)) / (end - start);
}

function periodRowCenterFromTopRem(
  rowIndex: number,
  compact: boolean,
  /** Alto de carril compacto en rem (sincronizado con `--period-compact-row-h`). */
  compactLaneHeightRem: number = ROW_BAR_REM_COMPACT
): number {
  const bar = compact ? compactLaneHeightRem : ROW_BAR_REM;
  const margin = compact ? ROW_MARGIN_REM_COMPACT : ROW_MARGIN_REM;
  return rowIndex * (bar + margin) + bar / 2;
}

/** Asigna carril por período: mismo carril si no se solapan en el tiempo (orden por inicio). */
function assignPeriodLanes(periods: Period[]): {
  laneByIndex: number[];
  laneCount: number;
} {
  const n = periods.length;
  if (n === 0) return { laneByIndex: [], laneCount: 0 };

  const order = periods
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        a.p.start.getTime() - b.p.start.getTime() ||
        a.p.end.getTime() - b.p.end.getTime()
    );

  const laneByIndex = new Array<number>(n);
  const laneEndMs: number[] = [];

  for (const { p, i } of order) {
    const start = p.start.getTime();
    const end = p.end.getTime();
    let lane = -1;
    for (let L = 0; L < laneEndMs.length; L++) {
      if (laneEndMs[L] <= start) {
        lane = L;
        laneEndMs[L] = end;
        break;
      }
    }
    if (lane < 0) {
      lane = laneEndMs.length;
      laneEndMs.push(end);
    }
    laneByIndex[i] = lane;
  }

  return { laneByIndex, laneCount: laneEndMs.length };
}

/** 0 | 1 según la década (años …0–…9), estable con años negativos. */
function axisBandStripeIndex(bandStartYear: number, bandYears: number): 0 | 1 {
  const k = Math.floor(bandStartYear / bandYears);
  return (((k % 2) + 2) % 2) as 0 | 1;
}

/** Franjas temporales recortadas al rango del eje, para colores alternos. */
function axisDecadeBands(
  minMs: number,
  maxMs: number,
  bandYears: number
): {
  key: string;
  leftPct: number;
  widthPct: number;
  stripe: 0 | 1;
  decadeLabel: string;
  bandStartYear: number;
}[] {
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs) || maxMs <= minMs) {
    return [];
  }
  const yMin = new Date(minMs).getUTCFullYear();
  const yMax = new Date(maxMs).getUTCFullYear();
  const dStart = Math.floor(yMin / bandYears) * bandYears;
  const out: {
    key: string;
    leftPct: number;
    widthPct: number;
    stripe: 0 | 1;
    decadeLabel: string;
    bandStartYear: number;
  }[] = [];
  for (let D = dStart; D <= yMax; D += bandYears) {
    const t0 = utcYearStartMs(D);
    const t1 = utcYearStartMs(D + bandYears);
    const segLo = Math.max(minMs, t0);
    const segHi = Math.min(maxMs, t1);
    if (segHi <= segLo) continue;
    const leftPct = pctOnTrack(segLo, minMs, maxMs);
    const rightPct = pctOnTrack(segHi, minMs, maxMs);
    const widthPct = Math.max(0, rightPct - leftPct);
    if (widthPct <= 0) continue;
    out.push({
      key: `band-${D}-${bandYears}`,
      leftPct,
      widthPct,
      stripe: axisBandStripeIndex(D, bandYears),
      decadeLabel: axisBandLabel(D, bandYears),
      bandStartYear: D,
    });
  }
  return out;
}

function toRomanNumerals(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let out = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]!) { out += syms[i]; n -= vals[i]!; }
  }
  return out;
}

function formatCenturyLabel(bandStartYear: number): string {
  if (bandStartYear >= 0) {
    return `s. ${toRomanNumerals(Math.floor(bandStartYear / 100) + 1)}`;
  }
  return `s. ${toRomanNumerals(Math.floor(-bandStartYear / 100))} a.C.`;
}

/**
 * Instantes del 1 ene (UTC) dentro de [minMs, maxMs] para micro-marcas del eje;
 * `major`: cada franja temporal principal el trazo es un poco más alto.
 */
function yearAxisMicroTicks(
  minMs: number,
  maxMs: number,
  tickYears: number,
  bandYears: number
): { t: number; major: boolean; isCentury: boolean; stripe: 0 | 1 }[] {
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs) || maxMs <= minMs) {
    return [];
  }
  let yStart = new Date(minMs).getUTCFullYear();
  yStart = Math.ceil(yStart / tickYears) * tickYears;
  const firstJan = utcYearStartMs(yStart);
  if (firstJan < minMs) yStart += tickYears;
  const yEnd = new Date(maxMs).getUTCFullYear();
  const out: { t: number; major: boolean; isCentury: boolean; stripe: 0 | 1 }[] = [];
  for (let y = yStart; y <= yEnd; y += tickYears) {
    const t = utcYearStartMs(y);
    if (t >= minMs && t <= maxMs) {
      const bandStart = Math.floor(y / bandYears) * bandYears;
      out.push({
        t,
        major: y % bandYears === 0,
        isCentury: bandYears < 100 && y % 100 === 0,
        stripe: axisBandStripeIndex(bandStart, bandYears),
      });
    }
  }
  return out;
}

function axisBandLabel(startYear: number, bandYears: number): string {
  const bandStartYear = Math.floor(startYear / bandYears) * bandYears;
  return formatHistoricalYear(bandStartYear);
}

/** Zoom horizontal del timeline (Ctrl + rueda). 1 = ancho base en CSS. */
const TIMELINE_ZOOM_MIN = 0.35;
const TIMELINE_ZOOM_DEFAULT_MAX = 14;
const TIMELINE_ZOOM_STEP = 1.085;

/** Ancho visual de la barra de escala (px); el texto indica el lapso temporal que cubre. */
const SCALE_BAR_PX = 112;

/** Viewport “tablet” para el visor: barras colapsadas al entrar. */
const VIEWER_TABLET_MQ = "(max-width: 1024px)";

function viewerIsTabletViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(VIEWER_TABLET_MQ).matches;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Slider 0…1 ↔ zoom (escala log para que el control se sienta natural). */
function zoomFromSliderT(t: number, maxZoom: number): number {
  const tt = clamp(t, 0, 1);
  const lo = Math.log(TIMELINE_ZOOM_MIN);
  const hi = Math.log(maxZoom);
  return Math.exp(lo + tt * (hi - lo));
}

function sliderTFromZoom(z: number, maxZoom: number): number {
  const lo = Math.log(TIMELINE_ZOOM_MIN);
  const hi = Math.log(maxZoom);
  const lz = Math.log(clamp(z, TIMELINE_ZOOM_MIN, maxZoom));
  return clamp((lz - lo) / (hi - lo), 0, 1);
}

function formatZoomFactorUi(z: number, maxZoom: number): string {
  const c = clamp(z, TIMELINE_ZOOM_MIN, maxZoom);
  if (c >= 10) return `×${Math.round(c)}`;
  const r = Math.round(c * 10) / 10;
  const s = Number.isInteger(r) ? String(r) : String(r).replace(".", ",");
  return `×${s}`;
}

function touchPinchDistance(touches: TouchList): number {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/** Posición X del punto medio del pellizco respecto al borde izquierdo visible del contenedor. */
function touchPinchMidViewportX(scrollEl: HTMLElement, touches: TouchList): number {
  const r = scrollEl.getBoundingClientRect();
  const mx = (touches[0].clientX + touches[1].clientX) / 2;
  return mx - r.left;
}

/** Lapso aproximado representado por `ms`, para la leyenda tipo mapa (es-AR). */
function formatApproxTimeSpan(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const day = 86_400_000;
  const year = 365.25 * day;
  const month = year / 12;
  if (ms >= year) {
    const y = ms / year;
    if (y >= 10) return `≈ ${Math.round(y)} años`;
    const rounded = y >= 2 ? Math.round(y) : Math.round(y * 10) / 10;
    const unit = rounded === 1 ? "año" : "años";
    return `≈ ${String(rounded).replace(".", ",")} ${unit}`;
  }
  if (ms >= month * 1.5) {
    const m = ms / month;
    const rounded = Math.max(1, Math.round(m));
    return `≈ ${rounded} ${rounded === 1 ? "mes" : "meses"}`;
  }
  if (ms >= day) {
    const d = ms / day;
    const rounded = Math.max(1, Math.round(d));
    return `≈ ${rounded} ${rounded === 1 ? "día" : "días"}`;
  }
  const h = ms / 3_600_000;
  const rounded = Math.max(1, Math.round(h));
  return `≈ ${rounded} ${rounded === 1 ? "hora" : "horas"}`;
}

export default function App() {
  const [timeline, setTimeline] = useState(() => timelineHistoriaArgentina);
  const [timelineSummaries, setTimelineSummaries] = useState<TimelineSummary[]>([]);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [timelineTitle, setTimelineTitle] = useState("Historia Argentina");
  const [timelineDescription, setTimelineDescription] = useState<string | null>(null);
  const [timelineApiStatus, setTimelineApiStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const { periods, events } = timeline;

  const { min, max } = useMemo(() => {
    const times: number[] = [];
    for (const p of periods) {
      times.push(p.start.getTime(), p.end.getTime());
    }
    for (const e of events) {
      times.push(e.date.getTime());
    }
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [periods, events]);

  const eventsSorted = useMemo(
    () => [...events].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events]
  );

  useEffect(() => {
    setSel((current) => {
      if (current == null) return defaultEventSelection(eventsSorted);
      if (current.kind === "event") {
        const fresh = eventsSorted.find((e) => e.id === current.item.id);
        return fresh ? { kind: "event", item: fresh } : defaultEventSelection(eventsSorted);
      }
      const freshPeriod = periods.find((p) => p.title === current.item.title);
      return freshPeriod ? { kind: "period", item: freshPeriod } : current;
    });
  }, [eventsSorted, periods]);

  const axisMarks = useMemo(
    () => mergeAxisMarks(periods, events),
    [periods, events]
  );

  const { laneByIndex, periodIndicesByLane } = useMemo(() => {
    const { laneByIndex: lanes, laneCount } = assignPeriodLanes(periods);
    const periodIndicesByLane: number[][] = Array.from(
      { length: laneCount },
      () => []
    );
    for (let i = 0; i < periods.length; i++) {
      periodIndicesByLane[lanes[i]].push(i);
    }
    return { laneByIndex: lanes, periodIndicesByLane };
  }, [periods]);

  const navigate = useNavigate();
  const [sel, setSel] = useState<Selection>(() =>
    defaultEventSelection(timelineHistoriaArgentina.events)
  );
  const [editorState, setEditorState] = useState<
    | { kind: "create" }
    | { kind: "edit"; event: TimelineEvent }
    | null
  >(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [viewerHeaderCollapsed, setViewerHeaderCollapsed] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [studyMenuOpen, setStudyMenuOpen] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [cursorPct, setCursorPct] = useState<number | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>("normal");
  const [themeMode, setThemeMode] = useThemeMode();
  const [laneVisibility, setLaneVisibility] = useState<
    Record<EventLaneId, boolean>
  >(
    () =>
      Object.fromEntries(
        EVENT_LANE_ORDER.map((id) => [id, true])
      ) as Record<EventLaneId, boolean>
  );
  const [stackWidthPx, setStackWidthPx] = useState<number | null>(null);
  const [scrollViewportWidthPx, setScrollViewportWidthPx] = useState<number | null>(
    null
  );
  const timelineZoomMax = useMemo(
    () =>
      chooseTimelineZoomMax(
        min,
        max,
        stackWidthPx == null ? null : stackWidthPx / timelineZoom,
        scrollViewportWidthPx,
        TIMELINE_ZOOM_DEFAULT_MAX
      ),
    [min, max, stackWidthPx, timelineZoom, scrollViewportWidthPx]
  );
  const axisScaleDetail = useMemo(
    () => chooseAxisScaleDetail(min, max, stackWidthPx),
    [min, max, stackWidthPx]
  );
  const axisYearMicroTicks = useMemo(
    () =>
      yearAxisMicroTicks(
        min,
        max,
        axisScaleDetail.microTickYears,
        axisScaleDetail.bandYears
      ),
    [min, max, axisScaleDetail]
  );
  const axisDecadeBandRects = useMemo(
    () => axisDecadeBands(min, max, axisScaleDetail.bandYears),
    [min, max, axisScaleDetail]
  );
  const axisCenturyBandRects = useMemo(
    () =>
      axisScaleDetail.bandYears < 100
        ? axisDecadeBands(min, max, 100).map((b) => ({
            ...b,
            centuryLabel: formatCenturyLabel(b.bandStartYear),
          }))
        : [],
    [min, max, axisScaleDetail]
  );
  const [layoutProbe, setLayoutProbe] = useState(() => ({
    vminPx:
      typeof window !== "undefined"
        ? Math.min(window.innerWidth, window.innerHeight)
        : 480,
    vhPx:
      typeof window !== "undefined" ? window.innerHeight : 800,
    rootPx: 16,
  }));
  const [pointerCoarse, setPointerCoarse] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches
  );

  const loadTimeline = useCallback(async (timelineId: string) => {
    setTimelineApiStatus("loading");
    const record = await timelineRepo.get(timelineId);
    setSelectedTimelineId(record.id);
    setTimelineTitle(record.title);
    setTimelineDescription(record.description);
    setTimeline(record.timeline);
    setSel(defaultEventSelection(record.timeline.events));
    setTimelineApiStatus("ready");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialTimeline() {
      try {
        setTimelineApiStatus("loading");
        const summaries = await timelineRepo.list();
        if (cancelled) return;
        setTimelineSummaries(summaries);
        const first = summaries.find((item) => item.id === "argentina-history") ?? summaries[0];
        if (!first) {
          setTimelineApiStatus("error");
          return;
        }
        const record = await timelineRepo.get(first.id);
        if (cancelled) return;
        setSelectedTimelineId(record.id);
        setTimelineTitle(record.title);
        setTimelineDescription(record.description);
        setTimeline(record.timeline);
        setSel(defaultEventSelection(record.timeline.events));
        setTimelineApiStatus("ready");
      } catch (error) {
        console.error("Could not load timeline from API", error);
        if (!cancelled) setTimelineApiStatus("error");
      }
    }
    loadInitialTimeline();
    return () => {
      cancelled = true;
    };
  }, []);

  const axisShowYearFlags = useMemo(
    () => computeAxisShowYearFlags(axisMarks),
    [axisMarks]
  );

  const axisShowYearByT = useMemo(() => {
    const m = new Map<number, boolean>();
    axisMarks.forEach((mk, i) => {
      m.set(mk.t, axisShowYearFlags[i]!);
    });
    return m;
  }, [axisMarks, axisShowYearFlags]);

  const eventClusters = useMemo((): EventCluster[] => {
    if (!stackWidthPx || stackWidthPx <= 0) return [];
    const trackPct = (tMs: number) => pctOnTrack(tMs, min, max);
    const colPx = verticalColumnWidthPx(pointerCoarse, readRootRemPx());
    return groupOverlappingEvents(
      eventsSorted,
      [{ lane: 0, anchor: "center", maxWidthPx: 160, columnPx: colPx }],
      trackPct,
      stackWidthPx
    ).clusters;
  }, [eventsSorted, min, max, stackWidthPx, pointerCoarse]);

  const axisMarksPlaced = useMemo(() => {
    const tPct = (tMs: number) => pctOnTrack(tMs, min, max);

    const clusteredTs = new Set(
      eventClusters.flatMap((c) => c.events.map((e) => e.date.getTime()))
    );
    const filtered = axisMarks.filter((m) => !clusteredTs.has(m.t));

    const rangeMarks: AxisMark[] = eventClusters.map((c) => ({
      t: Math.round((c.minMs + c.maxMs) / 2),
      year: c.rangeLabel,
      monthDay: "",
      rangeLabel: c.rangeLabel,
    }));

    const augmented = [...filtered, ...rangeMarks].sort((a, b) => a.t - b.t);

    const showYear = new Map<number, boolean>(axisShowYearByT);
    for (const rm of rangeMarks) showYear.set(rm.t, true);

    return assignAxisMarkLanes(augmented, tPct, showYear, stackWidthPx);
  }, [axisMarks, min, max, axisShowYearByT, stackWidthPx, eventClusters]);

  const axisMarkMaxLaneOffsetPx = useMemo(
    () =>
      axisMarksPlaced.reduce(
        (maxOffset, item) =>
          Math.max(maxOffset, axisMarkLaneOffsetPx(item.lane)),
        0
      ),
    [axisMarksPlaced]
  );

  useEffect(() => {
    const sync = () => {
      const rootPx =
        parseFloat(getComputedStyle(document.documentElement).fontSize) ||
        16;
      setLayoutProbe({
        vminPx: Math.min(window.innerWidth, window.innerHeight),
        vhPx: window.innerHeight,
        rootPx,
      });
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  /**
   * Alto de carril de período (rem): tablet comparte el mismo “bucket” de driver que móvil
   * (casi el mismo alto); monitores grandes siguen cómodos. `min(driver(vmin), driver(vh))`
   * respeta ventanas bajas o poco alto útil.
   */
  const compactPeriodRowRem = useMemo(() => {
    const { vminPx, vhPx, rootPx } = layoutProbe;
    const vminInRem = vminPx / rootPx;
    const vhInRem = vhPx / rootPx;
    const driver = Math.min(
      periodRowDriverRem(vminInRem),
      periodRowDriverRem(vhInRem)
    );
    return lerpPeriodRowRemFromDriver(driver, pointerCoarse);
  }, [layoutProbe, pointerCoarse]);

  const activePeriodForTimeline = useMemo((): Period | null => {
    if (sel == null) return null;
    if (sel.kind === "period") return sel.item;
    return firstPeriodContainingDate(periods, sel.item.date);
  }, [sel, periods]);

  const eventStepAvailability = useMemo(() => {
    if (sel == null) return { canPrev: false, canNext: false };
    if (sel.kind === "event") {
      const idx = eventsSorted.findIndex((e) => e.id === sel.item.id);
      return {
        canPrev: idx > 0,
        canNext: idx >= 0 && idx < eventsSorted.length - 1,
      };
    }
    const t0 = sel.item.start.getTime();
    return {
      canPrev: lastEventBeforeSorted(eventsSorted, t0) != null,
      canNext: firstEventFromSorted(eventsSorted, t0) != null,
    };
  }, [sel, eventsSorted]);

  const stepEvent = useCallback(
    (delta: -1 | 1) => {
      setSel((cur) => {
        if (cur == null) return cur;
        if (cur.kind === "event") {
          const idx = eventsSorted.findIndex((e) => e.id === cur.item.id);
          if (idx < 0) return cur;
          const nextIdx = idx + delta;
          if (nextIdx < 0 || nextIdx >= eventsSorted.length) return cur;
          return { kind: "event", item: eventsSorted[nextIdx]! };
        }
        const t0 = cur.item.start.getTime();
        if (delta === -1) {
          const e = lastEventBeforeSorted(eventsSorted, t0);
          return e != null ? { kind: "event", item: e } : cur;
        }
        const e = firstEventFromSorted(eventsSorted, t0);
        return e != null ? { kind: "event", item: e } : cur;
      });
    },
    [eventsSorted]
  );

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const timelineStackRef = useRef<HTMLDivElement>(null);
  const timelineSelectedPeriodBarRef = useRef<HTMLButtonElement | null>(null);
  const timelineSelectedEventDotRef = useRef<HTMLButtonElement | null>(null);
  /** Lectura síncrona del zoom en listeners nativos (pellizco). */
  const timelineZoomRef = useRef(timelineZoom);
  timelineZoomRef.current = timelineZoom;
  /** Cancela el arrastre horizontal si empieza un pellizco con dos dedos. */
  const cancelTimelineDragRef = useRef<(() => void) | null>(null);
  const pinchStateRef = useRef<{
    startDist: number;
    startZoom: number;
  } | null>(null);
  const pendingZoomAnchorRef = useRef<{
    frac: number;
    viewportX: number;
  } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setPointerCoarse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const tablet = viewerIsTabletViewport();
    setViewerHeaderCollapsed(false);
    setIndexOpen(false);
    setDetailCollapsed(tablet);
  }, []);

  /** Sin esto, a veces `html:has(.app--viewer)` no aplica a tiempo; `viewer-phase` fija el layout al viewport sin scroll del documento. */
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("viewer-phase");
    return () => {
      root.classList.remove("viewer-phase");
    };
  }, []);

  const eventLabelPlacements = useMemo(() => {
    const trackPct = (tMs: number) => pctOnTrack(tMs, min, max);
    const { placements } = assignEventLabelLanes(
      eventsSorted,
      trackPct,
      stackWidthPx,
      true,
      pointerCoarse,
      true,
      layoutProbe.vhPx
    );
    return placements;
  }, [
    eventsSorted,
    min,
    max,
    stackWidthPx,
    pointerCoarse,
    layoutProbe.vhPx,
  ]);

  const laneColorCssVars = useMemo((): CSSProperties => {
    const o: Record<string, string> = {};
    for (const id of EVENT_LANE_ORDER) {
      o[`--lane-${id}`] = LANE_UI[id].color;
    }
    return o as CSSProperties;
  }, []);

  const eventsById = useMemo(
    () => eventByIdMap(eventsSorted),
    [eventsSorted]
  );

  const causalHighlight = useMemo(() => {
    if (sel?.kind !== "event") return new Set<TimelineEvent>();
    return causalHighlightSet(sel.item, eventsById, studyMode);
  }, [sel, eventsById, studyMode]);

  const causalChainSet = useMemo(() => {
    const s = new Set(causalHighlight);
    if (sel?.kind === "event") s.add(sel.item);
    return s;
  }, [causalHighlight, sel]);

  const causalitySvgEdges = useMemo(() => {
    if (studyMode === "exam") return [];
    return causalEdgesInSet(causalChainSet, eventsById);
  }, [studyMode, causalChainSet, eventsById]);

  const eventPassesLaneFilter = useCallback(
    (ev: TimelineEvent) => ev.lanes.some((l) => laneVisibility[l]),
    [laneVisibility]
  );

  const toggleLaneVisibility = useCallback((id: EventLaneId) => {
    setLaneVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!EVENT_LANE_ORDER.some((l) => next[l])) return prev;
      return next;
    });
  }, []);

  const loadSelectedTimeline = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      const timelineId = event.target.value;
      if (!timelineId) return;
      try {
        await loadTimeline(timelineId);
      } catch (error) {
        console.error("Could not switch timeline", error);
        setTimelineApiStatus("error");
      }
    },
    [loadTimeline]
  );

  const createTimelineCopy = useCallback(async () => {
    try {
      setTimelineApiStatus("loading");
      const record = await timelineRepo.create({
        title: `${timelineTitle} copia`,
        description: timelineDescription,
        timeline,
      });
      setTimelineSummaries(await timelineRepo.list());
      setSelectedTimelineId(record.id);
      setTimelineTitle(record.title);
      setTimelineDescription(record.description);
      setTimeline(record.timeline);
      setSel(defaultEventSelection(record.timeline.events));
      setTimelineApiStatus("ready");
    } catch (error) {
      console.error("Could not create timeline copy", error);
      setTimelineApiStatus("error");
    }
  }, [timeline, timelineDescription, timelineTitle]);

  const saveNewEvent = useCallback(async (draft: TimelineEventDraft) => {
    if (!selectedTimelineId) return;
    const result = await timelineEditionService.createEvent(selectedTimelineId, draft);
    setTimeline(result.timeline);
    if (result.event) setSel({ kind: "event", item: result.event });
    setEditorState(null);
    setDetailCollapsed(false);
  }, [selectedTimelineId]);

  const saveEditedEvent = useCallback(
    async (eventId: string, draft: TimelineEventDraft) => {
      if (!selectedTimelineId) return;
      const result = await timelineEditionService.updateEvent(
        selectedTimelineId,
        eventId,
        draft
      );
      setTimeline(result.timeline);
      if (result.event) setSel({ kind: "event", item: result.event });
      setEditorState(null);
      setDetailCollapsed(false);
    },
    [selectedTimelineId]
  );

  const deleteSelectedEvent = useCallback(
    async (event: TimelineEvent) => {
      if (!selectedTimelineId) return;
      if (!window.confirm(`¿Eliminar "${event.title}"?`)) return;
      const result = await timelineEditionService.deleteEvent(
        selectedTimelineId,
        event.id
      );
      setTimeline(result.timeline);
      const sorted = [...result.timeline.events].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      const deletedTime = event.date.getTime();
      const next =
        firstEventFromSorted(sorted, deletedTime) ??
        lastEventBeforeSorted(sorted, deletedTime);
      setSel(next ? { kind: "event", item: next } : null);
      setDetailCollapsed(next == null);
    },
    [selectedTimelineId]
  );

  useLayoutEffect(() => {
    if (sel == null) return;
    const el =
      sel.kind === "period"
        ? timelineSelectedPeriodBarRef.current
        : timelineSelectedEventDotRef.current;
    if (!el) return;
    const smoothScroll =
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: smoothScroll ? "smooth" : "auto",
      block: "nearest",
      inline: "center",
    });
  }, [sel, timelineZoom]);

  const viewerShellClass = [
    sel === null ? "" : "viewer-shell--sel-compact",
    studyMode === "causal" ? "viewer-shell--study-causal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const rangeMs = max - min;

  const scaleBarLabel = useMemo(() => {
    if (stackWidthPx == null || stackWidthPx <= 0 || rangeMs <= 0) return "—";
    const msForBar = (rangeMs / stackWidthPx) * SCALE_BAR_PX;
    return formatApproxTimeSpan(msForBar);
  }, [stackWidthPx, rangeMs]);

  useEffect(() => {
    const el = timelineStackRef.current;
    const scrollEl = timelineScrollRef.current;
    if (!el) return;
    const updateMetrics = () => {
      setStackWidthPx(el.offsetWidth);
      setScrollViewportWidthPx(scrollEl?.clientWidth ?? null);
    };
    const ro = new ResizeObserver(updateMetrics);
    ro.observe(el);
    if (scrollEl) ro.observe(scrollEl);
    updateMetrics();
    return () => ro.disconnect();
  }, [timelineZoom]);

  useEffect(() => {
    setTimelineZoom((z) => clamp(z, TIMELINE_ZOOM_MIN, timelineZoomMax));
  }, [timelineZoomMax]);

  useLayoutEffect(() => {
    const pending = pendingZoomAnchorRef.current;
    const scrollEl = timelineScrollRef.current;
    if (!pending || !scrollEl) return;
    pendingZoomAnchorRef.current = null;
    const sw = scrollEl.scrollWidth;
    if (sw <= 0) return;
    const nextLeft = pending.frac * sw - pending.viewportX;
    scrollEl.scrollLeft = clamp(
      nextLeft,
      0,
      Math.max(0, sw - scrollEl.clientWidth)
    );
  }, [timelineZoom]);

  const setTimelineZoomCentered = useCallback((next: number) => {
    const z1 = clamp(next, TIMELINE_ZOOM_MIN, timelineZoomMax);
    const scrollEl = timelineScrollRef.current;
    if (scrollEl) {
      const viewportX = scrollEl.clientWidth / 2;
      const frac =
        (viewportX + scrollEl.scrollLeft) / Math.max(1, scrollEl.scrollWidth);
      pendingZoomAnchorRef.current = { frac, viewportX };
    }
    setTimelineZoom(z1);
  }, [timelineZoomMax]);

  const onClusterClick = useCallback(
    (cluster: EventCluster) => {
      const scrollEl = timelineScrollRef.current;
      if (!scrollEl || stackWidthPx == null || stackWidthPx <= 0) return;

      const colPx =
        eventLabelPlacements[0]?.columnPx ??
        verticalColumnWidthPx(pointerCoarse, readRootRemPx());

      // Porcentaje mínimo entre eventos adyacentes del cluster (escala-invariante)
      const pcts = cluster.events
        .map((e) => pctOnTrack(e.date.getTime(), min, max))
        .sort((a, b) => a - b);
      let pctDiffMin = Infinity;
      for (let i = 1; i < pcts.length; i++) {
        pctDiffMin = Math.min(pctDiffMin, pcts[i]! - pcts[i - 1]!);
      }

      // Threshold consistente con groupOverlappingEvents: (col + gap) / stackPx * 100
      // Necesitamos stackPx_new tal que (col+gap)/stackPx_new*100 < pctDiffMin / safety
      const CLUSTER_GAP_PX = 4;
      const SAFETY = 1.5;

      let newZoom: number;
      if (pctDiffMin <= 0) {
        // Misma fecha: no se pueden separar, ir al máximo
        newZoom = timelineZoomMax;
      } else {
        const requiredStackPx = ((colPx + CLUSTER_GAP_PX) * 100 * SAFETY) / pctDiffMin;
        const baseContainerPx = stackWidthPx / timelineZoom;
        newZoom = clamp(requiredStackPx / baseContainerPx, TIMELINE_ZOOM_MIN, timelineZoomMax);
      }

      pendingZoomAnchorRef.current = {
        frac: cluster.centerPct / 100,
        viewportX: scrollEl.clientWidth / 2,
      };
      setTimelineZoom(newZoom);
    },
    [
      timelineZoom,
      timelineZoomMax,
      stackWidthPx,
      pointerCoarse,
      eventLabelPlacements,
      min,
      max,
    ]
  );

  const onZoomSliderChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const t = Number(e.target.value) / 1000;
      setTimelineZoomCentered(zoomFromSliderT(t, timelineZoomMax));
    },
    [setTimelineZoomCentered, timelineZoomMax]
  );

  const onZoomNudge = useCallback(
    (direction: 1 | -1) => {
      setTimelineZoom((z0) => {
        const t0 = sliderTFromZoom(z0, timelineZoomMax);
        const z1 = zoomFromSliderT(
          clamp(t0 + 0.045 * direction, 0, 1),
          timelineZoomMax
        );
        const scrollEl = timelineScrollRef.current;
        if (scrollEl) {
          const viewportX = scrollEl.clientWidth / 2;
          const frac =
            (viewportX + scrollEl.scrollLeft) /
            Math.max(1, scrollEl.scrollWidth);
          pendingZoomAnchorRef.current = { frac, viewportX };
        }
        return z1;
      });
    },
    [timelineZoomMax]
  );

  const zoomSliderValue = Math.round(
    sliderTFromZoom(timelineZoom, timelineZoomMax) * 1000
  );

  const onTimelineWheelRef = useRef<(e: WheelEvent) => void>(() => {});
  onTimelineWheelRef.current = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const scrollEl = timelineScrollRef.current;
    if (!scrollEl) return;

    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= scrollEl.clientHeight;

    const direction = dy < 0 ? 1 : -1;
    const steps = clamp(Math.abs(dy) / 100, 0.35, 4);
    const factor = Math.pow(TIMELINE_ZOOM_STEP, direction * steps);

    setTimelineZoom((z0) => {
      const z1 = clamp(z0 * factor, TIMELINE_ZOOM_MIN, timelineZoomMax);
      if (Math.abs(z1 - z0) < 1e-9) return z0;

      const rect = scrollEl.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const frac =
        (viewportX + scrollEl.scrollLeft) / Math.max(1, scrollEl.scrollWidth);
      pendingZoomAnchorRef.current = { frac, viewportX };
      return z1;
    });
  };

  useEffect(() => {
    const scrollEl = timelineScrollRef.current;
    if (!scrollEl) return;
    const handler = (ev: WheelEvent) => onTimelineWheelRef.current(ev);
    scrollEl.addEventListener("wheel", handler, { passive: false });
    return () => scrollEl.removeEventListener("wheel", handler);
  }, []);

  useEffect(() => {
    const scrollEl = timelineScrollRef.current;
    if (!scrollEl) return;

    const MIN_PINCH_SPAN = 28;

    const onTouchStart = (e: TouchEvent) => {
      /* Solo al pasar a exactamente dos dedos: evita reiniciar si entra un tercer dedo. */
      if (e.touches.length !== 2) return;
      cancelTimelineDragRef.current?.();
      const d = Math.max(MIN_PINCH_SPAN, touchPinchDistance(e.touches));
      pinchStateRef.current = {
        startDist: d,
        startZoom: timelineZoomRef.current,
      };
      scrollEl.classList.add("timeline-scroll--pinching");
    };

    const onTouchMove = (e: TouchEvent) => {
      const p = pinchStateRef.current;
      if (!p || e.touches.length < 2) return;
      e.preventDefault();
      const dist = Math.max(MIN_PINCH_SPAN, touchPinchDistance(e.touches));
      const ratio = dist / p.startDist;
      const z1 = clamp(
        p.startZoom * ratio,
        TIMELINE_ZOOM_MIN,
        timelineZoomMax
      );
      const viewportX = touchPinchMidViewportX(scrollEl, e.touches);
      const frac =
        (viewportX + scrollEl.scrollLeft) / Math.max(1, scrollEl.scrollWidth);
      pendingZoomAnchorRef.current = { frac, viewportX };
      setTimelineZoom(z1);
    };

    const endPinch = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStateRef.current = null;
        scrollEl.classList.remove("timeline-scroll--pinching");
      }
    };

    scrollEl.addEventListener("touchstart", onTouchStart, {
      capture: true,
      passive: true,
    });
    scrollEl.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: false,
    });
    scrollEl.addEventListener("touchend", endPinch, { capture: true, passive: true });
    scrollEl.addEventListener("touchcancel", endPinch, {
      capture: true,
      passive: true,
    });

    return () => {
      scrollEl.removeEventListener("touchstart", onTouchStart, true);
      scrollEl.removeEventListener("touchmove", onTouchMove, true);
      scrollEl.removeEventListener("touchend", endPinch, true);
      scrollEl.removeEventListener("touchcancel", endPinch, true);
    };
  }, [timelineZoomMax]);

  const onTimelinePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const el = timelineScrollRef.current;
      if (!el) return;

      const startX = e.clientX;
      const startScrollLeft = el.scrollLeft;
      let dragging = false;
      const dragThreshold = e.pointerType === "touch" ? 14 : 6;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        if (!dragging && Math.abs(dx) > dragThreshold) {
          dragging = true;
          el.classList.add("timeline-scroll--dragging");
        }
        if (dragging) {
          el.scrollLeft = startScrollLeft - dx;
          ev.preventDefault();
        }
      };

      const cleanupDrag = () => {
        cancelTimelineDragRef.current = null;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", cleanupDrag);
        el.classList.remove("timeline-scroll--dragging");
        if (dragging) {
          const blockClick = (ce: MouseEvent) => {
            ce.preventDefault();
            ce.stopPropagation();
            document.removeEventListener("click", blockClick, true);
          };
          document.addEventListener("click", blockClick, true);
        }
      };

      cancelTimelineDragRef.current = cleanupDrag;
      document.addEventListener("pointermove", onMove, { passive: false });
      document.addEventListener("pointerup", cleanupDrag);
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (isTypingTarget(e.target)) return;

      if (helpOpen) {
        if (e.key === "Escape" || e.key === "?") {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      /* Ctrl/Cmd + ←/→ : evento anterior / siguiente (misma lógica que los botones). */
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        if (e.key === "ArrowLeft") {
          if (eventStepAvailability.canPrev) {
            e.preventDefault();
            stepEvent(-1);
          }
          return;
        }
        if (e.key === "ArrowRight") {
          if (eventStepAvailability.canNext) {
            e.preventDefault();
            stepEvent(1);
          }
          return;
        }
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      const ch = key.length === 1 ? key.toLowerCase() : "";
      const scrollEl = timelineScrollRef.current;

      const stepX = () =>
        scrollEl
          ? Math.max(48, Math.floor(scrollEl.clientWidth * 0.12))
          : 0;

      const stepYFor = (container: HTMLElement | null) => {
        if (container) {
          return Math.max(40, Math.floor(container.clientHeight * 0.18));
        }
        return Math.max(48, Math.floor(window.innerHeight * 0.12));
      };

      const goLeft = ch === "a" || ch === "h" || key === "ArrowLeft";
      const goRight = ch === "d" || ch === "l" || key === "ArrowRight";
      const goUp =
        ch === "w" || ch === "k" || key === "ArrowUp";
      const goDown =
        ch === "s" || ch === "j" || key === "ArrowDown";

      /* Sin modificadores: con selección, ↑/↓ (solo flechas) alternan contexto período ↔ evento. */
      if (sel != null) {
        if (key === "ArrowUp" && sel.kind === "event") {
          const p = firstPeriodContainingDate(periods, sel.item.date);
          if (p != null) {
            e.preventDefault();
            setSel({ kind: "period", item: p });
            return;
          }
        }
        if (key === "ArrowDown" && sel.kind === "period") {
          const ev = firstEventInPeriod(eventsSorted, sel.item);
          if (ev != null) {
            e.preventDefault();
            setSel({ kind: "event", item: ev });
            return;
          }
        }
      }

      if (goLeft) {
        if (!scrollEl) return;
        scrollEl.scrollLeft -= stepX();
        e.preventDefault();
        return;
      }
      if (goRight) {
        if (!scrollEl) return;
        scrollEl.scrollLeft += stepX();
        e.preventDefault();
        return;
      }
      if (goUp || goDown) {
        const dir = goUp ? -1 : 1;
        const inner =
          e.target instanceof HTMLElement
            ? findVerticalScrollContainer(e.target)
            : null;
        const step = stepYFor(inner);
        if (inner) {
          inner.scrollTop += dir * step;
        } else {
          window.scrollBy({ top: dir * step, left: 0, behavior: "auto" });
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    helpOpen,
    sel,
    periods,
    eventsSorted,
    stepEvent,
    eventStepAvailability.canPrev,
    eventStepAvailability.canNext,
  ]);

  return (
    <div className="app app--viewer">
      <div
        className={`viewer-shell ${viewerShellClass} ${sel != null ? "viewer-shell--has-selection" : ""} ${indexOpen ? "viewer-shell--index-open" : ""} ${detailCollapsed ? "viewer-shell--detail-collapsed" : ""}`.trim()}
      >
        <div
          className={`viewer-header-wrap${viewerHeaderCollapsed ? " viewer-header-wrap--collapsed" : ""}`.trim()}
        >
          {!viewerHeaderCollapsed && (
            <div className="viewer-header-inner">
              <header
                id="viewer-toolbar-main"
                className="viewer-toolbar"
                aria-label="Barra del visor"
              >
                <div className="viewer-toolbar-top">
                  <button
                    type="button"
                    className="viewer-map-btn"
                    onClick={() => {
                      setIndexOpen((open) => {
                        const next = !open;
                        if (next) setDetailCollapsed(true);
                        return next;
                      });
                    }}
                    aria-expanded={indexOpen}
                    aria-controls="viewer-index-panel"
                    aria-label={indexOpen ? "Ocultar índice" : "Mostrar índice"}
                    title={indexOpen ? "Ocultar índice" : "Índice"}
                  >
                    <svg
                      className="viewer-header-icon-svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                      />
                    </svg>
                  </button>
                <div className="viewer-toolbar-text">
                  <h1 className="viewer-toolbar-title">
                    {timelineTitle} · línea de tiempo
                  </h1>
                  <p className="viewer-toolbar-range timeline-date">
                    {formatShortDate(new Date(min))} —{" "}
                    {formatShortDate(new Date(max))}
                    {timelineApiStatus === "error" ? " · API no disponible" : ""}
                  </p>
                </div>
                <div className="viewer-timeline-picker">
                  <label className="viewer-timeline-picker-label" htmlFor="viewer-timeline-select">
                    Timeline
                  </label>
                  <select
                    id="viewer-timeline-select"
                    className="viewer-timeline-select"
                    value={selectedTimelineId ?? ""}
                    onChange={loadSelectedTimeline}
                    disabled={timelineApiStatus === "loading" || timelineSummaries.length === 0}
                  >
                    {timelineSummaries.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="viewer-map-btn viewer-map-btn--with-label"
                    onClick={createTimelineCopy}
                    disabled={timelineApiStatus === "loading"}
                    aria-label="Crear una copia editable del timeline actual"
                    title="Crear copia"
                  >
                    <span>Copiar</span>
                  </button>
                </div>
                <div className="viewer-toolbar-actions">
                  <div className="viewer-study-menu">
                    <button
                      type="button"
                      className="viewer-map-btn"
                      onClick={() => setStudyMenuOpen((open) => !open)}
                      aria-expanded={studyMenuOpen}
                      aria-haspopup="menu"
                      aria-controls="viewer-study-menu"
                      aria-label={`Modo de estudio: ${
                        STUDY_MODE_OPTIONS.find((option) => option.id === studyMode)
                          ?.label ?? "Normal"
                      }`}
                      title="Modo de estudio"
                    >
                      <StudyModeIcon mode={studyMode} />
                    </button>
                    {studyMenuOpen ? (
                      <div
                        id="viewer-study-menu"
                        className="viewer-study-menu-popover"
                        role="radiogroup"
                        aria-label="Modo de estudio"
                      >
                        {STUDY_MODE_OPTIONS.map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={studyMode === id}
                            className={`viewer-study-menu-option${studyMode === id ? " viewer-study-menu-option--active" : ""}`.trim()}
                            onClick={() => {
                              setStudyMode(id);
                              setStudyMenuOpen(false);
                            }}
                          >
                            <StudyModeIcon mode={id} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="viewer-theme-menu">
                    <button
                      type="button"
                      className="viewer-map-btn"
                      onClick={() => setThemeMenuOpen((open) => !open)}
                      aria-expanded={themeMenuOpen}
                      aria-haspopup="menu"
                      aria-controls="viewer-theme-menu"
                      aria-label={`Tema visual: ${
                        THEME_MODE_OPTIONS.find((option) => option.id === themeMode)
                          ?.label ?? "Sistema"
                      }`}
                      title="Tema visual"
                    >
                      <ThemeModeIcon mode={themeMode} />
                    </button>
                    {themeMenuOpen ? (
                      <div
                        id="viewer-theme-menu"
                        className="viewer-theme-menu-popover"
                        role="radiogroup"
                        aria-label="Tema visual"
                      >
                        {THEME_MODE_OPTIONS.map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={themeMode === id}
                            className={`viewer-theme-menu-option${themeMode === id ? " viewer-theme-menu-option--active" : ""}`.trim()}
                            onClick={() => {
                              setThemeMode(id);
                              setThemeMenuOpen(false);
                            }}
                          >
                            <ThemeModeIcon mode={id} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {sel != null ? (
                    <button
                      type="button"
                      className="viewer-map-btn"
                      onClick={() => setDetailCollapsed((collapsed) => !collapsed)}
                      aria-expanded={!detailCollapsed}
                      aria-controls="viewer-detail-panel"
                      aria-label={
                        detailCollapsed
                          ? "Expandir detalle seleccionado"
                          : "Contraer detalle seleccionado"
                      }
                      title={detailCollapsed ? "Expandir detalle" : "Contraer detalle"}
                    >
                      <svg
                        className="viewer-header-icon-svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={
                            detailCollapsed
                              ? "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                              : "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"
                          }
                        />
                      </svg>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="viewer-map-btn viewer-map-btn--with-label"
                    onClick={() => setEditorState({ kind: "create" })}
                    aria-label="Crear evento"
                    title="Crear evento"
                  >
                    <svg
                      className="viewer-header-icon-svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 5v14M5 12h14"
                      />
                    </svg>
                    <span>Evento</span>
                  </button>
                  <div className="viewer-layers-menu">
                    <button
                      type="button"
                      className="viewer-map-btn viewer-map-btn--with-label"
                      onClick={() => setFiltersOpen((open) => !open)}
                      aria-expanded={filtersOpen}
                      aria-controls="viewer-lane-filter-menu"
                      aria-label="Capas semánticas"
                      title="Capas"
                    >
                      <svg
                        className="viewer-header-icon-svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m12 3 8 4.5-8 4.5-8-4.5L12 3Zm0 9 8-4.5M12 12 4 7.5M4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5"
                        />
                      </svg>
                      <span>Capas</span>
                    </button>
                    {filtersOpen ? (
                      <div
                        id="viewer-lane-filter-menu"
                        className="viewer-lane-filter-menu"
                        role="group"
                        aria-label="Visibilidad por carril semántico"
                      >
                        {EVENT_LANE_ORDER.map((laneId) => (
                          <button
                            key={laneId}
                            type="button"
                            className="viewer-lane-filter"
                            aria-pressed={laneVisibility[laneId]}
                            title={
                              laneVisibility[laneId]
                                ? `Ocultar carril ${LANE_UI[laneId].label}`
                                : `Mostrar carril ${LANE_UI[laneId].label}`
                            }
                            style={
                              {
                                "--lane-chip-fg": LANE_UI[laneId].color,
                              } as CSSProperties
                            }
                            onClick={() => toggleLaneVisibility(laneId)}
                          >
                            {LANE_UI[laneId].label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <a
                    href={VIEWER_SOURCE_REPO_URL}
                    className="viewer-github-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Código fuente en GitHub (se abre en una pestaña nueva)"
                    title="Código en GitHub"
                  >
                    <svg
                      className="viewer-github-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.113.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                      />
                    </svg>
                  </a>
                  <a
                    href={SITE_INSTAGRAM_URL}
                    className="viewer-instagram-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram @hisctorictimelines (se abre en una pestaña nueva)"
                    title="Instagram"
                  >
                    <svg
                      className="viewer-instagram-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                      />
                    </svg>
                  </a>
                  <button
                    type="button"
                    className="viewer-help-btn"
                    onClick={() => setHelpOpen(true)}
                    aria-label="Atajos de teclado. Atajo: signo de interrogación"
                    title="Atajos (?)"
                  >
                    ?
                  </button>
                  <button
                    type="button"
                    className="viewer-inicio-btn"
                    onClick={() => {
                      setHelpOpen(false);
                      navigate("/");
                    }}
                  >
                    Inicio
                  </button>
                  <button
                    type="button"
                    className="viewer-header-peek-toggle viewer-header-peek-toggle--embedded"
                    onClick={() => setViewerHeaderCollapsed((c) => !c)}
                    aria-expanded={true}
                    aria-controls="viewer-toolbar-main"
                    aria-label="Ocultar barra del visor"
                    title="Ocultar encabezado"
                  >
                    <svg
                      className="viewer-header-icon-svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 14l5-5 5 5"
                      />
                    </svg>
                  </button>
                </div>
                </div>
              </header>
            </div>
          )}
        </div>

        {viewerHeaderCollapsed && (
          <button
            type="button"
            className="viewer-header-peek-toggle viewer-header-peek-toggle--floating viewer-header-peek-toggle--bar-hidden"
            onClick={() => setViewerHeaderCollapsed((c) => !c)}
            aria-expanded={false}
            aria-label="Mostrar barra del visor"
            title="Mostrar encabezado"
          >
            <svg
              className="viewer-header-icon-svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 10l5 5 5-5"
              />
            </svg>
          </button>
        )}

        <div className="viewer-main">
        <div
          className={`viewer-chart-wrap ${sel != null ? "viewer-chart-wrap--pinned" : ""}`.trim()}
        >
      <section
        className="chart chart-bleed chart--viewer"
        aria-label="Línea de tiempo"
      >
        <div
          ref={timelineScrollRef}
          className="timeline-scroll"
          onPointerDown={onTimelinePointerDown}
          onMouseMove={(e) => {
            const stack = timelineStackRef.current;
            if (!stack) return;
            const rect = stack.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / stack.offsetWidth) * 100;
            setCursorPct(Math.max(0, Math.min(100, pct)));
          }}
          onMouseLeave={() => setCursorPct(null)}
        >
          <div
            ref={timelineStackRef}
            className="timeline-stack timeline-stack--compact timeline-stack--event-labels-vertical"
            style={
              {
                "--timeline-zoom": String(timelineZoom),
                "--event-label-max-lane": 0,
                "--period-compact-row-h": `${compactPeriodRowRem}rem`,
                "--period-row-count": periodIndicesByLane.length,
                "--events-semantic-lane-count": EVENT_LANE_ORDER.length,
                ...laneColorCssVars,
              } as CSSProperties
            }
          >
            <div
              className="axis axis--ticks-single-vline-breakpoint"
              style={
                {
                  "--axis-max-lane-offset": `${axisMarkMaxLaneOffsetPx}px`,
                } as CSSProperties
              }
            >
              {axisCenturyBandRects.length > 0 && (
                <>
                  <div className="axis-century-bands" aria-hidden>
                    {axisCenturyBandRects.map(({ key, leftPct, widthPct, stripe }) => (
                      <span
                        key={`century-${key}`}
                        className={
                          stripe === 0
                            ? "axis-century-band axis-century-band--a"
                            : "axis-century-band axis-century-band--b"
                        }
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      />
                    ))}
                  </div>
                  <div className="axis-century-labels" aria-hidden>
                    {axisCenturyBandRects.map(({ key, leftPct, widthPct, stripe, centuryLabel }) => (
                      <span
                        key={`clbl-${key}`}
                        className={
                          stripe === 0
                            ? "axis-century-label axis-century-label--a timeline-date"
                            : "axis-century-label axis-century-label--b timeline-date"
                        }
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        {centuryLabel}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className="axis-decade-bands" aria-hidden>
                {axisDecadeBandRects.map(({ key, leftPct, widthPct, stripe }) => (
                  <span
                    key={key}
                    className={
                      stripe === 0
                        ? "axis-decade-band axis-decade-band--a"
                        : "axis-decade-band axis-decade-band--b"
                    }
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  />
                ))}
              </div>
              <div className="axis-decade-labels" aria-hidden>
                {axisDecadeBandRects.map(
                  ({ key, leftPct, widthPct, stripe, decadeLabel }) => (
                    <span
                      key={`lbl-${key}`}
                      className={
                        stripe === 0
                          ? "axis-decade-label axis-decade-label--a timeline-date"
                          : "axis-decade-label axis-decade-label--b timeline-date"
                      }
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    >
                      {decadeLabel}
                    </span>
                  )
                )}
              </div>
              <div className="axis-micro-ticks" aria-hidden>
                {axisYearMicroTicks.map(({ t, major, isCentury, stripe }) => (
                  <span
                    key={t}
                    className={[
                      "axis-micro-tick",
                      isCentury ? "axis-micro-tick--century" : (major ? "axis-micro-tick--decade" : ""),
                      major && !isCentury
                        ? stripe === 0
                          ? "axis-micro-tick--stripe-a"
                          : "axis-micro-tick--stripe-b"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ left: `${pctOnTrack(t, min, max)}%` }}
                  />
                ))}
              </div>
              {axisMarksPlaced.map(({ mark, p, lane }, i) => {
                const isFirst = i === 0;
                const isLast = i === axisMarksPlaced.length - 1;
                let edgeClass = "";
                if (isFirst && isLast) {
                  if (p <= 6) edgeClass = "tick--start";
                  else if (p >= 94) edgeClass = "tick--end";
                } else if (isFirst) {
                  edgeClass = "tick--start";
                } else if (isLast) {
                  edgeClass = "tick--end";
                }
                const isTickSelected =
                  (sel?.kind === "event" &&
                    sel.item.date.getTime() === mark.t) ||
                  (sel?.kind === "period" &&
                    (sel.item.start.getTime() === mark.t ||
                      sel.item.end.getTime() === mark.t));
                const tickEvent = eventsSorted.find(
                  (e) => e.date.getTime() === mark.t
                );
                const showYear = axisShowYearByT.get(mark.t) ?? true;
                const ariaLabel = axisTickAriaLabel(mark);
                const tickProps = {
                  mark,
                  p,
                  edgeClass,
                  isTickSelected,
                  tickEvent,
                  showYear,
                  ariaLabel,
                  singleVerticalLine: true,
                  lane,
                  laneOffsetPx: axisMarkLaneOffsetPx(lane),
                  onTickClick: tickEvent
                    ? () => setSel({ kind: "event", item: tickEvent })
                    : undefined,
                };
                return (
                  <AxisTickMark key={`${mark.t}-${i}`} {...tickProps} />
                );
              })}
            </div>

            <div className="track-wrap">
              <div className="track-bg" />
              <div className="period-connectors" aria-hidden>
                {periods.flatMap((p, i) => {
                  const centerRem = periodRowCenterFromTopRem(
                    laneByIndex[i],
                    true,
                    compactPeriodRowRem
                  );
                  const h = `calc(var(--timeline-axis-gap) + ${centerRem}rem)`;
                  const startLeft = pctOnTrack(p.start.getTime(), min, max);
                  const endLeft = pctOnTrack(p.end.getTime(), min, max);
                  const isConnActive = activePeriodForTimeline === p;
                  return [
                    <div
                      key={`${p.title}-start-conn`}
                      className={`period-connector${isConnActive ? " period-connector--selected" : ""}`}
                      style={{
                        left: `${startLeft}%`,
                        height: h,
                        borderLeftColor: p.color,
                      }}
                    />,
                    <div
                      key={`${p.title}-end-conn`}
                      className={`period-connector${isConnActive ? " period-connector--selected" : ""}`}
                      style={{
                        left: `${endLeft}%`,
                        height: h,
                        borderLeftColor: p.color,
                      }}
                    />,
                  ];
                })}
              </div>
              {periodIndicesByLane.map((indices, lane) => (
                <div key={`lane-${lane}`} className="period-row">
                  <div className="row-bar">
                    {indices.map((i) => {
                      const p = periods[i];
                      const left = pctOnTrack(p.start.getTime(), min, max);
                      const width = Math.max(
                        pctOnTrack(p.end.getTime(), min, max) - left,
                        0.8
                      );
                      const isActive = activePeriodForTimeline === p;
                      return (
                        <button
                          key={p.title}
                          type="button"
                          className={`bar ${isActive ? "active" : ""}`}
                          ref={(el) => {
                            if (isActive) {
                              timelineSelectedPeriodBarRef.current = el;
                            } else if (
                              timelineSelectedPeriodBarRef.current === el
                            ) {
                              timelineSelectedPeriodBarRef.current = null;
                            }
                          }}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            backgroundColor: p.color,
                            color: foregroundForHex(p.color),
                          }}
                          onClick={() => setSel({ kind: "period", item: p })}
                          title={`${formatDate(p.start)} — ${formatDate(p.end)}`}
                        >
                          <span className="bar-text timeline-period-label">
                            {p.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="events-stack">
                <TimelineSemanticEventLanes
                  laneVisibility={laneVisibility}
                  eventsSorted={eventsSorted}
                  trackPct={(t) => pctOnTrack(t, min, max)}
                  selection={sel}
                  studyMode={studyMode}
                  causalHighlight={causalHighlight}
                  onSelectEvent={(item) => setSel({ kind: "event", item })}
                />
                <TimelineEventTitlesLane
                  eventsSorted={eventsSorted}
                  eventLabelPlacements={eventLabelPlacements}
                  trackPct={(tMs: number) => pctOnTrack(tMs, min, max)}
                  sel={sel}
                  studyMode={studyMode}
                  causalHighlight={causalHighlight}
                  causalitySvgEdges={causalitySvgEdges}
                  eventPassesLaneFilter={eventPassesLaneFilter}
                  pointerCoarse={pointerCoarse}
                  viewportInnerHeightPx={layoutProbe.vhPx}
                  eventPointerTitle={(e: TimelineEvent) =>
                    eventPointerTitle(e, studyMode)
                  }
                  onSelectEvent={(e: TimelineEvent) =>
                    setSel({ kind: "event", item: e })
                  }
                  timelineSelectedEventDotRef={timelineSelectedEventDotRef}
                  clusters={eventClusters}
                  onClusterClick={onClusterClick}
                />
              </div>
            </div>

            {cursorPct !== null && (() => {
              const span = 100 - TIMELINE_TRACK_INSET_LEFT_PCT - TIMELINE_TRACK_INSET_RIGHT_PCT;
              const u = (cursorPct - TIMELINE_TRACK_INSET_LEFT_PCT) / span;
              const timeMs = min + Math.max(0, Math.min(1, u)) * (max - min);
              const year = new Date(timeMs).getUTCFullYear();
              return (
                <div
                  className="timeline-cursor"
                  style={{ left: `${cursorPct}%` }}
                  aria-hidden
                >
                  <span className="timeline-cursor__label">
                    {formatHistoricalYear(year)}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="timeline-chrome timeline-chrome--expanded">
          <div
            id="timeline-chrome-panel"
            className="chart-bleed-overlays"
          >
              <div className="timeline-controls-left">
                <div
                  className="timeline-zoom-panel"
                  role="group"
                  aria-label="Navegación de eventos y magnificación del eje"
                >
                  <div
                    className="timeline-event-nav"
                    role="group"
                    aria-label="Navegación entre eventos"
                  >
                    <button
                      type="button"
                      className="timeline-event-nav-btn"
                      disabled={!eventStepAvailability.canPrev}
                      onClick={() => stepEvent(-1)}
                      aria-label="Ir al evento anterior"
                      title="Evento anterior"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 18l-6-6 6-6"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="timeline-event-nav-btn"
                      disabled={!eventStepAvailability.canNext}
                      onClick={() => stepEvent(1)}
                      aria-label="Ir al evento siguiente"
                      title="Evento siguiente"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 18l6-6-6-6"
                        />
                      </svg>
                    </button>
                  </div>
                  <span className="timeline-zoom-sep" aria-hidden="true" />
                  <span className="timeline-zoom-icon" aria-hidden>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    className="timeline-zoom-btn"
                    onClick={() => onZoomNudge(-1)}
                    aria-label="Reducir magnificación del eje"
                  >
                    −
                  </button>
                  <input
                    className="timeline-zoom-slider"
                    type="range"
                    min={0}
                    max={1000}
                    step={1}
                    value={zoomSliderValue}
                    onChange={onZoomSliderChange}
                    aria-valuemin={0}
                    aria-valuemax={1000}
                    aria-valuenow={zoomSliderValue}
                    aria-label="Magnificación de la línea de tiempo"
                  />
                  <button
                    type="button"
                    className="timeline-zoom-btn"
                    onClick={() => onZoomNudge(1)}
                    aria-label="Aumentar magnificación del eje"
                  >
                    +
                  </button>
                  <span className="timeline-zoom-readout" aria-live="polite">
                    {formatZoomFactorUi(timelineZoom, timelineZoomMax)}
                  </span>
                </div>
              </div>

              <div className="timeline-scale-overlay" aria-hidden>
                <div className="timeline-scale-topline">
                  <span className="timeline-scale-caption">Escala del eje</span>
                  <div className="timeline-scale-label timeline-date">
                    {scaleBarLabel}
                  </div>
                </div>
                <div className="timeline-scale-rail-wrap">
                  <div
                    className="timeline-scale-rail"
                    style={{ width: SCALE_BAR_PX }}
                  />
                  <div
                    className="timeline-scale-ticks"
                    style={{ width: SCALE_BAR_PX }}
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>
        </div>

        <div className="viewer-map-overlays" aria-label="Paneles del visor">
          {indexOpen ? (
            <ViewerIndexPanel
              periods={periods}
              events={events}
              sel={sel}
              activePeriodForTimeline={activePeriodForTimeline}
              onSelectPeriod={(p) => {
                setSel({ kind: "period", item: p });
                if (viewerIsTabletViewport()) setIndexOpen(false);
              }}
              onSelectEvent={(e) => {
                setSel({ kind: "event", item: e });
                if (viewerIsTabletViewport()) setIndexOpen(false);
              }}
              onClose={() => setIndexOpen(false)}
            />
          ) : null}

          <ViewerDetailPanel
            sel={sel}
            studyMode={studyMode}
            eventsById={eventsById}
            activePeriodForTimeline={activePeriodForTimeline}
            collapsed={detailCollapsed}
            onToggleCollapsed={() =>
              setDetailCollapsed((collapsed) => !collapsed)
            }
            onSelectEvent={(e) => setSel({ kind: "event", item: e })}
            onEditEvent={(e) => setEditorState({ kind: "edit", event: e })}
            onDeleteEvent={deleteSelectedEvent}
          />
        </div>
        </div>

        {editorState ? (
          <EventEditorModal
            mode={editorState.kind}
            event={editorState.kind === "edit" ? editorState.event : undefined}
            events={eventsSorted}
            onClose={() => setEditorState(null)}
            onSave={(draft) =>
              editorState.kind === "edit"
                ? saveEditedEvent(editorState.event.id, draft)
                : saveNewEvent(draft)
            }
          />
        ) : null}
        <KeyboardHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    </div>
  );
}
