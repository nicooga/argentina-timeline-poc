# Historias en el Tiempo — Product Spec

> Decisiones de producto y UX destiladas de la sesión de diseño. Fuente de verdad para agentes y colaboradores.

---

## 1. Misión y público

**Nombre:** Historias en el Tiempo (HT / *Historic Timelines*)  
**Instagram:** @historic.timelines

**Qué es:** Plataforma web para crear, explorar y enriquecer con IA líneas de tiempo sobre cualquier tema.

**Para quién:** Estudiantes, docentes, y cualquier persona que necesite entender o comunicar procesos históricos o secuenciales.

**Lo que no es:** Una app de Argentina solamente. El dataset de historia argentina (1810–1916) es el seed de prueba, no el alcance del producto.

---

## 2. Modelo de datos canónico

```
Timeline
├── events: TimelineEvent[]
│   ├── id: string           (slug único, auto-generado del título)
│   ├── title: string
│   ├── date: Date           (UTC al mediodía para evitar drift de timezone)
│   ├── lanes: EventLaneId[] (uno o más: politico | militar | economico | social | diplomatico)
│   ├── items: string[]      (bullet points de contenido)
│   ├── summary?: string
│   ├── importance?: "primary" | "secondary" | "contextual"
│   ├── causes?: string[]    (IDs de eventos anteriores)
│   ├── consequences?: string[]
│   └── links?: string[]
└── periods: Period[]
    ├── title: string
    ├── start: Date
    ├── end: Date
    ├── color: string        (hex, usado en la barra de color)
    ├── items: string[]
    └── links?: string[]
```

---

## 3. Modos de uso del visor

El visor tiene tres modos de uso que guían la jerarquía de la UI:

| Modo | Usuario | Acciones primarias |
|------|---------|-------------------|
| **Explorar** | Cualquiera | Navegar el eje, seleccionar eventos/períodos, ver detalle |
| **Estudiar** | Estudiante | Modo examen (oculta contenido), modo causal (resalta cadenas) |
| **Editar** | Autor | Crear/editar/eliminar eventos, usar el agente IA |

### Navbar propuesta (futura)
```
[≡ Índice]   [Título · rango]   ···   [Modo estudio ▾]   [★ IA]   [⋮ Más]
```
- **Izquierda:** índice (siempre visible)
- **Centro:** título + rango de fechas
- **Derecha:** modo estudio, acceso al agente, menú secundario
- **En "⋮ Más":** capas/filtros, crear evento, copiar timeline, tema visual, inicio, GitHub/Instagram, ayuda

*Esta propuesta queda pendiente de implementación.*

---

## 4. Agente IA — modelo de interacción

### Flujo completo
```
Usuario escribe pedido (Ctrl+Enter)
  → Mensaje del usuario aparece de inmediato (optimistic UI)
  → Servidor procesa y devuelve respuesta con proposed_changes
  → Se activa auto-preview: el timeline muestra los cambios
  → Usuario evalúa:
      [Aceptar]         → commit al backend → estado "Aplicado ✓"
      [Cancelar Preview]→ vuelve al timeline original (no descarta la propuesta)
      [Ver en timeline] → activa/desactiva el preview manualmente
```

### Contratos UX

- **Viewport ring** (borde de pantalla en color accent): indica que el visor está en modo preview
- **El ring no bloquea la navegación** — se puede explorar el timeline en preview
- **Las ediciones manuales están deshabilitadas durante preview** (Crear/Editar/Eliminar) para evitar conflictos
- **Aceptar no hace desaparecer los controles** — el mensaje queda con estado "Aplicado ✓"
- **Cancelar Preview no descarta la propuesta** — se puede volver a activar el preview más tarde
- **Sin-efecto:** si la propuesta no produciría cambios detectables, el botón Aceptar aparece deshabilitado

### Keyboard shortcuts del agente

| Acción | Shortcut |
|--------|---------|
| Enviar mensaje | `Ctrl+Enter` |
| Aceptar cambios (en preview, input vacío) | `Ctrl+Enter` |
| Cancelar preview | `Escape` |
| Activar preview del mensaje actual | Clic en "Ver en timeline" |

### Formato del backend

El backend devuelve `proposed_changes` (lista de operaciones) en lugar de snapshots completos:
```ts
type TimelineChange = {
  type: "create_event" | "update_event" | "delete_event" | 
        "create_period" | "update_period" | "delete_period";
  target_id: string | null;
  data: Record<string, unknown> | null;
  rationale: string;
}
```

El endpoint `POST /timelines/{id}/operations` aplica los cambios en el backend.

---

## 5. Clusters de eventos

Cuando varios eventos están muy próximos en el eje a un nivel de zoom dado, se colapsan en un marcador de cluster ("N ev.").

- **Click en cluster:** zoom automático hasta descolapsar, **centrado en la posición del cursor** (no en el centro del cluster)
- **Animación de entrada:** los eventos aparecen con fade-in al descolapsar
- **Animación de salida del cluster:** transición suave al aparecer/desaparecer

---

## 6. Indicadores visuales de preview

| Elemento | Normal | Preview activo |
|----------|--------|---------------|
| Borde del viewport | Ninguno | Ring de 3px en `--accent`, animado |
| Eventos nuevos (dot en carril) | Color de carril, tamaño normal | 3× ancho, color accent, pulso |
| Eventos modificados (dot) | Color de carril | 2× ancho, tinte ámbar |
| Períodos nuevos | Normal | Outline accent pulsante |
| Períodos modificados | Normal | Outline ámbar estático |
| Títulos de eventos nuevos | Normal | Texto accent + negrita + pulso en disco |
| Títulos de eventos modificados | Normal | Texto ámbar + disco ámbar |
| Tab del chat IA | "Asistente IA" | Badge "Vista previa" |

---

## 7. Pendientes / no decidido

- [ ] **Navbar refactor:** simplificar barra a 3–4 elementos visibles con menú secundario
- [ ] **Drag-resize del panel de chat IA:** permitir agrandar el panel de conversación
- [ ] **Persistencia de conversaciones:** actualmente el historial de chat no persiste entre sesiones
- [ ] **Streaming de respuestas:** el agente responde en batch; sería mejor con streaming
- [ ] **Múltiples usuarios:** el modelo actual no tiene autenticación ni multi-tenant
- [ ] **Animación de salida de nodos:** cuando los eventos se colapsan de vuelta en un cluster, no se animan (limitación técnica: React unmount no permite CSS exit animations sin mantener el nodo en DOM)
