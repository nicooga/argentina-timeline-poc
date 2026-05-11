import { describe, expect, it } from "vitest";
import {
  chooseAxisScaleDetail,
  chooseTimelineZoomMax,
  utcYearStartMs,
} from "./axisScaleDetail";

describe("utcYearStartMs", () => {
  it("preserves BCE, year zero, and early CE years", () => {
    expect(new Date(utcYearStartMs(-3000)).getUTCFullYear()).toBe(-3000);
    expect(new Date(utcYearStartMs(0)).getUTCFullYear()).toBe(0);
    expect(new Date(utcYearStartMs(50)).getUTCFullYear()).toBe(50);
    expect(new Date(utcYearStartMs(300)).getUTCFullYear()).toBe(300);
  });
});

describe("chooseAxisScaleDetail", () => {
  it("keeps yearly ticks and decade bands when the range has enough pixels", () => {
    const detail = chooseAxisScaleDetail(
      utcYearStartMs(1800),
      utcYearStartMs(1900),
      2400
    );

    expect(detail).toEqual({ bandYears: 10, microTickYears: 1 });
  });

  it("lightens ticks and bands for multi-millennium ranges", () => {
    const detail = chooseAxisScaleDetail(
      utcYearStartMs(-3000),
      utcYearStartMs(2026),
      4200
    );

    expect(detail.bandYears).toBeGreaterThan(10);
    expect(detail.microTickYears).toBeGreaterThan(1);
  });
});

describe("chooseTimelineZoomMax", () => {
  it("keeps the default cap for shorter timelines", () => {
    const maxZoom = chooseTimelineZoomMax(
      utcYearStartMs(1800),
      utcYearStartMs(1900),
      4200,
      1200,
      14
    );

    expect(maxZoom).toBe(14);
  });

  it("raises the cap so long timelines can zoom into a few decades", () => {
    const maxZoom = chooseTimelineZoomMax(
      utcYearStartMs(-3000),
      utcYearStartMs(2026),
      4200,
      1200,
      14
    );

    expect(maxZoom).toBeGreaterThan(14);
  });

  it("raises the cap when event density needs more pixels", () => {
    const maxZoom = chooseTimelineZoomMax(
      utcYearStartMs(1800),
      utcYearStartMs(1900),
      1000,
      1200,
      14,
      0.05,
      24
    );

    expect(maxZoom).toBeGreaterThan(14);
  });

  it("does not raise the cap for identical-date events alone", () => {
    const maxZoom = chooseTimelineZoomMax(
      utcYearStartMs(1800),
      utcYearStartMs(1900),
      4200,
      1200,
      14,
      null,
      24
    );

    expect(maxZoom).toBe(14);
  });
});
