import React, {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type {
  AiConversation,
  AiMessage,
  ExecutionPlan,
  ExecutionPlanStep,
  TimelineChange,
} from "../timelineEdition/aiConversation";
import "./AiChatPanel.css";

export type AiChatError = { kind: "send" | "apply" | "preview"; message: string };

export type AiPlanPanelState = {
  sourceMessageId: string;
  plan: ExecutionPlan;
  operations: TimelineChange[];
  operationsStatus: ExecutionPlan["status"] | null;
  loading: boolean;
  error: string | null;
};

type Props = {
  collapsed: boolean;
  conversation: AiConversation | null;
  loading: boolean;
  sending: boolean;
  applyingMessageId: string | null;
  appliedMessageIds: ReadonlySet<string>;
  noEffectMessageIds: ReadonlySet<string>;
  previewedMessageId: string | null;
  planStates: Readonly<Record<string, AiPlanPanelState>>;
  error: AiChatError | null;
  onToggleCollapsed: () => void;
  onSend: (content: string) => void;
  onApply: (changes: TimelineChange[], messageId: string) => void;
  onDismiss: (messageId: string) => void;
  onPreview: (changes: TimelineChange[], messageId: string) => void;
  onCancelPreview: () => void;
  onStartPlan: (messageId: string) => void;
  onExecutePlan: (planId: string) => void;
  onPreviewPlan: (planId: string) => void;
  onApplyPlan: (planId: string) => void;
  onRefinePlan: (planId: string, prompt: string) => void;
  onRetryStep: (planId: string, stepId: string) => void;
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  create_event: "Crear evento",
  update_event: "Actualizar evento",
  delete_event: "Eliminar evento",
  upsert_event: "Crear/actualizar evento",
  create_period: "Crear período",
  update_period: "Actualizar período",
  delete_period: "Eliminar período",
};

function changeLabel(change: TimelineChange): string {
  const base = CHANGE_TYPE_LABELS[change.type] ?? change.type;
  const title =
    (change.data?.title as string | undefined) ?? change.target_id ?? null;
  return title ? `${base}: ${title}` : base;
}

function ShortcutHint({ children }: { children: string }) {
  return <span className="ai-btn-shortcut">{children}</span>;
}

function ProposedChanges({
  message,
  applyingMessageId,
  applied,
  noEffect,
  previewing,
  onApply,
  onPreview,
  onCancelPreview,
}: {
  message: AiMessage;
  applyingMessageId: string | null;
  applied: boolean;
  noEffect: boolean;
  previewing: boolean;
  onApply: (changes: TimelineChange[], messageId: string) => void;
  onPreview: (changes: TimelineChange[], messageId: string) => void;
  onCancelPreview: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { proposedChanges, id } = message;

  if (proposedChanges.length === 0) return null;

  const applying = applyingMessageId === id;
  const busy = applyingMessageId != null;

  const countLabel =
    proposedChanges.length === 1
      ? "1 cambio propuesto"
      : `${proposedChanges.length} cambios propuestos`;

  if (applied) {
    return (
      <div className="ai-chat-changes ai-chat-changes--applied">
        <span className="ai-chat-changes__applied-label">
          {countLabel} — aplicados ✓
        </span>
      </div>
    );
  }

  return (
    <div className="ai-chat-changes">
      <button
        type="button"
        className="ai-chat-changes__toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`ai-chat-changes__chevron${expanded ? " ai-chat-changes__chevron--open" : ""}`}
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 9l6 6 6-6"
          />
        </svg>
        <span>{countLabel}</span>
      </button>

      {expanded && (
        <ul className="ai-chat-changes__list">
          {proposedChanges.map((change, i) => (
            <li key={i} className="ai-chat-changes__item">
              <span className="ai-chat-changes__item-label">
                {changeLabel(change)}
              </span>
              <span className="ai-chat-changes__item-rationale">
                {change.rationale}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="ai-chat-changes__actions">
        {noEffect ? (
          <div className="ai-btn-wrap">
            <button
              type="button"
              className="viewer-editor-btn ai-chat-changes__preview-btn"
              disabled
              title="Sin cambios detectables en el timeline"
            >
              Sin efecto
            </button>
          </div>
        ) : previewing ? (
          <div className="ai-btn-wrap">
            <button
              type="button"
              className="viewer-editor-btn ai-chat-changes__preview-btn ai-chat-changes__preview-btn--active"
              onClick={onCancelPreview}
            >
              Vista previa activa
            </button>
          </div>
        ) : (
          <div className="ai-btn-wrap">
            <button
              type="button"
              className="viewer-editor-btn ai-chat-changes__preview-btn"
              disabled={busy}
              onClick={() => onPreview(proposedChanges, id)}
            >
              Ver en timeline
            </button>
          </div>
        )}
        <div className="ai-btn-wrap">
          <button
            type="button"
            className="viewer-editor-btn"
            disabled={busy || noEffect}
            title={noEffect ? "Sin cambios detectables en el timeline" : undefined}
            onClick={() => onApply(proposedChanges, id)}
          >
            {applying ? "Aplicando…" : "Aceptar"}
          </button>
          {previewing && <ShortcutHint>Ctrl+↵</ShortcutHint>}
        </div>
        {previewing && (
          <div className="ai-btn-wrap">
            <button
              type="button"
              className="viewer-editor-btn viewer-editor-btn--danger"
              disabled={busy}
              onClick={onCancelPreview}
            >
              Cancelar preview
            </button>
            <ShortcutHint>Esc</ShortcutHint>
          </div>
        )}
      </div>
    </div>
  );
}

const STEP_LABELS: Record<string, string> = {
  generate_periods: "Períodos",
  review_periods: "Revisión de períodos",
  generate_events_by_category: "Eventos",
  review_events: "Revisión de eventos",
};

const PLAN_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  executing: "Ejecutando",
  completed: "Completado",
  refining: "Refinando",
  failed: "Falló",
};

function countOperations(changes: readonly TimelineChange[]): string {
  const parts = [
    compactCount(changes, "create_period", "período nuevo", "períodos nuevos"),
    compactCount(changes, "create_event", "evento nuevo", "eventos nuevos"),
    compactCount(changes, "update_period", "período actualizado", "períodos actualizados"),
    compactCount(changes, "update_event", "evento actualizado", "eventos actualizados"),
    compactCount(changes, "delete_period", "período removido", "períodos removidos"),
    compactCount(changes, "delete_event", "evento removido", "eventos removidos"),
    compactCount(changes, "upsert_event", "evento upsertado", "eventos upsertados"),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Sin operaciones listas";
}

function compactCount(
  changes: readonly TimelineChange[],
  type: TimelineChange["type"],
  singular: string,
  plural: string
): string | null {
  const count = changes.filter((change) => change.type === type).length;
  if (count === 0) return null;
  return `${count} ${count === 1 ? singular : plural}`;
}

function PlanStepSummary({
  steps,
  planFailed,
  onRetryStep,
}: {
  steps: ExecutionPlanStep[];
  planFailed: boolean;
  onRetryStep?: (stepId: string) => void;
}) {
  const eventSteps = steps.filter((step) => step.stepType === "generate_events_by_category");
  const otherSteps = steps.filter((step) => step.stepType !== "generate_events_by_category");
  const eventCompleted = eventSteps.filter((step) => step.status === "completed").length;
  const eventExecuting = eventSteps.filter((step) => step.status === "executing").length;
  const failedEventSteps = eventSteps.filter((step) => step.status === "failed");
  const eventFailed = failedEventSteps.length;
  const canRetry = planFailed && onRetryStep != null;

  return (
    <ul className="ai-plan-steps">
      {otherSteps.map((step) => (
        <li key={step.id} className={`ai-plan-step ai-plan-step--${step.status}`}>
          <span>{STEP_LABELS[step.stepType] ?? step.description}</span>
          <span>
            {step.status}
            {step.attemptCount > 0 ? ` · ${step.attemptCount}` : ""}
          </span>
          {canRetry && step.status === "failed" && (
            <button
              type="button"
              className="ai-plan-step__retry"
              onClick={() => onRetryStep!(step.id)}
            >
              Reintentar
            </button>
          )}
        </li>
      ))}
      {eventSteps.length > 0 ? (
        <>
          <li className={`ai-plan-step${eventFailed > 0 ? " ai-plan-step--failed" : ""}`}>
            <span>Eventos por categoría</span>
            <span>
              {eventCompleted}/{eventSteps.length}
              {eventExecuting > 0 ? ` · ${eventExecuting} activo` : ""}
              {eventFailed > 0 ? ` · ${eventFailed} falló` : ""}
            </span>
          </li>
          {canRetry &&
            failedEventSteps.map((step) => (
              <li key={step.id} className="ai-plan-step ai-plan-step--failed ai-plan-step--event-retry">
                <span>{step.description}</span>
                <button
                  type="button"
                  className="ai-plan-step__retry"
                  onClick={() => onRetryStep!(step.id)}
                >
                  Reintentar
                </button>
              </li>
            ))}
        </>
      ) : null}
    </ul>
  );
}

function PlanCard({
  state,
  previewing,
  applying,
  applied,
  onExecutePlan,
  onPreviewPlan,
  onApplyPlan,
  onRefinePlan,
  onRetryStep,
}: {
  state: AiPlanPanelState;
  previewing: boolean;
  applying: boolean;
  applied: boolean;
  onExecutePlan: (planId: string) => void;
  onPreviewPlan: (planId: string) => void;
  onApplyPlan: (planId: string) => void;
  onRefinePlan: (planId: string, prompt: string) => void;
  onRetryStep: (planId: string, stepId: string) => void;
}) {
  const [refinePrompt, setRefinePrompt] = useState("");
  const { plan, operations, loading, error } = state;
  const completed = plan.steps.filter((step) => step.status === "completed").length;
  const hasOperations = operations.length > 0;
  const active = plan.status === "executing" || plan.status === "refining";
  const partial = plan.status === "failed" && hasOperations;
  const canPreviewOperations = hasOperations && !applied;
  const canApplyOperations =
    (plan.status === "completed" || partial) && hasOperations && !applied;

  return (
    <div className={`ai-plan-card ai-plan-card--${plan.status}`}>
      <div className="ai-plan-card__head">
        <strong>Plan de ejecución</strong>
        <span>{PLAN_STATUS_LABELS[plan.status] ?? plan.status}</span>
      </div>
      <code className="ai-chat-debug-id">plan {plan.id}</code>
      <p className="ai-plan-card__meta">
        {completed}/{plan.steps.length} pasos completados
        {loading || active ? " · actualizando" : ""}
      </p>
      {plan.steps.length > 0 ? (
        <PlanStepSummary
          steps={plan.steps}
          planFailed={plan.status === "failed"}
          onRetryStep={(stepId) => onRetryStep(plan.id, stepId)}
        />
      ) : null}
      {hasOperations ? (
        <p className="ai-plan-card__ops">
          {applied ? "Aplicado: " : partial ? "Preview parcial: " : ""}
          {countOperations(operations)}
        </p>
      ) : null}
      {error ? <p className="ai-plan-card__error">{error}</p> : null}
      <div className="ai-chat-changes__actions ai-plan-card__actions">
        {plan.status === "draft" ? (
          <button
            type="button"
            className="viewer-editor-btn"
            disabled={loading}
            onClick={() => onExecutePlan(plan.id)}
          >
            {loading ? "Preparando…" : "Ejecutar plan"}
          </button>
        ) : null}
        {canPreviewOperations ? (
          <button
            type="button"
            className={`viewer-editor-btn ai-chat-changes__preview-btn${previewing ? " ai-chat-changes__preview-btn--active" : ""}`}
            onClick={() => onPreviewPlan(plan.id)}
          >
            {previewing
              ? "Vista previa activa"
              : partial
                ? "Ver vista previa parcial"
                : "Ver vista previa"}
          </button>
        ) : null}
        {canApplyOperations ? (
          <button
            type="button"
            className="viewer-editor-btn"
            disabled={applying}
            onClick={() => onApplyPlan(plan.id)}
          >
            {applying ? "Aplicando…" : "Aplicar cambios"}
          </button>
        ) : null}
      </div>
      {plan.status === "completed" ? (
        <form
          className="ai-plan-refine"
          onSubmit={(event) => {
            event.preventDefault();
            onRefinePlan(plan.id, refinePrompt);
            setRefinePrompt("");
          }}
        >
          <input
            value={refinePrompt}
            onChange={(event) => setRefinePrompt(event.target.value)}
            placeholder="Refinar con una indicación opcional"
            aria-label="Indicación para refinar el plan"
          />
          <button type="submit" className="viewer-editor-btn" disabled={loading}>
            Refinar
          </button>
        </form>
      ) : null}
    </div>
  );
}

function planPreviewId(planId: string): string {
  return `plan:${planId}`;
}

function MessageBubble({
  message,
  applyingMessageId,
  appliedMessageIds,
  noEffectMessageIds,
  previewedMessageId,
  onApply,
  onPreview,
  onCancelPreview,
  planState,
  onStartPlan,
  onExecutePlan,
  onPreviewPlan,
  onApplyPlan,
  onRefinePlan,
  onRetryStep,
}: {
  message: AiMessage;
  applyingMessageId: string | null;
  appliedMessageIds: ReadonlySet<string>;
  noEffectMessageIds: ReadonlySet<string>;
  previewedMessageId: string | null;
  planState: AiPlanPanelState | null;
  onApply: (changes: TimelineChange[], messageId: string) => void;
  onPreview: (changes: TimelineChange[], messageId: string) => void;
  onCancelPreview: () => void;
  onStartPlan: (messageId: string) => void;
  onExecutePlan: (planId: string) => void;
  onPreviewPlan: (planId: string) => void;
  onApplyPlan: (planId: string) => void;
  onRefinePlan: (planId: string, prompt: string) => void;
  onRetryStep: (planId: string, stepId: string) => void;
}) {
  const isPlanProposal =
    message.role === "assistant" && message.messageType === "plan_proposal";
  return (
    <div className={`ai-chat-bubble ai-chat-bubble--${message.role}`}>
      <code className="ai-chat-debug-id">message {message.id}</code>
      <p className="ai-chat-bubble__content">{message.content}</p>
      {message.role === "assistant" && message.messageType === "response" && (
        <ProposedChanges
          message={message}
          applyingMessageId={applyingMessageId}
          applied={appliedMessageIds.has(message.id)}
          noEffect={noEffectMessageIds.has(message.id)}
          previewing={previewedMessageId === message.id}
          onApply={onApply}
          onPreview={onPreview}
          onCancelPreview={onCancelPreview}
        />
      )}
      {isPlanProposal && !planState ? (
        <div className="ai-plan-card">
          <button
            type="button"
            className="viewer-editor-btn"
            onClick={() => onStartPlan(message.id)}
          >
            Crear plan
          </button>
        </div>
      ) : null}
      {planState ? (
        <PlanCard
          state={planState}
          previewing={previewedMessageId === planPreviewId(planState.plan.id)}
          applying={applyingMessageId === planPreviewId(planState.plan.id)}
          applied={appliedMessageIds.has(planPreviewId(planState.plan.id))}
          onExecutePlan={onExecutePlan}
          onPreviewPlan={onPreviewPlan}
          onApplyPlan={onApplyPlan}
          onRefinePlan={onRefinePlan}
          onRetryStep={onRetryStep}
        />
      ) : null}
    </div>
  );
}

export function AiChatPanel({
  collapsed,
  conversation,
  loading,
  sending,
  applyingMessageId,
  appliedMessageIds,
  noEffectMessageIds,
  previewedMessageId,
  planStates,
  error,
  onToggleCollapsed,
  onSend,
  onApply,
  onPreview,
  onCancelPreview,
  onStartPlan,
  onExecutePlan,
  onPreviewPlan,
  onApplyPlan,
  onRefinePlan,
  onRetryStep,
}: Props) {
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages.length, sending, collapsed]);

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setDraft("");
    onSend(trimmed);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      if (draft.trim()) {
        submit();
      } else if (previewedMessageId != null) {
        const msg = conversation?.messages.find((m) => m.id === previewedMessageId);
        if (msg && applyingMessageId == null) {
          onApply(msg.proposedChanges, msg.id);
        }
      }
      return;
    }
    if (e.key === "Escape" && previewedMessageId != null) {
      e.preventDefault();
      onCancelPreview();
    }
  };

  const hasDraft = draft.trim().length > 0;

  return (
    <section
      className={`ai-chat-widget${collapsed ? " ai-chat-widget--collapsed" : ""}${previewedMessageId != null ? " ai-chat-widget--previewing" : ""}`}
      aria-label="Asistente IA"
    >
      <button
        type="button"
        className="ai-chat-widget__tab"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          />
        </svg>
        <span className="ai-chat-widget__tab-label">
          Asistente IA
          {previewedMessageId != null && (
            <span className="ai-chat-widget__preview-badge">Vista previa</span>
          )}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="ai-chat-widget__tab-chevron"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d={collapsed ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
          />
        </svg>
      </button>

      {!collapsed && (
        <>
          <div className="ai-chat-panel__messages">
            {loading ? (
              <p className="ai-chat-empty">Cargando conversación…</p>
            ) : !conversation || conversation.messages.length === 0 ? (
              <p className="ai-chat-empty">
                Contale al asistente qué cambios querés hacer en esta línea de
                tiempo.
              </p>
            ) : (
              conversation.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  applyingMessageId={applyingMessageId}
                  appliedMessageIds={appliedMessageIds}
                  noEffectMessageIds={noEffectMessageIds}
                  previewedMessageId={previewedMessageId}
                  planState={planStates[msg.id] ?? null}
                  onApply={onApply}
                  onPreview={onPreview}
                  onCancelPreview={onCancelPreview}
                  onStartPlan={onStartPlan}
                  onExecutePlan={onExecutePlan}
                  onPreviewPlan={onPreviewPlan}
                  onApplyPlan={onApplyPlan}
                  onRefinePlan={onRefinePlan}
                  onRetryStep={onRetryStep}
                />
              ))
            )}
            {sending && (
              <div className="ai-chat-bubble ai-chat-bubble--assistant ai-chat-bubble--typing">
                <span className="ai-chat-typing-dots" aria-label="Escribiendo">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="ai-chat-error" role="alert">
              {error.kind === "send"
                ? "No se pudo enviar el mensaje. Intentá de nuevo."
                : error.kind === "preview"
                  ? "No se pudo generar la vista previa."
                  : "No se pudieron aplicar los cambios. Intentá de nuevo."}
            </div>
          )}

          <form className="ai-chat-panel__form" onSubmit={handleSubmit}>
            <textarea
              className="ai-chat-panel__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu pedido…"
              rows={2}
              disabled={sending}
              aria-label="Mensaje al asistente"
            />
            <div className="ai-btn-wrap">
              <button
                type="submit"
                className="ai-chat-panel__send-btn"
                disabled={!hasDraft || sending}
                aria-label="Enviar mensaje"
              >
                Enviar
              </button>
              <ShortcutHint>Ctrl+↵</ShortcutHint>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
