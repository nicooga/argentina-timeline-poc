# Historia Argentina — Línea de tiempo

Prueba de concepto web interactiva: una línea de tiempo de la historia argentina con períodos coloreados y eventos puntuales, construida con React y TypeScript.

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior (coincide con el entorno de CI)

## Desarrollo

```bash
npm install
npm run dev
```

La app se sirve con Vite en modo desarrollo (por defecto en `http://localhost:5173`).

## Scripts

| Comando        | Descripción                          |
| -------------- | ------------------------------------ |
| `npm run dev`  | Servidor de desarrollo con hot reload |
| `npm run build`| Typecheck (`tsc`) y build de producción en `dist/` |
| `npm run preview` | Vista previa local del build de producción |

## Layout del visor

El comportamiento esperado del visor (timeline arriba, listas y detalle abajo, sin scroll del documento) está descrito en [`docs/VIEWER_LAYOUT.md`](./docs/VIEWER_LAYOUT.md).

Para asistentes de código (Cursor, Claude Code, etc.): [`AGENTS.md`](./AGENTS.md) (resumen y trampas), [`docs/VIEWER_LAYOUT.md`](./docs/VIEWER_LAYOUT.md) (spec + checklist) y en Cursor la regla [`.cursor/rules/viewer-layout.mdc`](./.cursor/rules/viewer-layout.mdc) (`alwaysApply: true`).

## Datos y tipos

- Los datos de la línea de tiempo viven en [`timelineHistoriaArgentina.ts`](./timelineHistoriaArgentina.ts).
- Los tipos (`Timeline`, `Period`, `TimelineEvent`, etc.) están en [`types.ts`](./types.ts).

Las fechas se modelan en UTC a mediodía para evitar desplazamientos por zona horaria del navegador.

## Despliegue (GitHub Pages)

El workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) construye y publica el sitio al hacer push a la rama `master` (también se puede disparar manualmente con *workflow_dispatch*).

Vite usa `base: /nombre-del-repo/` cuando existe la variable de entorno `GITHUB_REPOSITORY` en CI, de modo que los assets resuelvan bien bajo GitHub Pages. En local, `base` es `/`.

## Stack

- React 19
- TypeScript
- Vite 6
