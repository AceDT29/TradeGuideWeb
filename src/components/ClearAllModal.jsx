/**
 * ClearAllModal — confirmation dialog before wiping all guides.
 * Traps focus and blocks background interaction.
 */
export default function ClearAllModal({ count, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,11,17,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          animate-fadeInUp
          w-full max-w-md rounded-2xl
          bg-[#0f1520] border border-[#1e3a5f]
          shadow-[0_24px_80px_rgba(0,0,0,0.6)]
          p-7 flex flex-col gap-5
        "
      >
        {/* Warning icon */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/15 border border-red-500/25 flex-shrink-0">
            <WarningIcon />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              ¿Borrar todas las guías?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>

        {/* Body */}
        <p className="text-sm text-slate-400 leading-relaxed">
          Se eliminarán{' '}
          <span className="font-semibold text-slate-200">
            {count} {count === 1 ? 'guía' : 'guías'}
          </span>{' '}
          de la lista y del almacenamiento local. El contador de limpieza automática también se reiniciará.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            id="modal-cancel-btn"
            onClick={onCancel}
            className="
              px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer
              bg-[#1a2640] text-slate-400 border border-[#1e3a5f]/70
              hover:text-slate-200 hover:border-[#1e3a5f]
              transition-all duration-150
            "
          >
            Cancelar
          </button>

          <button
            id="modal-confirm-btn"
            onClick={onConfirm}
            className="
              px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              bg-red-500/15 text-red-400 border border-red-500/30
              hover:bg-red-500/25 hover:text-red-300 hover:border-red-500/50
              transition-all duration-150
            "
          >
            Sí, borrar todo
          </button>
        </div>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
