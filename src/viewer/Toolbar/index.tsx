import type { CSSProperties } from "react";
import type { StudyMode } from "../../../causality";
import {
  EVENT_LANE_ORDER,
  LANE_UI,
  type EventLaneId,
} from "../../../eventLanes";
import type { ThemeMode } from "../../shell/theme";

type ToolbarProps = {
  title: string;
  indexOpen: boolean;
  filtersOpen: boolean;
  previewMode: boolean;
  timelineApiLoading: boolean;
  laneVisibility: Record<EventLaneId, boolean>;
  studyMode: StudyMode;
  studyMenuOpen: boolean;
  themeMode: ThemeMode;
  themeMenuOpen: boolean;
  allPanelsCollapsed: boolean;
  hasSelection: boolean;
  onToggleIndex: () => void;
  onToggleFilters: () => void;
  onToggleLane: (id: EventLaneId) => void;
  onGoHome: () => void;
  onOpenHelp: () => void;
  onOpenSearch: () => void;
  onCreateCopy: () => void;
  onCreateEvent: () => void;
  onToggleStudyMenu: () => void;
  onSelectStudyMode: (mode: StudyMode) => void;
  onToggleThemeMenu: () => void;
  onSelectThemeMode: (mode: ThemeMode) => void;
  onTogglePanels: () => void;
};

const THEME_MODE_OPTIONS: readonly { id: ThemeMode; label: string }[] = [
  { id: "system", label: "Sistema" },
  { id: "light", label: "Claro" },
  { id: "dark", label: "Oscuro" },
];

const STUDY_MODE_OPTIONS: readonly { id: StudyMode; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "exam", label: "Examen" },
  { id: "causal", label: "Causal" },
];

function ThemeModeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") {
    return (
      <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4V2m0 20v-2m5.66-13.66 1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2m14.07 7.07-1.41-1.41M6.34 6.34 4.93 4.93M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
      </svg>
    );
  }
  if (mode === "dark") {
    return (
      <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.5A8.5 8.5 0 0 1 10.5 3 7 7 0 1 0 21 13.5Z" />
      </svg>
    );
  }
  return (
    <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5h16v10H4V5Zm5 14h6m-3-4v4" />
    </svg>
  );
}

