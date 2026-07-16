/**
 * Toast — floating notification stack (top-right corner).
 * Success: cyan-tinted · Error: red-tinted
 */
export default function Toast({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const isSuccess = toast.type === 'success';

  return (
    <div
      role="alert"
      className={`
        animate-slideIn pointer-events-auto
        flex items-center gap-3
        min-w-[240px] max-w-[340px] px-4 py-3 rounded-xl
        border shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        ${isSuccess
          ? 'bg-[#0a1a1f] border-cyan-500/30 text-cyan-300'
          : 'bg-[#1a0a0a] border-red-500/30 text-red-300'
        }
      `}
    >
      {/* Icon */}
      <div className="shrink-0">
        {isSuccess ? <SuccessIcon /> : <ErrorIcon />}
      </div>

      {/* Message */}
      <span className="text-sm font-medium flex-1">{toast.message}</span>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────

function SuccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
