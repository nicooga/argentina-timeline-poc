import { useMemo, useState } from "react";
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

function pct(time: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((time - min) / (max - min)) * 100;
}

function yearTicks(min: number, max: number): number[] {
  const y0 = new Date(min).getUTCFullYear();
  const y1 = new Date(max).getUTCFullYear();
  const step = y1 - y0 > 80 ? 20 : 10;
  const start = Math.floor(y0 / step) * step;
  const out: number[] = [];
  for (let y = start; y <= y1 + step; y += step) {
    const t = Date.UTC(y, 0, 1, 12, 0, 0);
    if (t >= min && t <= max) out.push(t);
  }
  if (out.length < 2) {
    return [min, max];
  }
  return out;
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

  const ticks = useMemo(() => yearTicks(min, max), [min, max]);
  const [sel, setSel] = useState<Selection>(null);

  return (
    <div className="app">
      <div className="app-header-inner">
        <header className="header">
          <h1 className="title">Historia Argentina</h1>
          <p className="subtitle">
            POC de línea de tiempo — datos desde{" "}
            <code>timelineHistoriaArgentina.ts</code>
          </p>
        </header>
      </div>

      <section className="chart chart-bleed" aria-label="Línea de tiempo">
        <div className="axis">
          {ticks.map((t, i) => {
            const isFirst = i === 0;
            const isLast = i === ticks.length - 1;
            const p = pct(t, min, max);
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
                key={t}
                className={`tick ${edgeClass}`.trim()}
                style={{ left: `${p}%` }}
              >
                <span className="tick-line" />
                <span className="tick-label">
                  {new Date(t).getUTCFullYear()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="track-wrap">
          <div className="track-bg" />
          {periods.map((p, i) => {
            const left = pct(p.start.getTime(), min, max);
            const width = Math.max(
              pct(p.end.getTime(), min, max) - left,
              0.8
            );
            const hue = i % 2 === 0 ? "period-a" : "period-b";
            return (
              <div key={p.title} className="period-row">
                <div className="row-bar">
                  <button
                    type="button"
                    className={`bar ${hue} ${sel?.kind === "period" && sel.item === p ? "active" : ""}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onClick={() => setSel({ kind: "period", item: p })}
                    title={`${formatDate(p.start)} — ${formatDate(p.end)}`}
                  >
                    <span className="bar-text">{p.title}</span>
                  </button>
                </div>
              </div>
            );
          })}

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
      </section>

      <div className="app-lower">
        <section className="legend">
          <h2 className="legend-title">Eventos (puntos)</h2>
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

        <aside className="detail" aria-live="polite">
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
