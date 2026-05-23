import { Link } from "react-router-dom";
import { SITE_INSTAGRAM_URL } from "./siteLinks";
import "./LandingPage.css";

// TODO: apuntar al slug real de la demo cuando el backend lo exponga.
const DEMO_SLUG = "historia-argentina";

export function LandingPage() {
  return (
    <div className="lp">
      <LandingNavbar />
      <LandingHero />
      <HowItWorksSection />
      <FeaturesSection />
      <CtaBanner />
      <LandingFooter />
    </div>
  );
}

function LandingNavbar() {
  return (
    <nav className="lp-nav">
      <span className="lp-logo">Historias en el Tiempo</span>
      <Link to="/app" className="lp-nav-cta">Entrar</Link>
    </nav>
  );
}

function LandingHero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-content">
        <h1 className="lp-hero-title">
          Navegá la historia<br />como nunca antes
        </h1>
        <p className="lp-hero-sub">
          Líneas del tiempo interactivas, enriquecidas con IA.
          Explorá períodos, filtrá eventos y descubrí conexiones causales
          entre los grandes momentos de la historia.
        </p>
        <div className="lp-hero-actions">
          <Link to={`/${DEMO_SLUG}`} className="lp-btn lp-btn--primary">
            Ver demo
          </Link>
          <a href="#como-funciona" className="lp-btn lp-btn--ghost">
            Saber más
          </a>
        </div>
      </div>
      <div className="lp-hero-illustration" aria-hidden="true">
        <TimelineIllustration />
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="lp-steps" id="como-funciona">
      <h2 className="lp-section-title">Cómo funciona</h2>
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
          title="Preguntale a la IA"
          desc="Hacé preguntas sobre cualquier evento o período. La IA responde con contexto y profundidad."
        />
        <StepCard
          number="3"
          icon={<CausalIcon />}
          title="Descubrí conexiones"
          desc="Activá el modo causal para ver cómo un evento lleva al siguiente a lo largo del tiempo."
        />
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="lp-features">
      <h2 className="lp-section-title">Todo lo que necesitás para estudiar historia</h2>
      <div className="lp-features-grid">
        <FeatureCard
          icon={<ZoomIcon />}
          title="Zoom temporal"
          desc="Acercate a un año puntual o alejate para ver siglos de un vistazo."
        />
        <FeatureCard
          icon={<FilterIcon />}
          title="Filtros por categoría"
          desc="Político, militar, económico, social y diplomático. Enfocate en lo que importa."
        />
        <FeatureCard
          icon={<GraphIcon />}
          title="Relaciones causales"
          desc="Visualizá las flechas de causalidad que conectan eventos históricos."
        />
        <FeatureCard
          icon={<AIIcon />}
          title="Chat con IA"
          desc="Profundizá cualquier evento con respuestas generadas por inteligencia artificial."
        />
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="lp-cta-banner">
      <h2 className="lp-cta-banner-title">Empezá a explorar gratis</h2>
      <p className="lp-cta-banner-sub">
        No necesitás cuenta. Abrí el demo y empezá a descubrir.
      </p>
      <Link to={`/${DEMO_SLUG}`} className="lp-btn lp-btn--inverse lp-btn--lg">
        Probá gratis
      </Link>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="lp-footer">
      <span>© {new Date().getFullYear()} Historias en el Tiempo</span>
      <a href={SITE_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
        @historic.timelines
      </a>
      <Link to="/app">Entrar a la app</Link>
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

type FeatureCardProps = { icon: React.ReactNode; title: string; desc: string };

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="lp-feature-card">
      <div className="lp-feature-icon">{icon}</div>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{desc}</p>
    </div>
  );
}

// ── Illustration ─────────────────────────────────────────────────────────────

function TimelineIllustration() {
  return (
    <svg
      viewBox="0 0 480 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="lp-hero-svg"
    >
      {/* Period bands */}
      <rect x="36" y="62" width="148" height="48" rx="7" className="lp-svg-period-1" />
      <rect x="196" y="62" width="158" height="48" rx="7" className="lp-svg-period-2" />
      <rect x="366" y="62" width="86" height="48" rx="7" className="lp-svg-period-1" />

      {/* Period labels */}
      <text x="52" y="82" className="lp-svg-period-label lp-svg-period-1-text">Independencia</text>
      <text x="210" y="82" className="lp-svg-period-label lp-svg-period-2-text">Organización Nacional</text>
      <text x="378" y="82" className="lp-svg-period-label lp-svg-period-1-text">Modernización</text>

      {/* Year labels */}
      <text x="34" y="132" className="lp-svg-year-label">1810</text>
      <text x="192" y="132" className="lp-svg-year-label">1853</text>
      <text x="360" y="132" className="lp-svg-year-label">1880</text>
      <text x="434" y="132" className="lp-svg-year-label">1916</text>

      {/* Main axis */}
      <line x1="20" y1="110" x2="460" y2="110" className="lp-svg-axis" />

      {/* Tick marks */}
      {[36, 96, 140, 196, 255, 310, 366, 440].map((x, i) => (
        <line key={i} x1={x} y1="106" x2={x} y2="114" className="lp-svg-tick" />
      ))}

      {/* Causality arc */}
      <path
        d="M 80 103 Q 148 50 220 103"
        className="lp-svg-causal-arc"
      />
      <polygon points="222,104 215,98 224,97" className="lp-svg-causal-arrow" />

      {/* Events */}
      <circle cx="80" cy="110" r="7" className="lp-svg-event" />
      <circle cx="120" cy="110" r="7" className="lp-svg-event" />
      <circle cx="160" cy="110" r="6" className="lp-svg-event-secondary" />
      <circle cx="220" cy="110" r="7" className="lp-svg-event" />
      <circle cx="270" cy="110" r="7" className="lp-svg-event" />
      <circle cx="330" cy="110" r="6" className="lp-svg-event-secondary" />
      <circle cx="390" cy="110" r="7" className="lp-svg-event" />

      {/* Tooltip bubble for selected event */}
      <rect x="188" y="140" width="136" height="42" rx="8" className="lp-svg-tooltip" />
      <line x1="220" y1="118" x2="236" y2="140" className="lp-svg-tooltip-line" />
      <text x="200" y="157" className="lp-svg-tooltip-title">Revolución de Mayo</text>
      <text x="200" y="172" className="lp-svg-tooltip-sub">25 de mayo, 1810</text>
    </svg>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="19" cy="19" r="2" />
      <line x1="7" y1="11" x2="17" y2="6" />
      <line x1="7" y1="13" x2="17" y2="18" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 3.87-3.13 7-7 7s-7-3.13-7-7a7 7 0 0 1 7-7z" />
      <path d="M9 12l2 2 4-4" />
      <line x1="12" y1="16" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}
