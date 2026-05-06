# Misión del proyecto — Historias en el Tiempo (HT)

## Qué es

**Historias en el Tiempo** (HT; *Historic Timelines* en inglés) es una **plataforma web** para crear, compartir, explorar y enriquecer líneas del tiempo de cualquier tema. El núcleo es un visor interactivo que permite navegar períodos históricos y eventos puntuales en un eje temporal, con zoom, filtros semánticos y relaciones causales.

La línea del tiempo de la historia argentina (1810–1916) es el **dataset semilla** con el que se construyó el proof-of-concept. No define el alcance del producto.

## Para quién

El público principal son **estudiantes y docentes argentinos** de secundaria y universidad, especialmente en materias de historia, ciencias sociales y política. El español rioplatense es el idioma de la interfaz y del contenido por defecto.

Secundariamente: divulgadores, periodistas o investigadores que necesitan contextualizar eventos en un eje temporal.

La plataforma puede albergar líneas del tiempo de cualquier tema e idioma, pero las decisiones de diseño deben favorecer al usuario argentino como caso base.

## Qué queremos lograr

1. **Explorar** — cualquiera puede navegar una línea del tiempo publicada sin fricción (no se requiere cuenta).
2. **Compartir** — cada línea del tiempo tiene una URL propia y permanente.
3. **Editar** — autores registrados pueden crear y modificar sus propias líneas del tiempo desde la plataforma.
4. **Generar** — asistencia con IA (Claude API) para enriquecer eventos, generar narrativas causales y responder preguntas sobre el contenido.

## Lo que no es

- No es una enciclopedia ni una fuente de autoridad. El contenido lo ponen los usuarios (o los autores del dataset semilla).
- No es una herramienta solo de historia argentina. Cualquier tema, idioma y rango temporal debe funcionar.
- No es un producto terminado. Estamos iterando desde el proof-of-concept hacia la plataforma completa.

## Implicancias para agentes y desarrolladores

- Al nombrar variables, rutas, mensajes de UI o estructura de datos: evitar nombres que asuman "Argentina" o una categoría semántica específica (p. ej. `politico`, `militar`). Preferir genéricos que funcionen para cualquier dominio.
- El dataset de historia argentina es un ejemplo; la plataforma debe soportar múltiples `Timeline` de distintos autores y temas.
- Las decisiones de diseño de producto deben favorecer al **estudiante explorador** como usuario primario y al **docente editor** como usuario secundario.
