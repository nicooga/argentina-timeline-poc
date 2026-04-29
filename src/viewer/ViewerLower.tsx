import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { StudyMode } from "../../causality";
import { lanesInDisplayOrder, LANE_UI } from "../../eventLanes";
import type { Period, Selection, TimelineEvent } from "../../types";
import { LaneGlyph } from "../timeline";
import "./ViewerLower.css";

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ViewerIndexPanelProps = {
  periods: Period[];
  events: TimelineEvent[];
  sel: Selection;
  activePeriodForTimeline: Period | null;
  onSelectPeriod: (p: Period) => void;
  onSelectEvent: (e: TimelineEvent) => void;
  onClose: () => void;
};

type ViewerDetailPanelProps = {
  sel: Selection;
  studyMode: StudyMode;
  eventsByTitle: Map<string, TimelineEvent>;
  activePeriodForTimeline: Period | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectEvent: (e: TimelineEvent) => void;
};

function PanelChrome({
  id,
  title,
  children,
  className = "",
  onClose,
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  return (
    <section id={id} className={`viewer-floating-panel ${className}`.trim()}>
      <div className="viewer-floating-panel__head">
        <h2>{title}</h2>
        {onClose ? (
          <button
            type="button"
            className="viewer-panel-icon-btn"
            onClick={onClose}
            aria-label={`Cerrar ${title.toLowerCase()}`}
            title="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 6 6 18M6 6l12 12"
              />
            </svg>
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ViewerIndexPanel({
  periods,
  events,
  sel,
  activePeriodForTimeline,
  onSelectPeriod,
  onSelectEvent,
  onClose,
}: ViewerIndexPanelProps) {
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
    <PanelChrome
      id="viewer-index-panel"
      title="Índice"
      className="viewer-index-panel"
      onClose={onClose}
    >
      <div className="viewer-index-panel__body">
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
                        <strong className="timeline-event-title">{p.title}</strong>
                        <span className="period-link__dates timeline-date">
                          {formatDate(p.start)} - {formatDate(p.end)}
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
      </div>
    </PanelChrome>
  );
}

function ViewerMediaSlot({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <div className="viewer-media-frame">{children}</div>;
}

export function ViewerDetailPanel({
  sel,
  studyMode,
  eventsByTitle,
  activePeriodForTimeline,
  collapsed,
  onToggleCollapsed,
  onSelectEvent,
}: ViewerDetailPanelProps) {
  const title =
    sel == null
      ? "Sin selección"
      : sel.kind === "period"
        ? sel.item.title
        : sel.item.title;
  const meta =
    sel == null
      ? "Elegí un período o evento"
      : sel.kind === "period"
        ? `${formatDate(sel.item.start)} - ${formatDate(sel.item.end)}`
        : formatDate(sel.item.date);

  return (
    <aside
      id="viewer-detail-panel"
      className={`viewer-detail-panel${collapsed ? " viewer-detail-panel--collapsed" : ""}${
        activePeriodForTimeline ? " viewer-detail-panel--period" : ""
      }`.trim()}
      aria-live="polite"
      style={
        activePeriodForTimeline
          ? ({ "--period-accent": activePeriodForTimeline.color } as CSSProperties)
          : undefined
      }
    >
      <button
        type="button"
        className="viewer-detail-panel__summary"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-controls="viewer-detail-panel-body"
      >
        <span className="viewer-detail-panel__summary-text">
          <strong className="timeline-event-title">{title}</strong>
          <span className="timeline-date">{meta}</span>
        </span>
        <span className="viewer-detail-panel__summary-icon" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d={collapsed ? "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" : "M6 9l6 6 6-6"}
            />
          </svg>
        </span>
      </button>
      {!collapsed ? (
        <div id="viewer-detail-panel-body" className="viewer-detail-panel__body">
          <ViewerMediaSlot />
          {sel == null ? (
            <p className="detail-placeholder">
              Elegí un período en la barra, un evento en la línea o abrí el índice.
            </p>
          ) : sel.kind === "period" ? (
            <>
              <h2 className="detail-title timeline-event-title">{sel.item.title}</h2>
              <p className="detail-meta timeline-date">
                {formatDate(sel.item.start)} - {formatDate(sel.item.end)}
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
              <div className="detail-lane-icons" aria-label="Carriles del evento">
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
              {studyMode !== "exam" && (sel.item.causes?.length ?? 0) > 0 ? (
                <section className="detail-causal detail-causal--causes">
                  <h3 className="detail-causal-title">Antecedentes</h3>
                  <ul className="detail-causal-list">
                    {sel.item.causes!.map((causeTitle) => {
                      const ev = eventsByTitle.get(causeTitle);
                      return (
                        <li key={causeTitle}>
                          {ev ? (
                            <button
                              type="button"
                              className="linkish detail-causal-link"
                              onClick={() => onSelectEvent(ev)}
                            >
                              {causeTitle}
                            </button>
                          ) : (
                            <span className="muted">{causeTitle}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
              {studyMode !== "exam" && (sel.item.consequences?.length ?? 0) > 0 ? (
                <section className="detail-causal detail-causal--effects">
                  <h3 className="detail-causal-title">Consecuencias</h3>
                  <ul className="detail-causal-list">
                    {sel.item.consequences!.map((effectTitle) => {
                      const ev = eventsByTitle.get(effectTitle);
                      return (
                        <li key={effectTitle}>
                          {ev ? (
                            <button
                              type="button"
                              className="linkish detail-causal-link"
                              onClick={() => onSelectEvent(ev)}
                            >
                              {effectTitle}
                            </button>
                          ) : (
                            <span className="muted">{effectTitle}</span>
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
        </div>
      ) : null}
    </aside>
  );
}
