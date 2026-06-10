import { useState, useEffect, useRef } from 'react';
import GuideRow from './GuideRow';

const PAGE_SIZE = 12;

/**
 * GuideTable — paginated data table (12 guides/page) with header actions.
 * Auto-advances to the last page whenever a new guide is added.
 */
export default function GuideTable({ guides, onCopyOne, onRemove, onCopyAll, onClearAll }) {
  const [currentPage, setCurrentPage] = useState(1);
  const prevLengthRef                  = useRef(guides.length);

  const totalPages  = Math.max(1, Math.ceil(guides.length / PAGE_SIZE));
  const startIdx    = (currentPage - 1) * PAGE_SIZE;
  const pageGuides  = guides.slice(startIdx, startIdx + PAGE_SIZE);

  // Auto-advance to last page when a new guide is added
  useEffect(() => {
    const newLength = guides.length;
    if (newLength > prevLengthRef.current) {
      setCurrentPage(Math.ceil(newLength / PAGE_SIZE));
    }
    prevLengthRef.current = newLength;
  }, [guides.length]);

  // If current page becomes empty after a deletion, go back one page
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  const isEmpty = guides.length === 0;

  return (
    <section className="animate-fadeInUp" style={{ animationDelay: '0.08s' }}>

      {/* ── Table header bar ───────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-300">
            Guías registradas
          </h2>
          {!isEmpty && (
            <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 rounded-full">
              {guides.length}
            </span>
          )}
        </div>

        {!isEmpty && (
          <div className="flex items-center gap-2">
            {/* Copy All */}
            <button
              id="copy-all-btn"
              onClick={onCopyAll}
              className="
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer
                bg-[#0d1320] text-slate-400 border border-[#1e3a5f]/60
                hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/[0.07]
                transition-all duration-150
              "
            >
              <CopyAllIcon />
              Copiar todo
            </button>

            {/* Clear All */}
            <button
              id="clear-all-btn"
              onClick={onClearAll}
              className="
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer
                bg-[#0d1320] text-slate-500 border border-[#1e3a5f]/60
                hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/[0.07]
                transition-all duration-150
              "
            >
              <TrashAllIcon />
              Limpiar lista
            </button>
          </div>
        )}
      </div>

      {/* ── Table container ────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border border-[#1a2640]"
        style={{ background: 'linear-gradient(180deg, #0d1320 0%, #0b1019 100%)' }}
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(26,38,64,0.8)' }}>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-widest w-12">
                    #
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-widest w-28">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-widest">
                    Nro. de Guía
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-widest w-44">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageGuides.map((guide, localIdx) => (
                  <GuideRow
                    key={guide.id}
                    guide={guide}
                    index={startIdx + localIdx}  // global row number
                    onCopy={onCopyOne}
                    onRemove={onRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination + footer ──────────────────────────────── */}
      {!isEmpty && (
        <div className="mt-4 flex items-center justify-between gap-4">

          {/* Left: info text */}
          <p className="text-xs text-slate-600 whitespace-nowrap">
            Mostrando{' '}
            <span className="text-slate-400 font-medium">{startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, guides.length)}</span>
            {' '}de{' '}
            <span className="text-slate-400 font-medium">{guides.length}</span>
            {' '}guías · Guardado auto
          </p>

          {/* Right: page controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">

              {/* Prev */}
              <button
                id="page-prev-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="
                  flex items-center justify-center w-8 h-8 rounded-lg
                  text-slate-400 border border-[#1e3a5f]/60 bg-[#0d1320]
                  hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/[0.07]
                  disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:text-slate-400
                  disabled:hover:border-[#1e3a5f]/60 disabled:hover:bg-[#0d1320]
                  transition-all duration-150 cursor-pointer
                "
                aria-label="Página anterior"
              >
                <ChevronLeftIcon />
              </button>

              {/* Page pills */}
              {buildPageRange(currentPage, totalPages).map((item, i) =>
                item === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-slate-700 text-xs select-none">…</span>
                ) : (
                  <button
                    key={item}
                    id={`page-btn-${item}`}
                    onClick={() => setCurrentPage(item)}
                    className={`
                      w-8 h-8 rounded-lg text-xs font-medium cursor-pointer
                      border transition-all duration-150
                      ${
                        item === currentPage
                          ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 font-semibold'
                          : 'bg-[#0d1320] text-slate-500 border-[#1e3a5f]/60 hover:text-slate-300 hover:border-[#1e3a5f]'
                      }
                    `}
                    aria-current={item === currentPage ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}

              {/* Next */}
              <button
                id="page-next-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="
                  flex items-center justify-center w-8 h-8 rounded-lg
                  text-slate-400 border border-[#1e3a5f]/60 bg-[#0d1320]
                  hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/[0.07]
                  disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:text-slate-400
                  disabled:hover:border-[#1e3a5f]/60 disabled:hover:bg-[#0d1320]
                  transition-all duration-150 cursor-pointer
                "
                aria-label="Página siguiente"
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#111827] border border-[#1e3a5f]/50">
        <InboxIcon />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500">Sin guías registradas</p>
        <p className="text-xs text-slate-700 mt-1">
          Escanea un código de barras o ingresa un número arriba
        </p>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────

function CopyAllIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function TrashAllIcon() {
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

function InboxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Returns an array of page numbers + '…' ellipsis markers.
 * Always shows first, last, current, and up to 1 neighbor on each side.
 * Example (current=5, total=10): [1, '…', 4, 5, 6, '…', 10]
 */
function buildPageRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current]);
  if (current > 1)     pages.add(current - 1);
  if (current < total) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('…');
    }
    result.push(sorted[i]);
  }

  return result;
}
