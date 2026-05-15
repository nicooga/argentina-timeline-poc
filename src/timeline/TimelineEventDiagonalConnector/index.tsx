import type { CSSProperties } from "react";

type TimelineEventDiagonalConnectorProps = {
  path: string;
  stroke: string;
  selected: boolean;
};

export default function TimelineEventDiagonalConnector({
  path,
  stroke,
  selected,
}: TimelineEventDiagonalConnectorProps) {
  return (
    <path
      className={`event-displacement-route${selected ? " event-displacement-route--selected" : ""}`}
      d={path}
      style={
        {
          "--event-connector-stroke": stroke,
        } as CSSProperties
      }
    />
  );
}
