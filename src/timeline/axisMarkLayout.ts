/**
 * Marcas del eje temporal (fechas de períodos + eventos): fusión, deduplicación visual de año
 * y posición en pista. Las etiquetas del eje son siempre verticales (año + mes/día en lectura vertical).
 */
export type AxisMark = { t: number; year: string; monthDay: string };

/** Línea superior del tick del eje (año). */
export function formatAxisYear(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
  });
}

/** Línea inferior: mes abreviado + día. */
export function formatAxisMonthDay(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export function mergeAxisMarks(
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

/**
 * Primera marca de cada año calendario en orden cronológico muestra año;
 * las siguientes con la misma cadena `year` lo omiten.
 */
export function computeAxisShowYearFlags(marks: readonly AxisMark[]): boolean[] {
  return marks.map((m, i) => i === 0 || m.year !== marks[i - 1]!.year);
}

/**
 * Ordena marcas por posición en pista; carril siempre 0 (sin apilado en el eje).
 */
export function assignAxisMarkLanes(
  marks: AxisMark[],
  trackPct: (tMs: number) => number
): { mark: AxisMark; p: number; lane: number }[] {
  return marks
    .map((mark) => ({
      mark,
      p: trackPct(mark.t),
    }))
    .sort((a, b) => a.p - b.p || a.mark.t - b.mark.t)
    .map(({ mark, p }) => ({ mark, p, lane: 0 }));
}

/** Etiqueta accesible con fecha completa (UTC) para ticks del eje. */
export function axisTickAriaLabel(mark: AxisMark): string {
  return new Date(mark.t).toLocaleDateString("es-AR", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
