import { useCallback, useEffect, useRef, useState } from "react";
import "./SearchPanel.css";
import type { Period, Timeline as TimelineModel, TimelineEvent } from "../../types";

const normalize = (str: string) =>
    str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const isPeriod = (item: TimelineEvent | Period): item is Period =>
    !("id" in item);

export default function SearchPanel({
  Timeline,
  isOpen,
  onClose,
  onSelectPeriod,
  onSelectEvent,
}: {
  Timeline: TimelineModel;
  isOpen: boolean;
  onClose: () => void;
  onSelectPeriod: (period: Period) => void;
  onSelectEvent: (event: TimelineEvent) => void;
}) {
    const [query, setQuery] = useState("");
    const [filtered, setFiltered] = useState<Array<TimelineEvent | Period>>([]);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const listRef = useRef<HTMLDivElement>(null);

    // Reset state when panel closes
    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setFiltered([]);
            setActiveIndex(-1);
        }
    }, [isOpen]);

    // Filter results whenever query or timeline data changes
    useEffect(() => {
        const normalizedQuery = normalize(query.trim());

        setActiveIndex(-1);

        if (normalizedQuery === "") {
            setFiltered([]);
            return;
        }

        const eventMatches = Timeline.events.filter((event) => {
            const titleMatch = normalize(event.title).includes(normalizedQuery);
            const summaryMatch = event.summary ? normalize(event.summary).includes(normalizedQuery) : false;
            const itemsMatch = event.items?.some((item) => normalize(item).includes(normalizedQuery)) ?? false;
            return titleMatch || summaryMatch || itemsMatch;
        });

        const periodMatches = Timeline.periods.filter((period) => {
            const titleMatch = normalize(period.title).includes(normalizedQuery);
            const itemsMatch = period.items?.some((item) => normalize(item).includes(normalizedQuery)) ?? false;
            return titleMatch || itemsMatch;
        });

        setFiltered([...eventMatches, ...periodMatches]);
    }, [query, Timeline.events, Timeline.periods]);

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex < 0 || !listRef.current) return;
        const items = listRef.current.querySelectorAll<HTMLElement>("[data-result-item]");
        items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const handleSelect = useCallback((item: TimelineEvent | Period) => {
        if (isPeriod(item)) {
            onSelectPeriod(item);
        } else {
            onSelectEvent(item);
        }
        onClose();
    }, [onSelectPeriod, onSelectEvent, onClose]);

    // Keyboard navigation within the panel
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                const target = filtered[activeIndex >= 0 ? activeIndex : 0];
                if (target) handleSelect(target);
                return;
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, filtered, activeIndex, handleSelect, onClose]);

    if (!isOpen) {
        return null;
    }

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    return (
        <div className="search-panel-root" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="search-panel-search">
                <input
                    type="text"
                    autoFocus
                    value={query}
                    placeholder="Buscar periodo o evento..."
                    className="search-panel-input"
                    onChange={handleOnChange}
                />
            </div>
            {query !== "" && (
                <div className="search-panel-filtered" ref={listRef}>
                    {filtered.length === 0 ? (
                        <div className="search-panel-empty-state">No se encontraron resultados.</div>
                    ) : (
                        filtered.map((item, index) => (
                            <div
                                key={isPeriod(item) ? `period-${item.title}` : item.id}
                                data-result-item
                                className={`search-panel-item${index === activeIndex ? " search-panel-item--active" : ""}`}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setActiveIndex(index)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="search-panel-item-header">
                                    <div className="search-panel-title">{item.title}</div>
                                    <span className={`search-panel-badge ${isPeriod(item) ? "search-panel-badge--period" : "search-panel-badge--event"}`}>
                                        {isPeriod(item) ? "Período" : "Evento"}
                                    </span>
                                </div>
                                <div className="search-panel-description">
                                    {isPeriod(item)
                                        ? item.items?.join(" · ") || "Sin detalles"
                                        : item.summary || item.items?.join(" · ") || "Sin detalles"}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
