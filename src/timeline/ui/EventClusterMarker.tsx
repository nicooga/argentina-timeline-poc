import type { CSSProperties, MouseEvent } from "react";
import type { EventCluster } from "../eventClusterLayout";

export type EventClusterMarkerProps = {
  cluster: EventCluster;
  onClick: (cluster: EventCluster, e: MouseEvent) => void;
};

export function EventClusterMarker({ cluster, onClick }: EventClusterMarkerProps) {
  return (
    <div
      className="evt-cluster-marker"
      style={{ left: `${cluster.centerPct}%` } as CSSProperties}
    >
      <button
        type="button"
        className="evt-cluster-hit"
        onClick={(e) => onClick(cluster, e)}
        title={`${cluster.rangeLabel} · ${cluster.events.length} eventos — clic para acercar`}
        aria-label={`${cluster.events.length} eventos agrupados, ${cluster.rangeLabel}`}
      >
        <span className="evt-cluster-disc" aria-hidden="true">
          <span className="evt-cluster-count">{cluster.events.length}</span>
          <span className="evt-cluster-unit">ev.</span>
        </span>
      </button>
    </div>
  );
}
