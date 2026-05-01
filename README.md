# Historia Argentina en el tiempo

Visor web interactivo para explorar la historia argentina entre 1810 y 1916. El proyecto muestra períodos históricos como franjas sobre un eje temporal y eventos puntuales organizados por carriles semánticos, con zoom, navegación, selección de detalles y relaciones causales.

Es una prueba de concepto frontend construida con React, TypeScript y Vite.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Vite sirve la aplicación en `http://localhost:5173` por defecto.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta el servidor de desarrollo con hot reload. |
| `npm run build` | Ejecuta `tsc`, genera el build en `dist/` y copia `index.html` como `404.html` para GitHub Pages. |
| `npm run preview` | Sirve localmente el build de producción. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |
| `npm run test` | Ejecuta Vitest en modo interactivo/watch. |
| `npm run test:ci` | Ejecuta la suite de tests una vez, pensado para CI. |

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Pantalla de bienvenida. |
| `/visor` | Visor full-screen de la línea de tiempo. |
| `*` | Redirección a `/`. |

El `basename` se toma de `import.meta.env.BASE_URL`, por lo que en GitHub Pages la app puede vivir bajo `/<repo>/` y en local bajo `/`.

## Stack

- React 19
- TypeScript 5.7
- React Router DOM 7
- Vite 6
- Vitest
- ESLint
- CSS plano con variables

## Estructura principal

```text
.
├── src/
│   ├── App.tsx                         # Visor principal
│   ├── App.css                         # Layout y estilos del visor/timeline
│   ├── main.tsx                        # Entrada React
│   ├── shell/                          # Router, bienvenida y modal de ayuda
│   ├── timeline/                       # Layout puro de etiquetas/eje y UI del timeline
│   ├── timelineEdition/                # Servicios/repositorios para edición de eventos
│   └── viewer/                         # Panel inferior del visor
├── timelineHistoriaArgentina.ts        # Dataset de períodos y eventos
├── eventLanes.ts                       # Carriles semánticos
├── causality.ts                        # Relaciones causales entre eventos
├── types.ts                            # Tipos de dominio
├── docs/                               # Specs de producto/layout
└── vite.config.ts
```

## Modelo de datos

Los tipos principales viven en [`types.ts`](./types.ts):

- `Timeline`: colección de `periods` y `events`.
- `Period`: franja histórica con `start`, `end`, `color`, descripción y links opcionales.
- `TimelineEvent`: evento puntual con `date`, `lanes`, importancia, causas, consecuencias y links opcionales.

Los datos actuales están en [`timelineHistoriaArgentina.ts`](./timelineHistoriaArgentina.ts). Las fechas se modelan como UTC al mediodía para evitar desplazamientos por zona horaria del navegador.

## Carriles semánticos

Los eventos pueden pertenecer a uno o más carriles:

- `politico`
- `militar`
- `economico`
- `social`
- `diplomatico`

La configuración visual y el orden de los carriles están en [`eventLanes.ts`](./eventLanes.ts).

## Specs de layout

Este repo usa specs en `docs/<NOMBRE>.SPEC.md`. Antes de tocar layout del visor o del timeline, leer:

- [`docs/VIEWER_LAYOUT.SPEC.md`](./docs/VIEWER_LAYOUT.SPEC.md): viewport, grid, overflow y scroll.
- [`docs/TIMELINE_LAYOUT.SPEC.md`](./docs/TIMELINE_LAYOUT.SPEC.md): eje, etiquetas, carriles, conectores y pruebas.
- [`docs/TEMPLATE.SPEC.md`](./docs/TEMPLATE.SPEC.md): plantilla para specs nuevas.
- [`docs/MASTER.md`](./docs/MASTER.md): documentación de contexto para mantenedores y agentes.

Resumen práctico: el visor debe ocupar el viewport sin scroll vertical del documento; el scroll vertical pertenece a los paneles internos y el scroll horizontal al timeline. Evitar combinaciones de `overflow-x` no visible con `overflow-y: visible`, porque Chromium puede generar una barra vertical fantasma.

## Tests

La suite actual cubre funciones puras de layout del timeline y servicios de edición:

```bash
npm run test:ci
```

Vitest busca tests con el patrón `src/**/*.test.ts`, definido en [`vite.config.ts`](./vite.config.ts).

## Calidad

Antes de abrir un PR o cambiar comportamiento de layout:

```bash
npm run lint
npm run test:ci
npm run build
```

Si el cambio toca CSS del visor, verificar manualmente `/visor` en viewport ancho y estrecho, con y sin selección activa, y revisar que no aparezca scroll vertical global ni barras fantasma en el chart.

## Despliegue

Hay workflows de GitHub Actions para CI y deploy:

- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)
- [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

El build usa `GITHUB_REPOSITORY` para configurar `base` como `/<repo>/` durante el despliegue en GitHub Pages. En local, `base` es `/`.

## Guía para agentes

Las instrucciones operativas para asistentes están en [`AGENTS.md`](./AGENTS.md). En Cursor, la regla permanente del layout del visor vive en [`.cursor/rules/viewer-layout.mdc`](./.cursor/rules/viewer-layout.mdc).
