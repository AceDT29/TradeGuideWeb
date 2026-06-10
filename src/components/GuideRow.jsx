import { useState } from 'react';

/**
 * GuideRow — single table row displaying one guide entry.
 * Shows: row number, formatted date+time, guide code (monospace), copy & delete actions.
 */
export default function GuideRow({ guide, index, onCopy, onRemove }) {
  const [copied, setCopied]   = useState(false);
  const [leaving, setLeaving] = useState(false);

  const { hour, minute, date } = formatTimestamp(guide.timestamp);

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopy(guide.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => onRemove(guide.id), 240);
  };

  const handleRemoveDoubleClick = (e) => {
    e.stopPropagation();
    handleRemove(e);
  };

  return (
    <tr
      className={`
        group border-b border-[#1a2640]/60 transition-all duration-200
        hover:bg-cyan-500/[0.04]
        ${leaving ? 'opacity-0 scale-y-95 origin-top' : 'animate-rowAppear'}
      `}
    >
      {/* # */}
      <td className="px-4 py-2 text-center">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1a2640] text-slate-400 text-xs font-medium">
          {index + 1}
        </span>
      </td>

      {/* Fecha / Hora */}
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex flex-col gap-0">
          <span className="text-xs text-slate-300 font-medium">{hour}:{minute}</span>
          <span className="text-[11px] text-slate-600">{date}</span>
        </div>
      </td>

      {/* Guía */}
      <td className="px-4 py-2">
        <span
          className="font-mono-guide text-sm font-medium tracking-widest text-cyan-300
            bg-cyan-500/[0.07] border border-cyan-500/20 px-2.5 py-1 rounded-lg
            select-all"
        >
          {guide.code}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Copy */}
          <button
            id={`copy-guide-${guide.id}`}
            onClick={handleCopy}
            title="Copiar guía"
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
              transition-all duration-150 cursor-pointer
              ${copied
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#1a2640] text-slate-400 border border-[#1e3a5f]/60 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/10'
              }
            `}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copiada' : 'Copiar'}
          </button>

          {/* Delete — double click required */}
          <button
            id={`delete-guide-${guide.id}`}
            onDoubleClick={handleRemoveDoubleClick}
            onClick={(e) => e.stopPropagation()}
            title="Doble clic para eliminar"
            className="
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
              bg-[#1a2640] text-slate-500 border border-[#1e3a5f]/60 cursor-pointer
              hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10
              active:scale-95
              transition-all duration-150
            "
          >
            <TrashIcon />
            <span>Borrar</span>
            <span className="text-[10px] text-slate-600 font-normal">×2</span>
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
    hour:   String(d.getHours()).padStart(2, '0'),
    minute: String(d.getMinutes()).padStart(2, '0'),
    date:   d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
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
