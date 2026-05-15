import type { CSSProperties } from "react";

type TimelineEventVerticalConnectorProps = {
  leftPct: number;
  lane: number;
  laneSpanCount: number;
  stroke: string;
  selected: boolean;
  lanesMuted: boolean;
};

export default function TimelineEventVerticalConnector({
  leftPct,
  lane,
  laneSpanCount,
  stroke,
  selected,
  lanesMuted,
}: TimelineEventVerticalConnectorProps) {
  return (
    <div
      className={`event-connector${selected ? " event-connector--selected" : ""}${lanesMuted ? " event-connector--lanes-muted" : ""}`.trim()}
      style={
        {
          left: `${leftPct}%`,
          "--event-conn-lane": lane,
          "--event-connector-lane-span-count": laneSpanCount,
          "--event-connector-stroke": stroke,
        } as CSSProperties
      }
    />
  );
}
