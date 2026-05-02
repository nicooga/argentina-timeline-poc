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

export type TimelineSummary = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TimelineRecord = TimelineSummary & {
  timeline: Timeline;
};

export type CreateTimelineInput = {
  title: string;
  description: string | null;
  timeline: Timeline;
};

export type ReplaceTimelineInput = {
  title: string;
  description: string | null;
  timeline: Timeline;
};

export interface TimelineRepo {
  list(): Promise<TimelineSummary[]>;
  get(timelineId: string): Promise<TimelineRecord>;
  create(input: CreateTimelineInput): Promise<TimelineRecord>;
  replace(timelineId: string, input: ReplaceTimelineInput): Promise<TimelineRecord>;
}
