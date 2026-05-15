/**
 * Semantic timeline lane (political, military, etc.): date-aligned points on the axis.
 *
 * ## Spec (behavior / agent contract)
 *
 * - **Lane labels (`events-lane__caption`)**: `position: sticky; left: 0` relative to
 *   `.timeline-scroll` horizontal scrolling. When the axis moves, the label stays attached to
 *   the scroll viewport's left edge without shrinking the date track.
 * - **Percent alignment**: the dot row (`.row-bar`) still occupies **100% of the scrollable
 *   content width** (same as the axis and periods). The label does not participate in width flow:
 *   it lives in the same grid cell as the track (`events-lane__semantic-body` in `App.css`).
 * - **Viewer / overflow**: do not add `overflow-y: visible` on the same node as `overflow-x: auto`
 *   (project rule: see `docs/VIEWER_LAYOUT.SPEC.md`). The sticky behavior is horizontal only.
 *
 * If this layout changes, verify that event `left: ${pct}%` positions still reference the same
 * width as `.timeline-stack` / axis.
 */

import type { StudyMode } from "../../../causality";
import {
  EVENT_LANE_ORDER,
  LANE_UI,
  type EventLaneId,
} from "../../../eventLanes";
import type { Selection, TimelineEvent } from "../../../types";
import type { PreviewChangeSet } from "../../timelineEdition/applyChangesLocally";
import TimelineEventMarker from "../TimelineEvent";

function eventPointerTitle(e: TimelineEvent, mode: StudyMode): string {
  if (mode === "exam") return e.title;
  const tail = e.summary ?? e.items[0];
  return tail && tail !== e.title ? `${e.title} — ${tail}` : e.title;
}

export type TimelineSemanticEventLanesProps = {
  laneVisibility: Record<EventLaneId, boolean>;
  eventsSorted: TimelineEvent[];
  /** 0-100 on the track, with the same insets as the axis. */
  trackPct: (timeMs: number) => number;
  selection: Selection;
  studyMode: StudyMode;
  causalHighlight: ReadonlySet<TimelineEvent>;
  onSelectEvent: (item: TimelineEvent) => void;
  previewHighlight?: PreviewChangeSet;
};

export function TimelineSemanticEventLanes({
  laneVisibility,
  eventsSorted,
  trackPct,
  selection,
  studyMode,
  causalHighlight,
  onSelectEvent,
  previewHighlight,
}: TimelineSemanticEventLanesProps) {
  return (
    <>
      {EVENT_LANE_ORDER.map((laneId) => {
        const laneOn = laneVisibility[laneId];
        const eventsHere = eventsSorted.filter((e) =>
          e.lanes.includes(laneId)
        );
        return (
          <div
            key={laneId}
            className={`events-lane events-lane--semantic${laneOn ? "" : " events-lane--filtered-off"}`.trim()}
            data-lane={laneId}
          >
            <div className="events-lane__semantic-body">
              <div
                className="events-lane__row events-lane__row--dots row-bar"
                role={laneId === EVENT_LANE_ORDER[0] ? "group" : undefined}
                aria-label={
                  laneId === EVENT_LANE_ORDER[0]
                    ? `Eventos en la línea temporal, carril ${LANE_UI[laneId].label}`
                    : `Carril ${LANE_UI[laneId].label}, eventos`
                }
              >
                {eventsHere.map((ev) => {
                  const isEventActive =
                    selection?.kind === "event" && selection.item === ev;
                  const isRelated =
                    studyMode !== "exam" &&
                    selection?.kind === "event" &&
                    causalHighlight.has(ev) &&
                    selection.item !== ev;
                  const isPreviewAdded = previewHighlight?.added.has(ev.id) ?? false;
                  const isPreviewUpdated = previewHighlight?.updated.has(ev.id) ?? false;
                  const p = trackPct(ev.date.getTime());
                  return (
                    <TimelineEventMarker
                      key={`${laneId}-${ev.title}-${ev.date.toISOString()}`}
                      event={ev}
                      laneColor={LANE_UI[laneId].color}
                      leftPct={p}
                      title={eventPointerTitle(ev, studyMode)}
                      selected={isEventActive}
                      related={isRelated}
                      previewAdded={isPreviewAdded}
                      previewUpdated={isPreviewUpdated}
                      onSelect={onSelectEvent}
                    />
                  );
                })}
              </div>
              <div className="events-lane__caption">
                <span className="events-lane__name">
                  {LANE_UI[laneId].label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
