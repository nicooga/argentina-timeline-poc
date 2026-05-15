import type { CSSProperties, RefObject } from "react";
import type { StudyMode } from "../../../causality";
import { semanticConnectorLaneSpanCount } from "../../../eventLanes";
import type { Selection, TimelineEvent } from "../../../types";
import type { EventLabelPlacement } from "../eventLabelLayout";
import { verticalColumnWidthPx, verticalEventTitlesRowLayoutPx } from "../eventLabelLayout";
import type { DisplacedEventPlacement } from "../eventClusterLayout";
import type { PreviewChangeSet } from "../../timelineEdition/applyChangesLocally";
import TimelineEventDiagonalConnector from "../TimelineEventDiagonalConnector";
import TimelineEventLabel from "../TimelineEventLabel";
import TimelineEventVerticalConnector from "../TimelineEventVerticalConnector";

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
  displacedEventPlacements: DisplacedEventPlacement[];
  previewHighlight?: PreviewChangeSet;
};

/**
 * Event titles by date. Single visual mode: vertical labels.
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
  displacedEventPlacements,
  previewHighlight,
}: TimelineEventTitlesLaneProps) {
  const routePlacements = eventsSorted.map((event, idx) => {
    const datePct = trackPct(event.date.getTime());
    return (
      displacedEventPlacements[idx] ?? {
        event,
        datePct,
        displayPct: datePct,
        offsetPx: 0,
        needsConnector: false,
      }
    );
  });
  /**
   * Axis-to-dot connector: `.event-marker` `left%` = track date; disk Y =
   * `--events-dot-half` (+ lane); `--ev-titles-v-connector-btm` ends the dotted line at the disk.
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
          {eventsSorted.map((e, idx) => {
            const displaced = displacedEventPlacements[idx];
            const isConnActive = sel?.kind === "event" && sel.item === e;
            const lanesMuted = !eventPassesLaneFilter(e);
            const connectorStroke = isConnActive
              ? "color-mix(in srgb, var(--accent) 82%, var(--text))"
              : "var(--muted)";
            return (
              <TimelineEventVerticalConnector
                key={`conn-title-${e.title}-${e.date.toISOString()}`}
                leftPct={displaced?.datePct ?? trackPct(e.date.getTime())}
                lane={0}
                laneSpanCount={semanticConnectorLaneSpanCount(e.lanes)}
                stroke={connectorStroke}
                selected={isConnActive}
                lanesMuted={lanesMuted}
              />
            );
          })}
        </div>
        {routePlacements.length > 0 ? (
          <svg
            className="events-titles-lane__displacement-routes"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {routePlacements.map((placement) => {
              const x1 = placement.datePct * 10;
              const x2 = placement.displayPct * 10;
              const bendY = 54;
              const d = placement.needsConnector
                ? `M ${x1} 0 L ${x1} ${bendY} L ${x2} 100`
                : `M ${x1} 0 L ${x1} 100`;
              const isActive =
                sel?.kind === "event" && sel.item === placement.event;
              const connectorStroke = isActive
                ? "color-mix(in srgb, var(--accent) 82%, var(--text))"
                : "var(--muted)";
              return (
                <TimelineEventDiagonalConnector
                  key={`displaced-route-${placement.event.id}`}
                  path={d}
                  stroke={connectorStroke}
                  selected={isActive}
                />
              );
            })}
          </svg>
        ) : null}
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
          const previewStatus = previewHighlight?.added.has(e.id)
            ? ("added" as const)
            : previewHighlight?.updated.has(e.id)
              ? ("updated" as const)
              : undefined;
          return (
            <TimelineEventLabel
              key={`title-${e.title}-${e.date.toISOString()}`}
              event={e}
              leftPct={displacedEventPlacements[idx]?.displayPct ?? p}
              isEventActive={isEventActive}
              isRelated={isRelated}
              lanesMuted={lanesMuted}
              clipWidthPx={pl?.columnPx ?? verticalColumnWidthPx(pointerCoarse, 16)}
              previewStatus={previewStatus}
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
