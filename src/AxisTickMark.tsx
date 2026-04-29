import type { CSSProperties } from "react";
import type { TimelineEvent } from "../types";
import type { AxisMark } from "./timeline/axisMarkLayout";

export type AxisTickMarkProps = {
  mark: AxisMark;
  p: number;
  edgeClass: string;
  isTickSelected: boolean;
  tickEvent: TimelineEvent | undefined;
  showYear: boolean;
  ariaLabel: string;
  lane: number;
  laneOffsetPx: number;
  onTickClick?: () => void;
  /** Un solo trazo vertical (año + mes/día en línea con espacio). */
  singleVerticalLine: boolean;
};

export function AxisTickMark({
  mark,
  p,
  edgeClass,
  isTickSelected,
  tickEvent,
  showYear,
  ariaLabel,
  lane,
  laneOffsetPx,
  onTickClick,
  singleVerticalLine,
}: AxisTickMarkProps) {
  const labelClass =
    `tick-label tick-label--axis${singleVerticalLine ? " tick-label--axis-single-vline" : ""}${showYear ? "" : " tick-label--year-suppressed"}`.trim();

  const rootClass = [
    "tick",
    "tick--axis-mark",
    singleVerticalLine && "tick--axis-mark-single-vline",
    edgeClass,
    isTickSelected && "tick--selected",
    tickEvent && "tick--clickable",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      style={
        {
          left: `${p}%`,
          "--tick-lane": lane,
          "--tick-lane-offset": `${laneOffsetPx}px`,
        } as CSSProperties
      }
      role={tickEvent ? "button" : undefined}
      tabIndex={tickEvent ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={tickEvent ? onTickClick : undefined}
      onKeyDown={
        tickEvent
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTickClick?.();
              }
            }
          : undefined
      }
    >
      <span className="tick-line" aria-hidden />
      <span className={labelClass}>
        {singleVerticalLine ? (
          <span className="tick-label-axis-vline timeline-date">
            {showYear ? (
              <>
                <span className="tick-label-axis-vline-year">{mark.year}</span>
                {" "}
                <span className="tick-label-axis-vline-month">{mark.monthDay}</span>
              </>
            ) : (
              <span className="tick-label-axis-vline-month">{mark.monthDay}</span>
            )}
          </span>
        ) : (
          <>
            {showYear ? (
              <span className="tick-label-axis-year timeline-date">{mark.year}</span>
            ) : null}
            <span className="tick-label-axis-monthday timeline-date">{mark.monthDay}</span>
          </>
        )}
      </span>
    </div>
  );
}
