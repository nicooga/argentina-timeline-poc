# Layout del visor (modo línea de tiempo)

Este documento describe el **comportamiento esperado** del layout en la fase “visor” de la app (`App` en modo `viewer`, clase `viewer-phase` en `html`). Sirve como referencia al tocar CSS o estructura de contenedores.

## Objetivo general

- La app ocupa el **viewport** (altura dinámica del navegador, p. ej. `100dvh`).
- **No** debe existir scroll vertical del **documento** ni de un contenedor que envuelva toda la pantalla como si fuera una página larga.
- El espacio vertical se **reparte** entre dos regiones claras: visor superior (timeline) y visor inferior (listas + detalle).

## Dos regiones principales

### 1. Visor superior (timeline)

**Contenedores relevantes (de afuera hacia adentro):**  
`.viewer-chart-wrap` → `<section class="chart chart-bleed chart--viewer">` → `.timeline-scroll` → `.timeline-stack` (eje, períodos, carriles, eventos, títulos, etc.).

**Comportamiento esperado:**

- Debe ocupar **tanta altura vertical como necesite su contenido** para mostrar el timeline completo (eje con marcas apiladas, barras de período, carriles semánticos, fila de títulos con carriles de etiquetas, controles de zoom cuando están en flujo, etc.).
- **No** debe mostrar **scroll vertical propio** (ni `overflow-y: auto` / scroll interno “recortando” el chart con una barra al costado del bloque del timeline).
- El scroll **horizontal** del eje (zoom, arrastre) sigue siendo responsabilidad de `.timeline-scroll`; eso es intencional.

En CSS, la primera fila del grid principal del visor (`.viewer-main`) tiene traza `auto`: la altura de esa fila es la del contenido del timeline, no un tope fijo en `vh`/`rem` que fuerce scroll dentro del wrap.

### 2. Visor inferior

**Componente:** `ViewerLower` (raíz `.viewer-lower`).

**Comportamiento esperado:**

- Ocupa **todo el espacio vertical que sobra** debajo del visor superior, dentro del mismo viewport.
- En **desktop** (ancho suficiente): dos columnas — a la izquierda listas colapsables (períodos y eventos), a la derecha el panel de detalle de lo seleccionado.
- En **móvil / estrecho**: suele apilarse en dos filas (listas arriba, detalle abajo); las reglas exactas están en `ViewerLower.css`.
- El **scroll vertical** cuando las listas o el detalle no entran **solo** ocurre **dentro** de esos paneles (p. ej. `.viewer-lower-scroll-block`, `.viewer-lower-detail`), no en el timeline ni en el cuerpo de la página.

## Cadena de layout (referencia rápida)

| Capa | Rol |
|------|-----|
| `html.viewer-phase`, `body`, `#root` | Altura acotada al viewport, `overflow: hidden` para evitar scroll del documento. |
| `.app--viewer` | Columna flex que llena `#root`. |
| `.viewer-shell` | Columna flex que llena el espacio bajo la barra de herramientas; **sin** scroll vertical de “página entera”. |
| `.viewer-main` | **CSS Grid**: fila 1 `auto` (timeline), fila 2 `minmax(0, 1fr)` (visor inferior). `min-height: 0` y `overflow: hidden` para que el `1fr` tenga altura bien definida y el scroll quede encapsulado en el inferior. |
| `.viewer-chart-wrap` | Fila 1 del grid; alineación que respeta altura al contenido (`align-self: start`, `min-height` mínimo razonable + `min-content` donde aplique). |
| `.viewer-lower` | Fila 2 del grid; `min-height: 0` para permitir que sus hijos hagan scroll interno. |

Los detalles concretos viven en `src/App.css`, `src/ViewerLower.css` y `src/index.css` (reglas bajo `html.viewer-phase`).

## Caso límite (contenido muy alto)

Si la altura **intrínseca** del timeline superara la del viewport menos cabecera, con viewport fijo y sin scroll global **no** cabría mostrar todo sin sacrificar algo (recorte, scroll en otro sitio, o reducir densidad de UI). El diseño actual asume que, sin capas artificiales que limiten el alto del chart, el timeline cabe en pantallas típicas y el inferior absorbe el resto; si en el futuro el dataset o el zoom hicieran el bloque enorme, habría que replantear (p. ej. política explícita de overflow o compactación).

## Al cambiar el layout

