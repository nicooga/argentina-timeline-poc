import { describe, expect, it } from "vitest";
import {
  formatHistoricalDate,
  formatHistoricalYear,
  formatHistoricalYearDate,
} from "./historicalDateFormat";
import { utcYearStartMs } from "./axisScaleDetail";

describe("historicalDateFormat", () => {
  it("formats BCE years compactly for timeline labels", () => {
    expect(formatHistoricalYear(-3000)).toBe("3000 a.C.");
    expect(formatHistoricalYear(-1200)).toBe("1200 a.C.");
  });

  it("keeps CE years compact", () => {
    expect(formatHistoricalYear(0)).toBe("0");
    expect(formatHistoricalYear(300)).toBe("300");
    expect(formatHistoricalYear(2026)).toBe("2026");
  });

  it("formats dates with a compact historical year suffix", () => {
    const date = new Date(utcYearStartMs(-3000));
    date.setUTCHours(12);

    expect(formatHistoricalYearDate(date)).toBe("3000 a.C.");
    expect(formatHistoricalDate(date)).toContain("3000 a.C.");
  });
});
