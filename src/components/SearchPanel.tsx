import { useEffect, useState } from "react";
import "./SearchPanel.css";
import type { Period, Timeline as TimelineModel, TimelineEvent } from "../../types";

const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function SearchPanel({
  Timeline,
  onSelectPeriod,
  onSelectEvent,
}: {
  Timeline: TimelineModel;
  onSelectPeriod: (period: Period) => void;
  onSelectEvent: (event: TimelineEvent) => void;
}) {
    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState("");
    const [filtered, setFiltered] = useState<Array<TimelineEvent | Period>>([]);

    useEffect(() => {
        const normalizedQuery = normalize(query.trim());

        if (normalizedQuery === "") {
            setFiltered([]);
            return;
        }

        const eventMatches = Timeline.events.filter((event) => {
            const titleMatch = normalize(event.title).includes(normalizedQuery);
            const summaryMatch = event.summary ? normalize(event.summary).includes(normalizedQuery) : false;
            const itemsMatch = event.items.some((item) => normalize(item).includes(normalizedQuery));
            return titleMatch || summaryMatch || itemsMatch;
        });

        const periodMatches = Timeline.periods.filter((period) => {
            const titleMatch = normalize(period.title).includes(normalizedQuery);
            const itemsMatch = period.items.some((item) => normalize(item).includes(normalizedQuery));
            return titleMatch || itemsMatch;
        });

        setFiltered([...eventMatches, ...periodMatches]);
    }, [query, Timeline.events, Timeline.periods]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "f") {
                e.preventDefault();
                setVisible(v => !v);
                return;
            }
            if (e.key === "Escape" && visible) {
                e.preventDefault();
                setVisible(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [visible]);

    if (!visible) {
        return null;
    }

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const isPeriod = (item: TimelineEvent | Period): item is Period =>
        !("id" in item);

    const handleSelect = (item: TimelineEvent | Period) => {
        if (isPeriod(item)) {
            onSelectPeriod(item);
        } else {
            onSelectEvent(item);
        }
        setVisible(false); // cierra el panel después de seleccionar
    };

    return (
        <div className="root">
            <div className="div-search">
                <input
                    type="text"
                    autoFocus
                    value={query}
                    placeholder="Buscar periodo o evento..."
                    className="input"
                    onChange={handleOnChange}
                />
            </div>
            {query !== "" && (
                <div className="div-filtered">
                    {filtered.length === 0 ? (
                        <div className="empty-state">No se encontraron resultados.</div>
                    ) : (
                        filtered.map((item) => (
                            <div
                                key={isPeriod(item) ? `period-${item.title}` : item.id}
                                className="item"
                                onClick={() => handleSelect(item)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="title">{item.title}</div>
                                <div className="description">
                                    {isPeriod(item)
                                        ? item.items.join(" · ") || "Sin detalles"
                                        : item.summary || item.items.join(" · ") || "Sin detalles"}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}