- Evitar `max-height` + `overflow-y: auto` en `.viewer-chart-wrap` salvo decisión explícita de producto (rompe el contrato del visor superior).
- Evitar `overflow-y: auto` en `.viewer-shell` para “arreglar” el timeline: vuelve a parecer scroll de página completa dentro del shell.
- La clase base `.chart-bleed` usa `width: 100vw` y márgenes negativos para “romper” el ancho del contenedor; en el visor el timeline ya va a ancho completo, así que `.chart.chart-bleed.chart--viewer` fuerza `width: 100%` y márgenes `0` para no desbordar el viewport cuando hay scrollbar vertical (evita scroll global fantasma).
- En `index.css`, `html.viewer-phase` y `body` deben fijar también **`min-height: 100dvh`**: si no, el `min-height: 100vh` global de `body` puede ser mayor que `height: 100dvh` y generar scroll del documento por unos píxeles.
- **No** uses en el mismo elemento `overflow-x: hidden` (o `auto`/`scroll`) junto con `overflow-y: visible`: en Chromium/WebKit `overflow-y` se calcula como `auto` y puede aparecer una **barra de scroll vertical casi llena** en ese nodo (p. ej. el `<section class="chart chart-bleed chart--viewer">` o `.viewer-chart-wrap`). Usá `overflow: visible` y dejá el recorte en un ancestro con `overflow: hidden` en ambos ejes (p. ej. `.viewer-main`).
- Lo mismo aplica a **`.timeline-scroll`** dentro del visor: con `overflow-x: auto` no conviene `overflow-y: visible`; usar `hidden` o `clip` (con `hidden` como respaldo).
- Tras cambios, comprobar: sin selección / con selección, chrome del timeline expandido y colapsado, y ancho móvil vs. desktop.

---

## Trampas comunes (bugs reales que ya aparecieron)

Resumen para **no regresar** al tocar CSS del visor o del documento.

### 1. Par `overflow-x` ≠ `visible` + `overflow-y: visible` (Chromium / WebKit)

En el **mismo nodo**, si `overflow-x` es `hidden`, `auto` o `scroll` y `overflow-y` es `visible`, el motor suele **forzar `overflow-y: auto`**. El síntoma es una **barra vertical con thumb enorme** (casi toda la altura del contenedor) y unos pocos píxeles de “contenido scrollable”.

**Nodos que ya se corrigieron:** `section.chart.chart-bleed.chart--viewer`, `.viewer-chart-wrap`, `.timeline-scroll` (este último lleva `overflow-x: auto` para el pan horizontal del eje → `overflow-y` debe ser `clip` o `hidden`, no `visible`).

### 2. `body { min-height: 100vh }` vs `height: 100dvh` en modo visor

El `body` global tiene `min-height: 100vh`. En muchos navegadores **`100vh` puede ser mayor que `100dvh`**. Si en `html.viewer-phase body` solo ponés `height: 100dvh` **sin** anular el mínimo, el **mínimo gana** y el documento queda unos píxeles más alto que la ventana visible → scroll global.

**Solución aplicada:** en el mismo bloque que `html.viewer-phase` y `html.viewer-phase body`, fijar también **`min-height: 100dvh`** (alineado con `height` / `max-height`).

### 3. Bleed `.chart-bleed` con `100vw` dentro del visor

`.chart-bleed` usa `width: 100vw` y márgenes negativos. `100vw` incluye el ancho de la **barra de scroll** del viewport en varios entornos → el bloque es **más ancho** que el área útil → overflow horizontal y, a veces, scroll vertical raro.

**Solución aplicada:** en `.chart.chart-bleed.chart--viewer`, `width: 100%`, `max-width: 100%`, `margin: 0`, `overflow: visible` (sin el par problemático del apartado 1).

### 4. “Arreglar” el timeline con scroll en `.viewer-shell`

Poner `overflow-y: auto` en `.viewer-shell` hace que **toda la UI del visor** scrollee como una página; contradice el modelo (timeline a altura de contenido + inferior con `1fr` y scroll interno).

### 5. `max-height` + scroll en `.viewer-chart-wrap`

Un tope en `vh`/`rem` + `overflow-y: auto` en el wrap **recorta** el timeline y obliga a scrollear dentro del chart; el producto espera **altura al contenido** en la fila `auto` del grid.

### 6. Aclaración: `.timeline-scroll` y scroll horizontal

El **scroll horizontal** del eje (zoom, arrastre) es intencional y vive en `.timeline-scroll`. Eso no contradice “sin scroll vertical fantasma”: el problema era el **`overflow-y` mal emparejado** con `overflow-x`, no la existencia de `overflow-x: auto`.

---

## Checklist rápida (después de tocar layout)

1. Modo visor: **no** debe haber barra de scroll del **documento** (viewport fijo).
2. **Sin** barra vertical “rara” en el borde del chart / wrap / `timeline-scroll` (thumb casi full-height).
3. Con y **sin** ítem seleccionado; chrome del timeline **expandido** y **colapsado**.
4. Ancho estrecho (móvil) y ancho desktop; si podés, **Chrome** y **Firefox**.
5. Si tocás `overflow` en un nodo, revisá el **apartado 1** de arriba antes de commitear.