function StudyModeIcon({ mode }: { mode: StudyMode }) {
  if (mode === "exam") {
    return (
      <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11h6m-6 4h4m-7 6h12a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2Zm8-19v5h5" />
      </svg>
    );
  }
  if (mode === "causal") {
    return (
      <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm8 8a3 3 0 1 1-3 3 3 3 0 0 1 3-3ZM10.6 9.4l2.8 3.2" />
      </svg>
    );
  }
  return (
    <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function Toolbar({
  title,
  indexOpen,
  filtersOpen,
  previewMode,
  timelineApiLoading,
  laneVisibility,
  studyMode,
  studyMenuOpen,
  themeMode,
  themeMenuOpen,
  allPanelsCollapsed,
  hasSelection,
  onToggleIndex,
  onToggleFilters,
  onToggleLane,
  onGoHome,
  onOpenHelp,
  onOpenSearch,
  onCreateCopy,
  onCreateEvent,
  onToggleStudyMenu,
  onSelectStudyMode,
  onToggleThemeMenu,
  onSelectThemeMode,
  onTogglePanels,
}: ToolbarProps) {
  return (
    <header id="viewer-toolbar-main" className="viewer-toolbar" aria-label="Barra del visor">
      <div className="viewer-toolbar-core">
        <button
          type="button"
          className="viewer-toolbar-btn"
          onClick={onToggleIndex}
          aria-expanded={indexOpen}
          aria-controls="viewer-index-panel"
          aria-label={indexOpen ? "Ocultar índice" : "Mostrar índice"}
          title={indexOpen ? "Ocultar índice" : "Índice"}
        >
          <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        <div className="viewer-layers-menu">
          <button
            type="button"
            className={`viewer-toolbar-btn${EVENT_LANE_ORDER.some((id) => !laneVisibility[id]) ? " viewer-toolbar-btn--active" : ""}`}
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
            aria-controls="viewer-lane-filter-menu"
            aria-label="Capas semánticas"
            title="Capas"
          >
            <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m12 3 8 4.5-8 4.5-8-4.5L12 3Zm0 9 8-4.5M12 12 4 7.5M4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
            </svg>
          </button>
          {filtersOpen ? (
            <div id="viewer-lane-filter-menu" className="viewer-lane-filter-menu" role="group" aria-label="Visibilidad por carril semántico">
              {EVENT_LANE_ORDER.map((laneId) => (
                <button
                  key={laneId}
                  type="button"
                  className="viewer-lane-filter"
                  aria-pressed={laneVisibility[laneId]}
                  title={
                    laneVisibility[laneId]
                      ? `Ocultar carril ${LANE_UI[laneId].label}`
                      : `Mostrar carril ${LANE_UI[laneId].label}`
                  }
                  style={{ "--lane-chip-fg": LANE_UI[laneId].color } as CSSProperties}
                  onClick={() => onToggleLane(laneId)}
                >
                  {LANE_UI[laneId].label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button type="button" className="viewer-toolbar-btn" onClick={onGoHome} title="Inicio" aria-label="Inicio">
          <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
          </svg>
        </button>

        <button type="button" className="viewer-toolbar-btn" onClick={onOpenHelp} title="Ayuda (atajos de teclado)" aria-label="Ayuda (atajos de teclado)">
          <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M9 9a3 3 0 115.2 2c-.5.5-1.2.9-1.7 1.4S12 13.5 12 14" />
            <circle cx="12" cy="17.5" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <button type="button" className="viewer-toolbar-btn" onClick={onOpenSearch} title="Buscar evento o período (Ctrl+F)" aria-label="Buscar evento o período">
          <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <span className="viewer-toolbar-title" title={title}>
        {title}
      </span>

      <div className="viewer-toolbar-secondary">
        <button
          type="button"
          className="viewer-toolbar-btn viewer-toolbar-btn--with-label"
          onClick={onCreateCopy}
          disabled={timelineApiLoading}
          aria-label="Crear una copia editable del timeline actual"
          title="Crear copia"
        >
          <span>Copiar</span>
        </button>

        <button
          type="button"
          className="viewer-toolbar-btn viewer-toolbar-btn--with-label"
          onClick={onCreateEvent}
          disabled={previewMode}
          aria-label="Crear evento"
          title={previewMode ? "No disponible en modo vista previa" : "Crear evento"}
        >
          <svg className="viewer-header-icon-svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          <span>Evento</span>
        </button>

        <div className="viewer-study-menu">
          <button
            type="button"
            className="viewer-toolbar-btn"
            onClick={onToggleStudyMenu}
            aria-expanded={studyMenuOpen}
            aria-haspopup="menu"
            aria-controls="viewer-study-menu"
            aria-label={`Modo de estudio: ${STUDY_MODE_OPTIONS.find((option) => option.id === studyMode)?.label ?? "Normal"}`}
            title="Modo de estudio"
          >
            <StudyModeIcon mode={studyMode} />
          </button>
          {studyMenuOpen ? (
            <div id="viewer-study-menu" className="viewer-study-menu-popover" role="radiogroup" aria-label="Modo de estudio">
              {STUDY_MODE_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={studyMode === id}
                  className={`viewer-study-menu-option${studyMode === id ? " viewer-study-menu-option--active" : ""}`.trim()}
                  onClick={() => onSelectStudyMode(id)}
                >
                  <StudyModeIcon mode={id} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="viewer-theme-menu">
          <button
            type="button"
            className="viewer-toolbar-btn"
            onClick={onToggleThemeMenu}
            aria-expanded={themeMenuOpen}
            aria-haspopup="menu"
            aria-controls="viewer-theme-menu"
            aria-label={`Tema visual: ${THEME_MODE_OPTIONS.find((option) => option.id === themeMode)?.label ?? "Sistema"}`}
            title="Tema visual"
          >
            <ThemeModeIcon mode={themeMode} />
          </button>
          {themeMenuOpen ? (
            <div id="viewer-theme-menu" className="viewer-theme-menu-popover" role="radiogroup" aria-label="Tema visual">
              {THEME_MODE_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={themeMode === id}
                  className={`viewer-theme-menu-option${themeMode === id ? " viewer-theme-menu-option--active" : ""}`.trim()}
                  onClick={() => onSelectThemeMode(id)}
                >
                  <ThemeModeIcon mode={id} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="viewer-toolbar-btn"
          onClick={onTogglePanels}
          aria-label={allPanelsCollapsed ? "Expandir paneles" : "Contraer paneles"}
          title={allPanelsCollapsed ? "Expandir paneles" : "Contraer paneles"}
        >
          <svg className="viewer-header-icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                allPanelsCollapsed || !hasSelection
                  ? "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                  : "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"
              }
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
