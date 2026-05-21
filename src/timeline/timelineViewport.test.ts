import { describe, expect, it } from "vitest";
import {
  FULL_TIMELINE_VISIBLE_RANGE,
  timelinePointInVisibleRange,
  timelineSpanIntersectsVisibleRange,
  timelineVisibleRangeFromScroll,
} from "./timelineViewport";

describe("timeline viewport", () => {
  it("returns the full range when content does not overflow", () => {
    expect(timelineVisibleRangeFromScroll(0, 1000, 900)).toEqual(
      FULL_TIMELINE_VISIBLE_RANGE
    );
  });

  it("adds viewport-sized overscan around the visible scroll window", () => {
    expect(timelineVisibleRangeFromScroll(1000, 500, 4000)).toEqual({
      startPct: 12.5,
      endPct: 50,
    });
  });

  it("clamps the overscanned range to timeline bounds", () => {
    expect(timelineVisibleRangeFromScroll(0, 500, 4000)).toEqual({
      startPct: 0,
      endPct: 25,
    });
    expect(timelineVisibleRangeFromScroll(3500, 500, 4000)).toEqual({
      startPct: 75,
      endPct: 100,
    });
  });

  it("matches points and spans against the visible range", () => {
    const range = { startPct: 20, endPct: 40 };

    expect(timelinePointInVisibleRange(25, range)).toBe(true);
    expect(timelinePointInVisibleRange(45, range)).toBe(false);
    expect(timelineSpanIntersectsVisibleRange(10, 30, range)).toBe(true);
    expect(timelineSpanIntersectsVisibleRange(41, 50, range)).toBe(false);
  });
});
