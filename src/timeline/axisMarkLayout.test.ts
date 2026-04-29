import { describe, expect, it } from "vitest";
import {
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
  it("sorts by track position and uses lane 0 for all marks", () => {
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
});
