import type { ChangeEvent } from "react";

type ZoomControlsProps = {
  canGoToPreviousEvent: boolean;
  canGoToNextEvent: boolean;
  zoomSliderValue: number;
  zoomReadout: string;
  onGoToPreviousEvent: () => void;
  onGoToNextEvent: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomSliderChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function ZoomControls({
  canGoToPreviousEvent,
  canGoToNextEvent,
  zoomSliderValue,
  zoomReadout,
  onGoToPreviousEvent,
  onGoToNextEvent,
  onZoomOut,
  onZoomIn,
  onZoomSliderChange,
}: ZoomControlsProps) {
  return (
    <div
      className="timeline-zoom-panel"
      role="group"
      aria-label="Navegación de eventos y magnificación del eje"
    >
      <div
        className="timeline-event-nav"
        role="group"
        aria-label="Navegación entre eventos"
      >
        <button
          type="button"
          className="timeline-event-nav-btn"
          disabled={!canGoToPreviousEvent}
          onClick={onGoToPreviousEvent}
          aria-label="Ir al evento anterior"
          title="Evento anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>
        </button>
        <button
          type="button"
          className="timeline-event-nav-btn"
          disabled={!canGoToNextEvent}
          onClick={onGoToNextEvent}
          aria-label="Ir al evento siguiente"
          title="Evento siguiente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 18l6-6-6-6"
            />
          </svg>
        </button>
      </div>
      <span className="timeline-zoom-sep" aria-hidden="true" />
      <span className="timeline-zoom-icon" aria-hidden>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <button
        type="button"
        className="timeline-zoom-btn"
        onClick={onZoomOut}
        aria-label="Reducir magnificación del eje"
      >
        -
      </button>
      <input
        className="timeline-zoom-slider"
        type="range"
        min={0}
        max={1000}
        step={1}
        value={zoomSliderValue}
        onChange={onZoomSliderChange}
        aria-valuemin={0}
        aria-valuemax={1000}
        aria-valuenow={zoomSliderValue}
        aria-label="Magnificación de la línea de tiempo"
      />
      <button
        type="button"
        className="timeline-zoom-btn"
        onClick={onZoomIn}
        aria-label="Aumentar magnificación del eje"
      >
        +
      </button>
      <span className="timeline-zoom-readout" aria-live="polite">
        {zoomReadout}
      </span>
    </div>
  );
}
