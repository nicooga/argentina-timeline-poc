import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { StudyMode } from "../causality";
import { lanesInDisplayOrder, LANE_UI } from "../eventLanes";
import type { Period, TimelineEvent, Selection } from "../types";
import { LaneGlyph } from "./LaneGlyph";
import "./ViewerLower.css";

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ViewerLowerProps = {
  periods: Period[];
  events: TimelineEvent[];
  sel: Selection;
  studyMode: StudyMode;
  eventsByTitle: Map<string, TimelineEvent>;
  activePeriodForTimeline: Period | null;
  onSelectPeriod: (p: Period) => void;
  onSelectEvent: (e: TimelineEvent) => void;
};

export function ViewerLower({
  periods,
  events,
  sel,
  studyMode,
  eventsByTitle,
  activePeriodForTimeline,
  onSelectPeriod,
  onSelectEvent,
}: ViewerLowerProps) {
  const periodListSelectedRef = useRef<HTMLButtonElement | null>(null);
  const eventListSelectedRef = useRef<HTMLButtonElement | null>(null);
  const [periodsPanelOpen, setPeriodsPanelOpen] = useState(true);
  const [eventsPanelOpen, setEventsPanelOpen] = useState(true);

  useEffect(() => {
    if (sel == null) return;
    if (sel.kind === "period") setPeriodsPanelOpen(true);
    else setEventsPanelOpen(true);
  }, [sel]);

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
      if (!periodsPanelOpen) return;
      periodListSelectedRef.current?.scrollIntoView(opts);
    } else {
      if (!eventsPanelOpen) return;
      eventListSelectedRef.current?.scrollIntoView(opts);
    }
  }, [sel, periodsPanelOpen, eventsPanelOpen]);

  return (
    <div className="viewer-lower">
      <div className="viewer-lower-col viewer-lower-col--list">
        <section className="legend viewer-lower-legend" aria-label="Listas de períodos y eventos">
          <div className="viewer-lower-legend-section">
            <button
              type="button"
              className="viewer-lower-legend-toggle"
              aria-expanded={periodsPanelOpen}
              aria-controls="viewer-lower-period-list"
              id="viewer-lower-period-heading"
              onClick={() => setPeriodsPanelOpen((o) => !o)}
            >
              <span className="viewer-lower-legend-chevron" aria-hidden>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="viewer-lower-legend-toggle-label">Períodos</span>
            </button>
            <div
              id="viewer-lower-period-list"
              role="region"
              aria-labelledby="viewer-lower-period-heading"
              hidden={!periodsPanelOpen}
              className="viewer-lower-scroll-block"
            >
              <ul className="period-list">
                {periods.map((p) => {
                  const periodExplicit =
                    sel?.kind === "period" && sel.item === p;
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
                          <strong className="timeline-event-title">{p.title}</strong>
                          <span className="period-link__dates timeline-date">
                            {formatDate(p.start)} — {formatDate(p.end)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="viewer-lower-legend-section viewer-lower-legend-section--events">
            <button
              type="button"
              className="viewer-lower-legend-toggle"
              aria-expanded={eventsPanelOpen}
              aria-controls="viewer-lower-event-list"
              id="viewer-lower-events-heading"
              onClick={() => setEventsPanelOpen((o) => !o)}
            >
              <span className="viewer-lower-legend-chevron" aria-hidden>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="viewer-lower-legend-toggle-label">Eventos</span>
            </button>
            <div
              id="viewer-lower-event-list"
              role="region"
              aria-labelledby="viewer-lower-events-heading"
              hidden={!eventsPanelOpen}
              className="viewer-lower-scroll-block"
            >
              <ul className="event-list">
                {events.map((e) => {
                  const eventSelected =
                    sel?.kind === "event" && sel.item === e;
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
                          <strong className="timeline-event-title">{e.title}</strong>
                          <span className="event-link__date timeline-date">
                            {formatDate(e.date)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
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
              <h2 className="detail-title timeline-event-title">{sel.item.title}</h2>
              <p className="detail-meta timeline-date">
                {formatDate(sel.item.start)} — {formatDate(sel.item.end)}
              </p>
              <ul className="detail-items timeline-event-items">
                {sel.item.items.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="detail-title timeline-event-title">{sel.item.title}</h2>
              <div
                className="detail-lane-icons"
                aria-label="Carriles del evento"
              >
                {lanesInDisplayOrder(sel.item.lanes).map((lane) => (
                  <span
                    key={lane}
                    className="detail-lane-icon-wrap"
                    title={LANE_UI[lane].label}
                  >
                    <LaneGlyph
                      lane={lane}
                      size={20}
                      className="detail-lane-icon"
                      style={{ color: LANE_UI[lane].color }}
                    />
                  </span>
                ))}
              </div>
              <p className="detail-meta timeline-date">{formatDate(sel.item.date)}</p>
              {studyMode !== "exam" && sel.item.importance ? (
                <p className="detail-importance muted">
                  Peso:{" "}
                  {sel.item.importance === "primary"
                    ? "central"
                    : sel.item.importance === "secondary"
                      ? "secundario"
                      : "contextual"}
                </p>
              ) : null}
              {studyMode === "exam" ? (
                <p className="detail-exam-hint muted">
                  Modo examen: los puntos detallados están ocultos para practicar
                  recuperación activa. Usá el título y la fecha como ancla.
                </p>
              ) : null}
              {studyMode === "causal" ? (
                <p className="detail-causal-hint muted">
                  Modo causal: en la línea se resaltan cadenas de antecedentes y
                  consecuencias respecto del evento elegido.
                </p>
              ) : null}
              {studyMode !== "exam" ? (
                <ul className="detail-items timeline-event-items">
                  {sel.item.items.map((text, i) => (
                    <li key={i}>{text}</li>
                  ))}
                </ul>
              ) : null}
              {studyMode !== "exam" &&
              (sel.item.causes?.length ?? 0) > 0 ? (
                <section className="detail-causal detail-causal--causes">
                  <h3 className="detail-causal-title">Antecedentes</h3>
                  <ul className="detail-causal-list">
                    {sel.item.causes!.map((title) => {
                      const ev = eventsByTitle.get(title);
                      return (
                        <li key={title}>
                          {ev ? (
                            <button
                              type="button"
                              className="linkish detail-causal-link"
                              onClick={() => onSelectEvent(ev)}
                            >
                              {title}
                            </button>
                          ) : (
                            <span className="muted">{title}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
              {studyMode !== "exam" &&
              (sel.item.consequences?.length ?? 0) > 0 ? (
                <section className="detail-causal detail-causal--effects">
                  <h3 className="detail-causal-title">Consecuencias</h3>
                  <ul className="detail-causal-list">
                    {sel.item.consequences!.map((title) => {
                      const ev = eventsByTitle.get(title);
                      return (
                        <li key={title}>
                          {ev ? (
                            <button
                              type="button"
                              className="linkish detail-causal-link"
                              onClick={() => onSelectEvent(ev)}
                            >
                              {title}
                            </button>
                          ) : (
                            <span className="muted">{title}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
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
