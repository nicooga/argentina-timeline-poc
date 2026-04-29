import type { Timeline } from "../../types";
import { timelineHistoriaArgentina } from "../../timelineHistoriaArgentina";
import type { TimelineRepo } from "./TimelineRepo";
import {
  cloneTimeline,
  deserializeTimeline,
  serializeTimeline,
} from "./timelineSerialization";

const DEFAULT_STORAGE_KEY = "argentina-timeline.timeline.v1";

export class LocalStorageTimelineRepo implements TimelineRepo {
  constructor(
    private readonly storageKey = DEFAULT_STORAGE_KEY,
    private readonly seedTimeline: Timeline = timelineHistoriaArgentina
  ) {}

  async get(): Promise<Timeline> {
    if (typeof window === "undefined") return cloneTimeline(this.seedTimeline);
    const stored = window.localStorage.getItem(this.storageKey);
    if (!stored) return cloneTimeline(this.seedTimeline);
    try {
      return deserializeTimeline(stored);
    } catch {
      return cloneTimeline(this.seedTimeline);
    }
  }

  async save(timeline: Timeline): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(this.storageKey, serializeTimeline(timeline));
  }

  async reset(): Promise<Timeline> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(this.storageKey);
    }
    return cloneTimeline(this.seedTimeline);
  }
}
