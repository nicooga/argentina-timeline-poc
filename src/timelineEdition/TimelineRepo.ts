import type { Timeline, TimelineEvent, TimelineEventId } from "../../types";

export type TimelineEventDraft = {
  title: string;
  date: Date;
  lanes: TimelineEvent["lanes"];
  items: string[];
  summary?: string;
  importance?: TimelineEvent["importance"];
  links?: string[];
  causes?: TimelineEventId[];
  consequences?: TimelineEventId[];
};

export type CreateTimelineEventInput = TimelineEventDraft;

export type UpdateTimelineEventInput = Partial<TimelineEventDraft>;

export type TimelineValidationError = {
  field: keyof TimelineEventDraft | "id";
  message: string;
};

export type TimelineEditionResult = {
  timeline: Timeline;
  event?: TimelineEvent;
};

export interface TimelineRepo {
  get(): Promise<Timeline>;
  save(timeline: Timeline): Promise<void>;
}
