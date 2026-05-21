export type TimelineVisibleRange = {
  startPct: number;
  endPct: number;
};

export const FULL_TIMELINE_VISIBLE_RANGE: TimelineVisibleRange = {
  startPct: 0,
  endPct: 100,
};

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function timelineVisibleRangeFromScroll(
  scrollLeftPx: number,
  viewportWidthPx: number,
  contentWidthPx: number,
  overscanViewportCount = 1
): TimelineVisibleRange {
  if (
    !Number.isFinite(scrollLeftPx) ||
    !Number.isFinite(viewportWidthPx) ||
    !Number.isFinite(contentWidthPx) ||
    viewportWidthPx <= 0 ||
    contentWidthPx <= 0 ||
    contentWidthPx <= viewportWidthPx
  ) {
    return FULL_TIMELINE_VISIBLE_RANGE;
  }

  const overscanPx = Math.max(0, viewportWidthPx * overscanViewportCount);
  return {
    startPct: clampPct(((scrollLeftPx - overscanPx) / contentWidthPx) * 100),
    endPct: clampPct(
      ((scrollLeftPx + viewportWidthPx + overscanPx) / contentWidthPx) * 100
    ),
  };
}

export function timelinePointInVisibleRange(
  pointPct: number,
  range: TimelineVisibleRange
): boolean {
  return pointPct >= range.startPct && pointPct <= range.endPct;
}

export function timelineSpanIntersectsVisibleRange(
  startPct: number,
  endPct: number,
  range: TimelineVisibleRange
): boolean {
  const leftPct = Math.min(startPct, endPct);
  const rightPct = Math.max(startPct, endPct);
  return rightPct >= range.startPct && leftPct <= range.endPct;
}
