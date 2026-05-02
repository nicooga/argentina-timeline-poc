import type { Timeline } from "../../types";
import { timelineHistoriaArgentina } from "../../timelineHistoriaArgentina";
import type {
  CreateTimelineInput,
  ReplaceTimelineInput,
  TimelineRecord,
  TimelineRepo,
  TimelineSummary,
} from "./TimelineRepo";
import {
  cloneTimeline,
  deserializeTimeline,
  serializeTimeline,
} from "./timelineSerialization";

const DEFAULT_STORAGE_KEY = "argentina-timeline.timeline.v1";
const LOCAL_TIMELINE_ID = "argentina-history";
const LOCAL_TIMELINE_TITLE = "Historia Argentina";
const LOCAL_TIMELINE_CREATED_AT = new Date("2026-05-01T00:00:00.000Z");

export class LocalStorageTimelineRepo implements TimelineRepo {
  constructor(
    private readonly storageKey = DEFAULT_STORAGE_KEY,
    private readonly seedTimeline: Timeline = timelineHistoriaArgentina
  ) {}

  async list(): Promise<TimelineSummary[]> {
    return [this.summary()];
  }

  async get(timelineId: string): Promise<TimelineRecord> {
    if (timelineId !== LOCAL_TIMELINE_ID) {
      throw new Error(`Timeline not found: ${timelineId}`);
    }
    return {
      ...this.summary(),
      timeline: await this.loadTimeline(),
    };
  }

  async create(input: CreateTimelineInput): Promise<TimelineRecord> {
    await this.saveTimeline(input.timeline);
    return this.record(input.title, input.description, input.timeline);
  }

  async replace(
    timelineId: string,
    input: ReplaceTimelineInput
  ): Promise<TimelineRecord> {
    if (timelineId !== LOCAL_TIMELINE_ID) {
      throw new Error(`Timeline not found: ${timelineId}`);
    }
    await this.saveTimeline(input.timeline);
    return this.record(input.title, input.description, input.timeline);
  }

  async loadTimeline(): Promise<Timeline> {
    if (typeof window === "undefined") return cloneTimeline(this.seedTimeline);
    const stored = window.localStorage.getItem(this.storageKey);
    if (!stored) return cloneTimeline(this.seedTimeline);
    try {
      return deserializeTimeline(stored);
    } catch {
      return cloneTimeline(this.seedTimeline);
    }
  }

  async saveTimeline(timeline: Timeline): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(this.storageKey, serializeTimeline(timeline));
  }

  async reset(): Promise<Timeline> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(this.storageKey);
    }
    return cloneTimeline(this.seedTimeline);
  }

  private summary(): TimelineSummary {
    return {
      id: LOCAL_TIMELINE_ID,
      title: LOCAL_TIMELINE_TITLE,
      description: "Copia local del timeline semilla",
      createdAt: new Date(LOCAL_TIMELINE_CREATED_AT),
      updatedAt: new Date(),
    };
  }

  private record(
    title: string,
    description: string | null,
    timeline: Timeline
  ): TimelineRecord {
    return {
      id: LOCAL_TIMELINE_ID,
      title,
      description,
      createdAt: new Date(LOCAL_TIMELINE_CREATED_AT),
      updatedAt: new Date(),
      timeline: cloneTimeline(timeline),
    };
  }
}
