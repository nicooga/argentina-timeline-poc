import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from "react";
import type { Period, TimelineEvent, Selection } from "../types";
import "./ViewerLower.css";

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type EventNav = {
  onStep: (delta: -1 | 1) => void;
  canPrev: boolean;
  canNext: boolean;
};

type ViewerLowerProps = {
  periods: Period[];
  events: TimelineEvent[];
  sel: Selection;
  activePeriodForTimeline: Period | null;
  eventNav: EventNav | null;
  onSelectPeriod: (p: Period) => void;
  onSelectEvent: (e: TimelineEvent) => void;
};

export function ViewerLower({
  periods,
  events,
  sel,
  activePeriodForTimeline,
  eventNav,
  onSelectPeriod,
  onSelectEvent,
}: ViewerLowerProps) {
  const periodListSelectedRef = useRef<HTMLButtonElement | null>(null);
  const eventListSelectedRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (sel == null) return;
    const smoothScroll =
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts: ScrollIntoViewOptions = {
      behavior: smoothScroll ? "smooth" : "auto",
      block: "center",
      inline: "nearest",
    };
    if (sel.kind === "period") {
      periodListSelectedRef.current?.scrollIntoView(opts);
    } else {
      eventListSelectedRef.current?.scrollIntoView(opts);
    }
  }, [sel]);

  return (
    <div className="viewer-lower">
      <div className="viewer-lower-col viewer-lower-col--list">
        <section className="legend viewer-lower-legend" aria-label="Listas de períodos y eventos">
          <h2 className="legend-title">Períodos</h2>
          <div className="viewer-lower-scroll-block">
            <ul className="period-list">
              {periods.map((p) => {
                const periodExplicit = sel?.kind === "period" && sel.item === p;
                const periodHighlighted = activePeriodForTimeline === p;
                return (
                <li key={p.title}>
                  <button
                    type="button"
                    className={`linkish period-link${periodHighlighted ? " linkish--selected" : ""}`}
                    aria-current={periodExplicit ? "true" : undefined}
                    style={
                      periodHighlighted
                        ? ({ "--sel-accent": p.color } as CSSProperties)
                        : undefined
                    }
                    ref={(el) => {
                      if (periodExplicit) {
                        periodListSelectedRef.current = el;
                      } else if (periodListSelectedRef.current === el) {
                        periodListSelectedRef.current = null;
                      }
                    }}
                    onClick={() => onSelectPeriod(p)}
                  >
                    <span
                      className="period-swatch"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    />
                    <span className="period-link__text">
                      <strong>{p.title}</strong>
                      <span className="muted period-link__dates">
                        {formatDate(p.start)} — {formatDate(p.end)}
                      </span>
                    </span>
                  </button>
                </li>
                );
              })}
            </ul>
          </div>
          <h2 className="legend-title legend-title--second">Eventos</h2>
          <div className="viewer-lower-scroll-block">
            <ul className="event-list">
              {events.map((e) => {
                const eventSelected = sel?.kind === "event" && sel.item === e;
                return (
                <li key={e.title + e.date.toISOString()}>
                  <button
                    type="button"
                    className={`linkish${eventSelected ? " linkish--selected" : ""}`}
                    aria-current={eventSelected ? "true" : undefined}
                    ref={(el) => {
                      if (eventSelected) {
                        eventListSelectedRef.current = el;
                      } else if (eventListSelectedRef.current === el) {
                        eventListSelectedRef.current = null;
                      }
                    }}
                    onClick={() => onSelectEvent(e)}
                  >
                    <span className="event-link__text">
                      <strong>{e.title}</strong>
                      <span className="muted event-link__date">
                        {formatDate(e.date)}
                      </span>
                    </span>
                  </button>
                </li>
              );
              })}
            </ul>
          </div>
        </section>
      </div>
      <div className="viewer-lower-col viewer-lower-col--detail">
        <aside
          className={`detail viewer-lower-detail${
            activePeriodForTimeline ? " viewer-lower-detail--period" : ""
          }`.trim()}
          aria-live="polite"
          style={
            activePeriodForTimeline
              ? ({ "--period-accent": activePeriodForTimeline.color } as CSSProperties)
              : undefined
          }
        >
          {sel == null ? (
            <p className="detail-placeholder">
              Elegí un período en la barra o un evento en la lista o en la línea.
            </p>
          ) : sel.kind === "period" ? (
            <>
              <h2 className="detail-title">{sel.item.title}</h2>
              <p className="detail-meta">
                {formatDate(sel.item.start)} — {formatDate(sel.item.end)}
              </p>
              <ul className="detail-items">
                {sel.item.items.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              {eventNav ? (
                <div
                  className="event-nav"
                  role="group"
                  aria-label="Navegación entre eventos"
                >
                  <button
                    type="button"
                    className="event-nav-btn"
                    disabled={!eventNav.canPrev}
                    onClick={() => eventNav.onStep(-1)}
                    aria-label="Ir al evento anterior"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="event-nav-btn"
                    disabled={!eventNav.canNext}
                    onClick={() => eventNav.onStep(1)}
                    aria-label="Ir al evento siguiente"
                  >
                    Siguiente
                  </button>
                </div>
              ) : null}
              <h2 className="detail-title">{sel.item.title}</h2>
              <p className="detail-meta">{formatDate(sel.item.date)}</p>
              <ul className="detail-items">
                {sel.item.items.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
              {sel.item.links?.length ? (
                <ul className="links">
                  {sel.item.links.map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        {url.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
