import { describe, expect, it } from "vitest";
import { timelineFromJson, timelineToJson } from "./timelineSerialization";

describe("timelineSerialization", () => {
  it("revives compact BCE and early CE UTC dates from backend snapshots", () => {
    const timeline = timelineFromJson({
      periods: [
        {
          title: "Antiguedad",
          start: "0-01-01T12:00:00.000Z",
          end: "300-01-01T12:00:00.000Z",
          color: "#fff",
          items: [],
        },
      ],
      events: [
        {
          id: "escritura-cuneiforme",
          title: "Primeras escrituras administrativas",
          date: "-3000-01-01T12:00:00.000Z",
          lanes: ["politico"],
          items: [],
        },
      ],
    });

    expect(timeline.periods[0]?.start.getUTCFullYear()).toBe(0);
    expect(timeline.periods[0]?.end.getUTCFullYear()).toBe(300);
    expect(timeline.events[0]?.date.getUTCFullYear()).toBe(-3000);
    expect(timeline.events[0]?.date.toISOString()).toBe(
      "-003000-01-01T12:00:00.000Z"
    );
  });

  it("serializes revived BCE dates as valid ISO strings", () => {
    const timeline = timelineFromJson({
      periods: [],
      events: [
        {
          title: "Evento a.C.",
          date: "-1200-01-01T12:00:00.000Z",
          lanes: ["politico"],
          items: [],
        },
      ],
    });

    expect(timelineToJson(timeline).events[0]?.date).toBe(
      "-001200-01-01T12:00:00.000Z"
    );
  });

  it("rejects impossible compact timeline dates while parsing", () => {
    expect(() =>
      timelineFromJson({
        periods: [],
        events: [
          {
            title: "Fecha imposible",
            date: "-3000-02-31T12:00:00.000Z",
            lanes: ["politico"],
            items: [],
          },
        ],
      })
    ).toThrow("Invalid timeline date: -3000-02-31T12:00:00.000Z");
  });
});
