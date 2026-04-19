import type { EventLaneId } from "./eventLanes";

interface Linked {
    links?: string[];
}

export type { EventLaneId };

export interface TimelineEvent extends Linked {
    title: string;
    /** Puntos breves para mostrar como lista en el panel de detalle. */
    items: string[];
    date: Date;
    /** Carril(es) semántico(s); no vacío. */
    lanes: EventLaneId[];
}

export interface Period extends Linked {
    title: string;
    start: Date;
    end: Date;
    /** Puntos breves para mostrar como lista en el panel de detalle. */
    items: string[];
    color: string;
}

export interface Timeline {
    events: TimelineEvent[];
    periods: Period[];
}

export type Selection =
    | { kind: "period"; item: Period }
    | { kind: "event"; item: TimelineEvent }
    | null;