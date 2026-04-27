import type { TimelineEvent } from "../../types";

/** Alineada con `font-size: 0.68rem` de `.event-label-h` y `1.02em` en `.event-label-vrot-wrap`. */
const EVENT_LABEL_VROT_LABEL_FONT_EM = 0.68;

export type EventLabelAnchor = "start" | "center" | "end";

export type EventLabelPlacement = {
  lane: number;
  anchor: EventLabelAnchor;
  /**
   * Modo horizontal: `max-width` CSS del título.
   * Modo vertical (eje de lectura tras 90°): límite en px = longitud de línea medida; ver
   * `readLengthPx` eje semántico y `columnPx` para el grosor en pista.
   */
  maxWidthPx: number;
  /**
   * Modo vertical: grosor de la “columna” en píxeles (eje X en pantalla, ortogonal a la lectura).
   * Alinea con `verticalColumnWidthPx` y con el ancho de `.event-label-vrot-wrap`. No se usa en
   * horizontal.
   */
  columnPx?: number;
};

/** 1rem del root (visión del layout, compact viewer). */
export function readRootRemPx(fallbackRemPx = 16): number {
  if (typeof document === "undefined") {
    return fallbackRemPx;
  }
  const n = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(n) && n > 0 ? n : fallbackRemPx;
}

/**
 * Grosor en pista (eje X) de la caja de etiqueta vertical, coherente con
 * [`App.css`](../App.css) (`.event-label-vrot-wrap` / coarse touch).
 */
export function verticalColumnWidthPx(
  pointerCoarse: boolean,
  remPx: number
): number {
  if (pointerCoarse) {
    return Math.max(0.85 * remPx, 44);
  }
  return Math.max(0.78 * remPx, 1.02 * EVENT_LABEL_VROT_LABEL_FONT_EM * remPx);
}

/**
 * Altura (eje de lectura en pantalla) reservada para el título + padding unificado del wrap.
 * `readLengthPx` = `maxWidthPx` en vertical (medida canvas del texto en una línea).
 */
export function verticalReadSlotHeightPx(readLengthPx: number): number {
  return readLengthPx + EVENT_TITLE_VROT_WRAP_PAD_PX;
}

let eventLabelMeasureCtx: CanvasRenderingContext2D | null = null;

export function measureEventTitleWidthsPx(
  titles: string[],
  compact: boolean,
  pointerCoarse: boolean
): number[] {
  const fontPx = compact ? 10 : pointerCoarse ? 12.5 : 12;
  const font = `600 ${fontPx}px "Source Sans 3",system-ui,sans-serif`;
  const pad = 10;
  if (typeof document === "undefined") {
    return titles.map((t) => Math.min(t.length * fontPx * 0.52 + pad, 280));
  }
  if (!eventLabelMeasureCtx) {
    const c = document.createElement("canvas");
    eventLabelMeasureCtx = c.getContext("2d");
  }
  const ctx = eventLabelMeasureCtx;
  if (!ctx) {
    return titles.map((t) => Math.min(t.length * fontPx * 0.52 + pad, 280));
  }
  ctx.font = font;
  return titles.map((t) => Math.min(ctx.measureText(t).width + pad, 320));
}

/** Comparación de intervalos en % de pista (eje y títulos de eventos). */
export function labelIntervalsOverlap(
  a: readonly [number, number],
  b: readonly [number, number],
  gapPct: number
): boolean {
  return a[0] < b[1] + gapPct && a[1] > b[0] - gapPct;
}

/** Igual que el `+ 24` de [`EventTitleMarker`](../EventTitleMarker.tsx) en el wrap vertical. */
export const EVENT_TITLE_VROT_WRAP_PAD_PX = 24;

const EVENT_DOT_PX = 14;

export type VerticalEventTitlesRowLayoutPx = {
  /**
   * Histórico: relleno superior en px para `--v-pad`. Queda **0**: el cálculo previo era
   * proporcional al ancho medido del título más largo (≈ mitad del “hit block”), lo que creaba un
   * hueco enorme sobre los discos. El alto de fila viene de `sizerContentMinPx`, no de padding-top.
   */
  vPadPx: number;
  /**
   * Altura mínima del sizer in-flow (`.events-titles-lane__vertical-inflow-sizer`): los
   * `.event-marker` son abspos 0×0 y **no** inflan el grid; hace falta cuerpo bajo el padding.
   */
  sizerContentMinPx: number;
  /** 1 rem en px (layout compact acostumbra 16 en desktop). */
  remPx: number;
  /**
   * Inset inferior (px) de `.event-connector` bajo fila alta: debe ser ≈
   * `sizerContentMinPx - eventsDotHalfPx` (no el ~16px de `--event-conn-end-adjust` del modo
   * horizontal) para que el trazo cierre en el disco.
   */
  connectorBottomInsetPx: number;
};

