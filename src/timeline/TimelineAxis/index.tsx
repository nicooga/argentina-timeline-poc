import type { CSSProperties } from "react";
import type { Selection, TimelineEvent } from "../../../types";
import { AxisTickMark } from "../../AxisTickMark";
import {
  axisMarkLaneOffsetPx,
  axisTickAriaLabel,
  type AxisMark,
} from "../axisMarkLayout";

type AxisBand = {
  key: string;
  leftPct: number;
  widthPct: number;
  stripe: 0 | 1;
  decadeLabel: string;
};

type CenturyBand = AxisBand & {
  centuryLabel: string;
};

type AxisMicroTick = {
  t: number;
  major: boolean;
  isCentury: boolean;
  stripe: 0 | 1;
};

type AxisMarkPlacement = {
  mark: AxisMark;
  p: number;
  lane: number;
};

type TimelineAxisProps = {
  maxLaneOffsetPx: number;
  centuryBands: CenturyBand[];
  decadeBands: AxisBand[];
  microTicks: AxisMicroTick[];
  marks: AxisMarkPlacement[];
  selection: Selection;
  eventsSorted: TimelineEvent[];
  showYearByTime: Map<number, boolean>;
  trackPct: (timeMs: number) => number;
  onSelectEvent: (event: TimelineEvent) => void;
};

export default function TimelineAxis({
  maxLaneOffsetPx,
  centuryBands,
  decadeBands,
  microTicks,
  marks,
  selection,
  eventsSorted,
  showYearByTime,
  trackPct,
  onSelectEvent,
}: TimelineAxisProps) {
  return (
    <div
      className="axis axis--ticks-single-vline-breakpoint"
      style={
        {
          "--axis-max-lane-offset": `${maxLaneOffsetPx}px`,
        } as CSSProperties
      }
    >
      {centuryBands.length > 0 && (
        <>
          <div className="axis-century-bands" aria-hidden>
            {centuryBands.map(({ key, leftPct, widthPct, stripe }) => (
              <span
                key={`century-${key}`}
                className={
                  stripe === 0
                    ? "axis-century-band axis-century-band--a"
                    : "axis-century-band axis-century-band--b"
                }
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              />
            ))}
          </div>
          <div className="axis-century-labels" aria-hidden>
            {centuryBands.map(({ key, leftPct, widthPct, stripe, centuryLabel }) => (
              <span
                key={`clbl-${key}`}
                className={
                  stripe === 0
                    ? "axis-century-label axis-century-label--a timeline-date"
                    : "axis-century-label axis-century-label--b timeline-date"
                }
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              >
                {centuryLabel}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="axis-decade-bands" aria-hidden>
        {decadeBands.map(({ key, leftPct, widthPct, stripe }) => (
          <span
            key={key}
            className={
              stripe === 0
                ? "axis-decade-band axis-decade-band--a"
                : "axis-decade-band axis-decade-band--b"
            }
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          />
        ))}
      </div>
      <div className="axis-decade-labels" aria-hidden>
        {decadeBands.map(({ key, leftPct, widthPct, stripe, decadeLabel }) => (
          <span
            key={`lbl-${key}`}
            className={
              stripe === 0
                ? "axis-decade-label axis-decade-label--a timeline-date"
                : "axis-decade-label axis-decade-label--b timeline-date"
            }
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          >
            {decadeLabel}
          </span>
        ))}
      </div>
      <div className="axis-micro-ticks" aria-hidden>
        {microTicks.map(({ t, major, isCentury, stripe }) => (
          <span
            key={t}
            className={[
              "axis-micro-tick",
              isCentury ? "axis-micro-tick--century" : (major ? "axis-micro-tick--decade" : ""),
              major && !isCentury
                ? stripe === 0
                  ? "axis-micro-tick--stripe-a"
                  : "axis-micro-tick--stripe-b"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ left: `${trackPct(t)}%` }}
          />
        ))}
      </div>
      {marks.map(({ mark, p, lane }, index) => {
        const isFirst = index === 0;
        const isLast = index === marks.length - 1;
        let edgeClass = "";
        if (isFirst && isLast) {
          if (p <= 6) edgeClass = "tick--start";
          else if (p >= 94) edgeClass = "tick--end";
        } else if (isFirst) {
          edgeClass = "tick--start";
        } else if (isLast) {
          edgeClass = "tick--end";
        }
        const isTickSelected =
          (selection?.kind === "event" &&
            selection.item.date.getTime() === mark.t) ||
          (selection?.kind === "period" &&
            (selection.item.start.getTime() === mark.t ||
              selection.item.end.getTime() === mark.t));
        const tickEvent = eventsSorted.find(
          (event) => event.date.getTime() === mark.t
        );
        return (
          <AxisTickMark
            key={`${mark.t}-${index}`}
            mark={mark}
            p={p}
            edgeClass={edgeClass}
            isTickSelected={isTickSelected}
            tickEvent={tickEvent}
            showYear={showYearByTime.get(mark.t) ?? true}
            ariaLabel={axisTickAriaLabel(mark)}
            singleVerticalLine={true}
            lane={lane}
            laneOffsetPx={axisMarkLaneOffsetPx(lane)}
            onTickClick={tickEvent ? () => onSelectEvent(tickEvent) : undefined}
          />
        );
      })}
    </div>
  );
}
