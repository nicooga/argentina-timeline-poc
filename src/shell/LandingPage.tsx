import { Link } from "react-router-dom";
import { FEATURED_TIMELINES, type FeaturedTimeline } from "./featuredTimelines";
import { SITE_INSTAGRAM_URL } from "./siteLinks";
import "./LandingPage.css";

export function LandingPage() {
  return (
    <div className="lp">
      <LandingNavbar />
      <LandingHero />
      <FeaturedTimelinesSection />
      <HowItWorksSection />
      <ClosingBand />
      <LandingFooter />
    </div>
  );
}

function LandingNavbar() {
  return (
    <nav className="lp-nav">
      <span className="lp-logo">Historias en el Tiempo</span>
      <Link to="/app" className="lp-nav-cta">Ingresar</Link>
    </nav>
  );
}

function LandingHero() {
  return (
    <div className="lp-hero-bg">
    <section className="lp-hero">
      <div className="lp-hero-content">
        <h1 className="lp-hero-title">
          Líneas del tiempo<br />para estudiar historia
        </h1>
        <p className="lp-hero-sub">
          Una plataforma educativa abierta. Estudiá períodos históricos sobre
          un eje interactivo, comparando eventos, relaciones causales y
          contexto.
        </p>
        <div className="lp-hero-actions">
          <a href="#lineas-del-tiempo" className="lp-btn lp-btn--primary">
            Explorar las líneas del tiempo
          </a>
          <a href="#como-se-usa" className="lp-btn lp-btn--ghost">
            Cómo se usa
          </a>
        </div>
      </div>
      <div className="lp-hero-illustration" aria-hidden="true">
        <TimelineIllustration />
      </div>
    </section>
    </div>
  );
}

function FeaturedTimelinesSection() {
  return (
    <section className="lp-timelines" id="lineas-del-tiempo">
      <div className="lp-timelines-header">
        <h2 className="lp-section-title">Líneas del tiempo</h2>
        <p className="lp-section-lead">
          Una selección sobre la historia republicana de la región. Abrí una
          para recorrer sus períodos y eventos.
        </p>
      </div>
      <div className="lp-timeline-grid">
        {FEATURED_TIMELINES.map((t) => (
          <TimelineCard key={t.slug} timeline={t} />
        ))}
      </div>
    </section>
  );
}

function TimelineCard({ timeline }: { timeline: FeaturedTimeline }) {
  const positions = eventPositionsForSeed(timeline.slug, 6);
  return (
    <Link to={`/${timeline.slug}`} className="lp-timeline-card">
      <div className="lp-timeline-mini-axis" aria-hidden="true">
        <MiniAxis positions={positions} />
      </div>
      <div className="lp-timeline-card-body">
        <span className="lp-timeline-chip">{timeline.category}</span>
        <span className="lp-timeline-year-range">{timeline.yearRange}</span>
        <h3 className="lp-timeline-title">{timeline.title}</h3>
        <p className="lp-timeline-desc">{timeline.description}</p>
      </div>
    </Link>
  );
}

function HowItWorksSection() {
  return (
    <section className="lp-steps" id="como-se-usa">
      <h2 className="lp-section-title">Cómo se usa</h2>
      <div className="lp-steps-grid">
        <StepCard
          number="1"
          icon={<ExploreIcon />}
          title="Explorá una línea del tiempo"
          desc="Navegá períodos históricos con zoom, filtrá por categoría y avanzá a tu ritmo."
        />
        <StepCard
          number="2"
          icon={<ChatIcon />}
          title="Profundizá con asistencia de IA"
          desc="Resolvé dudas puntuales sobre cualquier evento o período. El asistente explica, contextualiza y conecta con otros temas."
        />
        <StepCard
          number="3"
          icon={<CausalIcon />}
          title="Visualizá conexiones causales"
          desc="Activá el modo causal para ver cómo un evento lleva al siguiente a lo largo del tiempo."
        />
      </div>
    </section>
  );
}