/**
 * Tamaños para la fila de títulos en modo vertical: deben mantenerse alineados con el CSS
 * de `.event-hit`, `--events-dot-half` en `.timeline-stack--compact` y el wrap en `EventTitleMarker`.
 *
 * Comprobación manual (DevTools): a igual `left%` en pista, el centro del `.event-dot` y el tick
 * del carril semántico deben compartir eje X; en Y el disco usa `events-dot-half` (sin `--v-pad`).
 *
 * **Invariante (conector):** el trazo punteado no depende de la rotación del texto, solo de la
 * geometría de esta fila (sizer + `connectorBottomInsetPx` / `--ev-titles-v-connector-btm`) — ver
 * `connectorBottomInsetPx` y [`TimelineEventTitlesLane`](../TimelineEventTitlesLane.tsx).
 * Recalibración: medición canvas (misma fuente que `measureEventTitleWidthsPx`); si hubiera
 * desvío con webfonts, se podría añadir un ResizeObserver aislado, no hace falta hoy.
 */
export function verticalEventTitlesRowLayoutPx(
  placements: readonly { maxWidthPx: number }[],
  pointerCoarse: boolean,
  remPx = 16
): VerticalEventTitlesRowLayoutPx {
  const rootRemPx = readRootRemPx(remPx);
  if (placements.length === 0) {
    return {
      vPadPx: 0,
      sizerContentMinPx: 0,
      remPx: rootRemPx,
      connectorBottomInsetPx: 0,
    };
  }
  const maxReadLengthPx = Math.max(...placements.map((p) => p.maxWidthPx));
  /** Eje de lectura en pantalla (tras 90°) = longitud de línea + padding del wrap. */
  const readAxisSlotPx = verticalReadSlotHeightPx(maxReadLengthPx);
  const eventsDotHalfPx = (pointerCoarse ? 1.32 : 1.22) / 2 * rootRemPx;
  const gapPx = 0.38 * rootRemPx;
  const naturalHitH = EVENT_DOT_PX + gapPx + readAxisSlotPx;
  const hitBlockPx = pointerCoarse
    ? Math.max(44, naturalHitH)
    : Math.max(28, naturalHitH);
  const vPadPx = 0;
  const padBottomPx = (pointerCoarse ? 0.32 : 0.28) * rootRemPx;
  const sizerContentMinPx = Math.ceil(
    eventsDotHalfPx + hitBlockPx / 2 + padBottomPx + 2
  );
  const connectorBottomInsetPx = Math.max(
    0,
    Math.ceil(sizerContentMinPx - eventsDotHalfPx)
  );
  return {
    vPadPx,
    sizerContentMinPx,
    remPx: rootRemPx,
    connectorBottomInsetPx,
  };
}

const EVENT_LABEL_MEASURE_SAFETY = 1.12;

const EVENT_LABEL_TIGHT_PCT = 1.05;

function eventLabelEdgePx(pointerCoarse: boolean): number {
  const dotHalfPx = 7;
  const flexGapPx = pointerCoarse ? 5.5 : 6;
  return dotHalfPx + flexGapPx;
}

/**
 * @internal Ver contrato/AC y export estable en `eventLabelLayout.ts`.
 */
