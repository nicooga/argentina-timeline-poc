import { describe, expect, it } from "vitest";
import type { Timeline } from "../../types";
import type {
  CreateTimelineInput,
  ReplaceTimelineInput,
  TimelineRecord,
  TimelineRepo,
  TimelineSummary,
} from "./TimelineRepo";
import { TimelineEditionService } from "./TimelineEditionService";

class MemoryTimelineRepo implements TimelineRepo {
  constructor(private timeline: Timeline) {}

  async list(): Promise<TimelineSummary[]> {
    return [this.summary()];
  }

  async get(timelineId: string): Promise<TimelineRecord> {
    if (timelineId !== "timeline-1") throw new Error("Timeline not found");
    return {
      ...this.summary(),
      timeline: this.timeline,
    };
  }

  async create(input: CreateTimelineInput): Promise<TimelineRecord> {
    this.timeline = input.timeline;
    return {
      ...this.summary(input.title, input.description),
      timeline: this.timeline,
    };
  }

  async replace(
    timelineId: string,
    input: ReplaceTimelineInput
  ): Promise<TimelineRecord> {
    if (timelineId !== "timeline-1") throw new Error("Timeline not found");
    this.timeline = input.timeline;
    return {
      ...this.summary(input.title, input.description),
      timeline: this.timeline,
    };
  }

  private summary(
    title = "Historia",
    description: string | null = null
  ): TimelineSummary {
    const now = new Date("2026-05-01T00:00:00.000Z");
    return {
      id: "timeline-1",
      title,
      description,
      createdAt: now,
      updatedAt: now,
    };
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

    const result = await service.createEvent("timeline-1", {
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
      service.createEvent("timeline-1", {
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

    const result = await service.updateEvent("timeline-1", "causa", {
      title: "Causa renombrada",
    });

    const effect = result.timeline.events.find((e) => e.id === "efecto");
    expect(effect?.causes).toEqual(["causa"]);
  });

  it("deletes an event and removes causal references", async () => {
    const repo = new MemoryTimelineRepo(timelineFixture());
    const service = new TimelineEditionService(repo);

    const result = await service.deleteEvent("timeline-1", "causa");

    expect(result.timeline.events.map((e) => e.id)).toEqual(["efecto"]);
    expect(result.timeline.events[0]?.causes).toEqual([]);
  });

  it("prevents self references", async () => {
    const service = new TimelineEditionService(new MemoryTimelineRepo(timelineFixture()));

    await expect(
      service.updateEvent("timeline-1", "causa", {
        causes: ["causa"],
      })
    ).rejects.toMatchObject({
      validationErrors: expect.arrayContaining([
        expect.objectContaining({ field: "causes" }),
      ]),
    });
  });
});
