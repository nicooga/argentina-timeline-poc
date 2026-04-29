import { describe, expect, it } from "vitest";
import type { Timeline } from "../../types";
import type { TimelineRepo } from "./TimelineRepo";
import { TimelineEditionService } from "./TimelineEditionService";

class MemoryTimelineRepo implements TimelineRepo {
  constructor(private timeline: Timeline) {}

  async get(): Promise<Timeline> {
    return this.timeline;
  }

  async save(timeline: Timeline): Promise<void> {
    this.timeline = timeline;
  }
}

function d(day: number): Date {
  return new Date(Date.UTC(1900, 0, day, 12));
}

function timelineFixture(): Timeline {
  return {
    periods: [],
    events: [
      {
        id: "causa",
        title: "Causa",
        date: d(1),
        lanes: ["politico"],
        items: ["Causa inicial"],
        consequences: ["efecto"],
      },
      {
        id: "efecto",
        title: "Efecto",
        date: d(2),
        lanes: ["social"],
        items: ["Efecto posterior"],
        causes: ["causa"],
      },
    ],
  };
}

describe("TimelineEditionService", () => {
  it("creates a valid event", async () => {
    const repo = new MemoryTimelineRepo(timelineFixture());
    const service = new TimelineEditionService(repo);

    const result = await service.createEvent({
      title: "Nuevo evento",
      date: d(3),
      lanes: ["economico"],
      items: ["Punto"],
    });

    expect(result.event?.id).toBe("nuevo-evento");
    expect(result.timeline.events).toHaveLength(3);
  });

  it("rejects invalid title, lane, and items", async () => {
    const service = new TimelineEditionService(new MemoryTimelineRepo(timelineFixture()));

    await expect(
      service.createEvent({
        title: " ",
        date: d(3),
        lanes: [],
        items: [],
      })
    ).rejects.toMatchObject({
      validationErrors: expect.arrayContaining([
        expect.objectContaining({ field: "title" }),
        expect.objectContaining({ field: "lanes" }),
        expect.objectContaining({ field: "items" }),
      ]),
    });
  });

  it("updates title without breaking ID-based causal links", async () => {
    const repo = new MemoryTimelineRepo(timelineFixture());
    const service = new TimelineEditionService(repo);

    const result = await service.updateEvent("causa", {
      title: "Causa renombrada",
    });

    const effect = result.timeline.events.find((e) => e.id === "efecto");
    expect(effect?.causes).toEqual(["causa"]);
  });

  it("deletes an event and removes causal references", async () => {
    const repo = new MemoryTimelineRepo(timelineFixture());
    const service = new TimelineEditionService(repo);

    const result = await service.deleteEvent("causa");

    expect(result.timeline.events.map((e) => e.id)).toEqual(["efecto"]);
    expect(result.timeline.events[0]?.causes).toEqual([]);
  });

  it("prevents self references", async () => {
    const service = new TimelineEditionService(new MemoryTimelineRepo(timelineFixture()));

    await expect(
      service.updateEvent("causa", {
        causes: ["causa"],
      })
    ).rejects.toMatchObject({
      validationErrors: expect.arrayContaining([
        expect.objectContaining({ field: "causes" }),
      ]),
    });
  });
});
