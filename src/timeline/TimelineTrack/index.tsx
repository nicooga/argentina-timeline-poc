import type { CSSProperties, RefObject } from "react";
import type { StudyMode } from "../../../causality";
import type { EventLaneId } from "../../../eventLanes";
import type { Period, Selection, TimelineEvent } from "../../../types";
import type { PreviewChangeSet } from "../../timelineEdition/applyChangesLocally";
import type { DisplacedEventPlacement } from "../eventClusterLayout";
import type { EventLabelPlacement } from "../eventLabelLayout";
import { formatHistoricalYear } from "../historicalDateFormat";
import {
  timelinePointInVisibleRange,
  timelineSpanIntersectsVisibleRange,
  type TimelineVisibleRange,
} from "../timelineViewport";
import {
  TimelineSemanticEventLanes,
  TimelineEventTitlesLane,
  type TimelineCausalitySvgEdge,
} from "../ui";

type TimelineTrackProps = {
  periods: Period[];
  eventsSorted: TimelineEvent[];
  selection: Selection;
  minMs: number;
  maxMs: number;
  cursorPct: number | null;
  laneByIndex: number[];
  periodIndicesByLane: number[][];
  compactPeriodRowRem: number;
  activePeriod: Period | null;
  studyMode: StudyMode;
  laneVisibility: Record<EventLaneId, boolean>;
  causalHighlight: ReadonlySet<TimelineEvent>;
  causalitySvgEdges: TimelineCausalitySvgEdge[];
  eventLabelPlacements: EventLabelPlacement[];
  displacedEventPlacements: DisplacedEventPlacement[];
  pointerCoarse: boolean;
  viewportInnerHeightPx: number;
  previewChangeSet?: PreviewChangeSet;
  visibleRange: TimelineVisibleRange;
  selectedPeriodBarRef: RefObject<HTMLButtonElement | null>;
  selectedEventDotRef: RefObject<HTMLButtonElement | null>;
  trackPct: (timeMs: number) => number;
  periodRowCenterFromTopRem: (
    rowIndex: number,
    compact: boolean,
    compactLaneHeightRem: number
  ) => number;
  foregroundForHex: (hex: string) => string;
  formatDate: (date: Date) => string;
  eventPassesLaneFilter: (event: TimelineEvent) => boolean;
  eventPointerTitle: (event: TimelineEvent) => string;
  onSelectPeriod: (period: Period) => void;
  onSelectEvent: (event: TimelineEvent) => void;
};

