export type AxisScaleDetail = {
  bandYears: number;
  microTickYears: number;
};

const APPROX_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const BAND_YEAR_STEPS = [10, 25, 50, 100, 250, 500, 1000] as const;
const MICRO_TICK_YEAR_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500] as const;
const TARGET_BAND_WIDTH_PX = 34;
const TARGET_MICRO_TICK_GAP_PX = 7;
const TARGET_MAX_ZOOM_VISIBLE_YEARS = 36;

export function utcYearStartMs(year: number): number {
  const date = new Date(Date.UTC(0, 0, 1, 0, 0, 0, 0));
  date.setUTCFullYear(year);
  return date.getTime();
}

export function chooseAxisScaleDetail(
  minMs: number,
  maxMs: number,
  stackWidthPx: number | null
): AxisScaleDetail {
  if (
    !Number.isFinite(minMs) ||
    !Number.isFinite(maxMs) ||
    maxMs <= minMs ||
    stackWidthPx == null ||
    stackWidthPx <= 0
  ) {
    return { bandYears: 10, microTickYears: 1 };
  }

  const yMin = new Date(minMs).getUTCFullYear();
  const yMax = new Date(maxMs).getUTCFullYear();
  const yearSpan = Math.max(1, yMax - yMin + 1);
  const yearsPerPx = yearSpan / stackWidthPx;

  return {
    bandYears: firstStepAtLeast(BAND_YEAR_STEPS, yearsPerPx * TARGET_BAND_WIDTH_PX),
    microTickYears: firstStepAtLeast(
      MICRO_TICK_YEAR_STEPS,
      yearsPerPx * TARGET_MICRO_TICK_GAP_PX
    ),
  };
}

export function chooseTimelineZoomMax(
  minMs: number,
  maxMs: number,
  baseStackWidthPx: number | null,
  viewportWidthPx: number | null,
  defaultMaxZoom: number,
  minEventGapPct: number | null = null,
  targetEventGapPx: number | null = null
): number {
  if (
    !Number.isFinite(minMs) ||
    !Number.isFinite(maxMs) ||
    maxMs <= minMs ||
    baseStackWidthPx == null ||
    baseStackWidthPx <= 0 ||
    viewportWidthPx == null ||
    viewportWidthPx <= 0
  ) {
    return defaultMaxZoom;
  }

  const yearSpan = Math.max(1, (maxMs - minMs) / APPROX_YEAR_MS);
  const zoomForFewDecades =
    (yearSpan * viewportWidthPx) /
    (baseStackWidthPx * TARGET_MAX_ZOOM_VISIBLE_YEARS);

  const zoomForEventDensity =
    minEventGapPct != null &&
    minEventGapPct > 0 &&
    targetEventGapPx != null &&
    targetEventGapPx > 0
      ? targetEventGapPx / (baseStackWidthPx * (minEventGapPct / 100))
      : defaultMaxZoom;

  return Math.max(
    defaultMaxZoom,
    Math.ceil(zoomForFewDecades),
    Math.ceil(zoomForEventDensity)
  );
}

function firstStepAtLeast<const T extends readonly number[]>(
  steps: T,
  value: number
): T[number] {
  return steps.find((step) => step >= value) ?? steps[steps.length - 1]!;
}