function ClosingBand() {
  return (
    <section className="lp-closing">
      <p className="lp-closing-text">
        Elegí una línea del tiempo para comenzar.
      </p>
      <a href="#lineas-del-tiempo" className="lp-btn lp-btn--ghost">
        Ver todas
      </a>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-line">
        Proyecto educativo abierto · Pensado para estudiantes y docentes.
      </div>
      <div className="lp-footer-links">
        <span>© {new Date().getFullYear()} Historias en el Tiempo</span>
        <a href={SITE_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          @historic.timelines
        </a>
        <Link to="/app">Ingresar</Link>
      </div>
    </footer>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

type StepCardProps = {
  number: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
};

function StepCard({ number, icon, title, desc }: StepCardProps) {
  return (
    <div className="lp-step-card">
      <div className="lp-step-icon">{icon}</div>
      <span className="lp-step-number">Paso {number}</span>
      <h3 className="lp-step-title">{title}</h3>
      <p className="lp-step-desc">{desc}</p>
    </div>
  );
}

// ── Mini axis (card) ────────────────────────────────────────────────────────

function MiniAxis({ positions }: { positions: number[] }) {
  const width = 280;
  const height = 70;
  const midY = 42;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="lp-timeline-axis-svg"
    >
      <rect
        x="14"
        y="22"
        width={width / 2 - 24}
        height="18"
        rx="4"
        className="lp-svg-period-1"
      />
      <rect
        x={width / 2 + 10}
        y="22"
        width={width / 2 - 24}
        height="18"
        rx="4"
        className="lp-svg-period-2"
      />
      <line x1="10" y1={midY} x2={width - 10} y2={midY} className="lp-svg-axis" />
      {[0, 0.5, 1].map((t, i) => {
        const x = 10 + (width - 20) * t;
        return (
          <line
            key={i}
            x1={x}
            y1={midY - 4}
            x2={x}
            y2={midY + 4}
            className="lp-svg-tick"
          />
        );
      })}
      {positions.map((p, i) => {
        const x = 10 + (width - 20) * p;
        return (
          <circle
            key={i}
            cx={x}
            cy={midY}
            r="4"
            className={
              i % 3 === 0 ? "lp-svg-event-secondary" : "lp-svg-event"
            }
          />
        );
      })}
    </svg>
  );
}

function eventPositionsForSeed(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  let state = Math.abs(h) || 1;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    state = (state * 9301 + 49297) % 233280;
    out.push(0.08 + (state / 233280) * 0.84);
  }
  return out.sort((a, b) => a - b);
}

// ── Hero illustration ────────────────────────────────────────────────────────

function TimelineIllustration() {
  return (
    <svg
      viewBox="0 0 480 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="lp-hero-svg"
    >
      <rect x="36" y="62" width="148" height="48" rx="7" className="lp-svg-period-1" />
      <rect x="196" y="62" width="158" height="48" rx="7" className="lp-svg-period-2" />
      <rect x="366" y="62" width="86" height="48" rx="7" className="lp-svg-period-1" />

      <text x="52" y="82" className="lp-svg-period-label lp-svg-period-1-text">Independencia</text>
      <text x="210" y="82" className="lp-svg-period-label lp-svg-period-2-text">Organización Nacional</text>
      <text x="378" y="82" className="lp-svg-period-label lp-svg-period-1-text">Modernización</text>

      <text x="34" y="132" className="lp-svg-year-label">1810</text>
      <text x="192" y="132" className="lp-svg-year-label">1853</text>
      <text x="360" y="132" className="lp-svg-year-label">1880</text>
      <text x="434" y="132" className="lp-svg-year-label">1916</text>

      <line x1="20" y1="110" x2="460" y2="110" className="lp-svg-axis" />

      {[36, 96, 140, 196, 255, 310, 366, 440].map((x, i) => (
        <line key={i} x1={x} y1="106" x2={x} y2="114" className="lp-svg-tick" />
      ))}

      <path d="M 80 103 Q 148 50 220 103" className="lp-svg-causal-arc" />
      <polygon points="222,104 215,98 224,97" className="lp-svg-causal-arrow" />

      <circle cx="80" cy="110" r="7" className="lp-svg-event" />
      <circle cx="120" cy="110" r="7" className="lp-svg-event" />
      <circle cx="160" cy="110" r="6" className="lp-svg-event-secondary" />
      <circle cx="220" cy="110" r="7" className="lp-svg-event" />
      <circle cx="270" cy="110" r="7" className="lp-svg-event" />
      <circle cx="330" cy="110" r="6" className="lp-svg-event-secondary" />
      <circle cx="390" cy="110" r="7" className="lp-svg-event" />

      <rect x="188" y="140" width="136" height="42" rx="8" className="lp-svg-tooltip" />
      <line x1="220" y1="118" x2="236" y2="140" className="lp-svg-tooltip-line" />
      <text x="200" y="157" className="lp-svg-tooltip-title">Revolución de Mayo</text>
      <text x="200" y="172" className="lp-svg-tooltip-sub">25 de mayo, 1810</text>
    </svg>
  );
}

// ── Step icons ───────────────────────────────────────────────────────────────

function ExploreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="13" y2="14" />
    </svg>
  );
}

function CausalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="12" r="3" />
      <path d="M9 12 Q 12 6 15 12" />
      <polyline points="14,10 15,12 13,12" />
    </svg>
  );
}
