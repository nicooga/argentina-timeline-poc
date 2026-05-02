import type { Timeline } from "../../types";
import {
  timelineFromJson,
  timelineToJson,
} from "./timelineSerialization";
import type {
  CreateTimelineInput,
  ReplaceTimelineInput,
  TimelineRecord,
  TimelineRepo,
  TimelineSummary,
} from "./TimelineRepo";

type Fetcher = typeof fetch;
const defaultFetcher: Fetcher = (input, init) => globalThis.fetch(input, init);

type TimelineSummaryWire = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type TimelineWire = TimelineSummaryWire & {
  snapshot: unknown;
};

export class TimelineApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: unknown
  ) {
    super(message);
    this.name = "TimelineApiError";
  }
}

export class HttpTimelineRepo implements TimelineRepo {
  private readonly baseUrl: string;

  constructor(baseUrl: string, private readonly fetcher: Fetcher = defaultFetcher) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async list(): Promise<TimelineSummary[]> {
    const payload = await this.request<TimelineSummaryWire[]>("/timelines");
    return payload.map(timelineSummaryFromWire);
  }

  async get(timelineId: string): Promise<TimelineRecord> {
    const payload = await this.request<TimelineWire>(
      `/timelines/${encodeURIComponent(timelineId)}`
    );
    return timelineRecordFromWire(payload);
  }

  async create(input: CreateTimelineInput): Promise<TimelineRecord> {
    const payload = await this.request<TimelineWire>("/timelines", {
      method: "POST",
      body: timelineWriteBody(input.title, input.description, input.timeline),
    });
    return timelineRecordFromWire(payload);
  }

  async replace(
    timelineId: string,
    input: ReplaceTimelineInput
  ): Promise<TimelineRecord> {
    const payload = await this.request<TimelineWire>(
      `/timelines/${encodeURIComponent(timelineId)}`,
      {
        method: "PUT",
        body: timelineWriteBody(input.title, input.description, input.timeline),
      }
    );
    return timelineRecordFromWire(payload);
  }

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body == null ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new TimelineApiError(
        `Timeline API request failed with ${response.status}`,
        response.status,
        payload
      );
    }
    return payload as T;
  }
}

function timelineWriteBody(
  title: string,
  description: string | null,
  timeline: Timeline
): string {
  return JSON.stringify({
    title,
    description,
    snapshot: timelineToJson(timeline),
  });
}

function timelineSummaryFromWire(payload: TimelineSummaryWire): TimelineSummary {
  return {
    id: payload.id,
    title: payload.title,
    description: payload.description,
    createdAt: new Date(payload.created_at),
    updatedAt: new Date(payload.updated_at),
  };
}

function timelineRecordFromWire(payload: TimelineWire): TimelineRecord {
  return {
    ...timelineSummaryFromWire(payload),
    timeline: timelineFromJson(payload.snapshot),
  };
}
