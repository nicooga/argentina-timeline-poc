# Feature spec: AI execution plan UI

## Purpose

Definir la contraparte frontend del sistema backend de **AI Execution Plans**:
cuando el agente propone generar contenido histórico grande en pasos, el visor
debe permitir crear el plan, ejecutarlo, seguir su progreso, previsualizar las
operaciones resultantes y aplicarlas explícitamente al timeline.

Este documento no redefine el dominio ni el contrato completo de endpoints. La
fuente de verdad backend es:

- Backend spec: [`backend.codex/docs/features/ai-execution-plan.SPEC.md`](../../backend.codex/docs/features/ai-execution-plan.SPEC.md)
- Backend plan: [`backend.codex/docs/plans/ai-execution-plan.PLAN.md`](../../backend.codex/docs/plans/ai-execution-plan.PLAN.md)

## Scope

**In scope:** UI del panel AI (`AiChatPanel`), cliente HTTP AI, tipos frontend
para mensajes/planes/pasos, polling de estado, preview local desde
`TimelineOperation[]`, aplicación por `/operations`, refinamiento y estados de
error visibles para el usuario.

**Out of scope:** Semántica interna de generación, plantillas de pasos,
historiographic review, concurrencia de ejecución, persistencia backend,
cancelación de planes, edición manual de operaciones individuales y streaming.
Para esos temas, leer los documentos backend enlazados arriba.

## Behavior

### Entrada desde el chat

- Un mensaje assistant con `message_type = "response"` y `proposed_changes`
  sigue el flujo de preview directo existente.
- Un mensaje assistant con `message_type = "plan_proposal"` no trae cambios
  directos; muestra una acción primaria para crear un Execution Plan desde ese
  `source_message_id`.
- En modo local (`VITE_TIMELINES_API_BASE_URL=local`) la UI no ofrece acciones
  de planes, igual que no ofrece acciones HTTP del agente.

### Crear y ejecutar plan

- `start-plan` crea o recupera el draft asociado al mensaje. Si el backend
  responde `409` con un draft existente, la UI debe tratarlo como un resultado
  usable, no como un fallo fatal.
- El plan se muestra dentro del panel AI como una tarjeta asociada al mensaje
  fuente: status global, pasos resumidos y CTA `Ejecutar plan`.
- La ejecución requiere acción explícita del usuario. La UI no debe disparar
  `execute` automáticamente al crear el draft.

### Progreso y polling

- Durante `executing` o `refining`, la UI hace polling de
  `GET /execution-plans/{plan_id}` cada 5 segundos.
- Mostrar progreso como pasos completados / totales, pasos actualmente
  ejecutando y cantidad de intentos.
- Los pasos `generate_events_by_category` deben agruparse visualmente para no
  saturar el chat durante el fan-out paralelo. Basta una fila agregada con
  completados/ejecutando/fallidos y, opcionalmente, detalle expandible.
- El polling termina cuando el plan llega a `completed` o `failed`.

### Propuestas, preview y aplicación

- Al llegar a `completed`, la UI pide `GET /proposed-changes` y muestra un
  resumen por tipo de operación.
- Siempre que el plan tenga operaciones propuestas sin aplicar, la UI ofrece
  `Ver vista previa`.
- Si el plan llega a `failed` pero existen operaciones parciales, puede ofrecer
  `Ver vista previa parcial`, etiquetado como parcial.
- El preview se calcula localmente aplicando las operaciones al timeline actual.
  No se reemplaza el snapshot completo salvo como resultado de la respuesta del
  backend al aplicar.
- Mientras hay preview activo, las ediciones manuales del visor quedan
  deshabilitadas, igual que en previews AI directos.
- `Aplicar cambios` envía exactamente esas operaciones a
  `POST /timelines/{timeline_id}/operations`; al responder OK, refresca el
  timeline desde el snapshot devuelto y limpia el preview.
- Si aplicar devuelve error (especialmente `422`), mantener el preview activo y
  mostrar el error para no perder el contexto de revisión.

### Refinamiento

- En planes `completed`, mostrar un campo corto opcional para pedir refinamiento.
- `Refinar` llama `POST /execution-plans/{plan_id}/refine`, vuelve el plan a un
  estado activo y reusa el mismo polling.
- La UI conserva la misma tarjeta de plan y reemplaza el resumen de cambios al
  recibir las operaciones refinadas.

## Constraints and invariants

- **Backend como fuente de verdad:** estados, nombres de endpoints, step types y
  reglas de lifecycle vienen del spec backend; este spec solo fija la UX
  frontend.
- **Propuestas, no auto-apply:** ni mensajes directos ni planes se aplican sin
  acción explícita del usuario.
- **Preview local reversible:** `Cancelar preview` solo limpia estado local; no
  rechaza ni borra propuestas en backend.
- **Un solo modelo visual de preview:** previews directos y previews de plan
  comparten ring, resaltado de eventos/períodos y bloqueo de edición manual. El
  texto del banner diferencia origen: `Preview de cambios del agente` vs.
  `Preview de plan AI`.
- **Lanes generadas por backend:** normalizar al modelo visual actual:
  `political -> politico`, `military -> militar`, `economic -> economico`,
  `social -> social`. Hasta que haya lanes dinámicos, mapear `cultural` a
  `social` o mostrarlo como categoría desconocida sin romper render.
- **Layout del visor:** cualquier UI flotante nueva debe respetar
  [`VIEWER_LAYOUT.SPEC.md`](./VIEWER_LAYOUT.SPEC.md), especialmente no provocar
  scroll vertical global ni barras fantasma por combinaciones de overflow.

## Testing and verification

- Cliente HTTP:
  - parsea `message_type` y `proposed_changes`;
  - llama `startPlan`, `executePlan`, `getPlan`, `listPlans`,
    `getProposedChanges` y `refinePlan`;
  - trata `409` de `start-plan` como draft existente utilizable.
- Operaciones locales:
  - create/update/delete de eventos y períodos;
  - error o estado sin efecto para targets inexistentes;
  - diff correcto después de aplicar operaciones localmente;
  - normalización de lanes backend al set visual frontend.
- UI:
  - mensaje `plan_proposal` muestra `Crear plan`;
  - draft muestra `Ejecutar plan`;
  - `executing`/`refining` activa polling y muestra progreso;
  - `completed` habilita preview, aplicar y refinar;
  - aplicar usa `/operations` y limpia preview solo después de respuesta OK;
  - error al aplicar mantiene preview y muestra feedback.
- Verificación manual:
  - panel AI abierto/cerrado, con y sin preview;
  - viewport ancho y estrecho;
  - timeline navegable durante preview;
  - sin scroll vertical global del documento.

## Related

- Backend source of truth:
  [`ai-execution-plan.SPEC.md`](../../backend.codex/docs/features/ai-execution-plan.SPEC.md)
  and [`ai-execution-plan.PLAN.md`](../../backend.codex/docs/plans/ai-execution-plan.PLAN.md)
- Backend AI suggestions spec:
  [`generative-ai-timeline-suggestions.SPEC.md`](../../backend.codex/docs/features/generative-ai-timeline-suggestions.SPEC.md)
- Product AI interaction model: [`VIEWER.SPEC.md`](./VIEWER.SPEC.md)
- Viewer layout constraints: [`VIEWER_LAYOUT.SPEC.md`](./VIEWER_LAYOUT.SPEC.md)
- Spec template: [`TEMPLATE.SPEC.md`](./TEMPLATE.SPEC.md)
- [`AGENTS.md`](../AGENTS.md)
