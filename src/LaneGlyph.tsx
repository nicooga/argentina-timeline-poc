import type { CSSProperties } from "react";
import type { EventLaneId } from "../types";
import { LANE_UI, type LaneGlyphId } from "../eventLanes";

function GlyphPath({ id }: { id: LaneGlyphId }) {
  switch (id) {
    case "landmark":
      return (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 21h18M6 21V10l6-3v14M12 7l6 3v11M9 10v11M15 10v11"
        />
      );
    case "shield":
      return (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        />
      );
    case "coins":
      return (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4M8 8c0-2.2 1.8-4 4-4s4 1.8 4 4"
        />
      );
    case "users":
      return (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm12 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        />
      );
    case "globe":
      return (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"
        />
      );
    default:
      return null;
  }
}

/** Icono del carril (solo trazo; usar `color` en CSS o style). */
export function LaneGlyph({
  lane,
  size = 18,
  className,
  style,
}: {
  lane: EventLaneId;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { glyph } = LANE_UI[lane];
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <GlyphPath id={glyph} />
    </svg>
  );
}