export default function TimelineTrack({
  periods,
  eventsSorted,
  selection,
  minMs,
  maxMs,
  cursorPct,
  laneByIndex,
  periodIndicesByLane,
  compactPeriodRowRem,
  activePeriod,
  studyMode,
  laneVisibility,
  causalHighlight,
  causalitySvgEdges,
  eventLabelPlacements,
  displacedEventPlacements,
  pointerCoarse,
  viewportInnerHeightPx,
  previewChangeSet,
  visibleRange,
  selectedPeriodBarRef,
  selectedEventDotRef,
  trackPct,
  periodRowCenterFromTopRem,
  foregroundForHex,
  formatDate,
  eventPassesLaneFilter,
  eventPointerTitle,
  onSelectPeriod,
  onSelectEvent,
}: TimelineTrackProps) {
  const visiblePeriodIndexSet = new Set<number>();
  periods.forEach((period, index) => {
    const startPct = trackPct(period.start.getTime());
    const endPct = trackPct(period.end.getTime());
    const selected = activePeriod === period;
    if (
      selected ||
      timelineSpanIntersectsVisibleRange(startPct, endPct, visibleRange)
    ) {
      visiblePeriodIndexSet.add(index);
    }
  });
  const visibleEventIndexSet = new Set<number>();
  eventsSorted.forEach((event, index) => {
    const selected = selection?.kind === "event" && selection.item === event;
    if (
      selected ||
      timelinePointInVisibleRange(trackPct(event.date.getTime()), visibleRange)
    ) {
      visibleEventIndexSet.add(index);
    }
  });
  const visibleEventSet = new Set<TimelineEvent>(
    [...visibleEventIndexSet].map((index) => eventsSorted[index]!)
  );
  const visibleCausalitySvgEdges = causalitySvgEdges.filter(
    ({ from, to }) =>
      visibleEventSet.has(from) ||
      visibleEventSet.has(to) ||
      timelineSpanIntersectsVisibleRange(
        trackPct(from.date.getTime()),
        trackPct(to.date.getTime()),
        visibleRange
      )
  );

  return (
    <>
      <div className="track-wrap">
        <div className="track-bg" />
        <div className="period-connectors" aria-hidden>
          {periods.flatMap((period, index) => {
            if (!visiblePeriodIndexSet.has(index)) return [];
            const centerRem = periodRowCenterFromTopRem(
              laneByIndex[index],
              true,
              compactPeriodRowRem
            );
            const height = `calc(var(--timeline-axis-gap) + ${centerRem}rem)`;
            const startLeft = trackPct(period.start.getTime());
            const endLeft = trackPct(period.end.getTime());
            const selected = activePeriod === period;
            return [
              <div
                key={`${period.title}-start-conn`}
                className={`period-connector${selected ? " period-connector--selected" : ""}`}
                style={{
                  left: `${startLeft}%`,
                  height,
                  borderLeftColor: period.color,
                }}
              />,
              <div
                key={`${period.title}-end-conn`}
                className={`period-connector${selected ? " period-connector--selected" : ""}`}
                style={{
                  left: `${endLeft}%`,
                  height,
                  borderLeftColor: period.color,
                }}
              />,
            ];
          })}
        </div>
        {periodIndicesByLane.map((indices, lane) => (
          <div key={`lane-${lane}`} className="period-row">
            <div className="row-bar">
              {indices.map((index) => {
                if (!visiblePeriodIndexSet.has(index)) return null;
                const period = periods[index];
                const left = trackPct(period.start.getTime());
                const width = Math.max(trackPct(period.end.getTime()) - left, 0.8);
                const selected = activePeriod === period;
                const periodId =
                  (period as unknown as Record<string, unknown>)["id"] as string | undefined ??
                  period.title;
                const previewAdded = previewChangeSet?.added.has(periodId) ?? false;
                const previewUpdated = previewChangeSet?.updated.has(periodId) ?? false;
                return (
                  <button
                    key={period.title}
                    type="button"
                    className={[
                      "bar",
                      selected ? "active" : "",
                      previewAdded ? "bar--preview-added" : "",
                      previewUpdated ? "bar--preview-updated" : "",
                    ].filter(Boolean).join(" ")}
                    ref={(el) => {
                      if (selected) {
                        selectedPeriodBarRef.current = el;
                      } else if (selectedPeriodBarRef.current === el) {
                        selectedPeriodBarRef.current = null;
                      }
                    }}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: period.color,
                      color: foregroundForHex(period.color),
                    }}
                    onClick={() => onSelectPeriod(period)}
                    title={`${formatDate(period.start)} — ${formatDate(period.end)}`}
                  >
                    <span className="bar-text timeline-period-label">
                      {period.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="events-stack">
          <TimelineSemanticEventLanes
            laneVisibility={laneVisibility}
            eventsSorted={eventsSorted}
            visibleEventIndexSet={visibleEventIndexSet}
            trackPct={trackPct}
            selection={selection}
            studyMode={studyMode}
            causalHighlight={causalHighlight}
            onSelectEvent={onSelectEvent}
            previewHighlight={previewChangeSet}
          />
          <TimelineEventTitlesLane
            eventsSorted={eventsSorted}
            eventLabelPlacements={eventLabelPlacements}
            trackPct={trackPct}
            sel={selection}
            studyMode={studyMode}
            causalHighlight={causalHighlight}
            causalitySvgEdges={visibleCausalitySvgEdges}
            eventPassesLaneFilter={eventPassesLaneFilter}
            pointerCoarse={pointerCoarse}
            viewportInnerHeightPx={viewportInnerHeightPx}
            eventPointerTitle={eventPointerTitle}
            onSelectEvent={onSelectEvent}
            timelineSelectedEventDotRef={selectedEventDotRef}
            displacedEventPlacements={displacedEventPlacements}
            visibleEventIndexSet={visibleEventIndexSet}
            previewHighlight={previewChangeSet}
          />
        </div>
      </div>

      {cursorPct !== null && (() => {
        const span = 100 - 7 - 4;
        const u = (cursorPct - 7) / span;
        const timeMs = minMs + Math.max(0, Math.min(1, u)) * (maxMs - minMs);
        const year = new Date(timeMs).getUTCFullYear();
        return (
          <div
            className="timeline-cursor"
            style={{ left: `${cursorPct}%` } as CSSProperties}
            aria-hidden
          >
            <span className="timeline-cursor__label">
              {formatHistoricalYear(year)}
            </span>
          </div>
        );
      })()}
    </>
  );
}
