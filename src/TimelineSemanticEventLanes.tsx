import type { CSSProperties } from "react";

/**
 * Carril semántico del timeline (POLÍTICO, MILITAR, …): puntos por fecha alineados al eje.
 *
 * ## Spec (comportamiento / contrato para agentes)
 *
 * - **Etiquetas de carril (`events-lane__caption`)**: `position: sticky; left: 0` respecto del
 *   scroll horizontal de `.timeline-scroll`. Al desplazar el eje, el rótulo queda pegado al
 *   borde izquierdo del viewport del scroll, sin encoger la pista de fechas.
 * - **Alineación %**: la fila de puntos (`.row-bar`) sigue ocupando el **100% del ancho** del
 *   contenido scrollable (igual que eje y períodos). El rótulo no participa del flujo de ancho:
 *   vive en la misma celda de rejilla que la pista (`events-lane__semantic-body` en `App.css`).
 * - **Visor / overflow**: no añadir `overflow-y: visible` en el mismo nodo que `overflow-x: auto`
 *   (regla del proyecto: ver `docs/VIEWER_LAYOUT.md`). El sticky es solo horizontal.
 *
 * Si tocás el layout de este bloque, revisá que los `left: ${pct}%` de los eventos sigan
 * referidos al mismo ancho que `.timeline-stack` / eje.
 */

import type { StudyMode } from "../causality";
import {
  EVENT_LANE_ORDER,
  LANE_UI,
  type EventLaneId,
} from "../eventLanes";
import type { Selection, TimelineEvent } from "../types";

function eventPointerTitle(e: TimelineEvent, mode: StudyMode): string {
  if (mode === "exam") return e.title;
  const tail = e.summary ?? e.items[0];
  return tail && tail !== e.title ? `${e.title} — ${tail}` : e.title;
}

export type TimelineSemanticEventLanesProps = {
  laneVisibility: Record<EventLaneId, boolean>;
  eventsSorted: TimelineEvent[];
  eventPassesLaneFilter: (ev: TimelineEvent) => boolean;
  /** 0–100 en la pista (mismos márgenes que el eje). */
  trackPct: (timeMs: number) => number;
  selection: Selection;
  studyMode: StudyMode;
  causalHighlight: ReadonlySet<TimelineEvent>;
  onSelectEvent: (item: TimelineEvent) => void;
};

export function TimelineSemanticEventLanes({
  laneVisibility,
  eventsSorted,
  eventPassesLaneFilter,
  trackPct,
  selection,
  studyMode,
  causalHighlight,
  onSelectEvent,
}: TimelineSemanticEventLanesProps) {
  return (
    <>
      {EVENT_LANE_ORDER.map((laneId) => {
        const laneOn = laneVisibility[laneId];
        const eventsHere = eventsSorted.filter(
          (e) =>
            e.lanes.includes(laneId) &&
            laneOn &&
            eventPassesLaneFilter(e)
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
                  const p = trackPct(ev.date.getTime());
                  return (
                    <div
                      key={`${laneId}-${ev.title}-${ev.date.toISOString()}`}
                      className={`event-marker event-marker--lane-dot ${isEventActive ? "event-marker--selected" : ""}${isRelated ? " event-marker--related" : ""}`.trim()}
                      style={
                        {
                          left: `${p}%`,
                          "--event-dot-fill": LANE_UI[laneId].color,
                        } as CSSProperties
                      }
                    >
                      <button
                        type="button"
                        className="event-hit event-hit--lane-dot"
                        tabIndex={-1}
                        aria-hidden={true}
                        onClick={() => onSelectEvent(ev)}
                        title={eventPointerTitle(ev, studyMode)}
                      >
                        <span
                          className={`event-lane-tick${isEventActive ? " event-lane-tick--active" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
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
