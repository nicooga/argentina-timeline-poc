import { describe, expect, it } from "vitest";
import type { Timeline } from "../../types";
import { applyChangesLocally, TimelineChangeApplyError } from "./applyChangesLocally";
import type { TimelineChange } from "./aiConversation";

const baseTimeline: Timeline = {
  periods: [
    {
      id: "p1",
      title: "Período uno",
      start: new Date("1900-01-01T00:00:00.000Z"),
      end: new Date("1910-01-01T00:00:00.000Z"),
      color: "#325f87",
      items: ["Inicio"],
    } as Timeline["periods"][number],
  ],
  events: [
    {
      id: "e1",
      title: "Evento uno",
      date: new Date("1901-01-01T00:00:00.000Z"),
      lanes: ["politico"],
      items: ["Detalle"],
    },
  ],
};

function apply(changes: TimelineChange[]) {
  return applyChangesLocally(baseTimeline, changes);
}

describe("applyChangesLocally", () => {
  it("creates events and normalizes backend lane names", () => {
    const result = apply([
      {
        type: "create_event",
        target_id: null,
        rationale: "Add event",
        data: {
          id: "e2",
          title: "Evento dos",
          date: "1902-01-01",
          lanes: ["political", "military", "economic", "cultural"],
          items: ["Detalle"],
        },
      },
    ]);

    expect(result.timeline.events.at(-1)).toMatchObject({
      id: "e2",
      lanes: ["politico", "militar", "economico", "social"],
    });
    expect(result.changeSet.added.has("e2")).toBe(true);
  });

  it("updates and deletes existing nodes", () => {
    const result = apply([
      {
        type: "update_event",
        target_id: "e1",
        rationale: "Rename event",
        data: { title: "Evento renombrado" },
      },
      {
        type: "delete_period",
        target_id: "p1",
        rationale: "Remove period",
        data: null,
      },
    ]);

    expect(result.timeline.events[0]?.title).toBe("Evento renombrado");
    expect(result.timeline.periods).toEqual([]);
    expect(result.changeSet.updated.has("e1")).toBe(true);
    expect(result.changeSet.removed.has("p1")).toBe(true);
  });

  it("throws for missing update targets", () => {
    expect(() =>
      apply([
        {
          type: "update_event",
          target_id: "missing",
          rationale: "Broken update",
          data: { title: "Nope" },
        },
      ])
    ).toThrow(TimelineChangeApplyError);
  });
});