export function assignEventLabelLanes(
  eventsSorted: TimelineEvent[],
  trackPct: (timeMs: number) => number,
  stackWidthPx: number | null,
  compact: boolean,
  pointerCoarse: boolean,
  labelsVertical: boolean
): { placements: EventLabelPlacement[]; maxLane: number } {
  const n = eventsSorted.length;
  if (n === 0) {
    return { placements: [], maxLane: 0 };
  }

  const stackPx =
    stackWidthPx != null && stackWidthPx > 0 ? stackWidthPx : 520;
  const edgePx = eventLabelEdgePx(pointerCoarse);
  const edgePct = (edgePx / stackPx) * 100;

  const widthsPx = measureEventTitleWidthsPx(
    eventsSorted.map((e) => e.title),
    compact,
    pointerCoarse
  );

  const items = eventsSorted.map((event, i) => {
    const measured = widthsPx[i]! * EVENT_LABEL_MEASURE_SAFETY;
    const baseWidthPx = labelsVertical
      ? verticalColumnWidthPx(
          pointerCoarse,
          readRootRemPx(16)
        ) * EVENT_LABEL_MEASURE_SAFETY
      : measured;
    return {
      event,
      i,
      p: trackPct(event.date.getTime()),
      baseWidthPx,
      measuredWidthPx: measured,
    };
  });
  items.sort((a, b) => a.p - b.p || a.i - b.i);

  const gapPct = Math.max(1.35, (22 / stackPx) * 100);

  const anchorByS: EventLabelAnchor[] = new Array(n);
  if (n === 1) {
    const p0 = items[0]!.p;
    anchorByS[0] = p0 <= 6 ? "start" : p0 >= 94 ? "end" : "center";
  } else {
    anchorByS[0] = "start";
    anchorByS[n - 1] = "end";
    for (let s = 1; s < n - 1; s++) {
      const p = items[s]!.p;
      const prevP = items[s - 1]!.p;
      const nextP = items[s + 1]!.p;
      const gapLeft = p - prevP;
      const gapRight = nextP - p;
      let anchor: EventLabelAnchor =
        gapRight > gapLeft
          ? "start"
          : gapRight < gapLeft
            ? "end"
            : p < 50
              ? "start"
              : "end";
      if (Math.abs(p - prevP) < EVENT_LABEL_TIGHT_PCT) {
        anchor = anchorByS[s - 1] === "start" ? "end" : "start";
      }
      anchorByS[s] = anchor;
    }
  }

  if (labelsVertical) {
    anchorByS.fill("start");
  }

  const lanes: [number, number][][] = [];
  const temp: {
    i: number;
    lane: number;
    anchor: EventLabelAnchor;
    maxWidthPx: number;
  }[] = [];

  for (let s = 0; s < items.length; s++) {
    const { i, p, baseWidthPx, measuredWidthPx } = items[s]!;
    const anchor = anchorByS[s]!;

    const rawSpanPct = (baseWidthPx / stackPx) * 100 + 0.38;

    let widthPct = Math.min(rawSpanPct, 44);
    if (anchor === "start") {
      widthPct = Math.min(
        widthPct,
        Math.max(0.85, 100 - p - edgePct - 0.25)
      );
    } else if (anchor === "end") {
      widthPct = Math.min(widthPct, Math.max(0.85, p - edgePct - 0.25));
    } else {
      widthPct = Math.min(
        widthPct,
        Math.max(0.85, 2 * Math.min(p, 100 - p) - edgePct * 2 - 0.35)
      );
    }

    let left: number;
    let right: number;
    if (anchor === "start") {
      left = p + edgePct;
      right = p + edgePct + widthPct;
    } else if (anchor === "end") {
      right = p - edgePct;
      left = p - edgePct - widthPct;
    } else {
      left = p - widthPct / 2;
      right = p + widthPct / 2;
    }

    const interval: [number, number] = [left, right];

    let lane = 0;
    for (;; lane++) {
      if (lane >= lanes.length) {
        lanes.push([]);
      }
      const occupied = lanes[lane]!;
      const clash = occupied.some((iv) =>
        labelIntervalsOverlap(interval, iv, gapPct)
      );
      if (!clash) {
        occupied.push(interval);
        const maxWidthPx = labelsVertical
          ? Math.min(measuredWidthPx, 300)
          : Math.min(
              baseWidthPx,
              Math.max(48, (widthPct / 100) * stackPx)
            );
        temp.push({
          i,
          lane,
          anchor,
          maxWidthPx,
        });
        break;
      }
    }
  }

  const columnBasePx = labelsVertical
    ? verticalColumnWidthPx(pointerCoarse, readRootRemPx(16))
    : undefined;

  const placements: EventLabelPlacement[] = eventsSorted.map(() => ({
    lane: 0,
    anchor: "center" as const,
    maxWidthPx: 160,
  }));
  let maxLane = 0;
  for (const t of temp) {
    placements[t.i] = {
      lane: t.lane,
      anchor: t.anchor,
      maxWidthPx: t.maxWidthPx,
      ...(columnBasePx != null ? { columnPx: columnBasePx } : {}),
    };
    maxLane = Math.max(maxLane, t.lane);
  }

  if (labelsVertical) {
    for (const p of placements) {
      p.lane = 0;
    }
    maxLane = 0;
  }

  return { placements, maxLane };
}
