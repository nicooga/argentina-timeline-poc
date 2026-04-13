interface Linked {
    links?: string[];
}

export interface TimelineEvent extends Linked {
    title: string;
    description: string;
    date: Date;
}

export interface Period extends Linked {
    title: string;
    start: Date;
    end: Date;
    description: string;
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