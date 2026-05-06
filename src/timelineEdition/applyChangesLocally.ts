import type { Timeline } from "../../types";
import type { TimelineChange } from "./aiConversation";
import { timelineToJson, timelineFromJson } from "./timelineSerialization";

export type PreviewChangeSet = {
  added: ReadonlySet<string>;
  updated: ReadonlySet<string>;
};

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
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
    if (v !== null && v !== undefined) result[k] = v;
  }
  return result;
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
        let found = false;
        events = events.map((ev) => {
          if (ev["id"] === change.target_id) {
            found = true;
            const next = mergeInto(ev, change.data);
            updated.add(String(next["id"] ?? change.target_id));
            return next;
          }
          return ev;
        });
        if (!found && change.target_id) updated.add(change.target_id);
        break;
      }
      case "delete_event": {
        events = events.filter((ev) => ev["id"] !== change.target_id);
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
        let found = false;
        periods = periods.map((p) => {
          if (p["id"] === change.target_id) {
            found = true;
            const next = mergeInto(p, change.data);
            updated.add(String(next["id"] ?? change.target_id));
            return next;
          }
          return p;
        });
        if (!found && change.target_id) updated.add(change.target_id);
        break;
      }
      case "delete_period": {
        periods = periods.filter((p) => p["id"] !== change.target_id);
        break;
      }
    }
  }

  const previewJson = { events, periods };
  let previewTimeline: Timeline;
  try {
    previewTimeline = timelineFromJson(previewJson);
  } catch {
    previewTimeline = timeline;
  }

  return {
    timeline: previewTimeline,
    changeSet: { added, updated },
  };
}
