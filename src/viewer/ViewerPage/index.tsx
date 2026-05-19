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
import { timelineHistoriaArgentina } from "../../../timelineHistoriaArgentina";
import {
  causalEdgesInSet,
  causalHighlightSet,
  eventByIdMap,
  type StudyMode,
} from "../../../causality";
import { EVENT_LANE_ORDER, LANE_UI, type EventLaneId } from "../../../eventLanes";
import type { Period, Selection, Timeline as TimelineModel, TimelineEvent } from "../../../types";
import { useNavigate, useParams } from "react-router-dom";
import { KeyboardHelpModal } from "../../shell";
import {
  AiChatPanel,
  type AiChatError,
} from "..";
import EventEditor from "../EventEditor";
import SelectionDetail from "../SelectionDetail";
import Toolbar from "../Toolbar";
import ViewerIndex from "../ViewerIndex";
/* Event titles: single vertical mode (layout+CSS); see `timeline/eventLabelLayout.ts`. */
import {
  axisMarkLaneOffsetPx,
  assignAxisMarkLanes,
  assignEventLabelLanes,
  layoutDisplacedEventPlacements,
  minEventSeparationPct,
  readRootRemPx,
  verticalColumnWidthPx,
  chooseAxisScaleDetail,
  chooseTimelineZoomMax,
  computeAxisShowYearFlags,
  formatHistoricalDate,
  formatHistoricalYear,
  formatHistoricalYearDate,
  mergeAxisMarks,
  timelineVisibleRangeFromScroll,
  utcYearStartMs,
  type TimelineVisibleRange,
} from "../../timeline";
import Timeline from "../../timeline/Timeline";
import TimelineAxis from "../../timeline/TimelineAxis";
import TimelineTrack from "../../timeline/TimelineTrack";
import ZoomControls from "../../timeline/ZoomControls";
import {
  TimelineEditionService,
  HttpAiService,
  applyChangesLocally,
  createTimelineRepo,
  type TimelineEventDraft,
  type AiConversation,
  type ExecutionPlan,
  type ExecutionPlanStatus,
  type TimelineChange,
  type PreviewChangeSet,
} from "../../timelineEdition";
import { timelineToJson } from "../../timelineEdition/timelineSerialization";
import { useThemeMode } from "../../shell/theme";
import "../../App.css";
import { SearchPanel } from "@/components";

const timelineRepo = createTimelineRepo();
const timelineEditionService = new TimelineEditionService(timelineRepo);
const DEFAULT_API_BASE_URL = "https://ukpswhaxmg.us-east-1.awsapprunner.com";
const EXECUTION_PLAN_POLLING_INTERVAL_MS = 5000;
const apiBaseUrl = import.meta.env.VITE_TIMELINES_API_BASE_URL as string | undefined;
const aiService =
  apiBaseUrl === "local" ? null : new HttpAiService(apiBaseUrl ?? DEFAULT_API_BASE_URL);

type PlanUiState = {
  sourceMessageId: string;
  plan: ExecutionPlan;
  operations: TimelineChange[];
  operationsStatus: ExecutionPlanStatus | null;
  loading: boolean;
  error: string | null;
};

function planPreviewId(planId: string): string {
  return `plan:${planId}`;
}

function hasVisibleChangeSet(changeSet: PreviewChangeSet): boolean {
  return (
    changeSet.added.size > 0 ||
    changeSet.updated.size > 0 ||
    changeSet.removed.size > 0
  );
}

type TimelineJsonItem = Record<string, unknown>;

