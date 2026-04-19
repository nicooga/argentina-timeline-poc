# Guía para agentes (Cursor, Claude Code, etc.)

## Layout del visor

**Especificación completa:** [`docs/VIEWER_LAYOUT.md`](./docs/VIEWER_LAYOUT.md) (incluye tabla de contenedores, checklist y sección **“Trampas comunes”**).

En Cursor: regla siempre activa [`.cursor/rules/viewer-layout.mdc`](./.cursor/rules/viewer-layout.mdc).

### No regresar (resumen ejecutivo)

| Tema | Qué evitar | Por qué |
|------|------------|---------|
| **Overflow en un solo nodo** | `overflow-x: hidden` o `auto` **junto** con `overflow-y: visible` | Chromium fuerza `overflow-y: auto` → barra vertical “fantasma” (thumb enorme). Afectó `section.chart.chart-bleed.chart--viewer`, `.viewer-chart-wrap`, `.timeline-scroll`. |
| **`body` en modo visor** | Solo `height: 100dvh` sin tocar `min-height` | El `min-height: 100vh` global del `body` puede ser **>** `100dvh` → scroll global de pocos px. Hace falta **`min-height: 100dvh`** en `html.viewer-phase` y `body`. |
| **Ancho del chart** | Dejar el bleed `100vw` de `.chart-bleed` en el visor | Desborda el ancho útil; puede sumar al scroll. En **`.chart.chart-bleed.chart--viewer`** va `width: 100%` + `margin: 0`. |
| **Scroll del shell** | `overflow-y: auto` en `.viewer-shell` “para que quepa” | Convierte el visor en página scrolleable; no es el modelo deseado. |
| **Alto del timeline** | `max-height` + `overflow-y: auto` en `.viewer-chart-wrap` | Recorta el timeline; la fila del grid debe ser **`auto`** a altura de contenido. |

### Archivos a revisar al tocar el visor

- `src/App.tsx` — estructura DOM del visor y timeline
- `src/App.css` — `.viewer-main`, `.viewer-shell`, `.viewer-chart-wrap`, `section.chart.chart-bleed.chart--viewer`, `.timeline-scroll`
- `src/ViewerLower.tsx` / `src/ViewerLower.css` — panel inferior (grid `1fr`, scroll interno)
- `src/index.css` — `html.viewer-phase`, `#root`

### Otros puntos de entrada

- [`CLAUDE.md`](./CLAUDE.md) remite aquí.
- [`README.md`](./README.md) enlaza a `docs/VIEWER_LAYOUT.md`.
