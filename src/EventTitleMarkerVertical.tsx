import type { CSSProperties, RefObject } from "react";
import type { TimelineEvent } from "../types";
import type { EventLabelPlacement } from "./timeline/eventLabelLayout";

export type EventTitleMarkerVerticalProps = {
  event: TimelineEvent;
  placement: EventLabelPlacement;
  leftPct: number;
  isEventActive: boolean;
  isRelated: boolean;
  lanesMuted: boolean;
  eventPointerTitle: (e: TimelineEvent) => string;
  onSelectEvent: (e: TimelineEvent) => void;
  timelineSelectedEventDotRef: RefObject<HTMLButtonElement | null>;
};

/**
 * Solo modo etiquetas vertical: layout (`writing-mode`) independiente del modo horizontal;
 * sin `.event-marker` ni `.event-hit--*`.
 */
export function EventTitleMarkerVertical({
  event,
  placement: pl,
  leftPct: p,
  isEventActive,
  isRelated,
  lanesMuted,
  eventPointerTitle,
  onSelectEvent,
  timelineSelectedEventDotRef,
}: EventTitleMarkerVerticalProps) {
  const captionStyle =
    pl.columnPx != null
      ? ({ width: `${Math.round(pl.columnPx)}px` } as CSSProperties)
      : undefined;

  return (
    <div
      className={`evt-v-marker ${isEventActive ? "evt-v-marker--selected" : ""}${isRelated ? " evt-v-marker--related" : ""}${lanesMuted ? " evt-v-marker--lanes-muted" : ""}`.trim()}
      style={
        {
          left: `${p}%`,
        } as CSSProperties
      }
    >
      <button
        type="button"
        className="evt-v-hit"
        ref={(el) => {
          if (isEventActive) {
            timelineSelectedEventDotRef.current = el;
          } else if (timelineSelectedEventDotRef.current === el) {
            timelineSelectedEventDotRef.current = null;
          }
        }}
        onClick={() => onSelectEvent(event)}
        title={eventPointerTitle(event)}
      >
        <span
          className={`event-dot event-dot--titles ${isEventActive ? "active" : ""}`}
          aria-hidden="true"
        />
        <span
          className="evt-v-caption timeline-event-title"
          style={captionStyle}
        >
          {event.title}
        </span>
      </button>
    </div>
  );
}
