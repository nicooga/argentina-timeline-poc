import type { Timeline } from "../../types";
import type { TimelineChange } from "./aiConversation";
import { timelineToJson, timelineFromJson } from "./timelineSerialization";

export type PreviewChangeSet = {
  added: ReadonlySet<string>;
  updated: ReadonlySet<string>;
  removed: ReadonlySet<string>;
};

export class TimelineChangeApplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimelineChangeApplyError";
  }
}

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

type JsonItem = Record<string, unknown>;

function mergeInto(target: JsonItem, data: Record<string, unknown> | null): JsonItem {
  if (!data) return target;
  const result = { ...target };
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined) {
      result[k] = k === "lanes" ? normalizeLanes(v) : v;
    }
  }
  return result;
}

function normalizeLanes(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((lane) => {
    if (lane === "political") return "politico";
    if (lane === "military") return "militar";
    if (lane === "economic") return "economico";
    if (lane === "cultural") return "social";
    return lane;
  });
}

function requireTargetId(change: TimelineChange): string {
  if (change.target_id == null || change.target_id.trim() === "") {
    throw new TimelineChangeApplyError(`${change.type} requires target_id`);
  }
  return change.target_id;
}

export function applyChangesLocally(
  timeline: Timeline,
  changes: TimelineChange[]
): { timeline: Timeline; changeSet: PreviewChangeSet } {
  const json = timelineToJson(timeline);
  let events: JsonItem[] = json.events.map((e) => ({ ...e }));
  let periods: JsonItem[] = json.periods.map((p) => ({ ...p }));

  const added = new Set<string>();
  const updated = new Set<string>();
  const removed = new Set<string>();

  for (const change of changes) {
    switch (change.type) {
      case "create_event": {
        const ev: JsonItem = mergeInto({}, change.data);
        if (!ev["id"]) ev["id"] = slugify(String(ev["title"] ?? "evento"));
        events = [...events, ev];
        added.add(String(ev["id"]));
        break;
      }
      case "update_event": {
        const targetId = requireTargetId(change);
        let found = false;
        events = events.map((ev) => {
          if (ev["id"] === targetId) {
            found = true;
            const next = mergeInto(ev, change.data);
            updated.add(String(next["id"] ?? targetId));
            return next;
          }
          return ev;
        });
        if (!found) throw new TimelineChangeApplyError(`event ${targetId} not found`);
        break;
      }
      case "delete_event": {
        const targetId = requireTargetId(change);
        const before = events.length;
        events = events.filter((ev) => ev["id"] !== targetId);
        if (events.length === before) {
          throw new TimelineChangeApplyError(`event ${targetId} not found`);
        }
        removed.add(targetId);
        break;
      }
      case "create_period": {
        const p: JsonItem = mergeInto({}, change.data);
        if (!p["id"]) p["id"] = slugify(String(p["title"] ?? "periodo"));
        periods = [...periods, p];
        added.add(String(p["id"]));
        break;
      }
      case "update_period": {
        const targetId = requireTargetId(change);
        let found = false;
        periods = periods.map((p) => {
          if (p["id"] === targetId) {
            found = true;
            const next = mergeInto(p, change.data);
            updated.add(String(next["id"] ?? targetId));
            return next;
          }
          return p;
        });
        if (!found) throw new TimelineChangeApplyError(`period ${targetId} not found`);
        break;
      }
      case "delete_period": {
        const targetId = requireTargetId(change);
        const before = periods.length;
        periods = periods.filter((p) => p["id"] !== targetId);
        if (periods.length === before) {
          throw new TimelineChangeApplyError(`period ${targetId} not found`);
        }
        removed.add(targetId);
        break;
      }
    }
  }

  const previewJson = { events, periods };

  return {
    timeline: timelineFromJson(previewJson),
    changeSet: { added, updated, removed },
  };
}
