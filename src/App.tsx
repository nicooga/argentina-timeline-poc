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
import type { Period, Selection, TimelineEvent } from "../types";
import { WelcomeScreen } from "./WelcomeScreen";
import { ViewerLower } from "./ViewerLower";
import { KeyboardHelpModal } from "./KeyboardHelpModal";
import "./App.css";

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
  });
}

/** Línea superior del tick del eje (año). */
function formatAxisYear(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
  });
}

/** Línea inferior: mes abreviado + día (ahorra ancho vs. una sola línea larga). */
function formatAxisMonthDay(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

/**
 * Posición horizontal en la pista (0–100% del ancho del contenedor).
 * Deja márgenes laterales para etiquetas del eje y títulos en diagonal junto al primer/último evento.
 */
const TIMELINE_TRACK_INSET_LEFT_PCT = 7;
const TIMELINE_TRACK_INSET_RIGHT_PCT = 4;

function pctOnTrack(time: number, min: number, max: number): number {
  if (max <= min) return TIMELINE_TRACK_INSET_LEFT_PCT;
  const u = (time - min) / (max - min);
  const span =
    100 - TIMELINE_TRACK_INSET_LEFT_PCT - TIMELINE_TRACK_INSET_RIGHT_PCT;
  return TIMELINE_TRACK_INSET_LEFT_PCT + u * span;
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

function foregroundForHex(hex: string): string {
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
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const lin = [r, g, b].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return L > 0.45 ? "#1a1d21" : "#ffffff";
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
/** Modo compacto: altura de fila de período = `.timeline-stack--compact .period-row .row-bar`; margen entre filas de período = `.timeline-stack--compact .period-row` */
const ROW_BAR_REM_COMPACT = 0.62;
const ROW_MARGIN_REM_COMPACT = 0;

function periodRowCenterFromTopRem(
  rowIndex: number,
  compact: boolean
): number {
  const bar = compact ? ROW_BAR_REM_COMPACT : ROW_BAR_REM;
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

type AxisMark = { t: number; year: string; monthDay: string };

function mergeAxisMarks(
  periods: { start: Date; end: Date }[],
  events: { date: Date }[]
): AxisMark[] {
  const raw: AxisMark[] = [];
  for (const p of periods) {
    raw.push({
      t: p.start.getTime(),
      year: formatAxisYear(p.start),
      monthDay: formatAxisMonthDay(p.start),
    });
    raw.push({
      t: p.end.getTime(),
      year: formatAxisYear(p.end),
      monthDay: formatAxisMonthDay(p.end),
    });
  }
  for (const e of events) {
    raw.push({
      t: e.date.getTime(),
      year: formatAxisYear(e.date),
      monthDay: formatAxisMonthDay(e.date),
    });
  }
  raw.sort((a, b) => a.t - b.t);
  const out: AxisMark[] = [];
  for (const item of raw) {
    const prev = out[out.length - 1];
    if (prev && prev.t === item.t) {
      if (prev.year !== item.year) {
        prev.year = `${prev.year} · ${item.year}`;
      }
      if (prev.monthDay !== item.monthDay) {
        prev.monthDay = `${prev.monthDay} · ${item.monthDay}`;
      }
    } else {
      out.push({ ...item });
    }
  }
  return out;
}

/** Zoom horizontal del timeline (Ctrl + rueda). 1 = ancho base en CSS. */
const TIMELINE_ZOOM_MIN = 0.35;
const TIMELINE_ZOOM_MAX = 14;
const TIMELINE_ZOOM_STEP = 1.085;

/** Ancho visual de la barra de escala (px); el texto indica el lapso temporal que cubre. */
const SCALE_BAR_PX = 112;

/** Separación mínima entre centros de etiquetas (% del ancho de la pista) para compartir la misma fila. */
const AXIS_LABEL_MIN_GAP_PCT = 3.1;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Slider 0…1 ↔ zoom (escala log para que el control se sienta natural). */
function zoomFromSliderT(t: number): number {
  const tt = clamp(t, 0, 1);
  const lo = Math.log(TIMELINE_ZOOM_MIN);
  const hi = Math.log(TIMELINE_ZOOM_MAX);
  return Math.exp(lo + tt * (hi - lo));
}

function sliderTFromZoom(z: number): number {
  const lo = Math.log(TIMELINE_ZOOM_MIN);
  const hi = Math.log(TIMELINE_ZOOM_MAX);
  const lz = Math.log(clamp(z, TIMELINE_ZOOM_MIN, TIMELINE_ZOOM_MAX));
  return clamp((lz - lo) / (hi - lo), 0, 1);
}

function formatZoomFactorUi(z: number): string {
  const c = clamp(z, TIMELINE_ZOOM_MIN, TIMELINE_ZOOM_MAX);
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

/**
 * Cuando muchas fechas caen cerca en el eje, reparte etiquetas en filas verticales
 * (lane 0 pegada al trazo, lane 1 más abajo, etc.).
 */
function assignAxisMarkLanes(
  marks: AxisMark[],
  min: number,
  max: number
): { mark: AxisMark; p: number; lane: number }[] {
  const sorted = [...marks].sort(
    (a, b) => pctOnTrack(a.t, min, max) - pctOnTrack(b.t, min, max)
  );
  const lastCenterInLane: number[] = [];

  return sorted.map((mark) => {
    const p = pctOnTrack(mark.t, min, max);
    let lane = 0;
    for (;; lane++) {
      if (lane >= lastCenterInLane.length) {
        lastCenterInLane.push(p);
        return { mark, p, lane };
      }
      if (p - lastCenterInLane[lane] >= AXIS_LABEL_MIN_GAP_PCT) {
        lastCenterInLane[lane] = p;
        return { mark, p, lane };
      }
    }
  });
}

type EventLabelAnchor = "start" | "center" | "end";

type EventLabelPlacement = {
  lane: number;
  anchor: EventLabelAnchor;
  /** Ancho máximo del texto (px), acotado al espacio disponible en la pista. */
  maxWidthPx: number;
};

let eventLabelMeasureCtx: CanvasRenderingContext2D | null = null;

function measureEventTitleWidthsPx(
  titles: string[],
  compact: boolean,
  pointerCoarse: boolean
): number[] {
  const fontPx = compact ? 10 : pointerCoarse ? 12.5 : 12;
  const font = `600 ${fontPx}px "Source Sans 3",system-ui,sans-serif`;
  const pad = 10;
  if (typeof document === "undefined") {
    return titles.map((t) => Math.min(t.length * fontPx * 0.52 + pad, 280));
  }
  if (!eventLabelMeasureCtx) {
    const c = document.createElement("canvas");
    eventLabelMeasureCtx = c.getContext("2d");
  }
  const ctx = eventLabelMeasureCtx;
  if (!ctx) {
    return titles.map((t) => Math.min(t.length * fontPx * 0.52 + pad, 280));
  }
  ctx.font = font;
  return titles.map((t) => Math.min(ctx.measureText(t).width + pad, 320));
}

function labelIntervalsOverlap(
  a: readonly [number, number],
  b: readonly [number, number],
  gapPct: number
): boolean {
  return a[0] < b[1] + gapPct && a[1] > b[0] - gapPct;
}

/** Coincide con `.event-label--start` / coarse: mitad táctil + margen hasta el texto. */
function eventLabelEdgePx(pointerCoarse: boolean): number {
  const touch = 44;
  return touch / 2 + (pointerCoarse ? 8 : 6);
}

/**
 * Reparte etiquetas de eventos en carriles verticales (swimming lanes), como los ticks del eje.
 * Los intervalos de colisión siguen el anclaje real (texto a la derecha/izquierda/centro del punto)
 * en % del ancho del stack (misma convención que pctOnTrack).
 */
function assignEventLabelLanes(
  eventsSorted: TimelineEvent[],
  min: number,
  max: number,
  stackWidthPx: number | null,
  compact: boolean,
  pointerCoarse: boolean
): { placements: EventLabelPlacement[]; maxLane: number } {
  const n = eventsSorted.length;
  if (n === 0) {
    return { placements: [], maxLane: 0 };
  }

  const stackPx =
    stackWidthPx != null && stackWidthPx > 0 ? stackWidthPx : 520;
  const edgePx = eventLabelEdgePx(pointerCoarse);
  const edgePct = (edgePx / stackPx) * 100;

  const widthsPx = measureEventTitleWidthsPx(
    eventsSorted.map((e) => e.title),
    compact,
    pointerCoarse
  );

  const items = eventsSorted.map((event, i) => ({
    event,
    i,
    p: pctOnTrack(event.date.getTime(), min, max),
    baseWidthPx: widthsPx[i]!,
  }));
  items.sort((a, b) => a.p - b.p || a.i - b.i);

  /** Hueco horizontal mínimo entre cajas de etiqueta (como AXIS_LABEL_MIN_GAP_PCT arriba). */
  const gapPct = 0.62;
  const lanes: [number, number][][] = [];
  const temp: {
    i: number;
    lane: number;
    anchor: EventLabelAnchor;
    maxWidthPx: number;
  }[] = [];

  for (let s = 0; s < items.length; s++) {
    const { i, p, baseWidthPx } = items[s]!;
    const isFirst = s === 0;
    const isLast = s === n - 1;

    let anchor: EventLabelAnchor;
    if (n === 1) {
      if (p <= 6) anchor = "start";
      else if (p >= 94) anchor = "end";
      else anchor = "center";
    } else if (isFirst) {
      anchor = "start";
    } else if (isLast) {
      anchor = "end";
    } else {
      /* Empujar el texto hacia el interior del gráfico (más aire al borde). */
      anchor = p < 50 ? "start" : "end";
    }

    const rawSpanPct = (baseWidthPx / stackPx) * 100 + 0.22;

    let widthPct = Math.min(rawSpanPct, 56);
    if (anchor === "start") {
      widthPct = Math.min(
        widthPct,
        Math.max(0.85, 100 - p - edgePct - 0.25)
      );
    } else if (anchor === "end") {
      widthPct = Math.min(widthPct, Math.max(0.85, p - edgePct - 0.25));
    } else {
      widthPct = Math.min(
        widthPct,
        Math.max(0.85, 2 * Math.min(p, 100 - p) - edgePct * 2 - 0.35)
      );
    }

    let left: number;
    let right: number;
    if (anchor === "start") {
      left = p + edgePct;
      right = p + edgePct + widthPct;
    } else if (anchor === "end") {
      right = p - edgePct;
      left = p - edgePct - widthPct;
    } else {
      left = p - widthPct / 2;
      right = p + widthPct / 2;
    }

    const interval: [number, number] = [left, right];

    let lane = 0;
    for (;; lane++) {
      if (lane >= lanes.length) {
        lanes.push([]);
      }
      const occupied = lanes[lane]!;
      const clash = occupied.some((iv) =>
        labelIntervalsOverlap(interval, iv, gapPct)
      );
      if (!clash) {
        occupied.push(interval);
        const maxWidthPx = Math.min(
          baseWidthPx,
          Math.max(48, (widthPct / 100) * stackPx)
        );
        temp.push({
          i,
          lane,
          anchor,
          maxWidthPx,
        });
        break;
      }
    }
  }

  const placements: EventLabelPlacement[] = eventsSorted.map(() => ({
    lane: 0,
    anchor: "center",
    maxWidthPx: 160,
  }));
  let maxLane = 0;
  for (const t of temp) {
    placements[t.i] = {
      lane: t.lane,
      anchor: t.anchor,
      maxWidthPx: t.maxWidthPx,
    };
    maxLane = Math.max(maxLane, t.lane);
  }

  return { placements, maxLane };
}

export default function App() {
  const { periods, events } = timelineHistoriaArgentina;

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

  const axisMarks = useMemo(
    () => mergeAxisMarks(periods, events),
    [periods, events]
  );

  const axisMarksPlaced = useMemo(
    () => assignAxisMarkLanes(axisMarks, min, max),
    [axisMarks, min, max]
  );

  const axisMaxLane = useMemo(
    () =>
      axisMarksPlaced.reduce((m, x) => Math.max(m, x.lane), 0),
    [axisMarksPlaced]
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

  const [appPhase, setAppPhase] = useState<"welcome" | "viewer">("welcome");
  const [sel, setSel] = useState<Selection>(null);
  const [timelineExpandedForTouch, setTimelineExpandedForTouch] =
    useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [viewerHeaderCollapsed, setViewerHeaderCollapsed] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [stackWidthPx, setStackWidthPx] = useState<number | null>(null);
  const [pointerCoarse, setPointerCoarse] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches
  );

  const activePeriodForTimeline = useMemo((): Period | null => {
    if (sel == null) return null;
    if (sel.kind === "period") return sel.item;
    return firstPeriodContainingDate(periods, sel.item.date);
  }, [sel, periods]);

  const eventStepAvailability = useMemo(() => {
    if (sel == null) return { canPrev: false, canNext: false };
    if (sel.kind === "event") {
      const idx = eventsSorted.indexOf(sel.item);
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
          const idx = eventsSorted.indexOf(cur.item);
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
    if (sel === null) setTimelineExpandedForTouch(false);
  }, [sel]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setPointerCoarse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const timelineCompact = sel !== null && !timelineExpandedForTouch;

  const { eventLabelPlacements, eventLabelMaxLane } = useMemo(
    () => {
      const { placements, maxLane } = assignEventLabelLanes(
        eventsSorted,
        min,
        max,
        stackWidthPx,
        timelineCompact,
        pointerCoarse
      );
      return { eventLabelPlacements: placements, eventLabelMaxLane: maxLane };
    },
    [eventsSorted, min, max, stackWidthPx, timelineCompact, pointerCoarse]
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
  }, [sel, timelineZoom, timelineCompact]);

  const viewerShellClass =
    sel === null
      ? ""
      : timelineCompact
        ? "viewer-shell--sel-compact"
        : "viewer-shell--sel-touch";

  const rangeMs = max - min;

  const scaleBarLabel = useMemo(() => {
    if (stackWidthPx == null || stackWidthPx <= 0 || rangeMs <= 0) return "—";
    const msForBar = (rangeMs / stackWidthPx) * SCALE_BAR_PX;
    return formatApproxTimeSpan(msForBar);
  }, [stackWidthPx, rangeMs]);

  useEffect(() => {
    const el = timelineStackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setStackWidthPx(el.offsetWidth);
    });
    ro.observe(el);
    setStackWidthPx(el.offsetWidth);
    return () => ro.disconnect();
  }, [timelineZoom]);

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
    const z1 = clamp(next, TIMELINE_ZOOM_MIN, TIMELINE_ZOOM_MAX);
    const scrollEl = timelineScrollRef.current;
    if (scrollEl) {
      const viewportX = scrollEl.clientWidth / 2;
      const frac =
        (viewportX + scrollEl.scrollLeft) / Math.max(1, scrollEl.scrollWidth);
      pendingZoomAnchorRef.current = { frac, viewportX };
    }
    setTimelineZoom(z1);
  }, []);

  const onZoomSliderChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const t = Number(e.target.value) / 1000;
      setTimelineZoomCentered(zoomFromSliderT(t));
    },
    [setTimelineZoomCentered]
  );

  const onZoomNudge = useCallback(
    (direction: 1 | -1) => {
      setTimelineZoom((z0) => {
        const t0 = sliderTFromZoom(z0);
        const z1 = zoomFromSliderT(clamp(t0 + 0.045 * direction, 0, 1));
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
    []
  );

  const zoomSliderValue = Math.round(sliderTFromZoom(timelineZoom) * 1000);

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
      const z1 = clamp(z0 * factor, TIMELINE_ZOOM_MIN, TIMELINE_ZOOM_MAX);
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
        TIMELINE_ZOOM_MAX
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
  }, []);

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
  }, [helpOpen]);

  if (appPhase === "welcome") {
    return <WelcomeScreen onEnter={() => setAppPhase("viewer")} />;
  }

  return (
    <div className="app app--viewer">
      <div
        className={`viewer-shell ${viewerShellClass} ${sel != null ? "viewer-shell--has-selection" : ""}`.trim()}
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
                <div className="viewer-toolbar-text">
                  <h1 className="viewer-toolbar-title">
                    Historia Argentina · línea de tiempo
                  </h1>
                  <p className="viewer-toolbar-range muted">
                    {formatShortDate(new Date(min))} —{" "}
                    {formatShortDate(new Date(max))}
                  </p>
                </div>
                <div className="viewer-toolbar-actions">
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
                      setAppPhase("welcome");
                      setSel(null);
                      setHelpOpen(false);
                      setViewerHeaderCollapsed(false);
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
        >
          <div
            ref={timelineStackRef}
            className={
              timelineCompact
                ? "timeline-stack timeline-stack--compact"
                : "timeline-stack"
            }
            style={
              {
                "--timeline-zoom": String(timelineZoom),
                "--event-label-max-lane": eventLabelMaxLane,
              } as CSSProperties
            }
          >
            <div
              className="axis"
              style={
                {
                  "--axis-max-lane": axisMaxLane,
                } as CSSProperties
              }
            >
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
                return (
                  <div
                    key={`${mark.t}-${i}`}
                    className={`tick tick--axis-mark ${edgeClass}`.trim()}
                    style={
                      {
                        left: `${p}%`,
                        "--tick-lane": lane,
                      } as CSSProperties
                    }
                  >
                    <span className="tick-line" />
                    <span className="tick-label">
                      <span className="tick-label-year">{mark.year}</span>
                      <span className="tick-label-monthday">{mark.monthDay}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="track-wrap">
              <div className="track-bg" />
              <div className="period-connectors" aria-hidden>
                {periods.flatMap((p, i) => {
                  const centerRem = periodRowCenterFromTopRem(
                    laneByIndex[i],
                    timelineCompact
                  );
                  const h = `calc(var(--timeline-axis-gap) + ${centerRem}rem)`;
                  const startLeft = pctOnTrack(p.start.getTime(), min, max);
                  const endLeft = pctOnTrack(p.end.getTime(), min, max);
                  return [
                    <div
                      key={`${p.title}-start-conn`}
                      className="period-connector"
                      style={{
                        left: `${startLeft}%`,
                        height: h,
                        borderLeftColor: p.color,
                      }}
                    />,
                    <div
                      key={`${p.title}-end-conn`}
                      className="period-connector"
                      style={{
                        left: `${endLeft}%`,
                        height: h,
                        borderLeftColor: p.color,
                      }}
                    />,
                  ];
                })}
              </div>
              <div className="event-connectors" aria-hidden>
                {eventsSorted.map((ev, connIdx) => {
                  const lane = eventLabelPlacements[connIdx]!.lane;
                  return (
                    <div
                      key={`conn-${ev.title + ev.date.toISOString()}`}
                      className="event-connector"
                      style={
                        {
                          left: `${pctOnTrack(ev.date.getTime(), min, max)}%`,
                          "--event-conn-lane": lane,
                        } as CSSProperties
                      }
                    />
                  );
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
                            boxShadow: isActive
                              ? `0 0 0 2px ${p.color}`
                              : undefined,
                          }}
                          onClick={() => setSel({ kind: "period", item: p })}
                          title={`${formatDate(p.start)} — ${formatDate(p.end)}`}
                        >
                          <span className="bar-text">{p.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="events-row">
                <div
                  className="row-bar"
                  role="group"
                  aria-label="Eventos en la línea temporal"
                >
                  {eventsSorted.map((e, eventIdx) => {
                    const p = pctOnTrack(e.date.getTime(), min, max);
                    const pl = eventLabelPlacements[eventIdx]!;
                    const isEventActive =
                      sel?.kind === "event" && sel.item === e;
                    return (
                      <div
                        key={e.title + e.date.toISOString()}
                        className={`event-marker ${isEventActive ? "event-marker--selected" : ""}`}
                        style={
                          {
                            left: `${p}%`,
                            "--event-label-lane": pl.lane,
                          } as CSSProperties
                        }
                      >
                        <button
                          type="button"
                          className={`event-dot ${isEventActive ? "active" : ""}`}
                          ref={(el) => {
                            if (isEventActive) {
                              timelineSelectedEventDotRef.current = el;
                            } else if (
                              timelineSelectedEventDotRef.current === el
                            ) {
                              timelineSelectedEventDotRef.current = null;
                            }
                          }}
                          onClick={() => setSel({ kind: "event", item: e })}
                          title={e.title}
                          aria-label={e.title}
                        />
                        <span
                          className={`event-label-h event-label--${pl.anchor}`}
                          aria-hidden="true"
                          style={
                            {
                              maxWidth: `${Math.round(pl.maxWidthPx)}px`,
                            } as CSSProperties
                          }
                        >
                          {e.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-bleed-overlays">
          <div className="timeline-controls-left">
            {sel != null ? (
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
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="timeline-event-nav-btn"
                  disabled={!eventStepAvailability.canNext}
                  onClick={() => stepEvent(1)}
                  aria-label="Ir al evento siguiente"
                >
                  Siguiente
                </button>
              </div>
            ) : null}
            <div
              className="timeline-zoom-panel"
              role="group"
              aria-label="Magnificación del eje temporal"
            >
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
                {formatZoomFactorUi(timelineZoom)}
              </span>
            </div>
          </div>

          {sel != null ? (
            <div className="timeline-touch-toggle-wrap">
              <button
                type="button"
                className="timeline-touch-toggle"
                aria-pressed={timelineExpandedForTouch}
                onClick={() =>
                  setTimelineExpandedForTouch((prev) => !prev)
                }
                aria-label={
                  timelineExpandedForTouch
                    ? "Priorizar lectura: línea temporal compacta junto al detalle"
                    : "Ampliar franjas de períodos para facilitar el toque en la línea"
                }
              >
                <span className="timeline-touch-toggle-icon" aria-hidden>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </span>
                <span className="timeline-touch-toggle-text">
                  {timelineExpandedForTouch
                    ? "Priorizar lectura"
                    : "Franjas táctiles"}
                </span>
              </button>
            </div>
          ) : null}

          <div className="timeline-scale-overlay" aria-hidden>
            <div className="timeline-scale-topline">
              <span className="timeline-scale-caption">Escala del eje</span>
              <div className="timeline-scale-label">{scaleBarLabel}</div>
            </div>
            <div className="timeline-scale-rail-wrap">
              <div
                className="timeline-scale-rail"
                style={{ width: SCALE_BAR_PX }}
              />
              <div className="timeline-scale-ticks" style={{ width: SCALE_BAR_PX }}>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>

        <ViewerLower
          periods={periods}
          events={events}
          sel={sel}
          activePeriodForTimeline={activePeriodForTimeline}
          eventNav={
            sel?.kind === "event"
              ? {
                  onStep: stepEvent,
                  canPrev: eventStepAvailability.canPrev,
                  canNext: eventStepAvailability.canNext,
                }
              : null
          }
          onSelectPeriod={(p) => setSel({ kind: "period", item: p })}
          onSelectEvent={(e) => setSel({ kind: "event", item: e })}
        />
        </div>

        <KeyboardHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    </div>
  );
}
