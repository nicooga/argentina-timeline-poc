import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type {
  AiConversation,
  AiMessage,
  TimelineChange,
} from "../timelineEdition/aiConversation";
import "./AiChatPanel.css";

export type AiChatError = { kind: "send" | "apply"; message: string };

type Props = {
  collapsed: boolean;
  conversation: AiConversation | null;
  loading: boolean;
  sending: boolean;
  applyingMessageId: string | null;
  dismissedMessageIds: ReadonlySet<string>;
  previewedMessageId: string | null;
  error: AiChatError | null;
  onToggleCollapsed: () => void;
  onSend: (content: string) => void;
  onApply: (changes: TimelineChange[], messageId: string) => void;
  onDismiss: (messageId: string) => void;
  onPreview: (changes: TimelineChange[], messageId: string) => void;
  onCancelPreview: () => void;
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  create_event: "Crear evento",
  update_event: "Actualizar evento",
  delete_event: "Eliminar evento",
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

function ProposedChanges({
  message,
  applyingMessageId,
  dismissed,
  previewing,
  onApply,
  onDismiss,
  onPreview,
  onCancelPreview,
}: {
  message: AiMessage;
  applyingMessageId: string | null;
  dismissed: boolean;
  previewing: boolean;
  onApply: (changes: TimelineChange[], messageId: string) => void;
  onDismiss: (messageId: string) => void;
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

  if (dismissed) {
    return (
      <div className="ai-chat-changes ai-chat-changes--dismissed">
        <span className="ai-chat-changes__dismissed-label">
          {countLabel} — descartados
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
        {previewing ? (
          <button
            type="button"
            className="viewer-editor-btn ai-chat-changes__preview-btn ai-chat-changes__preview-btn--active"
            onClick={onCancelPreview}
          >
            Cancelar vista previa
            <kbd className="ai-shortcut">Ctrl+⌫</kbd>
          </button>
        ) : (
          <button
            type="button"
            className="viewer-editor-btn ai-chat-changes__preview-btn"
            disabled={busy}
            onClick={() => onPreview(proposedChanges, id)}
          >
            Vista previa
          </button>
        )}
        <button
          type="button"
          className="viewer-editor-btn ai-chat-changes__apply-btn"
          disabled={busy}
          onClick={() => onApply(proposedChanges, id)}
        >
          {applying ? "Aplicando…" : "Aplicar"}
        </button>
        <button
          type="button"
          className="viewer-editor-btn viewer-editor-btn--danger"
          disabled={busy}
          onClick={() => onDismiss(id)}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  applyingMessageId,
  dismissedMessageIds,
  previewedMessageId,
  onApply,
  onDismiss,
  onPreview,
  onCancelPreview,
}: {
  message: AiMessage;
  applyingMessageId: string | null;
  dismissedMessageIds: ReadonlySet<string>;
  previewedMessageId: string | null;
  onApply: (changes: TimelineChange[], messageId: string) => void;
  onDismiss: (messageId: string) => void;
  onPreview: (changes: TimelineChange[], messageId: string) => void;
  onCancelPreview: () => void;
}) {
  return (
    <div className={`ai-chat-bubble ai-chat-bubble--${message.role}`}>
      <p className="ai-chat-bubble__content">{message.content}</p>
      {message.role === "assistant" && (
        <ProposedChanges
          message={message}
          applyingMessageId={applyingMessageId}
          dismissed={dismissedMessageIds.has(message.id)}
          previewing={previewedMessageId === message.id}
          onApply={onApply}
          onDismiss={onDismiss}
          onPreview={onPreview}
          onCancelPreview={onCancelPreview}
        />
      )}
    </div>
  );
}

export function AiChatPanel({
  collapsed,
  conversation,
  loading,
  sending,
  applyingMessageId,
  dismissedMessageIds,
  previewedMessageId,
  error,
  onToggleCollapsed,
  onSend,
  onApply,
  onDismiss,
  onPreview,
  onCancelPreview,
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Backspace" && e.ctrlKey && previewedMessageId != null) {
      e.preventDefault();
      onCancelPreview();
    }
  };

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
                  dismissedMessageIds={dismissedMessageIds}
                  previewedMessageId={previewedMessageId}
                  onApply={onApply}
                  onDismiss={onDismiss}
                  onPreview={onPreview}
                  onCancelPreview={onCancelPreview}
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
            <button
              type="submit"
              className="ai-chat-panel__send-btn"
              disabled={!draft.trim() || sending}
              aria-label="Enviar"
              title="Enviar (Ctrl+↵)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                />
              </svg>
              <kbd className="ai-shortcut ai-shortcut--send">Ctrl+↵</kbd>
            </button>
          </form>
        </>
      )}
    </section>
  );
}
