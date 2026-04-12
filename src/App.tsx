import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { timelineHistoriaArgentina } from "../timelineHistoriaArgentina";
import type { Period, TimelineEvent } from "../types";
import "./App.css";

type Selection =
  | { kind: "period"; item: Period }
  | { kind: "event"; item: TimelineEvent }
  | null;

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
  });
}

/** Línea superior del tick del eje (año). */
function formatAxisYear(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
  });
}

/** Línea inferior: mes abreviado + día (ahorra ancho vs. una sola línea larga). */
function formatAxisMonthDay(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

function pct(time: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((time - min) / (max - min)) * 100;
}

/** Texto legible sobre un fondo en hex (#rgb o #rrggbb). */
function foregroundForHex(hex: string): string {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length !== 3 && raw.length !== 6) return "var(--text)";
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return "var(--text)";
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const lin = [r, g, b].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return L > 0.45 ? "#1a1d21" : "#ffffff";
}

/** Contenedor con scroll vertical bajo el foco (p. ej. listas de la leyenda). */
function findVerticalScrollContainer(el: HTMLElement | null): HTMLElement | null {
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const st = window.getComputedStyle(n);
    const oy = st.overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      n.scrollHeight > n.clientHeight + 2
    ) {
      return n;
    }
  }
  return null;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** Debe coincidir con altura de `.row-bar` y `margin-bottom` de `.period-row` en App.css */
const ROW_BAR_REM = 2.25;
const ROW_MARGIN_REM = 0.1;

function periodRowCenterFromTopRem(rowIndex: number): number {
  return rowIndex * (ROW_BAR_REM + ROW_MARGIN_REM) + ROW_BAR_REM / 2;
}

/** Asigna carril por período: mismo carril si no se solapan en el tiempo (orden por inicio). */
function assignPeriodLanes(periods: Period[]): {
  laneByIndex: number[];
  laneCount: number;
} {
  const n = periods.length;
  if (n === 0) return { laneByIndex: [], laneCount: 0 };

  const order = periods
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        a.p.start.getTime() - b.p.start.getTime() ||
        a.p.end.getTime() - b.p.end.getTime()
    );

  const laneByIndex = new Array<number>(n);
  const laneEndMs: number[] = [];

  for (const { p, i } of order) {
    const start = p.start.getTime();
    const end = p.end.getTime();
    let lane = -1;
    for (let L = 0; L < laneEndMs.length; L++) {
      if (laneEndMs[L] <= start) {
        lane = L;
        laneEndMs[L] = end;
        break;
      }
    }
    if (lane < 0) {
      lane = laneEndMs.length;
      laneEndMs.push(end);
    }
    laneByIndex[i] = lane;
  }

  return { laneByIndex, laneCount: laneEndMs.length };
}

type AxisMark = { t: number; year: string; monthDay: string };

function mergeAxisMarks(
  periods: { start: Date; end: Date }[],
  events: { date: Date }[]
): AxisMark[] {
  const raw: AxisMark[] = [];
  for (const p of periods) {
    raw.push({
      t: p.start.getTime(),
      year: formatAxisYear(p.start),
      monthDay: formatAxisMonthDay(p.start),
    });
    raw.push({
      t: p.end.getTime(),
      year: formatAxisYear(p.end),
      monthDay: formatAxisMonthDay(p.end),
    });
  }
  for (const e of events) {
    raw.push({
      t: e.date.getTime(),
      year: formatAxisYear(e.date),
      monthDay: formatAxisMonthDay(e.date),
    });
  }
  raw.sort((a, b) => a.t - b.t);
  const out: AxisMark[] = [];
  for (const item of raw) {
    const prev = out[out.length - 1];
    if (prev && prev.t === item.t) {
      if (prev.year !== item.year) {
        prev.year = `${prev.year} · ${item.year}`;
      }
      if (prev.monthDay !== item.monthDay) {
        prev.monthDay = `${prev.monthDay} · ${item.monthDay}`;
      }
    } else {
      out.push({ ...item });
    }
  }
  return out;
}

/** Separación mínima entre centros de etiquetas (% del ancho de la pista) para compartir la misma fila. */
const AXIS_LABEL_MIN_GAP_PCT = 3.1;

/**
 * Cuando muchas fechas caen cerca en el eje, reparte etiquetas en filas verticales
 * (lane 0 pegada al trazo, lane 1 más abajo, etc.).
 */
function assignAxisMarkLanes(
  marks: AxisMark[],
  min: number,
  max: number
): { mark: AxisMark; p: number; lane: number }[] {
  const sorted = [...marks].sort(
    (a, b) => pct(a.t, min, max) - pct(b.t, min, max)
  );
  const lastCenterInLane: number[] = [];

  return sorted.map((mark) => {
    const p = pct(mark.t, min, max);
    let lane = 0;
    for (;; lane++) {
      if (lane >= lastCenterInLane.length) {
        lastCenterInLane.push(p);
        return { mark, p, lane };
      }
      if (p - lastCenterInLane[lane] >= AXIS_LABEL_MIN_GAP_PCT) {
        lastCenterInLane[lane] = p;
        return { mark, p, lane };
      }
    }
  });
}

