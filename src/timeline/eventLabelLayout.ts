/**
 * @fileoverview Posicionamiento de títulos de eventos (`.events-titles-lane`) y contrato/AC
 *
 * ## Qué hace
 * - Coloca títulos en “carriles” (índice `lane`, no confundir con carriles semánticos POL/MIL/…)
 *   y devuelve `maxWidthPx` y `anchor` (start|center|end) por evento, para estilos en
 *   [`./ui/TimelineEventTitlesLane.tsx`](./ui/TimelineEventTitlesLane.tsx).
 *
 * ## Eje e inputs
 * - Pista 0–100% vía `trackPct` (misma convención que el chart).
 * - `stackWidthPx`: ancho en px de `.timeline-stack` (ResizeObserver) para colisiones.
 * - Colisión: intervalos [left,right] en % + gap; al chocar, `lane+1` (cada unidad añade
 *   desplazamiento Y en **horizontal** vía `var(--event-label-lane) * nudge` en
 *   [`../App.css`](../App.css)).
 *
 * ## Criterio de aceptación
 * - **Horizontal** (`labelsVertical = false`, legacy/test-only):
 *   - `lane` y `maxLane` alimentan el apilado Y (evita solapar títulos largos a lo largo del tiempo)
 *     y CSS `--event-label-max-lane` (padding bajo el timeline en `.timeline-stack--compact`).
 *   - `anchor` afecta dónde se extiende el título en X respecto a la bolita; alternar
 *     anclas vecinas reduce colisiones antes de subir de carril.
 * - **Vertical** (`labelsVertical = true`, único modo de UI):
 *   - `maxWidthPx` = eje de **lectura** (long); `columnPx` = grosor en pista (eje X). Colisión en
 *     `assignEventLabelLanes` usa `columnPx` (vía `verticalColumnWidthPx`) en % de pista. Al
 *     terminar, **fuerza `lane: 0` y `maxLane: 0`**: el apilado Y de horizontal **no** aplica al
 *     DOM; vPad, row y padding fijan `verticalEventTitlesRowLayoutPx` y el CSS bajo
 *   `.timeline-stack--event-labels-vertical` (valores fijos, sin nudge 9rem de horizontal).
 *   - `anchor` se fuerza a `start` (lectura/geométrica unificada con CSS; ver comentario en
 *   [`eventLabelLayoutCore.ts`](./eventLabelLayoutCore.ts)).
 * - Si se cambiara solo el CSS (rotación, padding) **sin** este algoritmo, las colisiones
 *   en % de pista dejarían de alinear títulos.
 *
 * @see `eventLabelLayoutCore.ts` — implementación; pruebas en `eventLabelLayoutCore.test.ts`.
 * @see `../App.css` — `--event-label-lane`, `--event-label-lane-nudge` (separar horizontal vs
 *   vertical; en vertical, room/nudge fijos, no vstride en px desde TS)
 */
export {
  assignEventLabelLanes,
  labelIntervalsOverlap,
  measureEventTitleWidthsPx,
  readRootRemPx,
  verticalColumnWidthPx,
  verticalEventTitlesRowLayoutPx,
  verticalReadSlotHeightPx,
} from "./eventLabelLayoutCore";
export { EVENT_TITLE_VROT_WRAP_PAD_PX } from "./eventLabelLayoutCore";
export type { EventLabelAnchor, EventLabelPlacement } from "./eventLabelLayoutCore";
