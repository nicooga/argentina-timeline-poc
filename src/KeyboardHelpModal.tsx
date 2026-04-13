import { useEffect, useId, useRef } from "react";
import "./KeyboardHelpModal.css";

type KeyboardHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardHelpModal({ open, onClose }: KeyboardHelpModalProps) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="help-modal-root"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="help-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="help-modal-header">
          <h2 id={titleId} className="help-modal-title">
            Atajos de teclado
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="help-modal-close"
            onClick={onClose}
            aria-label="Cerrar ayuda"
          >
            Cerrar
          </button>
        </div>
        <ul className="keyboard-cheatsheet-list help-modal-list">
          <li className="keyboard-cheatsheet-row">
            <span className="keyboard-cheatsheet-label">
              Desplazar la línea de tiempo (horizontal)
            </span>
            <span className="keyboard-cheatsheet-keys">
              <kbd className="kbd">←</kbd>
              <kbd className="kbd">→</kbd>
              <span className="keyboard-cheatsheet-or">o</span>
              <kbd className="kbd">A</kbd>
              <span className="keyboard-cheatsheet-slash">/</span>
              <kbd className="kbd">D</kbd>
              <span className="keyboard-cheatsheet-or">o</span>
              <kbd className="kbd">H</kbd>
              <span className="keyboard-cheatsheet-slash">/</span>
              <kbd className="kbd">L</kbd>
            </span>
          </li>
          <li className="keyboard-cheatsheet-row">
            <span className="keyboard-cheatsheet-label">
              Desplazar listas o el panel de detalle (vertical)
            </span>
            <span className="keyboard-cheatsheet-keys">
              <kbd className="kbd">↑</kbd>
              <kbd className="kbd">↓</kbd>
              <span className="keyboard-cheatsheet-or">o</span>
              <kbd className="kbd">W</kbd>
              <span className="keyboard-cheatsheet-slash">/</span>
              <kbd className="kbd">S</kbd>
              <span className="keyboard-cheatsheet-or">o</span>
              <kbd className="kbd">K</kbd>
              <span className="keyboard-cheatsheet-slash">/</span>
              <kbd className="kbd">J</kbd>
            </span>
          </li>
          <li className="keyboard-cheatsheet-row">
            <span className="keyboard-cheatsheet-label">
              Ampliar o reducir la escala del eje (sobre la línea de tiempo)
            </span>
            <span className="keyboard-cheatsheet-keys">
              <kbd className="kbd">Ctrl</kbd>
              <span className="keyboard-cheatsheet-slash">+</span>
              <kbd className="kbd">rueda</kbd>
            </span>
          </li>
          <li className="keyboard-cheatsheet-row keyboard-cheatsheet-row--touch">
            <span className="keyboard-cheatsheet-label">
              Pantalla táctil: pellizcar en la línea de tiempo
            </span>
            <span className="keyboard-cheatsheet-keys keyboard-cheatsheet-keys--text">
              dos dedos
            </span>
          </li>
          <li className="keyboard-cheatsheet-row">
            <span className="keyboard-cheatsheet-label">
              Abrir o cerrar esta ayuda
            </span>
            <span className="keyboard-cheatsheet-keys">
              <kbd className="kbd">?</kbd>
            </span>
          </li>
        </ul>
        <p className="keyboard-cheatsheet-note help-modal-note">
          Los atajos de flechas y letras no aplican con Ctrl, Alt ni Meta (salvo
          Ctrl + rueda en la línea de tiempo; en macOS también funciona Cmd +
          rueda); se ignoran si estás escribiendo en un campo de texto. En móvil
          o tablet podés deslizar con un dedo y pellizcar con dos para el zoom
          del eje.
        </p>
      </div>
    </div>
  );
}