function slugifyTimelineId(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function normalizedComparable(field: string, value: unknown): unknown {
  if (field === "lanes" && Array.isArray(value)) {
    return value.map((lane) => {
      if (lane === "political") return "politico";
      if (lane === "military") return "militar";
      if (lane === "economic") return "economico";
      if (lane === "cultural") return "social";
      return lane;
    });
  }
  if (
    (field === "date" || field === "start" || field === "end") &&
    typeof value === "string"
  ) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return value;
}

function matchesData(item: TimelineJsonItem, data: Record<string, unknown> | null): boolean {
  if (!data) return true;
  return Object.entries(data).every(([field, value]) => {
    if (value == null) return true;
    return (
      JSON.stringify(normalizedComparable(field, item[field])) ===
      JSON.stringify(normalizedComparable(field, value))
    );
  });
}

function periodId(period: TimelineJsonItem): string {
  return String(period["id"] ?? period["title"] ?? "");
}

function findPeriod(periods: TimelineJsonItem[], idOrTitle: string): TimelineJsonItem | undefined {
  return periods.find(
    (item) => periodId(item) === idOrTitle || item["title"] === idOrTitle
  );
}

function operationAppliedToTimeline(
  events: TimelineJsonItem[],
  periods: TimelineJsonItem[],
  change: TimelineChange
): boolean {
  if (change.type === "create_event") {
    const id = String(
      change.data?.id ?? slugifyTimelineId(String(change.data?.title ?? "evento"))
    );
    const event = events.find((item) => item["id"] === id);
    return event != null && matchesData(event, change.data);
  }
  if (change.type === "update_event") {
    const event = events.find((item) => item["id"] === change.target_id);
    return event != null && matchesData(event, change.data);
  }
  if (change.type === "delete_event") {
    return !events.some((item) => item["id"] === change.target_id);
  }
  if (change.type === "create_period") {
    const id = String(
      change.data?.id ??
      slugifyTimelineId(String(change.data?.title ?? "periodo"))
    );
    const period = findPeriod(periods, id);
    return period != null && matchesData(period, change.data);
  }
  if (change.type === "update_period") {
    const period = findPeriod(periods, String(change.target_id ?? ""));
    return period != null && matchesData(period, change.data);
  }
  if (change.type === "delete_period") {
    return findPeriod(periods, String(change.target_id ?? "")) == null;
  }
  return false;
}

function operationsAppliedToTimeline(
  timeline: TimelineModel,
  changes: readonly TimelineChange[]
): boolean {
  if (changes.length === 0) return false;
  const snapshot = timelineToJson(timeline);
  const events = snapshot.events as TimelineJsonItem[];
  const periods = snapshot.periods as TimelineJsonItem[];
  return changes.every((change) =>
    operationAppliedToTimeline(events, periods, change)
  );
}

function formatDate(d: Date): string {
  return formatHistoricalDate(d);
}

function formatShortDate(d: Date): string {
  return formatHistoricalYearDate(d);
}

/**
 * Horizontal position on the track (0-100% of the container width).
 * Leaves side insets for axis labels and diagonal titles near the first/last event.
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

function eventPointerTitle(e: TimelineEvent, mode: StudyMode): string {
  if (mode === "exam") return e.title;
  const tail = e.summary ?? e.items[0];
  return tail && tail !== e.title ? `${e.title} — ${tail}` : e.title;
}

/** Readable foreground color over a hex background (#rgb or #rrggbb). */
/** First period, in data order, whose window contains the event date (inclusive). */
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

function allPeriodsContainingDate(periods: Period[], date: Date): Period[] {
  const t = date.getTime();
  return periods.filter((p) => t >= p.start.getTime() && t <= p.end.getTime());
}

/** Last chronological event with a date strictly before `tMs`. */
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

/** First chronological event with date >= `tMs`. */
function firstEventFromSorted(
  eventsSorted: TimelineEvent[],
  tMs: number
): TimelineEvent | null {
  for (const e of eventsSorted) {
    if (e.date.getTime() >= tMs) return e;
  }
  return null;
}

/** First chronological event whose date falls inside the period (inclusive). */
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

/** Initial viewer selection: the first event in chronological order. */
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

/** Vertical scroll container under focus (for example legend lists). */
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

/** Must match `.row-bar` height and `.period-row` margin-bottom in App.css. */
const ROW_BAR_REM = 2.25;
const ROW_MARGIN_REM = 0.1;
/** Fallback when `--period-compact-row-h` is unavailable, aligned with `lerpPeriodRowRemFromDriver` low value. */
const ROW_BAR_REM_COMPACT = 0.56;
const ROW_MARGIN_REM_COMPACT = 0;

/**
 * Converts a viewport dimension (in root rems) into the interpolation driver for period row
 * height. Up to ~56rem (mobile plus portrait tablet) stays close to phone density; only after
 * that does it grow for laptops and monitors.
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
  /* Above ~20 the lane grows slowly until ~68, keeping tablets close to mobile density. */
  const start = 20;
  const end = pointerCoarse ? 76 : 68;
  if (driverInRem <= start) return lo;
  if (driverInRem >= end) return hi;
  return lo + ((hi - lo) * (driverInRem - start)) / (end - start);
}

function periodRowCenterFromTopRem(
  rowIndex: number,
  compact: boolean,
  /** Compact lane height in rem (synchronized with `--period-compact-row-h`). */
  compactLaneHeightRem: number = ROW_BAR_REM_COMPACT
): number {
  const bar = compact ? compactLaneHeightRem : ROW_BAR_REM;
  const margin = compact ? ROW_MARGIN_REM_COMPACT : ROW_MARGIN_REM;
  return rowIndex * (bar + margin) + bar / 2;
}

/** Assigns period lanes: reuse a lane when periods do not overlap in time (ordered by start). */
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

/** 0 | 1 by decade (...0-...9 years), stable for negative years. */
function axisBandStripeIndex(bandStartYear: number, bandYears: number): 0 | 1 {
  const k = Math.floor(bandStartYear / bandYears);
  return (((k % 2) + 2) % 2) as 0 | 1;
}

/** Time bands clipped to the axis range, used for alternating colors. */
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
 * January 1 (UTC) instants inside [minMs, maxMs] for axis micro ticks.
 * `major`: main temporal bands get a slightly taller stroke.
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

/** Horizontal timeline zoom (Ctrl + wheel). 1 = base CSS width. */
const TIMELINE_ZOOM_MIN = 0.35;
const TIMELINE_ZOOM_DEFAULT_MAX = 14;
const TIMELINE_ZOOM_STEP = 1.085;
const TIMELINE_VIRTUAL_OVERSCAN_VIEWPORTS = 1;


/** Viewer tablet viewport: panels start collapsed. */
const VIEWER_TABLET_MQ = "(max-width: 1024px)";

function viewerIsTabletViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(VIEWER_TABLET_MQ).matches;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Slider 0..1 <-> zoom (log scale so the control feels natural). */
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

/** X position of the pinch midpoint relative to the visible left edge of the container. */
function touchPinchMidViewportX(scrollEl: HTMLElement, touches: TouchList): number {
  const r = scrollEl.getBoundingClientRect();
  const mx = (touches[0].clientX + touches[1].clientX) / 2;
  return mx - r.left;
}


export default function ViewerPage() {
  const { timelineSlug } = useParams<{ timelineSlug: string }>();
  const [timeline, setTimeline] = useState(() => timelineHistoriaArgentina);
  const timelineRef = useRef(timeline);
  useEffect(() => { timelineRef.current = timeline; }, [timeline]);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [timelineTitle, setTimelineTitle] = useState("Cargando…");
  const [timelineDescription, setTimelineDescription] = useState<string | null>(null);
  const [timelineApiStatus, setTimelineApiStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [previewedMessageId, setPreviewedMessageId] = useState<string | null>(null);
  const [previewTimeline, setPreviewTimeline] = useState<TimelineModel | null>(null);
  const [previewChangeSet, setPreviewChangeSet] = useState<PreviewChangeSet | null>(null);
  const previewMode = previewedMessageId != null;
  const { periods, events } = previewTimeline ?? timeline;

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
  const timelineRange = `${formatShortDate(new Date(min))} — ${formatShortDate(new Date(max))}`;

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
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiConversation, setAiConversation] = useState<AiConversation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSending, setAiSending] = useState(false);
  const [aiApplyingMessageId, setAiApplyingMessageId] = useState<string | null>(null);
  const [aiAppliedIds, setAiAppliedIds] = useState<ReadonlySet<string>>(new Set());
  const [aiNoEffectIds, setAiNoEffectIds] = useState<ReadonlySet<string>>(new Set());
  const [aiError, setAiError] = useState<AiChatError | null>(null);
  const [aiPlansByMessageId, setAiPlansByMessageId] = useState<
    Record<string, PlanUiState>
  >({});

  const [indexOpen, setIndexOpen] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [studyMenuOpen, setStudyMenuOpen] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [cursorPct, setCursorPct] = useState<number | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>("normal");
  const [themeMode, setThemeMode] = useThemeMode();
  const [pointerCoarse, setPointerCoarse] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches
  );
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
  const [timelineVisibleRange, setTimelineVisibleRange] =
    useState<TimelineVisibleRange>({ startPct: 0, endPct: 100 });
  const timelineZoomMax = useMemo(
    () => {
      const baseStackWidthPx =
        stackWidthPx == null ? null : stackWidthPx / timelineZoom;
      const minGapPct = minEventSeparationPct(eventsSorted, (tMs) =>
        pctOnTrack(tMs, min, max)
      );
      const targetEventGapPx =
        verticalColumnWidthPx(pointerCoarse, readRootRemPx()) + 4;
      return chooseTimelineZoomMax(
        min,
        max,
        baseStackWidthPx,
        scrollViewportWidthPx,
        TIMELINE_ZOOM_DEFAULT_MAX,
        minGapPct,
        targetEventGapPx
      );
    },
    [
      min,
      max,
      stackWidthPx,
      timelineZoom,
      scrollViewportWidthPx,
      eventsSorted,
      pointerCoarse,
    ]
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
  useEffect(() => {
    if (!timelineSlug) return;
    let cancelled = false;
    async function loadInitialTimeline() {
      try {
        setTimelineApiStatus("loading");
        const record = await timelineRepo.get(timelineSlug!);
        if (cancelled) return;
        setSelectedTimelineId(record.id);
        setTimelineTitle(record.title);
        setTimelineDescription(record.description);
        setTimeline(record.timeline);
        setSel(defaultEventSelection(record.timeline.events));
        setAiConversation(null);
        setAiPlansByMessageId({});
        setPreviewedMessageId(null);
        setPreviewTimeline(null);
        setPreviewChangeSet(null);
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
  }, [timelineSlug]);

  useEffect(() => {
    if (!aiChatOpen || !selectedTimelineId || !aiService) return;
    let cancelled = false;
    async function loadConversation() {
      setAiLoading(true);
      try {
        const conv = await aiService!.getConversation(selectedTimelineId!);
        const planSummaries = await aiService!.listPlans(selectedTimelineId!);
        const planEntries = await Promise.all(
          planSummaries.map(async (summary) => {
            const plan = await aiService!.getPlan(selectedTimelineId!, summary.id);
            const proposed = await aiService!.getProposedChanges(
              selectedTimelineId!,
              plan.id
            );
            return {
              sourceMessageId: summary.sourceMessageId,
              state: {
                sourceMessageId: summary.sourceMessageId,
                plan,
                operations: proposed.operations,
                operationsStatus: proposed.status,
                loading: false,
                error: null,
              } satisfies PlanUiState,
            };
          })
        );
        if (cancelled) return;

        const loadedPlans = Object.fromEntries(
          planEntries.map((entry) => [entry.sourceMessageId, entry.state])
        );
        const appliedIds = new Set<string>();
        for (const message of conv.messages) {
          if (
            message.proposedChanges.length > 0 &&
            operationsAppliedToTimeline(timelineRef.current, message.proposedChanges)
          ) {
            appliedIds.add(message.id);
          }
        }
        for (const entry of planEntries) {
          if (
            entry.state.operations.length > 0 &&
            operationsAppliedToTimeline(timelineRef.current, entry.state.operations)
          ) {
            appliedIds.add(planPreviewId(entry.state.plan.id));
          }
        }

        setAiConversation(conv);
        setAiPlansByMessageId(loadedPlans);
        setAiAppliedIds(appliedIds);
      } catch (error) {
        console.error("Could not load AI state", error);
        if (!cancelled) setAiError({ kind: "send", message: String(error) });
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }
    loadConversation();
    return () => { cancelled = true; };
  }, [aiChatOpen, selectedTimelineId]);

  const sendAiMessage = useCallback(async (content: string) => {
    if (!selectedTimelineId || !aiService) return;
    setAiSending(true);
    setAiError(null);

    // Show the user's message immediately (optimistic).
    const optimisticMsg = {
      id: "__optimistic__",
      role: "user" as const,
      content,
      createdAt: new Date(),
      proposedChanges: [] as TimelineChange[],
      messageType: "response" as const,
    };
    setAiConversation((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, optimisticMsg] }
        : { timelineId: selectedTimelineId, messages: [optimisticMsg] }
    );

    try {
      const conv = await aiService.sendMessage(selectedTimelineId, content);
      setAiConversation(conv);

      // Auto-preview when the latest assistant response proposes visible changes.
      const lastMsg = conv.messages[conv.messages.length - 1];
      if (
        lastMsg?.role === "assistant" &&
        lastMsg.messageType === "response" &&
        lastMsg.proposedChanges.length > 0
      ) {
        try {
          const { timeline: preview, changeSet } = applyChangesLocally(
            timelineRef.current,
            lastMsg.proposedChanges
          );
          if (!hasVisibleChangeSet(changeSet)) {
            setAiNoEffectIds((prev) => new Set([...prev, lastMsg.id]));
          } else {
            setPreviewTimeline(preview);
            setPreviewChangeSet(changeSet);
            setPreviewedMessageId(lastMsg.id);
          }
        } catch (error) {
          console.error("AI preview failed", error);
          setAiError({ kind: "preview", message: String(error) });
        }
      }
    } catch (error) {
      console.error("AI message failed", error);
      setAiError({ kind: "send", message: String(error) });
      // Revert the optimistic message.
      setAiConversation((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== "__optimistic__") }
          : prev
      );
    } finally {
      setAiSending(false);
    }
  }, [selectedTimelineId]);

  const applyAiChanges = useCallback(async (changes: TimelineChange[], messageId: string) => {
    if (!selectedTimelineId || !aiService) return;
    setAiApplyingMessageId(messageId);
    setAiError(null);
    try {
      const record = await aiService.applyOperations(selectedTimelineId, changes);
      setTimeline(record.timeline);
      setAiAppliedIds((prev) => new Set([...prev, messageId]));
      setPreviewedMessageId(null);
      setPreviewTimeline(null);
      setPreviewChangeSet(null);
    } catch (error) {
      console.error("Apply operations failed", error);
      setAiError({ kind: "apply", message: String(error) });
    } finally {
      setAiApplyingMessageId(null);
    }
  }, [selectedTimelineId]);

  const cancelPreview = useCallback(() => {
    setPreviewedMessageId(null);
    setPreviewTimeline(null);
    setPreviewChangeSet(null);
  }, []);

  const dismissAiChanges = useCallback(() => {
    cancelPreview();
  }, [cancelPreview]);

  const startPreview = useCallback((changes: TimelineChange[], messageId: string) => {
    try {
      const { timeline: preview, changeSet } = applyChangesLocally(timeline, changes);
      if (!hasVisibleChangeSet(changeSet)) {
        setAiNoEffectIds((prev) => new Set([...prev, messageId]));
        return;
      }
      setPreviewTimeline(preview);
      setPreviewChangeSet(changeSet);
      setPreviewedMessageId(messageId);
    } catch (error) {
      console.error("AI preview failed", error);
      setAiError({ kind: "preview", message: String(error) });
    }
  }, [timeline]);

  const refreshPlan = useCallback(
    async (planId: string) => {
      if (!selectedTimelineId || !aiService) return null;
      const plan = await aiService.getPlan(selectedTimelineId, planId);
      const proposed = await aiService.getProposedChanges(selectedTimelineId, plan.id);
      const operations = proposed.operations;
      if (
        operations.length > 0 &&
        operationsAppliedToTimeline(timelineRef.current, operations)
      ) {
        setAiAppliedIds((prev) => new Set([...prev, planPreviewId(plan.id)]));
      }
      setAiPlansByMessageId((prev) => {
        const entry = Object.values(prev).find((item) => item.plan.id === plan.id);
        if (!entry) return prev;
        return {
          ...prev,
          [entry.sourceMessageId]: {
            ...entry,
            plan,
            operations,
            operationsStatus: proposed.status,
            loading: false,
            error: null,
          },
        };
      });
      return plan;
    },
    [selectedTimelineId]
  );

  const startAiPlan = useCallback(
    async (messageId: string) => {
      if (!selectedTimelineId || !aiService) return;
      setAiPlansByMessageId((prev) => {
        const current = prev[messageId];
        return {
          ...prev,
          [messageId]: current
            ? { ...current, loading: true, error: null }
            : {
              sourceMessageId: messageId,
              plan: {
                id: `pending-${messageId}`,
                timelineId: selectedTimelineId,
                status: "draft",
                proposedChanges: [],
                steps: [],
                createdAt: new Date(),
              },
              operations: [],
              operationsStatus: null,
              loading: true,
              error: null,
            },
        };
      });
      try {
        const plan = await aiService.startPlan(selectedTimelineId, messageId);
        const proposed = await aiService.getProposedChanges(selectedTimelineId, plan.id);
        setAiPlansByMessageId((prev) => ({
          ...prev,
          [messageId]: {
            sourceMessageId: messageId,
            plan,
            operations: proposed.operations,
            operationsStatus: proposed.status,
            loading: false,
            error: null,
          },
        }));
      } catch (error) {
        console.error("Start plan failed", error);
        setAiPlansByMessageId((prev) => {
          const current = prev[messageId];
          if (!current) return prev;
          return {
            ...prev,
            [messageId]: { ...current, loading: false, error: String(error) },
          };
        });
      }
    },
    [selectedTimelineId]
  );

  const executeAiPlan = useCallback(
    async (planId: string) => {
      if (!selectedTimelineId || !aiService) return;
      const entry = Object.values(aiPlansByMessageId).find(
        (item) => item.plan.id === planId
      );
      if (!entry) return;
      setAiPlansByMessageId((prev) => ({
        ...prev,
        [entry.sourceMessageId]: { ...entry, loading: true, error: null },
      }));
      try {
        await aiService.executePlan(selectedTimelineId, planId);
        await refreshPlan(planId);
      } catch (error) {
        console.error("Execute plan failed", error);
        setAiPlansByMessageId((prev) => ({
          ...prev,
          [entry.sourceMessageId]: {
            ...prev[entry.sourceMessageId]!,
            loading: false,
            error: String(error),
          },
        }));
      }
    },
    [aiPlansByMessageId, refreshPlan, selectedTimelineId]
  );

  const previewAiPlan = useCallback(
    (planId: string) => {
      const entry = Object.values(aiPlansByMessageId).find(
        (item) => item.plan.id === planId
      );
      if (!entry || entry.operations.length === 0) return;
      const sourceId = planPreviewId(planId);
      try {
        const { timeline: preview, changeSet } = applyChangesLocally(
          timeline,
          entry.operations
        );
        if (!hasVisibleChangeSet(changeSet)) return;
        setPreviewTimeline(preview);
        setPreviewChangeSet(changeSet);
        setPreviewedMessageId(sourceId);
      } catch (error) {
        console.error("Plan preview failed", error);
        setAiError({ kind: "preview", message: String(error) });
      }
    },
    [aiPlansByMessageId, timeline]
  );

  const applyAiPlan = useCallback(
    async (planId: string) => {
      if (!selectedTimelineId || !aiService) return;
      const entry = Object.values(aiPlansByMessageId).find(
        (item) => item.plan.id === planId
      );
      if (!entry || entry.operations.length === 0) return;
      setAiApplyingMessageId(planPreviewId(planId));
      setAiError(null);
      try {
        const record = await aiService.applyOperations(
          selectedTimelineId,
          entry.operations
        );
        setTimeline(record.timeline);
        setAiAppliedIds((prev) => new Set([...prev, planPreviewId(planId)]));
        setPreviewedMessageId(null);
        setPreviewTimeline(null);
        setPreviewChangeSet(null);
      } catch (error) {
        console.error("Apply plan operations failed", error);
        setAiError({ kind: "apply", message: String(error) });
      } finally {
        setAiApplyingMessageId(null);
      }
    },
    [aiPlansByMessageId, selectedTimelineId]
  );

  const refineAiPlan = useCallback(
    async (planId: string, prompt: string) => {
      if (!selectedTimelineId || !aiService) return;
      const entry = Object.values(aiPlansByMessageId).find(
        (item) => item.plan.id === planId
      );
      if (!entry) return;
      setAiPlansByMessageId((prev) => ({
        ...prev,
        [entry.sourceMessageId]: { ...entry, loading: true, error: null },
      }));
      try {
        await aiService.refinePlan(selectedTimelineId, planId, prompt.trim() || null);
        await refreshPlan(planId);
      } catch (error) {
        console.error("Refine plan failed", error);
        setAiPlansByMessageId((prev) => ({
          ...prev,
          [entry.sourceMessageId]: {
            ...prev[entry.sourceMessageId]!,
            loading: false,
            error: String(error),
          },
        }));
      }
    },
    [aiPlansByMessageId, refreshPlan, selectedTimelineId]
  );

  const retryAiPlanStep = useCallback(
    async (planId: string, stepId: string) => {
      if (!selectedTimelineId || !aiService) return;
      const entry = Object.values(aiPlansByMessageId).find(
        (item) => item.plan.id === planId
      );
      if (!entry) return;
      setAiPlansByMessageId((prev) => ({
        ...prev,
        [entry.sourceMessageId]: { ...entry, loading: true, error: null },
      }));
      try {
        await aiService.retryStep(selectedTimelineId, planId, stepId);
        await refreshPlan(planId);
      } catch (error) {
        console.error("Retry plan step failed", error);
        setAiPlansByMessageId((prev) => ({
          ...prev,
          [entry.sourceMessageId]: {
            ...prev[entry.sourceMessageId]!,
            loading: false,
            error: String(error),
          },
        }));
      }
    },
    [aiPlansByMessageId, refreshPlan, selectedTimelineId]
  );

  const activePlanIdsKey = useMemo(
    () =>
      Object.values(aiPlansByMessageId)
        .map((entry) => entry.plan)
        .filter((plan) => plan.status === "executing" || plan.status === "refining")
        .map((plan) => plan.id)
        .sort()
        .join("|"),
    [aiPlansByMessageId]
  );

  useEffect(() => {
    if (!selectedTimelineId || !aiService) return;
    const activePlanIds = activePlanIdsKey === "" ? [] : activePlanIdsKey.split("|");
    if (activePlanIds.length === 0) return;

    let cancelled = false;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        await Promise.all(
          activePlanIds.map((planId) =>
            refreshPlan(planId).catch((error) => {
              if (!cancelled) console.error("Plan polling failed", error);
            })
          )
        );
      } finally {
        polling = false;
      }
    };
    const intervalId = window.setInterval(() => {
      void poll();
    }, EXECUTION_PLAN_POLLING_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activePlanIdsKey, refreshPlan, selectedTimelineId]);

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

  const displacedEventPlacements = useMemo(() => {
    if (!stackWidthPx || stackWidthPx <= 0) return [];
    const trackPct = (tMs: number) => pctOnTrack(tMs, min, max);
    const colPx = verticalColumnWidthPx(pointerCoarse, readRootRemPx());
    return layoutDisplacedEventPlacements(
      eventsSorted,
      [{ lane: 0, anchor: "center", maxWidthPx: 160, columnPx: colPx }],
      trackPct,
      stackWidthPx
    );
  }, [eventsSorted, min, max, stackWidthPx, pointerCoarse]);

  const axisMarksPlaced = useMemo(() => {
    const tPct = (tMs: number) => pctOnTrack(tMs, min, max);
    return assignAxisMarkLanes(axisMarks, tPct, axisShowYearByT, stackWidthPx);
  }, [axisMarks, min, max, axisShowYearByT, stackWidthPx]);

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
   * Period lane height (rem): tablets share the mobile driver bucket while large monitors remain
   * comfortable. `min(driver(vmin), driver(vh))` respects short or low-usable-height windows.
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

  const periodsForEvent = useMemo((): Period[] => {
    if (sel == null || sel.kind !== "event") return [];
    return allPeriodsContainingDate(periods, sel.item.date);
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
  /** Synchronous zoom read for native listeners (pinch). */
  const timelineZoomRef = useRef(timelineZoom);
  timelineZoomRef.current = timelineZoom;
  /** Cancels horizontal drag when a two-finger pinch begins. */
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
    setIndexOpen(false);
    setDetailCollapsed(tablet);
  }, []);

  /** Ensures viewport-locked layout applies before `html:has(.app--viewer)` settles. */
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

  const createTimelineCopy = useCallback(async () => {
    try {
      setTimelineApiStatus("loading");
      const record = await timelineRepo.create({
        title: `${timelineTitle} copia`,
        description: timelineDescription,
        timeline,
      });
      navigate(`/${record.id}`);
    } catch (error) {
      console.error("Could not create timeline copy", error);
      setTimelineApiStatus("error");
    }
  }, [navigate, timeline, timelineDescription, timelineTitle]);

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
    if (!el) {
      const scrollEl = timelineScrollRef.current;
      if (!scrollEl) return;
      const pct =
        sel.kind === "period"
          ? (pctOnTrack(sel.item.start.getTime(), min, max) +
              pctOnTrack(sel.item.end.getTime(), min, max)) /
            2
          : pctOnTrack(sel.item.date.getTime(), min, max);
      const targetLeft =
        (pct / 100) * scrollEl.scrollWidth - scrollEl.clientWidth / 2;
      scrollEl.scrollLeft = clamp(
        targetLeft,
        0,
        Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth)
      );
      return;
    }
    const smoothScroll =
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: smoothScroll ? "smooth" : "auto",
      block: "nearest",
      inline: "center",
    });
  }, [max, min, sel, timelineZoom]);

  const viewerShellClass = [
    sel === null ? "" : "viewer-shell--sel-compact",
    studyMode === "causal" ? "viewer-shell--study-causal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const el = timelineStackRef.current;
    const scrollEl = timelineScrollRef.current;
    if (!el) return;
    const updateMetrics = () => {
      setStackWidthPx(el.offsetWidth);
      setScrollViewportWidthPx(scrollEl?.clientWidth ?? null);
      if (scrollEl) {
        setTimelineVisibleRange(
          timelineVisibleRangeFromScroll(
            scrollEl.scrollLeft,
            scrollEl.clientWidth,
            scrollEl.scrollWidth,
            TIMELINE_VIRTUAL_OVERSCAN_VIEWPORTS
          )
        );
      }
    };
    const ro = new ResizeObserver(updateMetrics);
    ro.observe(el);
    if (scrollEl) ro.observe(scrollEl);
    updateMetrics();
    return () => ro.disconnect();
  }, [timelineZoom]);

  useEffect(() => {
    const scrollEl = timelineScrollRef.current;
    if (!scrollEl) return;
    let frameId = 0;
    const updateVisibleRange = () => {
      frameId = 0;
      setTimelineVisibleRange(
        timelineVisibleRangeFromScroll(
          scrollEl.scrollLeft,
          scrollEl.clientWidth,
          scrollEl.scrollWidth,
          TIMELINE_VIRTUAL_OVERSCAN_VIEWPORTS
        )
      );
    };
    const onScroll = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(updateVisibleRange);
    };
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    updateVisibleRange();
    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
    };
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

  const onTimelineWheelRef = useRef<(e: WheelEvent) => void>(() => { });
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
      /* Only when entering exactly two fingers: avoids restarting when a third finger joins. */
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

      if (e.key === "Escape" && previewedMessageId != null) {
        e.preventDefault();
        cancelPreview();
        return;
      }

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

      /* Ctrl/Cmd + arrows: previous/next event, same logic as the buttons. */
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

      /* Without modifiers, selected arrow up/down switches between period and event context. */
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
    previewedMessageId,
    cancelPreview,
  ]);

  return (
    <div className="app app--viewer">
      <div
        className={`viewer-shell ${viewerShellClass} ${sel != null ? "viewer-shell--has-selection" : ""} ${indexOpen ? "viewer-shell--index-open" : ""} ${detailCollapsed ? "viewer-shell--detail-collapsed" : ""}`.trim()}
      >
        <Toolbar
          title={timelineTitle}
          indexOpen={indexOpen}
          filtersOpen={filtersOpen}
          previewMode={previewMode}
          timelineApiLoading={timelineApiStatus === "loading"}
          laneVisibility={laneVisibility}
          studyMode={studyMode}
          studyMenuOpen={studyMenuOpen}
          themeMode={themeMode}
          themeMenuOpen={themeMenuOpen}
          allPanelsCollapsed={detailCollapsed && !aiChatOpen && !indexOpen}
          hasSelection={sel != null}
          onToggleIndex={() => {
            setIndexOpen((open) => {
              const next = !open;
              if (next) setDetailCollapsed(true);
              return next;
            });
          }}
          onToggleFilters={() => setFiltersOpen((open) => !open)}
          onToggleLane={toggleLaneVisibility}
          onGoHome={() => {
            setHelpOpen(false);
            navigate("/");
          }}
          onOpenHelp={() => setHelpOpen(true)}
          onCreateCopy={createTimelineCopy}
          onCreateEvent={() => !previewMode && setEditorState({ kind: "create" })}
          onToggleStudyMenu={() => setStudyMenuOpen((open) => !open)}
          onSelectStudyMode={(mode) => {
            setStudyMode(mode);
            setStudyMenuOpen(false);
          }}
          onToggleThemeMenu={() => setThemeMenuOpen((open) => !open)}
          onSelectThemeMode={(mode) => {
            setThemeMode(mode);
            setThemeMenuOpen(false);
          }}
          onTogglePanels={() => {
            const allPanelsCollapsed = detailCollapsed && !aiChatOpen && !indexOpen;
            if (allPanelsCollapsed) {
              setIndexOpen(true);
              setAiChatOpen(true);
              if (sel != null) setDetailCollapsed(false);
            } else {
              setDetailCollapsed(true);
              setAiChatOpen(false);
              setIndexOpen(false);
            }
          }}
        />

        <div className="viewer-main">
          <div
            className={`viewer-chart-wrap ${sel != null ? "viewer-chart-wrap--pinned" : ""}`.trim()}
          >
            <Timeline
              scrollRef={timelineScrollRef}
              stackRef={timelineStackRef}
              stackStyle={{
                "--timeline-zoom": String(timelineZoom),
                "--event-label-max-lane": 0,
                "--period-compact-row-h": `${compactPeriodRowRem}rem`,
                "--period-row-count": periodIndicesByLane.length,
                "--events-semantic-lane-count": EVENT_LANE_ORDER.length,
                ...laneColorCssVars,
              } as CSSProperties}
              onPointerDown={onTimelinePointerDown}
              onMouseMove={(e) => {
                const stack = timelineStackRef.current;
                if (!stack) return;
                const rect = stack.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / stack.offsetWidth) * 100;
                setCursorPct(Math.max(0, Math.min(100, pct)));
              }}
              onMouseLeave={() => setCursorPct(null)}
              controls={
                <ZoomControls
                  canGoToPreviousEvent={eventStepAvailability.canPrev}
                  canGoToNextEvent={eventStepAvailability.canNext}
                  zoomSliderValue={zoomSliderValue}
                  zoomReadout={formatZoomFactorUi(timelineZoom, timelineZoomMax)}
                  onGoToPreviousEvent={() => stepEvent(-1)}
                  onGoToNextEvent={() => stepEvent(1)}
                  onZoomOut={() => onZoomNudge(-1)}
                  onZoomIn={() => onZoomNudge(1)}
                  onZoomSliderChange={onZoomSliderChange}
                />
              }
            >
              <TimelineAxis
                maxLaneOffsetPx={axisMarkMaxLaneOffsetPx}
                centuryBands={axisCenturyBandRects}
                decadeBands={axisDecadeBandRects}
                microTicks={axisYearMicroTicks}
                marks={axisMarksPlaced}
                selection={sel}
                eventsSorted={eventsSorted}
                showYearByTime={axisShowYearByT}
                trackPct={(timeMs) => pctOnTrack(timeMs, min, max)}
                onSelectEvent={(event) => setSel({ kind: "event", item: event })}
              />

              <TimelineTrack
                periods={periods}
                eventsSorted={eventsSorted}
                selection={sel}
                minMs={min}
                maxMs={max}
                cursorPct={cursorPct}
                laneByIndex={laneByIndex}
                periodIndicesByLane={periodIndicesByLane}
                compactPeriodRowRem={compactPeriodRowRem}
                activePeriod={activePeriodForTimeline}
                studyMode={studyMode}
                laneVisibility={laneVisibility}
                causalHighlight={causalHighlight}
                causalitySvgEdges={causalitySvgEdges}
                eventLabelPlacements={eventLabelPlacements}
                displacedEventPlacements={displacedEventPlacements}
                pointerCoarse={pointerCoarse}
                viewportInnerHeightPx={layoutProbe.vhPx}
                previewChangeSet={previewChangeSet ?? undefined}
                visibleRange={timelineVisibleRange}
                selectedPeriodBarRef={timelineSelectedPeriodBarRef}
                selectedEventDotRef={timelineSelectedEventDotRef}
                trackPct={(timeMs) => pctOnTrack(timeMs, min, max)}
                periodRowCenterFromTopRem={periodRowCenterFromTopRem}
                foregroundForHex={foregroundForHex}
                formatDate={formatDate}
                eventPassesLaneFilter={eventPassesLaneFilter}
                eventPointerTitle={(event) => eventPointerTitle(event, studyMode)}
                onSelectPeriod={(period) => setSel({ kind: "period", item: period })}
                onSelectEvent={(event) => setSel({ kind: "event", item: event })}
              />
            </Timeline>
          </div>

          <div className="viewer-map-overlays" aria-label="Paneles del visor">
            {indexOpen ? (
              <ViewerIndex
                periods={periods}
                events={events}
                sel={sel}
                activePeriodForTimeline={activePeriodForTimeline}
                timelineTitle={timelineTitle}
                timelineRange={timelineRange}
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

            <SelectionDetail
              sel={sel}
              studyMode={studyMode}
              eventsById={eventsById}
              activePeriodForTimeline={activePeriodForTimeline}
              periodsForEvent={periodsForEvent}
              collapsed={detailCollapsed}
              previewMode={previewMode}
              onToggleCollapsed={() =>
                setDetailCollapsed((collapsed) => !collapsed)
              }
              onSelectEvent={(e) => setSel({ kind: "event", item: e })}
              onEditEvent={(e) => !previewMode && setEditorState({ kind: "edit", event: e })}
              onDeleteEvent={deleteSelectedEvent}
            />
          </div>
        </div>

        {editorState ? (
          <EventEditor
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
        {previewMode && (
          <>
            <div className="preview-viewport-ring" aria-hidden />
            <div className="preview-mode-banner" role="status">
              {previewedMessageId?.startsWith("plan:")
                ? "Preview de plan AI"
                : "Preview de cambios del agente"}
            </div>
          </>
        )}
        {selectedTimelineId && aiService ? (
          <AiChatPanel
            collapsed={!aiChatOpen}
            conversation={aiConversation}
            loading={aiLoading}
            sending={aiSending}
            applyingMessageId={aiApplyingMessageId}
            appliedMessageIds={aiAppliedIds}
            noEffectMessageIds={aiNoEffectIds}
            previewedMessageId={previewedMessageId}
            planStates={aiPlansByMessageId}
            error={aiError}
            onToggleCollapsed={() => setAiChatOpen((open) => !open)}
            onSend={sendAiMessage}
            onApply={applyAiChanges}
            onDismiss={dismissAiChanges}
            onPreview={startPreview}
            onCancelPreview={cancelPreview}
            onStartPlan={startAiPlan}
            onExecutePlan={executeAiPlan}
            onPreviewPlan={previewAiPlan}
            onApplyPlan={applyAiPlan}
            onRefinePlan={refineAiPlan}
            onRetryStep={retryAiPlanStep}
          />
        ) : null}
        <SearchPanel
          key="search-panel"
          Timeline={{ periods, events }}
          onSelectPeriod={(period) => setSel({ kind: "period", item: period })}
          onSelectEvent={(event) => setSel({ kind: "event", item: event })}
        />
      </div>
    </div>
  );
}
