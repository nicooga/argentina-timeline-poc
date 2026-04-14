interface Linked {
    links?: string[];
}

export interface TimelineEvent extends Linked {
    title: string;
    /** Puntos breves para mostrar como lista en el panel de detalle. */
    items: string[];
    date: Date;
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