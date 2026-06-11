import { useState, useEffect, useRef } from 'react';
import GuideRow from './GuideRow';
import { exportGuidesToPDF } from '../lib/pdfExport';

const PAGE_SIZE = 10;

/**
 * GuideTable — paginated data table (10 guides/page) with header actions.
 * Auto-advances to the last page whenever a new guide is added.
 */
export default function GuideTable({ guides, onCopyOne, onRemove, onCopyAll, onClearAll }) {
  const [currentPage, setCurrentPage] = useState(1);
  const prevLengthRef = useRef(guides.length);

  const totalPages = Math.max(1, Math.ceil(guides.length / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageGuides = guides.slice(startIdx, startIdx + PAGE_SIZE);

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
          <h2 className="text-sm font-semibold text-white/90">
            Guías registradas
          </h2>
          {!isEmpty && (
            <span className="text-xs font-medium text-blue-700 bg-white/80 border border-white/60 px-2.5 py-0.5 rounded-full">
              {guides.length}
            </span>
          )}
        </div>

        {!isEmpty && (
          <div className="flex items-center gap-2">
            {/* Export PDF */}
            <button
              id="export-pdf-btn"
              onClick={() => exportGuidesToPDF(guides)}
              className="
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer
                bg-white/80 text-slate-600 border border-white/60
                hover:text-red-600 hover:border-red-300 hover:bg-white
                transition-all duration-150 shadow-sm
              "
            >
              <PdfIcon />
              Exportar PDF
            </button>

            {/* Copy All */}
            <button
              id="copy-all-btn"
              onClick={onCopyAll}
              className="
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer
                bg-white/80 text-slate-600 border border-white/60
                hover:text-blue-700 hover:border-blue-300 hover:bg-white
                transition-all duration-150 shadow-sm
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
                bg-white/80 text-slate-500 border border-white/60
                hover:text-red-500 hover:border-red-300 hover:bg-white
                transition-all duration-150 shadow-sm
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
        className="rounded-2xl overflow-hidden border border-white/40 shadow-[0_8px_32px_rgba(30,58,138,0.15)]"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)' }}
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.3)' }}
                  className="bg-slate-50/80">
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest w-12">
                    #
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest w-28">
                    Fecha
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Nro. de Guía
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-widest w-44">
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
          <p className="text-xs text-white/70 whitespace-nowrap">
            Mostrando{' '}
            <span className="text-white font-medium">{startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, guides.length)}</span>
            {' '}de{' '}
            <span className="text-white font-medium">{guides.length}</span>
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
                  text-slate-600 border border-white/60 bg-white/80
                  hover:text-blue-700 hover:border-blue-300 hover:bg-white
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-600
                  disabled:hover:border-white/60 disabled:hover:bg-white/80
                  transition-all duration-150 cursor-pointer shadow-sm
                "
                aria-label="Página anterior"
              >
                <ChevronLeftIcon />
              </button>

              {/* Page pills */}
              {buildPageRange(currentPage, totalPages).map((item, i) =>
                item === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-white/60 text-xs select-none">…</span>
                ) : (
                  <button
                    key={item}
                    id={`page-btn-${item}`}
                    onClick={() => setCurrentPage(item)}
                    className={`
                      w-8 h-8 rounded-lg text-xs font-medium cursor-pointer
                      border transition-all duration-150 shadow-sm
                      ${item === currentPage
                        ? 'bg-blue-700 text-white border-blue-700 font-semibold shadow-md'
                        : 'bg-white/80 text-slate-600 border-white/60 hover:text-blue-700 hover:border-blue-300 hover:bg-white'
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
                  text-slate-600 border border-white/60 bg-white/80
                  hover:text-blue-700 hover:border-blue-300 hover:bg-white
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-600
                  disabled:hover:border-white/60 disabled:hover:bg-white/80
                  transition-all duration-150 cursor-pointer shadow-sm
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
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200">
        <InboxIcon />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500">Sin guías registradas</p>
        <p className="text-xs text-slate-400 mt-1">
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

function PdfIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
  if (current > 1) pages.add(current - 1);
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