export default function App() {
  const { periods, events } = timelineHistoriaArgentina;

  const { min, max } = useMemo(() => {
    const times: number[] = [];
    for (const p of periods) {
      times.push(p.start.getTime(), p.end.getTime());
    }
    for (const e of events) {
      times.push(e.date.getTime());
    }
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [periods, events]);

  const eventsSorted = useMemo(
    () => [...events].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events]
  );

  const axisMarks = useMemo(
    () => mergeAxisMarks(periods, events),
    [periods, events]
  );

  const axisMarksPlaced = useMemo(
    () => assignAxisMarkLanes(axisMarks, min, max),
    [axisMarks, min, max]
  );

  const axisMaxLane = useMemo(
    () =>
      axisMarksPlaced.reduce((m, x) => Math.max(m, x.lane), 0),
    [axisMarksPlaced]
  );

  const { laneByIndex, periodIndicesByLane } = useMemo(() => {
    const { laneByIndex: lanes, laneCount } = assignPeriodLanes(periods);
    const periodIndicesByLane: number[][] = Array.from(
      { length: laneCount },
      () => []
    );
    for (let i = 0; i < periods.length; i++) {
      periodIndicesByLane[lanes[i]].push(i);
    }
    return { laneByIndex: lanes, periodIndicesByLane };
  }, [periods]);

  const [sel, setSel] = useState<Selection>(null);

  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const onTimelinePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const el = timelineScrollRef.current;
      if (!el) return;

      const startX = e.clientX;
      const startScrollLeft = el.scrollLeft;
      let dragging = false;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        if (!dragging && Math.abs(dx) > 6) {
          dragging = true;
          el.classList.add("timeline-scroll--dragging");
        }
        if (dragging) {
          el.scrollLeft = startScrollLeft - dx;
          ev.preventDefault();
        }
      };

      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        el.classList.remove("timeline-scroll--dragging");
        if (dragging) {
          const blockClick = (ce: MouseEvent) => {
            ce.preventDefault();
            ce.stopPropagation();
            document.removeEventListener("click", blockClick, true);
          };
          document.addEventListener("click", blockClick, true);
        }
      };

      document.addEventListener("pointermove", onMove, { passive: false });
      document.addEventListener("pointerup", onUp);
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key;
      const ch = key.length === 1 ? key.toLowerCase() : "";
      const scrollEl = timelineScrollRef.current;

      const stepX = () =>
        scrollEl
          ? Math.max(48, Math.floor(scrollEl.clientWidth * 0.12))
          : 0;

      const stepYFor = (container: HTMLElement | null) => {
        if (container) {
          return Math.max(40, Math.floor(container.clientHeight * 0.18));
        }
        return Math.max(48, Math.floor(window.innerHeight * 0.12));
      };

      const goLeft = ch === "a" || ch === "h" || key === "ArrowLeft";
      const goRight = ch === "d" || ch === "l" || key === "ArrowRight";
      const goUp =
        ch === "w" || ch === "k" || key === "ArrowUp";
      const goDown =
        ch === "s" || ch === "j" || key === "ArrowDown";

      if (goLeft) {
        if (!scrollEl) return;
        scrollEl.scrollLeft -= stepX();
        e.preventDefault();
        return;
      }
      if (goRight) {
        if (!scrollEl) return;
        scrollEl.scrollLeft += stepX();
        e.preventDefault();
        return;
      }
      if (goUp || goDown) {
        const dir = goUp ? -1 : 1;
        const inner =
          e.target instanceof HTMLElement
            ? findVerticalScrollContainer(e.target)
            : null;
        const step = stepYFor(inner);
        if (inner) {
          inner.scrollTop += dir * step;
        } else {
          window.scrollBy({ top: dir * step, left: 0, behavior: "auto" });
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="app">
      <div className="app-header-inner">
        <header className="header">
          <h1 className="title">
            Linea de tiempo de la Historia Argentina
            <div className="subtitle">desde {formatShortDate(new Date(min))} hasta {formatShortDate(new Date(max))}</div>
          </h1>
        </header>
      </div>

      <section className="chart chart-bleed" aria-label="Línea de tiempo">
        <div
          ref={timelineScrollRef}
          className="timeline-scroll"
          onPointerDown={onTimelinePointerDown}
        >
          <div className="timeline-stack">
            <div
              className="axis"
              style={
                {
                  "--axis-max-lane": axisMaxLane,
                } as CSSProperties
              }
            >
              {axisMarksPlaced.map(({ mark, p, lane }, i) => {
                const isFirst = i === 0;
                const isLast = i === axisMarksPlaced.length - 1;
                let edgeClass = "";
                if (isFirst && isLast) {
                  if (p <= 6) edgeClass = "tick--start";
                  else if (p >= 94) edgeClass = "tick--end";
                } else if (isFirst) {
                  edgeClass = "tick--start";
                } else if (isLast) {
                  edgeClass = "tick--end";
                }
                return (
                  <div
                    key={`${mark.t}-${i}`}
                    className={`tick tick--axis-mark ${edgeClass}`.trim()}
                    style={
                      {
                        left: `${p}%`,
                        "--tick-lane": lane,
                      } as CSSProperties
                    }
                  >
                    <span className="tick-line" />
                    <span className="tick-label">
                      <span className="tick-label-year">{mark.year}</span>
                      <span className="tick-label-monthday">{mark.monthDay}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="track-wrap">
              <div className="track-bg" />
              <div className="period-connectors" aria-hidden>
                {periods.flatMap((p, i) => {
                  const centerRem = periodRowCenterFromTopRem(laneByIndex[i]);
                  const h = `calc(var(--timeline-axis-gap) + ${centerRem}rem)`;
                  const startLeft = pct(p.start.getTime(), min, max);
                  const endLeft = pct(p.end.getTime(), min, max);
                  return [
                    <div
                      key={`${p.title}-start-conn`}
                      className="period-connector"
                      style={{
                        left: `${startLeft}%`,
                        height: h,
                        borderLeftColor: p.color,
                      }}
                    />,
                    <div
                      key={`${p.title}-end-conn`}
                      className="period-connector"
                      style={{
                        left: `${endLeft}%`,
                        height: h,
                        borderLeftColor: p.color,
                      }}
                    />,
                  ];
                })}
              </div>
              <div className="event-connectors" aria-hidden>
                {eventsSorted.map((ev) => (
                  <div
                    key={`conn-${ev.title + ev.date.toISOString()}`}
                    className="event-connector"
                    style={{ left: `${pct(ev.date.getTime(), min, max)}%` }}
                  />
                ))}
              </div>
              {periodIndicesByLane.map((indices, lane) => (
                <div key={`lane-${lane}`} className="period-row">
                  <div className="row-bar">
                    {indices.map((i) => {
                      const p = periods[i];
                      const left = pct(p.start.getTime(), min, max);
                      const width = Math.max(
                        pct(p.end.getTime(), min, max) - left,
                        0.8
                      );
                      const isActive = sel?.kind === "period" && sel.item === p;
                      return (
                        <button
                          key={p.title}
                          type="button"
                          className={`bar ${isActive ? "active" : ""}`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            backgroundColor: p.color,
                            color: foregroundForHex(p.color),
                            boxShadow: isActive
                              ? `0 0 0 2px ${p.color}`
                              : undefined,
                          }}
                          onClick={() => setSel({ kind: "period", item: p })}
                          title={`${formatDate(p.start)} — ${formatDate(p.end)}`}
                        >
                          <span className="bar-text">{p.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="events-row">
                <div
                  className="row-bar"
                  role="group"
                  aria-label="Eventos en la línea temporal"
                >
                  {events.map((e) => (
                    <button
                      key={e.title + e.date.toISOString()}
                      type="button"
                      className={`event-dot ${sel?.kind === "event" && sel.item === e ? "active" : ""}`}
                      style={{ left: `${pct(e.date.getTime(), min, max)}%` }}
                      onClick={() => setSel({ kind: "event", item: e })}
                      title={e.title}
                      aria-label={e.title}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="app-lower">
        <section className="legend">
          <h2 className="legend-title">Períodos</h2>
          <ul className="period-list">
            {periods.map((p) => (
              <li key={p.title}>
                <button
                  type="button"
                  className="linkish period-link"
                  onClick={() => setSel({ kind: "period", item: p })}
                >
                  <span
                    className="period-swatch"
                    style={{ backgroundColor: p.color }}
                    aria-hidden
                  />
                  <span>
                    <strong>{p.title}</strong>
                    <span className="muted">
                      {" "}
                      · {formatDate(p.start)} — {formatDate(p.end)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <h2 className="legend-title legend-title--second">Eventos</h2>
          <ul className="event-list">
            {events.map((e) => (
              <li key={e.title + e.date.toISOString()}>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setSel({ kind: "event", item: e })}
                >
                  <strong>{e.title}</strong>
                  <span className="muted"> · {formatDate(e.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside
          className="detail"
          aria-live="polite"
          style={
            sel?.kind === "period"
              ? { boxShadow: `inset 4px 0 0 0 ${sel.item.color}` }
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
              <pre className="detail-body">{sel.item.description.trim()}</pre>
            </>
          ) : (
            <>
              <h2 className="detail-title">{sel.item.title}</h2>
              <p className="detail-meta">{formatDate(sel.item.date)}</p>
              <pre className="detail-body">{sel.item.description.trim()}</pre>
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
