import type { EventLaneId, Period, Timeline, TimelineEvent } from "../../types";

type JsonPeriod = Omit<Period, "start" | "end"> & {
  start: string;
  end: string;
};

type JsonTimelineEvent = Omit<TimelineEvent, "date" | "id" | "lanes"> & {
  id?: string;
  date: string;
  lanes?: EventLaneId[];
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
      items: p.items ? [...p.items] : undefined,
      links: p.links ? [...p.links] : undefined,
    })),
    events: timeline.events.map((e) => ({
      ...e,
      date: new Date(e.date.getTime()),
      lanes: [...(e.lanes ?? [])],
      items: [...e.items],
      links: e.links ? [...e.links] : undefined,
      causes: e.causes ? [...e.causes] : undefined,
      consequences: e.consequences ? [...e.consequences] : undefined,
    })),
  };
}

export function serializeTimeline(timeline: Timeline): string {
  return JSON.stringify(timelineToJson(timeline));
}

export function timelineToJson(timeline: Timeline): JsonTimeline {
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
  return json;
}

export function deserializeTimeline(raw: string): Timeline {
  return timelineFromJson(JSON.parse(raw));
}

export function timelineFromJson(json: unknown): Timeline {
  const payload = json as Partial<JsonTimeline>;
  if (!Array.isArray(payload.periods) || !Array.isArray(payload.events)) {
    throw new Error("Invalid timeline payload");
  }
  const titleToId = new Map(
    payload.events.map((e) => [e.title, e.id ?? eventIdFromTitle(e.title)])
  );
  return {
    periods: payload.periods.map((p) => ({
      ...p,
      start: parseTimelineDate(p.start),
      end: parseTimelineDate(p.end),
    })),
    events: payload.events.map((e) => {
      const id = e.id ?? titleToId.get(e.title) ?? eventIdFromTitle(e.title);
      return {
        ...e,
        id,
        date: parseTimelineDate(e.date),
        lanes: e.lanes ?? [],
        causes: e.causes?.map((ref) => titleToId.get(ref) ?? ref),
        consequences: e.consequences?.map((ref) => titleToId.get(ref) ?? ref),
      };
    }),
  };
}

const TIMELINE_UTC_DATE_RE =
  /^([+-]?\d{1,6})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;

function parseTimelineDate(value: string): Date {
  const match = TIMELINE_UTC_DATE_RE.exec(value);
  if (!match) {
    return assertValidDate(new Date(value), value);
  }

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw, msRaw = "0"] =
    match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const second = Number(secondRaw);
  const millisecond = Number(msRaw.padEnd(3, "0"));
  const date = new Date(Date.UTC(0, month - 1, day, hour, minute, second, millisecond));
  date.setUTCFullYear(year);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second ||
    date.getUTCMilliseconds() !== millisecond
  ) {
    throw new Error(`Invalid timeline date: ${value}`);
  }

  return assertValidDate(date, value);
}

function assertValidDate(date: Date, value: string): Date {
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timeline date: ${value}`);
  }
  return date;
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
