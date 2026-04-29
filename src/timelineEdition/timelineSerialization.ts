import type { Period, Timeline, TimelineEvent } from "../../types";

type JsonPeriod = Omit<Period, "start" | "end"> & {
  start: string;
  end: string;
};

type JsonTimelineEvent = Omit<TimelineEvent, "date" | "id"> & {
  id?: string;
  date: string;
};

type JsonTimeline = {
  periods: JsonPeriod[];
  events: JsonTimelineEvent[];
};

export function cloneTimeline(timeline: Timeline): Timeline {
  return {
    periods: timeline.periods.map((p) => ({
      ...p,
      start: new Date(p.start.getTime()),
      end: new Date(p.end.getTime()),
      items: [...p.items],
      links: p.links ? [...p.links] : undefined,
    })),
    events: timeline.events.map((e) => ({
      ...e,
      date: new Date(e.date.getTime()),
      lanes: [...e.lanes],
      items: [...e.items],
      links: e.links ? [...e.links] : undefined,
      causes: e.causes ? [...e.causes] : undefined,
      consequences: e.consequences ? [...e.consequences] : undefined,
    })),
  };
}

export function serializeTimeline(timeline: Timeline): string {
  const json: JsonTimeline = {
    periods: timeline.periods.map((p) => ({
      ...p,
      start: p.start.toISOString(),
      end: p.end.toISOString(),
    })),
    events: timeline.events.map((e) => ({
      ...e,
      date: e.date.toISOString(),
    })),
  };
  return JSON.stringify(json);
}

export function deserializeTimeline(raw: string): Timeline {
  const json = JSON.parse(raw) as JsonTimeline;
  if (!Array.isArray(json.periods) || !Array.isArray(json.events)) {
    throw new Error("Invalid timeline payload");
  }
  const titleToId = new Map(
    json.events.map((e) => [e.title, e.id ?? eventIdFromTitle(e.title)])
  );
  return {
    periods: json.periods.map((p) => ({
      ...p,
      start: new Date(p.start),
      end: new Date(p.end),
    })),
    events: json.events.map((e) => {
      const id = e.id ?? titleToId.get(e.title) ?? eventIdFromTitle(e.title);
      return {
        ...e,
        id,
        date: new Date(e.date),
        causes: e.causes?.map((ref) => titleToId.get(ref) ?? ref),
        consequences: e.consequences?.map((ref) => titleToId.get(ref) ?? ref),
      };
    }),
  };
}

function eventIdFromTitle(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "evento"
  );
}
