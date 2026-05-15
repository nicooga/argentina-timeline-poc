import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";

type TimelineProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  stackRef: RefObject<HTMLDivElement | null>;
  stackStyle: CSSProperties;
  children: ReactNode;
  controls: ReactNode;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
};

export default function Timeline({
  scrollRef,
  stackRef,
  stackStyle,
  children,
  controls,
  onPointerDown,
  onMouseMove,
  onMouseLeave,
}: TimelineProps) {
  return (
    <section
      className="chart chart-bleed chart--viewer"
      aria-label="Línea de tiempo"
    >
      <div
        ref={scrollRef}
        className="timeline-scroll"
        onPointerDown={onPointerDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div
          ref={stackRef}
          className="timeline-stack timeline-stack--compact timeline-stack--event-labels-vertical"
          style={stackStyle}
        >
          {children}
        </div>
      </div>

      <div className="timeline-chrome timeline-chrome--expanded">
        <div id="timeline-chrome-panel" className="chart-bleed-overlays">
          <div className="timeline-controls-left">
            {controls}
          </div>
        </div>
      </div>
    </section>
  );
}
