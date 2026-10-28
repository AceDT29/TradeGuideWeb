import { useState, useEffect, useRef } from 'react';

/**
 * GuideRow — single table row displaying one guide entry.
 * Shows: row number, formatted date+time, guide code (monospace), package owner, copy & delete actions.
 */
export default function GuideRow({ guide, index, onCopy, onRemove, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [rowCopied, setRowCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [owner, setOwner] = useState(guide.owner || '');
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const [prevGuideOwner, setPrevGuideOwner] = useState(guide.owner || '');

  if (guide.owner !== prevGuideOwner) {
    setPrevGuideOwner(guide.owner || '');
    setOwner(guide.owner || '');
  }

  const { hour, minute, date } = formatTimestamp(guide.timestamp);

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopy(guide.code);
    setCopied(true);
    setRowCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleRemove = (e) => {
    e?.stopPropagation?.();
    setLeaving(true);
    setTimeout(() => onRemove(guide.id), 240);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (confirmDelete) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      handleRemove(e);
    } else {
      setConfirmDelete(true);
      deleteTimerRef.current = setTimeout(() => {
        setConfirmDelete(false);
      }, 3000);
    }
  };

  const handleRemoveDoubleClick = (e) => {
    e.stopPropagation();
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    handleRemove(e);
  };

  const handleSaveOwner = () => {
    const trimmed = owner.trim();
    if (trimmed !== (guide.owner || '')) {
      onUpdate?.(guide.id, { owner: trimmed });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveOwner();
      e.target.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOwner(guide.owner || '');
      e.target.blur();
    }
  };

  return (
    <tr
      className={`
        group border-b border-slate-200/70 transition-all duration-200
        ${guide.delivered ? 'bg-slate-50/80 hover:bg-slate-100/70' : rowCopied ? 'bg-emerald-200/80 hover:bg-emerald-100/60' : 'hover:bg-blue-50/60'}
        ${leaving ? 'opacity-0 scale-y-95 origin-top' : 'animate-rowAppear'}
      `}
    >
      {/* Checkbox Entregado (Desktop) */}
      <td className="hidden sm:table-cell px-2 py-2.5 text-center whitespace-nowrap">
        <label className="relative inline-flex items-center justify-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(guide.delivered)}
            onChange={(e) => {
              onUpdate?.(guide.id, { delivered: e.target.checked });
            }}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30 cursor-pointer accent-emerald-600 transition-all"
            title={guide.delivered ? 'Paquete entregado (clic para desmarcar)' : 'Marcar paquete como entregado'}
          />
        </label>
      </td>

      {/* # (Desktop) */}
      <td className="hidden sm:table-cell px-2 py-2.5 text-center">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
          {index + 1}
        </span>
      </td>

      {/* Fecha / Hora (Desktop compacta) */}
      <td className="hidden sm:table-cell px-2 py-2.5 whitespace-nowrap">
        <div className="flex flex-col gap-0 leading-tight">
          <span className={`text-[11px] font-medium ${guide.delivered ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {hour}:{minute}
          </span>
          <span className="text-[10px] text-slate-400">{date}</span>
        </div>
      </td>

      {/* Guía (Móvil y Desktop) */}
      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`
                font-mono-guide text-sm font-medium tracking-widest px-2.5 py-1 rounded-lg select-all transition-all
                ${
                  guide.delivered
                    ? 'line-through text-slate-400 bg-slate-100/90 border border-slate-200'
                    : 'text-blue-700 bg-blue-50 border border-blue-200'
                }
              `}
            >
              {guide.code}
            </span>
            {guide.delivered && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200/60">
                Entregado
              </span>
            )}
          </div>
          {/* Subtítulo en móvil: dueño y cobro */}
          {guide.owner && (
            <div className="sm:hidden flex items-center gap-1 text-[10px] text-slate-600 font-semibold truncate max-w-[170px]">
              <span className="truncate">👤 {guide.owner}</span>
              {guide.hasPayment === true && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded-full whitespace-nowrap">
                  Cobro
                </span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Dueño del paquete (Desktop expandido) */}
      <td className="hidden sm:table-cell px-3 py-2.5">
        <div className="relative flex items-center w-full max-w-sm group/input">
          <div
            className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none transition-colors duration-150 ${
              owner ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <UserIcon />
          </div>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            onBlur={handleSaveOwner}
            onKeyDown={handleKeyDown}
            placeholder="+ Asignar dueño..."
            className={`
              w-full pl-7 pr-6 py-1 text-[11px] rounded-lg font-medium transition-all duration-150 outline-none
              ${guide.delivered ? 'line-through text-slate-400 opacity-75' : ''}
              ${
                owner
                  ? 'bg-sky-50/80 border border-sky-200/90 text-sky-950 font-semibold focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 shadow-xs'
                  : 'bg-slate-50/50 border border-dashed border-slate-300/80 text-slate-700 placeholder-slate-400 hover:bg-white hover:border-slate-300 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
              }
            `}
            title="Escribe el nombre del dueño y presiona Enter o haz clic fuera para guardar"
          />
          {/* Right status icon */}
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            {saved ? (
              <span className="text-emerald-600 font-bold text-xs flex items-center" title="Guardado">
                <CheckIcon />
              </span>
            ) : owner ? (
              <span className="opacity-0 group-hover/input:opacity-50 text-slate-400 transition-opacity">
                <PencilIcon />
              </span>
            ) : null}
          </div>
        </div>
      </td>

      {/* Tipo de Servicio (Desktop) */}
      <td className="hidden sm:table-cell px-2 py-2.5 text-center whitespace-nowrap">
        {guide.serviceType && guide.serviceType !== '—' ? (
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
            {guide.serviceType}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>

      {/* Cobro / Pago (Desktop) */}
      <td className="hidden sm:table-cell px-2 py-2.5 text-center whitespace-nowrap">
        {guide.hasPayment === true ? (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
            Pago: Sí
          </span>
        ) : guide.hasPayment === false ? (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            Pago: No
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>

      {/* Acciones (Móvil y Desktop) */}
      <td className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
          {/* Copy */}
          <button
            id={`copy-guide-${guide.id}`}
            onClick={handleCopy}
            title="Copiar guía"
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
              transition-all duration-150 cursor-pointer border
              ${copied
                ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                : 'bg-white text-slate-500 border-slate-200 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50'
              }
            `}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copiada' : 'Copiar'}
          </button>

          {/* Delete — 1-click confirmation or double-click */}
          <button
            id={`delete-guide-${guide.id}`}
            onClick={handleDeleteClick}
            onDoubleClick={handleRemoveDoubleClick}
            title={confirmDelete ? "Haz clic para confirmar eliminación" : "Borrar guía (doble clic o clic para confirmar)"}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer
              transition-all duration-150 active:scale-95
              ${confirmDelete
                ? 'bg-red-500 text-white border-red-600 shadow-xs animate-pulse font-semibold'
                : 'bg-white text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-300 hover:bg-red-50'
              }
            `}
          >
            <TrashIcon />
            <span>{confirmDelete ? '¿Eliminar?' : 'Borrar'}</span>
            {!confirmDelete && <span className="text-[10px] text-slate-300 font-normal">×2</span>}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function formatTimestamp(iso) {
  const d = new Date(iso);
  return {
    hour: String(d.getHours()).padStart(2, '0'),
    minute: String(d.getMinutes()).padStart(2, '0'),
    date: d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
  };
}

// ── Icons ─────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
