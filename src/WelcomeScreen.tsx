import "./WelcomeScreen.css";

type WelcomeScreenProps = {
  onEnter: () => void;
};

export function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-screen-inner">
        <h1 className="welcome-title">Historia Argentina en el tiempo</h1>
        <p className="welcome-lead">
          Este proyecto es un visor interactivo de la historia argentina: períodos
          como franjas en una línea temporal y eventos puntuales enlazados al
          eje. Podés explorar por toque o teclado, ampliar el eje y leer el
          detalle de cada período o evento.
        </p>
        <p className="welcome-note">
          Pensado para usarse en escritorio y en tablet: el visor ocupa toda la
          pantalla y adapta el espacio cuando elegís un elemento.
        </p>
        <button type="button" className="welcome-cta" onClick={onEnter}>
          Entrar al visor
        </button>
      </div>
    </div>
  );
}
