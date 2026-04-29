import { describe, expect, it } from "vitest";
import {
  axisMarkLaneOffsetPx,
  assignAxisMarkLanes,
  computeAxisShowYearFlags,
  type AxisMark,
} from "./axisMarkLayout";

function mk(t: number, year: string, monthDay: string): AxisMark {
  return { t, year, monthDay };
}

describe("computeAxisShowYearFlags", () => {
  it("shows year on first tick and when year string changes", () => {
    const marks = [
      mk(1, "1989", "1 jul."),
      mk(2, "1989", "15 oct."),
      mk(3, "1990", "1 ene."),
    ];
    expect(computeAxisShowYearFlags(marks)).toEqual([true, false, true]);
  });

  it("shows year when merged combined label differs from previous", () => {
    const marks = [
      mk(1, "1989 · 1990", "a · b"),
      mk(2, "1991", "1 ene."),
    ];
    expect(computeAxisShowYearFlags(marks)).toEqual([true, true]);
  });
});

describe("assignAxisMarkLanes", () => {
  it("sorts by track position and uses lane 0 when labels do not overlap", () => {
    const marks = [
      mk(300, "1990", "a"),
      mk(100, "1989", "b"),
      mk(200, "1989", "c"),
    ];
    const trackPct = (t: number) => t / 4;
    const placed = assignAxisMarkLanes(marks, trackPct);
    expect(placed.map((x) => x.mark.t)).toEqual([100, 200, 300]);
    expect(placed.every((x) => x.lane === 0)).toBe(true);
    expect(placed.map((x) => x.p)).toEqual([25, 50, 75]);
  });

  it("adds vertical lanes only within the same year", () => {
    const marks = [
      mk(100, "1890", "1 ene."),
      mk(101, "1890", "26 jul."),
      mk(102, "1890", "10 nov."),
      mk(103, "1891", "1 ene."),
      mk(104, "1891", "3 feb."),
    ];
    const showYearByT = new Map([
      [100, true],
      [101, false],
      [102, false],
      [103, true],
      [104, false],
    ]);
    const placed = assignAxisMarkLanes(
      marks,
      (t) => (t - 100) / 2,
      showYearByT,
      900
    );
    expect(placed.map((x) => x.lane)).toEqual([0, 1, 2, 0, 1]);
  });

  it("does not add lanes for close marks that belong to different years", () => {
    const marks = [
      mk(100, "1890", "26 dic."),
      mk(101, "1891", "1 ene."),
      mk(102, "1892", "1 ene."),
    ];
    const showYearByT = new Map([
      [100, true],
      [101, true],
      [102, true],
    ]);
    const placed = assignAxisMarkLanes(
      marks,
      (t) => (t - 100) / 4,
      showYearByT,
      900
    );
    expect(placed.map((x) => x.lane)).toEqual([0, 0, 0]);
  });
});

describe("axisMarkLaneOffsetPx", () => {
  it("keeps lane 0 at baseline and gives lane 1 the special first-year clearance", () => {
    expect(axisMarkLaneOffsetPx(0)).toBe(0);
    expect(axisMarkLaneOffsetPx(1)).toBe(60);
    expect(axisMarkLaneOffsetPx(2) - axisMarkLaneOffsetPx(1)).toBe(27);
  });
});
