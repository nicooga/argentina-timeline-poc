import type { EventLaneId } from "./eventLanes";

interface Linked {
    links?: string[];
}

export type { EventLaneId };

export type TimelineEventId = string;

export interface TimelineEvent extends Linked {
    id: TimelineEventId;
    title: string;
    /** Resumen corto (hover / disclosure progresiva). */
    summary?: string;
    /** Puntos breves para mostrar como lista en el panel de detalle. */
    items: string[];
    date: Date;
    /** Carril(es) semántico(s); no vacío. */
    lanes?: EventLaneId[];
    /** IDs de otros eventos que ayudan a explicar por qué ocurre. */
    causes?: string[];
    /** IDs de otros eventos que este hecho condiciona o desencadena. */
    consequences?: string[];
    /** Peso didáctico en listas compactas. */
    importance?: "primary" | "secondary" | "contextual";
}

export interface Period extends Linked {
    title: string;
    start: Date;
    end: Date;
    /** Puntos breves para mostrar como lista en el panel de detalle. */
    items?: string[];
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

export interface inputChange {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}