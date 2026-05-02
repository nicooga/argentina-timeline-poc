import { describe, expect, it, vi } from "vitest";
import { HttpTimelineRepo } from "./HttpTimelineRepo";

const timelineResponse = {
  id: "argentina-history",
  title: "Historia Argentina",
  description: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  snapshot: {
    periods: [],
    events: [
      {
        id: "evento",
        title: "Evento",
        date: "1900-01-01T12:00:00.000Z",
        lanes: ["politico"],
        items: ["Punto"],
      },
    ],
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HttpTimelineRepo", () => {
  it("lists timeline summaries using backend snake_case fields", async () => {
    const fetcher = vi.fn(async () => jsonResponse([timelineResponse]));
    const repo = new HttpTimelineRepo("http://api.test", fetcher);

    const summaries = await repo.list();

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/timelines",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) })
    );
    expect(summaries[0]).toMatchObject({
      id: "argentina-history",
      title: "Historia Argentina",
      createdAt: new Date("2026-05-01T00:00:00Z"),
    });
  });

  it("revives snapshot dates when fetching a timeline", async () => {
    const fetcher = vi.fn(async () => jsonResponse(timelineResponse));
    const repo = new HttpTimelineRepo("http://api.test/", fetcher);

    const record = await repo.get("argentina-history");

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/timelines/argentina-history",
      expect.any(Object)
    );
    expect(record.timeline.events[0]?.date).toBeInstanceOf(Date);
  });

  it("sends full snapshot replacements to the backend", async () => {
    const fetcher = vi.fn(async () => jsonResponse(timelineResponse));
    const repo = new HttpTimelineRepo("http://api.test", fetcher);

    await repo.replace("argentina-history", {
      title: "Historia Argentina",
      description: null,
      timeline: {
        periods: [],
        events: [
          {
            id: "evento",
            title: "Evento",
            date: new Date("1900-01-01T12:00:00.000Z"),
            lanes: ["politico"],
            items: ["Punto"],
          },
        ],
      },
    });

    const call = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(call[1].body))).toEqual({
      title: "Historia Argentina",
      description: null,
      snapshot: timelineResponse.snapshot,
    });
  });
});
