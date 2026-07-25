import { useState, useEffect, useRef } from 'react';
import GuideRow from './GuideRow';
import { exportGuidesToPDF } from '../lib/pdfExport';

const PAGE_SIZE = 10;

export default function GuideTable({ guides, onCopyOne, onRemove, onCopyAll, onClearAll }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const prevLengthRef = useRef(guides.length);
  const searchRef = useRef(null);

  // Returns keyboard priority to the GuideScanner after clearing the search.
  const returnFocusToScanner = () => {
    document.getElementById('guide-input')?.focus();
  };

  const clearSearch = () => {
    setSearchTerm('');
    returnFocusToScanner();
  };

  const cleanSearch = searchTerm.trim().toLowerCase();

  // Filter guides by search term (matches guide code)
  const filteredGuides = cleanSearch
    ? guides.filter((g) => g.code.toLowerCase().includes(cleanSearch))
    : guides;

  const totalPages = Math.max(1, Math.ceil(filteredGuides.length / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageGuides = filteredGuides.slice(startIdx, startIdx + PAGE_SIZE);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
  const isSearchEmpty = !isEmpty && filteredGuides.length === 0;

  return (
    <section className="animate-fadeInUp mt-12 md:mt-0" style={{ animationDelay: '0.08s' }}>

      {/* ── Table header bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 z-0">

        {/* Title & Count Badge */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white/90 whitespace-nowrap">
            Guías registradas
          </h2>
          {!isEmpty && (
            <span className="text-xs font-medium text-blue-700 bg-white/80 border border-white/60 px-2.5 py-0.5 rounded-full shadow-xs">
              {cleanSearch ? `${filteredGuides.length} de ${guides.length}` : guides.length}
            </span>
          )}
        </div>

        {/* Search / Indexer Input */}
        {!isEmpty && (
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon />
            </div>
            <input
              id="guide-search-input"
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  clearSearch();
                }
              }}
              placeholder="Buscar o indexar guía..."
              className="
                w-full pl-9 pr-8 py-1.5 text-xs rounded-xl
                bg-white/80 border border-white/60 text-slate-700 placeholder-slate-400
                focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                transition-all duration-150 shadow-xs
              "
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                title="Limpiar búsqueda (Esc)"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        )}

        {/* Header action buttons */}
        {!isEmpty && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Export PDF */}
            <button
              id="export-pdf-btn"
              onClick={() => exportGuidesToPDF(filteredGuides)}
              className="
                flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-medium cursor-pointer
                bg-white/80 text-slate-600 border border-white/60
                hover:text-red-600 hover:border-red-300 hover:bg-white
                transition-all duration-150 shadow-sm
              "
              title={cleanSearch ? "Exportar guías filtradas a PDF" : "Exportar todas las guías a PDF"}
            >
              <PdfIcon />
              <span className="hidden sm:inline">Exportar</span> PDF
            </button>

            {/* Copy All */}
            <button
              id="copy-all-btn"
              onClick={() => onCopyAll(filteredGuides)}
              className="
                flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-medium cursor-pointer
                bg-white/80 text-slate-600 border border-white/60
                hover:text-blue-700 hover:border-blue-300 hover:bg-white
                transition-all duration-150 shadow-sm
              "
              title={cleanSearch ? "Copiar guías filtradas al portapapeles" : "Copiar todas las guías al portapapeles"}
            >
              <CopyAllIcon />
              <span className="hidden sm:inline">Copiar</span> {cleanSearch ? 'filtradas' : 'todo'}
            </button>

            {/* Clear All */}
            <button
              id="clear-all-btn"
              onClick={onClearAll}
              className="
                flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-medium cursor-pointer
                bg-white/80 text-slate-500 border border-white/60
                hover:text-red-500 hover:border-red-300 hover:bg-white
                transition-all duration-150 shadow-sm
              "
            >
              <TrashAllIcon />
              <span className="hidden sm:inline">Limpiar</span> lista
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
        ) : isSearchEmpty ? (
          <SearchEmptyState searchTerm={searchTerm} onClear={clearSearch} />
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
                {pageGuides.map((guide) => (
                  <GuideRow
                    key={guide.id}
                    guide={guide}
                    index={guides.findIndex((g) => g.id === guide.id)}  // Global row position
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
      {!isEmpty && !isSearchEmpty && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Left: info text */}
          <p className="text-xs text-white/70 whitespace-nowrap">
            Mostrando{' '}
            <span className="text-white font-medium">{startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filteredGuides.length)}</span>
            {' '}de{' '}
            <span className="text-white font-medium">{filteredGuides.length}</span>
            {cleanSearch ? ' guías filtradas' : ' guías'}
            {cleanSearch && <span className="text-white/60"> (de {guides.length} totales)</span>}
            {' '}· Guardado auto
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

// ── Empty state (No guides registered) ─────────────────────────

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

// ── Search Empty state (No search results found) ───────────────

function SearchEmptyState({ searchTerm, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 gap-3 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
        <SearchIcon />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">No se encontraron guías</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No hay ninguna guía registrada que coincida con <span className="font-mono bg-slate-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded border border-slate-200">"{searchTerm}"</span>
        </p>
      </div>
      <button
        onClick={onClear}
        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-xl transition-all duration-150 cursor-pointer shadow-xs"
      >
        <ClearIcon />
        Restablecer lista de guías
      </button>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

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
