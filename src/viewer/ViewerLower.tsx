import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import type { StudyMode } from "../../causality";
import { lanesInDisplayOrder, LANE_UI } from "../../eventLanes";
import type { Period, Selection, TimelineEvent } from "../../types";
import type { TimelineEventDraft } from "../timelineEdition";
import { formatHistoricalDate, LaneGlyph } from "../timeline";
import "./ViewerLower.css";

function formatDate(d: Date): string {
  return formatHistoricalDate(d);
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
  eventsById: Map<string, TimelineEvent>;
  activePeriodForTimeline: Period | null;
  periodsForEvent: Period[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectEvent: (e: TimelineEvent) => void;
  onEditEvent: (e: TimelineEvent) => void;
  onDeleteEvent: (e: TimelineEvent) => void;
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
  const [activeTab, setActiveTab] = useState<"periods" | "events">(() =>
    sel?.kind === "period" ? "periods" : "events"
  );

  useEffect(() => {
    if (sel == null) return;
    setActiveTab(sel.kind === "period" ? "periods" : "events");
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
    if (sel.kind === "period" && activeTab === "periods") {
      periodListSelectedRef.current?.scrollIntoView(opts);
    } else if (sel.kind === "event" && activeTab === "events") {
      eventListSelectedRef.current?.scrollIntoView(opts);
    }
  }, [sel, activeTab]);

  return (
    <PanelChrome
      id="viewer-index-panel"
      title="Índice"
      className="viewer-index-panel"
      onClose={onClose}
    >
      <div className="viewer-index-panel__body">
        <div
          className="viewer-index-tabs"
          role="tablist"
          aria-label="Tipo de índice"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "periods"}
            aria-controls="viewer-lower-period-list"
            className="viewer-index-tab"
            onClick={() => setActiveTab("periods")}
          >
            Períodos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "events"}
            aria-controls="viewer-lower-event-list"
            className="viewer-index-tab"
            onClick={() => setActiveTab("events")}
          >
            Eventos
          </button>
        </div>
        <div className="viewer-index-list-viewport">
          {activeTab === "periods" ? (
            <div
              id="viewer-lower-period-list"
              role="tabpanel"
              className="viewer-index-scroll-block"
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
          ) : (
            <div
              id="viewer-lower-event-list"
              role="tabpanel"
              className="viewer-index-scroll-block"
            >
              <ul className="event-list">
                {events.map((e) => {
                  const eventSelected = sel?.kind === "event" && sel.item.id === e.id;
                  return (
                    <li key={e.id}>
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
          )}
        </div>
      </div>
    </PanelChrome>
  );
}

function ViewerMediaSlot({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <div className="viewer-media-frame">{children}</div>;
}

function dateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateFromInput(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

function linesFrom(values: readonly string[] | undefined): string {
  return (values ?? []).join("\n");
}

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type EventEditorModalProps = {
  mode: "create" | "edit";
  event?: TimelineEvent;
  events: TimelineEvent[];
  onClose: () => void;
  onSave: (draft: TimelineEventDraft) => Promise<void>;
};

export function EventEditorModal({
  mode,
  event,
  events,
  onClose,
  onSave,
}: EventEditorModalProps) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(dateInputValue(event?.date ?? new Date()));
  const [summary, setSummary] = useState(event?.summary ?? "");
  const [items, setItems] = useState(linesFrom(event?.items ?? [""]));
  const [links, setLinks] = useState(linesFrom(event?.links));
  const [lanes, setLanes] = useState<TimelineEvent["lanes"]>(
    event?.lanes ?? ["politico"]
  );
  const [importance, setImportance] = useState<TimelineEvent["importance"] | "">(
    event?.importance ?? ""
  );
  const [causes, setCauses] = useState<string[]>(event?.causes ?? []);
  const [consequences, setConsequences] = useState<string[]>(
    event?.consequences ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const relatedEvents = events.filter((e) => e.id !== event?.id);

  const toggleLane = (lane: TimelineEvent["lanes"][number]) => {
    setLanes((current) => {
      if (current.includes(lane)) {
        const next = current.filter((id) => id !== lane);
        return next.length ? next : current;
      }
      return [...current, lane];
    });
  };

  const selectedOptions = (select: HTMLSelectElement): string[] =>
    Array.from(select.selectedOptions).map((option) => option.value);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title,
        date: dateFromInput(date),
        summary,
        items: linesToList(items),
        lanes,
        links: linesToList(links),
        causes,
        consequences,
        importance: importance || undefined,
      });
    } catch (err) {
      const validationErrors = (err as { validationErrors?: Array<{ message: string }> })
        .validationErrors;
      setError(
        validationErrors?.map((v) => v.message).join(" ") ??
        "No se pudo guardar el evento."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="event-editor-root" role="presentation">
      <form className="event-editor-dialog" onSubmit={submit}>
        <div className="event-editor-header">
          <h2>{mode === "create" ? "Crear evento" : "Editar evento"}</h2>
          <button type="button" className="viewer-panel-icon-btn" onClick={onClose}>
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="event-editor-body">
          <label className="event-editor-field">
            <span>Título</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="event-editor-field">
            <span>Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="event-editor-field event-editor-field--wide">
            <span>Resumen</span>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </label>
          <fieldset className="event-editor-field event-editor-field--wide">
            <legend>Carriles</legend>
            <div className="event-editor-lanes">
              {Object.entries(LANE_UI).map(([lane, ui]) => (
                <label key={lane} style={{ color: ui.color }}>
                  <input
                    type="checkbox"
                    checked={lanes.includes(lane as TimelineEvent["lanes"][number])}
                    onChange={() => toggleLane(lane as TimelineEvent["lanes"][number])}
                  />
                  <span>{ui.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="event-editor-field">
            <span>Importancia</span>
            <select
              value={importance}
              onChange={(e) =>
                setImportance(e.target.value as TimelineEvent["importance"] | "")
              }
            >
              <option value="">Sin peso</option>
              <option value="primary">Central</option>
              <option value="secondary">Secundario</option>
              <option value="contextual">Contextual</option>
            </select>
          </label>
          <label className="event-editor-field event-editor-field--wide">
            <span>Puntos</span>
            <textarea
              rows={5}
              value={items}
              onChange={(e) => setItems(e.target.value)}
            />
          </label>
          <label className="event-editor-field event-editor-field--wide">
            <span>Links</span>
            <textarea
              rows={3}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />
          </label>
          <label className="event-editor-field">
            <span>Antecedentes</span>
            <select
              multiple
              value={causes}
              onChange={(e) => setCauses(selectedOptions(e.currentTarget))}
            >
              {relatedEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <label className="event-editor-field">
            <span>Consecuencias</span>
            <select
              multiple
              value={consequences}
              onChange={(e) => setConsequences(selectedOptions(e.currentTarget))}
            >
              {relatedEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="event-editor-error">{error}</p> : null}
        </div>
        <div className="event-editor-footer">
          <button type="button" className="viewer-editor-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="viewer-editor-btn" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ViewerDetailPanel({
  sel,
  studyMode,
  eventsById,
  activePeriodForTimeline,
  periodsForEvent,
  collapsed,
  onToggleCollapsed,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
}: ViewerDetailPanelProps) {
  const isDesktop =
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 70rem)").matches;

  const title =
    sel == null ? "Sin selección" : sel.item.title;
  const meta =
    sel == null
      ? "Elegí un período o evento"
      : sel.kind === "period"
        ? `${formatDate(sel.item.start)} – ${formatDate(sel.item.end)}`
        : formatDate(sel.item.date);
  const kindLabel =
    sel == null ? null : sel.kind === "period" ? "Período" : "Evento";

  return (
    <aside
      id="viewer-detail-panel"
      className={`viewer-detail-panel${collapsed ? " viewer-detail-panel--collapsed" : ""}${activePeriodForTimeline ? " viewer-detail-panel--period" : ""
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
          {kindLabel && (
            <span className="viewer-detail-panel__summary-kind">{kindLabel}</span>
          )}
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
            <ul className="detail-items timeline-event-items">
              {sel.item.items.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="viewer-detail-actions">
                  <button
                    type="button"
                    className="viewer-editor-btn"
                    onClick={() => onEditEvent(sel.item)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="viewer-editor-btn viewer-editor-btn--danger"
                    onClick={() => onDeleteEvent(sel.item)}
                  >
                    Eliminar
                  </button>
                </div>
                <div className="detail-lane-icons" aria-label="Carriles del evento">
                  {lanesInDisplayOrder(sel.item.lanes).map((lane) => (
                    <span
                      key={lane}
                      className="detail-lane-icon-wrap"
                      title={LANE_UI[lane].label}
                      style={
                        {
                          "--lane-color": LANE_UI[lane].color,
                        } as CSSProperties
                      }
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
              </div>
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
                    {sel.item.causes!.map((causeId) => {
                      const ev = eventsById.get(causeId);
                      return (
                        <li key={causeId}>
                          {ev ? (
                            <button
                              type="button"
                              className="linkish detail-causal-link"
                              onClick={() => onSelectEvent(ev)}
                            >
                              {ev.title}
                            </button>
                          ) : (
                            <span className="muted">{causeId}</span>
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
                    {sel.item.consequences!.map((effectId) => {
                      const ev = eventsById.get(effectId);
                      return (
                        <li key={effectId}>
                          {ev ? (
                            <button
                              type="button"
                              className="linkish detail-causal-link"
                              onClick={() => onSelectEvent(ev)}
                            >
                              {ev.title}
                            </button>
                          ) : (
                            <span className="muted">{effectId}</span>
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
              {periodsForEvent.length > 0 && (
                <section className="detail-period-context">
                  <p className="detail-section-label">
                    {periodsForEvent.length === 1 ? "Período" : "Períodos"}
                  </p>
                  {periodsForEvent.map((p) => (
                    <details
                      key={sel.item.id + p.title}
                      open={isDesktop || periodsForEvent.length === 1}
                      className="detail-period-item"
                    >
                      <summary className="detail-period-summary">
                        <span className="timeline-event-title">{p.title}</span>
                        <span className="timeline-date">
                          {formatDate(p.start)} – {formatDate(p.end)}
                        </span>
                      </summary>
                      <ul className="detail-items timeline-event-items">
                        {p.items.map((text, i) => (
                          <li key={i}>{text}</li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      ) : null}
    </aside>
  );
}
