/** Carril semántico del timeline (dominio del evento). */
export type EventLaneId =
  | "politico"
  | "militar"
  | "economico"
  | "social"
  | "diplomatico";

/** Orden visual de arriba hacia abajo en la pista. */
export const EVENT_LANE_ORDER: readonly EventLaneId[] = [
  "politico",
  "militar",
  "economico",
  "social",
  "diplomatico",
] as const;

export type LaneGlyphId =
  | "landmark"
  | "shield"
  | "coins"
  | "users"
  | "globe";

export const LANE_UI: Record<
  EventLaneId,
  { label: string; color: string; glyph: LaneGlyphId }
> = {
  politico: { label: "Político", color: "#325f87", glyph: "landmark" },
  militar: { label: "Militar", color: "#8f4b3f", glyph: "shield" },
  economico: { label: "Económico", color: "#a7792d", glyph: "coins" },
  social: { label: "Social", color: "#6f5b83", glyph: "users" },
  diplomatico: { label: "Diplomático", color: "#4f7257", glyph: "globe" },
};

/** Primer carril en orden visual que el evento ocupa (etiqueta + foco principal). */
export function primarySemanticLane(
  lanes: readonly EventLaneId[]
): EventLaneId {
  for (const id of EVENT_LANE_ORDER) {
    if (lanes.includes(id)) return id;
  }
  return lanes[0]!;
}

/** Índice 0..n-1 del carril más alto (más cerca del eje) donde el evento tiene marca. */
export function topSemanticLaneIndex(lanes: readonly EventLaneId[]): number {
  for (let i = 0; i < EVENT_LANE_ORDER.length; i++) {
    if (lanes.includes(EVENT_LANE_ORDER[i]!)) return i;
  }
  return 0;
}

/** Cantidad de franjas semánticas que debe atravesar el conector (desde el carril superior con bola hasta títulos). */
export function semanticConnectorLaneSpanCount(
  lanes: readonly EventLaneId[]
): number {
  return Math.max(1, EVENT_LANE_ORDER.length - topSemanticLaneIndex(lanes));
}

/** Carriles del evento ordenados como en la pista (subconjunto de EVENT_LANE_ORDER). */
export function lanesInDisplayOrder(
  lanes: readonly EventLaneId[]
): EventLaneId[] {
  return EVENT_LANE_ORDER.filter((id) => lanes.includes(id));
}
