import { describe, expect, it } from "vitest";
import type { TimelineEvent } from "../../types";
import {
  assignEventLabelLanes,
  EVENT_TITLE_VROT_WRAP_PAD_PX,
  labelIntervalsOverlap,
  readRootRemPx,
  verticalColumnWidthPx,
  verticalEventTitlesRowLayoutPx,
  verticalReadSlotHeightPx,
} from "./eventLabelLayoutCore";

function makeEvent(
  title: string,
  date: Date
): TimelineEvent {
  return {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    items: [],
    date,
    lanes: ["politico"],
  };
}

describe("labelIntervalsOverlap", () => {
  it("returns false for separated intervals respecting gap", () => {
    expect(labelIntervalsOverlap([0, 10], [20, 30], 1)).toBe(false);
  });

  it("returns true when intervals overlap in % space with gap", () => {
    expect(labelIntervalsOverlap([0, 10], [8, 18], 1)).toBe(true);
  });

  it("returns false when edges touch and gap is zero", () => {
    expect(labelIntervalsOverlap([0, 10], [10, 20], 0)).toBe(false);
  });
});

describe("assignEventLabelLanes", () => {
  it("returns empty placements for no events", () => {
    const r = assignEventLabelLanes(
      [],
      () => 0,
      800,
      false,
      false,
      false
    );
    expect(r.placements).toEqual([]);
    expect(r.maxLane).toBe(0);
  });

  it("in horizontal mode, uses extra lanes when many titles share the same track %", () => {
    const d = new Date("2000-01-01T12:00:00Z");
    const longTitle = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed";
    const events = Array.from({ length: 6 }, (_, i) =>
      makeEvent(`${longTitle} ${i}`, d)
    );
    const { placements, maxLane } = assignEventLabelLanes(
      events,
      () => 50,
      400,
      false,
      false,
      false
    );
    expect(placements).toHaveLength(6);
    expect(maxLane).toBeGreaterThan(0);
    const lanes = new Set(placements.map((p) => p.lane));
    expect(lanes.size).toBeGreaterThan(1);
  });

  it("in vertical mode forces lane 0 and start anchor for all", () => {
    const d0 = new Date("2000-01-01T12:00:00Z");
    const d1 = new Date("2000-02-01T12:00:00Z");
    const a = makeEvent("Short", d0);
    const b = makeEvent("Another", d1);
    const { placements, maxLane } = assignEventLabelLanes(
      [a, b],
      (t) => (t === d0.getTime() ? 30 : 70),
      500,
      false,
      false,
      true
    );
    expect(maxLane).toBe(0);
    const rem = readRootRemPx(16);
    const expectedCol = verticalColumnWidthPx(false, rem);
    for (const p of placements) {
      expect(p.lane).toBe(0);
      expect(p.anchor).toBe("start");
      expect(p.columnPx).toBe(expectedCol);
    }
  });

  it("in vertical mode columnPx matches touch minimum when pointer is coarse", () => {
    const d = new Date("2000-01-01T12:00:00Z");
    const { placements } = assignEventLabelLanes(
      [makeEvent("A", d)],
      () => 50,
      500,
      false,
      true,
      true
    );
    const rem = readRootRemPx(16);
    expect(placements[0]!.columnPx).toBe(verticalColumnWidthPx(true, rem));
  });
});

describe("verticalEventTitlesRowLayoutPx", () => {
  it("returns zeros for empty placements", () => {
    const r = verticalEventTitlesRowLayoutPx([], false, 16, 800);
    expect(r.vPadPx).toBe(0);
    expect(r.sizerContentMinPx).toBe(0);
    expect(r.connectorBottomInsetPx).toBe(0);
  });

  it("keeps vPadPx at zero (top padding distorted layout for long measured titles)", () => {
    for (const pointerCoarse of [false, true] as const) {
      for (const w of [0, 40, 120, 300]) {
        expect(
          verticalEventTitlesRowLayoutPx([{ maxWidthPx: w }], pointerCoarse, 16, 800)
            .vPadPx
        ).toBe(0);
      }
    }
  });

  it("Sizer height follows viewport (fixed read slot), not longest maxWidthPx title", () => {
    const short = verticalEventTitlesRowLayoutPx(
      [{ maxWidthPx: 20 }],
      false,
      16,
      400
    );
    const long = verticalEventTitlesRowLayoutPx(
      [{ maxWidthPx: 400 }],
      false,
      16,
      400
    );
    expect(long.sizerContentMinPx).toBe(short.sizerContentMinPx);
    expect(long.connectorBottomInsetPx).toBe(short.connectorBottomInsetPx);
  });

  it("taller viewport increases sizer until axis cap (regression)", () => {
    const lowVh = verticalEventTitlesRowLayoutPx(
      [{ maxWidthPx: 80 }],
      false,
      16,
      400
    );
    const midVh = verticalEventTitlesRowLayoutPx(
      [{ maxWidthPx: 80 }],
      false,
      16,
      900
    );
    expect(midVh.sizerContentMinPx).toBeGreaterThan(lowVh.sizerContentMinPx);
  });

  it("verticalReadSlotHeightPx adds unified wrap padding to read length", () => {
    expect(verticalReadSlotHeightPx(100)).toBe(100 + EVENT_TITLE_VROT_WRAP_PAD_PX);
  });
});
