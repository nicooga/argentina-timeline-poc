import type { CSSProperties } from "react";
import type { TimelineEvent as TimelineEventModel } from "../../../types";

type TimelineEventProps = {
  event: TimelineEventModel;
  laneColor: string;
  leftPct: number;
  title: string;
  selected: boolean;
  related: boolean;
  previewAdded: boolean;
  previewUpdated: boolean;
  onSelect: (event: TimelineEventModel) => void;
};

export default function TimelineEvent({
  event,
  laneColor,
  leftPct,
  title,
  selected,
  related,
  previewAdded,
  previewUpdated,
  onSelect,
}: TimelineEventProps) {
  return (
    <div
      className={[
        "event-marker",
        "event-marker--lane-dot",
        selected ? "event-marker--selected" : "",
        related ? "event-marker--related" : "",
        previewAdded ? "event-marker--preview-added" : "",
        previewUpdated ? "event-marker--preview-updated" : "",
      ].filter(Boolean).join(" ")}
      style={
        {
          left: `${leftPct}%`,
          "--event-dot-fill": laneColor,
        } as CSSProperties
      }
    >
      <button
        type="button"
        className="event-hit event-hit--lane-dot"
        tabIndex={-1}
        aria-hidden={true}
        onClick={() => onSelect(event)}
        title={title}
      >
        <span
          className={`event-lane-tick${selected ? " event-lane-tick--active" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
