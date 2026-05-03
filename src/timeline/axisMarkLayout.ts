/**
 * Marcas del eje temporal (fechas de períodos + eventos): fusión, deduplicación visual de año
 * y posición en pista. Las etiquetas del eje son siempre verticales (año + mes/día en lectura vertical).
 */
import {
  formatHistoricalDate,
  formatHistoricalMonthDay,
  formatHistoricalYearDate,
} from "./historicalDateFormat";

export type AxisMark = { t: number; year: string; monthDay: string };

const AXIS_MARK_LANE_GAP_PCT = 0.32;
const AXIS_MARK_FIRST_OF_YEAR_GAP_PCT = 0.72;
const AXIS_MARK_MIN_LABEL_WIDTH_PX = 16;
const AXIS_MARK_YEAR_CHAR_PX = 7.2;
const AXIS_MARK_MONTHDAY_CHAR_PX = 6.6;
const AXIS_MARK_FULL_DATE_HEIGHT_PX = 60;
const AXIS_MARK_SHORT_DATE_HEIGHT_PX = 27;

/** Línea superior del tick del eje (año). */
export function formatAxisYear(d: Date): string {
  return formatHistoricalYearDate(d);
}

/** Línea inferior: mes abreviado + día. */
export function formatAxisMonthDay(d: Date): string {
  return formatHistoricalMonthDay(d);
}

export function mergeAxisMarks(
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

/**
 * Primera marca de cada año calendario en orden cronológico muestra año;
 * las siguientes con la misma cadena `year` lo omiten.
 */
export function computeAxisShowYearFlags(marks: readonly AxisMark[]): boolean[] {
  return marks.map((m, i) => i === 0 || m.year !== marks[i - 1]!.year);
}

export function axisMarkLaneOffsetPx(lane: number): number {
  if (lane <= 0) return 0;
  return (
    AXIS_MARK_FULL_DATE_HEIGHT_PX +
    AXIS_MARK_SHORT_DATE_HEIGHT_PX * (lane - 1)
  );
}

function axisMarkLabelWidthPx(mark: AxisMark, showYear: boolean): number {
  const yearPx = showYear ? mark.year.length * AXIS_MARK_YEAR_CHAR_PX : 0;
  const monthDayPx = mark.monthDay.length * AXIS_MARK_MONTHDAY_CHAR_PX;
  const gapPx = showYear ? 4 : 0;
  return Math.max(AXIS_MARK_MIN_LABEL_WIDTH_PX, yearPx + gapPx + monthDayPx);
}

/**
 * Ordena marcas por posición en pista y usa carriles verticales solo cuando sus etiquetas
 * competirían por el mismo espacio horizontal.
 */
export function assignAxisMarkLanes(
  marks: AxisMark[],
  trackPct: (tMs: number) => number,
  showYearByT: ReadonlyMap<number, boolean> = new Map(),
  stackWidthPx: number | null = null
): { mark: AxisMark; p: number; lane: number }[] {
  const sorted = marks
    .map((mark) => ({
      mark,
      p: trackPct(mark.t),
    }))
    .sort((a, b) => a.p - b.p || a.mark.t - b.mark.t);

  if (stackWidthPx == null || stackWidthPx <= 0) {
    return sorted.map(({ mark, p }) => ({ mark, p, lane: 0 }));
  }

  let currentYear: string | null = null;
  let laneRightEdgePct: number[] = [];
  return sorted.map(({ mark, p }) => {
    const showYear = showYearByT.get(mark.t) ?? true;
    if (mark.year !== currentYear) {
      currentYear = mark.year;
      laneRightEdgePct = [];
    }
    const widthPct = (axisMarkLabelWidthPx(mark, showYear) / stackWidthPx) * 100;
    const left = p - widthPct / 2;
    const right = p + widthPct / 2;
    let lane = 0;
    while (
      laneRightEdgePct[lane] != null &&
      left <
        laneRightEdgePct[lane]! +
          (lane === 0 ? AXIS_MARK_FIRST_OF_YEAR_GAP_PCT : AXIS_MARK_LANE_GAP_PCT)
    ) {
      lane += 1;
    }
    laneRightEdgePct[lane] = right;
    return { mark, p, lane };
  });
}

/** Etiqueta accesible con fecha completa (UTC) para ticks del eje. */
export function axisTickAriaLabel(mark: AxisMark): string {
  return formatHistoricalDate(new Date(mark.t));
}
