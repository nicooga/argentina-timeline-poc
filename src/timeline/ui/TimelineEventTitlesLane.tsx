import type { CSSProperties, RefObject } from "react";
import type { StudyMode } from "../../../causality";
import { semanticConnectorLaneSpanCount } from "../../../eventLanes";
import type { Selection, TimelineEvent } from "../../../types";
import { EventTitleMarkerVertical } from "./EventTitleMarkerVertical";
import type { EventLabelPlacement } from "../eventLabelLayout";
import { verticalColumnWidthPx, verticalEventTitlesRowLayoutPx } from "../eventLabelLayout";

export type TimelineCausalitySvgEdge = {
  from: TimelineEvent;
  to: TimelineEvent;
};

export type TimelineEventTitlesLaneProps = {
  eventsSorted: TimelineEvent[];
  eventLabelPlacements: EventLabelPlacement[];
  trackPct: (timeMs: number) => number;
  sel: Selection;
  studyMode: StudyMode;
  causalHighlight: ReadonlySet<TimelineEvent>;
  causalitySvgEdges: TimelineCausalitySvgEdge[];
  eventPassesLaneFilter: (ev: TimelineEvent) => boolean;
  eventPointerTitle: (e: TimelineEvent) => string;
  onSelectEvent: (e: TimelineEvent) => void;
  timelineSelectedEventDotRef: RefObject<HTMLButtonElement | null>;
  /** Coherente con `matchMedia('(pointer: coarse)')` en App — afecta `--events-dot-half` y el layout. */
  pointerCoarse: boolean;
  /** Para alinear alto del visor de título vertical con TS (`verticalEventTitlesRowLayoutPx`). */
  viewportInnerHeightPx: number;
};

/**
 * Títulos de eventos por fecha. Único modo visual: etiquetas verticales.
 * @see docs/VIEWER_LAYOUT.SPEC.md
 */
export function TimelineEventTitlesLane({
  eventsSorted,
  eventLabelPlacements,
  trackPct,
  sel,
  studyMode,
  causalHighlight,
  causalitySvgEdges,
  eventPassesLaneFilter,
  eventPointerTitle,
  onSelectEvent,
  timelineSelectedEventDotRef,
  pointerCoarse,
  viewportInnerHeightPx,
}: TimelineEventTitlesLaneProps) {
  /**
   * Conector eje↔bola: `left%` de `.event-marker` = fecha en pista; Y del disco =
   * `--events-dot-half` (+ carril); `--ev-titles-v-connector-btm` cierra el punteado en el disco.
   */
  const verticalLayout =
    eventLabelPlacements.length > 0
      ? verticalEventTitlesRowLayoutPx(
          eventLabelPlacements,
          pointerCoarse,
          16,
          viewportInnerHeightPx
        )
      : null;

  return (
    <div
      className="events-titles-lane events-titles-lane--labels-vertical"
      role="region"
      aria-label="Títulos de eventos por fecha"
    >
      <div
        className="events-titles-lane__row row-bar"
        role="group"
        aria-label="Seleccionar evento por título"
        style={
          verticalLayout
            ? ({
                "--ev-titles-v-connector-btm": `${verticalLayout.connectorBottomInsetPx}px`,
              } as CSSProperties)
            : undefined
        }
      >
        {verticalLayout != null && verticalLayout.sizerContentMinPx > 0 ? (
          <div
            className="events-titles-lane__vertical-inflow-sizer"
            aria-hidden
            style={{ minHeight: verticalLayout.sizerContentMinPx }}
          />
        ) : null}
        {causalitySvgEdges.length > 0 ? (
          <div className="events-titles-lane__causality-wrap" aria-hidden>
            <svg
              className="events-titles-lane__causality-svg"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              {causalitySvgEdges.map(({ from, to }, i) => {
                const x1 = trackPct(from.date.getTime()) * 10;
                const x2 = trackPct(to.date.getTime()) * 10;
                const mid = (x1 + x2) / 2;
                const bulge = Math.min(42, Math.abs(x2 - x1) * 0.22 + 10);
                const d = `M ${x1} 62 Q ${mid} ${62 - bulge} ${x2} 62`;
                return (
                  <path
                    key={`${from.title}→${to.title}-${i}`}
                    className="events-titles-lane__causality-path"
                    d={d}
                  />
                );
              })}
            </svg>
          </div>
        ) : null}
        <div className="events-titles-lane__connectors" aria-hidden>
          {eventsSorted.map((e) => {
            const isConnActive = sel?.kind === "event" && sel.item === e;
            const lanesMuted = !eventPassesLaneFilter(e);
            return (
              <div
                key={`conn-title-${e.title}-${e.date.toISOString()}`}
                className={`event-connector${isConnActive ? " event-connector--selected" : ""}${lanesMuted ? " event-connector--lanes-muted" : ""}`.trim()}
                style={
                  {
                    left: `${trackPct(e.date.getTime())}%`,
                    "--event-conn-lane": 0,
                    "--event-connector-lane-span-count":
                      semanticConnectorLaneSpanCount(e.lanes),
                    "--event-connector-stroke": isConnActive
                      ? "var(--accent)"
                      : "var(--muted)",
                  } as CSSProperties
                }
              />
            );
          })}
        </div>
        {eventsSorted.map((e, idx) => {
          const pl = eventLabelPlacements[idx];
          const isEventActive = sel?.kind === "event" && sel.item === e;
          const isRelated =
            studyMode !== "exam" &&
            sel?.kind === "event" &&
            causalHighlight.has(e) &&
            sel.item !== e;
          const p = trackPct(e.date.getTime());
          const lanesMuted = !eventPassesLaneFilter(e);
          return (
            <EventTitleMarkerVertical
              key={`title-${e.title}-${e.date.toISOString()}`}
              event={e}
              leftPct={p}
              isEventActive={isEventActive}
              isRelated={isRelated}
              lanesMuted={lanesMuted}
              clipWidthPx={pl?.columnPx ?? verticalColumnWidthPx(pointerCoarse, 16)}
              eventPointerTitle={eventPointerTitle}
              onSelectEvent={onSelectEvent}
              timelineSelectedEventDotRef={timelineSelectedEventDotRef}
            />
          );
        })}
      </div>
    </div>
  );
}
