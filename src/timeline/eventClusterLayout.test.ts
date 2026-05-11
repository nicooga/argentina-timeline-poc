import { describe, expect, it } from "vitest";
import type { TimelineEvent } from "../../types";
import {
  layoutDisplacedEventPlacements,
  minEventSeparationPct,
} from "./eventClusterLayout";

function makeEvent(title: string, day: number): TimelineEvent {
  return {
    id: title.toLowerCase(),
    title,
    items: [],
    date: new Date(Date.UTC(2000, 0, day)),
    lanes: ["politico"],
  };
}

const placement = { lane: 0, anchor: "center" as const, maxWidthPx: 160, columnPx: 20 };
const minGapPct = ((20 + 4) / 1000) * 100;

function expectNoRenderedOverlap(displayPcts: number[], minGap: number): void {
  const sorted = [...displayPcts].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(minGap - 0.000001);
  }
}

describe("layoutDisplacedEventPlacements", () => {
  it("keeps separated events on their real dates", () => {
    const events = [makeEvent("A", 1), makeEvent("B", 2)];
    const placed = layoutDisplacedEventPlacements(
      events,
      [placement],
      (t) => (t === events[0]!.date.getTime() ? 10 : 80),
      1000
    );

    expect(placed.map((p) => p.displayPct)).toEqual([10, 80]);
    expect(placed.map((p) => p.datePct)).toEqual([10, 80]);
    expect(placed.every((p) => !p.needsConnector)).toBe(true);
  });

  it("separates close events by at least the column footprint", () => {
    const events = [makeEvent("A", 1), makeEvent("B", 2), makeEvent("C", 3)];
    const placed = layoutDisplacedEventPlacements(
      events,
      [placement],
      (_t) => [50, 50.5, 51][events.findIndex((e) => e.date.getTime() === _t)]!,
      1000
    );

    expect(placed[1]!.displayPct - placed[0]!.displayPct).toBeCloseTo(minGapPct);
    expect(placed[2]!.displayPct - placed[1]!.displayPct).toBeCloseTo(minGapPct);
    expect(placed[0]!.datePct).not.toBe(placed[0]!.displayPct);
    expect(placed.some((p) => p.needsConnector)).toBe(true);
  });

  it("recursively merges groups when displaced clusters collide with neighbors", () => {
    const events = [makeEvent("A", 1), makeEvent("B", 2), makeEvent("C", 3)];
    const placed = layoutDisplacedEventPlacements(
      events,
      [placement],
      (_t) => [0.1, 0.2, 2.6][events.findIndex((e) => e.date.getTime() === _t)]!,
      1000
    );

    expectNoRenderedOverlap(
      placed.map((p) => p.displayPct),
      minGapPct
    );
    expect(placed[2]!.needsConnector).toBe(true);
  });

  it("spreads events that share the exact same date", () => {
    const date = new Date(Date.UTC(2000, 0, 1));
    const events = ["A", "B", "C"].map((title) => ({
      ...makeEvent(title, 1),
      date,
    }));
    const placed = layoutDisplacedEventPlacements(
      events,
      [placement],
      () => 50,
      1000
    );

    expect(new Set(placed.map((p) => p.displayPct)).size).toBe(3);
    expect(placed.map((p) => p.datePct)).toEqual([50, 50, 50]);
  });

  it("keeps displaced groups within the track near edges", () => {
    const events = [makeEvent("A", 1), makeEvent("B", 2), makeEvent("C", 3)];
    const placed = layoutDisplacedEventPlacements(
      events,
      [placement],
      (_t) => [0.1, 0.2, 0.3][events.findIndex((e) => e.date.getTime() === _t)]!,
      1000
    );

    expect(Math.min(...placed.map((p) => p.displayPct))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...placed.map((p) => p.displayPct))).toBeLessThanOrEqual(100);
    expectNoRenderedOverlap(
      placed.map((p) => p.displayPct),
      minGapPct
    );
  });

  it("keeps very large groups within the track when ideal spacing cannot fit", () => {
    const events = Array.from({ length: 60 }, (_, i) => makeEvent(`E${i}`, i + 1));
    const placed = layoutDisplacedEventPlacements(
      events,
      [placement],
      () => 50,
      1000
    );

    expect(Math.min(...placed.map((p) => p.displayPct))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...placed.map((p) => p.displayPct))).toBeLessThanOrEqual(100);
  });
});

describe("minEventSeparationPct", () => {
  it("ignores identical dates for zoom-density calculations", () => {
    const events = [makeEvent("A", 1), makeEvent("B", 1)];
    expect(minEventSeparationPct(events, () => 20)).toBeNull();
  });
});
