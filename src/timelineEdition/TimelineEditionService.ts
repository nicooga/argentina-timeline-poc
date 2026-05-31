import type { EventLaneId, TimelineEvent, TimelineEventId } from "../../types";
import { EVENT_LANE_ORDER } from "../../eventLanes";
import type {
  CreateTimelineEventInput,
  TimelineEditionResult,
  TimelineEventDraft,
  TimelineRepo,
  TimelineValidationError,
  UpdateTimelineEventInput,
} from "./TimelineRepo";
import { cloneTimeline } from "./timelineSerialization";

function cleanTextList(values: readonly string[] | undefined): string[] | undefined {
  const out = (values ?? []).map((v) => v.trim()).filter(Boolean);
  return out.length ? out : undefined;
}

function cleanIdList(
  values: readonly TimelineEventId[] | undefined,
  validIds: ReadonlySet<TimelineEventId>,
  ownId?: TimelineEventId
): TimelineEventId[] | undefined {
  const out = Array.from(
    new Set((values ?? []).map((v) => v.trim()).filter(Boolean))
  ).filter((id) => validIds.has(id) && id !== ownId);
  return out.length ? out : undefined;
}

function eventIdFromTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "evento";
}

function uniqueEventId(title: string, existing: ReadonlySet<TimelineEventId>): TimelineEventId {
  const base = eventIdFromTitle(title);
  let id = base;
  let n = 2;
  while (existing.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function validLanes(lanes: readonly EventLaneId[]): EventLaneId[] {
  return EVENT_LANE_ORDER.filter((lane) => lanes.includes(lane));
}

function applyDraft(
  draft: TimelineEventDraft,
  validIds: ReadonlySet<TimelineEventId>,
  ownId?: TimelineEventId
): Omit<TimelineEvent, "id"> {
  return {
    title: draft.title.trim(),
    summary: draft.summary?.trim() || undefined,
    items: cleanTextList(draft.items) ?? [],
    date: new Date(draft.date.getTime()),
    lanes: validLanes(draft.lanes),
    links: cleanTextList(draft.links),
    causes: cleanIdList(draft.causes, validIds, ownId),
    consequences: cleanIdList(draft.consequences, validIds, ownId),
    importance: draft.importance,
  };
}

export class TimelineEditionService {
  constructor(private readonly repo: TimelineRepo) {}

  async createEvent(
    timelineId: string,
    input: CreateTimelineEventInput
  ): Promise<TimelineEditionResult> {
    const record = await this.repo.get(timelineId);
    const timeline = record.timeline;
    this.assertValid(input);
    const existingIds = new Set(timeline.events.map((e) => e.id));
    const id = uniqueEventId(input.title, existingIds);
    const validIds = new Set([...existingIds, id]);
    const event: TimelineEvent = {
      id,
      ...applyDraft(input, validIds, id),
    };
    const next = cloneTimeline({
      ...timeline,
      events: [...timeline.events, event],
    });
    const saved = await this.repo.replace(timelineId, {
      title: record.title,
      description: record.description,
      timeline: next,
    });
    return { timeline: saved.timeline, event: saved.timeline.events.find((e) => e.id === id) };
  }

  async updateEvent(
    timelineId: string,
    id: TimelineEventId,
    input: UpdateTimelineEventInput
  ): Promise<TimelineEditionResult> {
    const record = await this.repo.get(timelineId);
    const timeline = record.timeline;
    const current = timeline.events.find((e) => e.id === id);
    if (!current) throw new Error(`Event not found: ${id}`);
    const draft: TimelineEventDraft = {
      title: input.title ?? current.title,
      summary: input.summary ?? current.summary,
      items: input.items ?? current.items ?? [],
      date: input.date ?? current.date,
      lanes: input.lanes ?? current.lanes,
      links: input.links ?? current.links,
      causes: input.causes ?? current.causes,
      consequences: input.consequences ?? current.consequences,
      importance: "importance" in input ? input.importance : current.importance,
    };
    this.assertValid(draft, id);
    const validIds = new Set(timeline.events.map((e) => e.id));
    const event: TimelineEvent = {
      id,
      ...applyDraft(draft, validIds, id),
    };
    const next = cloneTimeline({
      ...timeline,
      events: timeline.events.map((e) => (e.id === id ? event : e)),
    });
    const saved = await this.repo.replace(timelineId, {
      title: record.title,
      description: record.description,
      timeline: next,
    });
    return { timeline: saved.timeline, event: saved.timeline.events.find((e) => e.id === id) };
  }

  async deleteEvent(
    timelineId: string,
    id: TimelineEventId
  ): Promise<TimelineEditionResult> {
    const record = await this.repo.get(timelineId);
    const timeline = record.timeline;
    const next = cloneTimeline({
      ...timeline,
      events: timeline.events
        .filter((e) => e.id !== id)
        .map((e) => ({
          ...e,
          causes: e.causes?.filter((causeId) => causeId !== id),
          consequences: e.consequences?.filter((effectId) => effectId !== id),
        })),
    });
    const saved = await this.repo.replace(timelineId, {
      title: record.title,
      description: record.description,
      timeline: next,
    });
    return { timeline: saved.timeline };
  }

  private assertValid(input: TimelineEventDraft, ownId?: TimelineEventId): void {
    const errors: TimelineValidationError[] = [];
    if (!input.title.trim()) {
      errors.push({ field: "title", message: "El título es obligatorio." });
    }
    if (!(input.date instanceof Date) || Number.isNaN(input.date.getTime())) {
      errors.push({ field: "date", message: "La fecha no es válida." });
    }
    if (validLanes(input.lanes).length === 0) {
      errors.push({ field: "lanes", message: "Elegí al menos un carril." });
    }
    if (cleanTextList(input.items)?.length == null) {
      errors.push({ field: "items", message: "Agregá al menos un punto." });
    }
    if (ownId) {
      if (input.causes?.includes(ownId)) {
        errors.push({ field: "causes", message: "Un evento no puede causarse a sí mismo." });
      }
      if (input.consequences?.includes(ownId)) {
        errors.push({ field: "consequences", message: "Un evento no puede ser su propia consecuencia." });
      }
    }
    if (errors.length > 0) {
      throw Object.assign(new Error("Timeline event validation failed"), {
        validationErrors: errors,
      });
    }
  }
}
