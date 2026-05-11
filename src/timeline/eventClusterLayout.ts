import type { TimelineEvent } from "../../types";
import type { EventLabelPlacement } from "./eventLabelLayout";
import { readRootRemPx, verticalColumnWidthPx } from "./eventLabelLayout";

const DISPLACED_EVENT_GAP_PX = 4;
const DISPLACEMENT_CONNECTOR_MIN_PX = 1;

export interface DisplacedEventPlacement {
  event: TimelineEvent;
  datePct: number;
  displayPct: number;
  offsetPx: number;
  needsConnector: boolean;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

type LayoutItem = { event: TimelineEvent; index: number; datePct: number };

type RenderCluster = {
  items: LayoutItem[];
  startPct: number;
  endPct: number;
  displayPcts: number[];
};

function placeCluster(
  items: LayoutItem[],
  separationPct: number
): RenderCluster {
  const sorted = [...items].sort(
    (a, b) => a.datePct - b.datePct || a.index - b.index
  );
  if (sorted.length === 1) {
    const pct = clamp(sorted[0]!.datePct, 0, 100);
    return {
      items: sorted,
      startPct: pct,
      endPct: pct,
      displayPcts: [pct],
    };
  }

  const displaySpanPct = separationPct * (sorted.length - 1);
  const minDatePct = sorted[0]!.datePct;
  const maxDatePct = sorted[sorted.length - 1]!.datePct;
  const centerPct = (minDatePct + maxDatePct) / 2;
  const startPct = clamp(centerPct - displaySpanPct / 2, 0, 100 - displaySpanPct);
  const displayPcts = sorted.map((_item, i) => startPct + i * separationPct);
  return {
    items: sorted,
    startPct,
    endPct: startPct + displaySpanPct,
    displayPcts,
  };
}

/**
 * Coloca eventos visualmente separados cuando sus columnas verticales se pisan.
 * La fecha real queda en `datePct`; `displayPct` es solo la posición de lectura.
 */
export function layoutDisplacedEventPlacements(
  eventsSorted: TimelineEvent[],
  placements: EventLabelPlacement[],
  trackPct: (ms: number) => number,
  stackWidthPx: number
): DisplacedEventPlacement[] {
  if (eventsSorted.length === 0) return [];

  const safeStackWidthPx = stackWidthPx > 0 ? stackWidthPx : 520;
  const columnPx =
    placements[0]?.columnPx ?? verticalColumnWidthPx(false, readRootRemPx());
  const separationPct = ((columnPx + DISPLACED_EVENT_GAP_PX) / safeStackWidthPx) * 100;
  const effectiveSeparationPct =
    eventsSorted.length > 1
      ? Math.min(separationPct, 100 / (eventsSorted.length - 1))
      : separationPct;

  const items: LayoutItem[] = eventsSorted.map((event, index) => ({
    event,
    index,
    datePct: trackPct(event.date.getTime()),
  }));

  let groups: LayoutItem[][] = [];
  let current: LayoutItem[] = [items[0]!];
  for (let i = 1; i < items.length; i++) {
    const item = items[i]!;
    const last = current[current.length - 1]!;
    if (item.datePct - last.datePct < effectiveSeparationPct) {
      current.push(item);
    } else {
      groups.push(current);
      current = [item];
    }
  }
  groups.push(current);

  let placedClusters: RenderCluster[] = [];
  for (let pass = 0; pass < eventsSorted.length; pass++) {
    placedClusters = groups
      .map((group) => placeCluster(group, effectiveSeparationPct))
      .sort((a, b) => a.startPct - b.startPct);

    const nextGroups: LayoutItem[][] = [];
    let mergedCurrent = [...placedClusters[0]!.items];
    let currentEnd = placedClusters[0]!.endPct;
    let didMerge = false;

    for (let i = 1; i < placedClusters.length; i++) {
      const cluster = placedClusters[i]!;
      if (cluster.startPct - currentEnd < effectiveSeparationPct) {
        mergedCurrent.push(...cluster.items);
        currentEnd = Math.max(currentEnd, cluster.endPct);
        didMerge = true;
      } else {
        nextGroups.push(mergedCurrent);
        mergedCurrent = [...cluster.items];
        currentEnd = cluster.endPct;
      }
    }
    nextGroups.push(mergedCurrent);

    if (!didMerge) break;
    groups = nextGroups;
  }

  const out: DisplacedEventPlacement[] = eventsSorted.map((event) => ({
    event,
    datePct: trackPct(event.date.getTime()),
    displayPct: trackPct(event.date.getTime()),
    offsetPx: 0,
    needsConnector: false,
  }));

  for (const cluster of placedClusters) {
    cluster.items.forEach((item, i) => {
      const displayPct = cluster.displayPcts[i]!;
      const offsetPx = ((displayPct - item.datePct) / 100) * safeStackWidthPx;
      out[item.index] = {
        event: item.event,
        datePct: item.datePct,
        displayPct,
        offsetPx,
        needsConnector: Math.abs(offsetPx) >= DISPLACEMENT_CONNECTOR_MIN_PX,
      };
    });
  }

  return out;
}

export function minEventSeparationPct(
  eventsSorted: TimelineEvent[],
  trackPct: (ms: number) => number
): number | null {
  let minDiff = Infinity;
  let prevPct: number | null = null;
  for (const event of eventsSorted) {
    const pct = trackPct(event.date.getTime());
    if (prevPct != null) {
      const diff = pct - prevPct;
      if (diff > 0) minDiff = Math.min(minDiff, diff);
    }
    prevPct = pct;
  }
  return Number.isFinite(minDiff) ? minDiff : null;
}
