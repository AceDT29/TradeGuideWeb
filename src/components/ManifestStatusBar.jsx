import { useState } from 'react';

/**
 * ManifestStatusBar — displays real-time comparison progress between
 * the uploaded Zoom manifest and the guides that operators have scanned.
 */
export default function ManifestStatusBar({
  manifestMeta,
  comparisonStats,
  onOpenUploadModal,
  onClearManifest,
  onResetAll,
}) {
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [missingSearch, setMissingSearch] = useState('');
  const [copiedItemCode, setCopiedItemCode] = useState(null);
  const [allCopied, setAllCopied] = useState(false);

  if (!comparisonStats?.hasManifest) {
    return (
      <div className="hidden md:flex mb-4 bg-white/80 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/60 shadow-sm items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            📄
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">
              ¿Tienes la Hoja de Ruta de Zoom en PDF?
            </p>
            <p className="text-[11px] text-slate-500">
              Cárgala para autocompletar clientes, tipos de servicio y comparar faltantes.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenUploadModal}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          + Cargar PDF
        </button>
      </div>
    );
  }

  const {
    totalExpected = 0,
    scannedCount = 0,
    missing = [],
    missingCount = 0,
    unmanifestedCount = 0,
    percentage = 0,
  } = comparisonStats;

  const isComplete = scannedCount >= totalExpected && totalExpected > 0;

  const filteredMissing = missingSearch.trim()
    ? missing.filter(
        (m) =>
          m.code.includes(missingSearch.trim()) ||
          m.owner.toLowerCase().includes(missingSearch.trim().toLowerCase())
      )
    : missing;

  const handleCopyOneMissing = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedItemCode(code);
    setTimeout(() => setCopiedItemCode(null), 1800);
  };

  const handleCopyAllMissing = () => {
    const text = missing.map((m) => `${m.code}\t${m.owner}\t${m.serviceType}\t${m.hasPayment ? 'Pago: Sí' : 'Pago: No'}`).join('\n');
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const missingWithPay = missing.filter((m) => m.hasPayment).length;
  const missingFree = missing.filter((m) => !m.hasPayment).length;

  return (
    <>
      <div className="hidden md:block mb-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)] animate-fadeIn">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Hoja de Ruta Zoom
            </span>
            {manifestMeta?.route && (
              <span className="text-xs font-semibold text-slate-700">
                Ruta {manifestMeta.route}
              </span>
            )}
            {manifestMeta?.manifestNumber && (
              <span className="text-[11px] text-slate-400 font-mono">
                Mis: {manifestMeta.manifestNumber}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => setShowMissingModal(true)}
              className="text-xs font-bold text-amber-800 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <span>📦</span>
              <span>Ver {missingCount} faltantes</span>
            </button>
            <button
              onClick={onOpenUploadModal}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/80 transition-colors cursor-pointer"
              title="Cambiar o ver detalles del PDF"
            >
              ⚙ PDF
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              title="Suprimir este manifiesto o empezar desde cero"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Progreso de Descarga / Escaneo:
            </span>
            <span className="font-bold text-slate-900">
              {scannedCount} de {totalExpected} paquetes ({percentage}%)
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete
                  ? 'bg-emerald-500'
                  : percentage > 60
                  ? 'bg-blue-600'
                  : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Metric Badges */}
          <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {scannedCount} Recibidos
            </span>

            {/* Clickable Missing Badge */}
            <button
              type="button"
              onClick={() => setShowMissingModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              title="Haz clic para ver la lista detallada de guías faltantes"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{missingCount} Faltantes</span>
              <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded-full">
                Ver lista ↗
              </span>
            </button>

            {unmanifestedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-semibold select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                {unmanifestedCount} Fuera de hoja
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal: View Missing Guides */}
      {showMissingModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMissingModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-fadeInUp">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                  📦
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Guías Faltantes por Escanear ({missingCount})
                  </h3>
                  <p className="text-xs text-amber-100">
                    Paquetes que figuran en el PDF de Zoom pero no han sido recibidos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMissingModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mini Summary Chips */}
            <div className="px-6 py-2.5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Por cobrar:</span>
                <span className="px-2 py-0.5 rounded-md font-bold bg-amber-200/80 text-amber-900 text-[11px]">
                  {missingWithPay} con cobro
                </span>
                <span className="px-2 py-0.5 rounded-md font-semibold bg-white border border-slate-200 text-slate-600 text-[11px]">
                  {missingFree} prepagados
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Haz clic en una guía para copiarla
              </span>
            </div>

            {/* Filter Search */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <input
                type="text"
                value={missingSearch}
                onChange={(e) => setMissingSearch(e.target.value)}
                placeholder="Buscar por nro. de guía o nombre de destinatario..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
              />
              {missingSearch && (
                <button
                  type="button"
                  onClick={() => setMissingSearch('')}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 max-h-96">
              {filteredMissing.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {missingCount === 0
                    ? '🎉 ¡Completado! Se han escaneado todos los paquetes de la hoja de ruta.'
                    : 'No hay paquetes faltantes que coincidan con la búsqueda.'}
                </div>
              ) : (
                filteredMissing.map((item) => {
                  const isCopied = copiedItemCode === item.code;
                  return (
                    <div
                      key={item.code}
                      onClick={() => handleCopyOneMissing(item.code)}
                      className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-amber-50/50 rounded-xl transition-colors cursor-pointer group"
                      title="Haz clic para copiar este número de guía"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 group-hover:bg-amber-100 group-hover:border-amber-300 px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5">
                          {item.code}
                          {isCopied && (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              ✓
                            </span>
                          )}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.owner}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.serviceType}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.hasPayment
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          Pago: {item.hasPayment ? 'Sí' : 'No'}
                        </span>
                        <span className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isCopied ? '¡Copiado!' : 'Copiar'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCopyAllMissing}
                disabled={missingCount === 0}
                className="text-xs font-semibold text-slate-700 hover:text-amber-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span>{allCopied ? '✓ ¡Lista copiada!' : '📋 Copiar toda la lista'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMissingModal(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Reset / Suppress Manifest */}
      {showResetModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 gap-4 animate-fadeInUp">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl flex-shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  ¿Suprimir Hoja de Ruta y reiniciar?
                </h3>
                <p className="text-xs text-slate-500">
                  {manifestMeta?.manifestNumber ? `Mis: ${manifestMeta.manifestNumber}` : 'Manifiesto activo'} ({totalExpected} paquetes)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Elige cómo deseas proceder. Puedes suprimir solamente el PDF cargado o limpiar también la lista de guías registradas para empezar desde cero:
            </p>

            <div className="flex flex-col gap-2.5 pt-1">
              {/* Option 1: Only clear manifest */}
              <button
                type="button"
                onClick={() => {
                  onClearManifest?.();
                  setShowResetModal(false);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-amber-300 bg-slate-50 hover:bg-amber-50/60 text-left transition-all cursor-pointer group flex items-start gap-3"
              >
                <span className="text-xl mt-0.5">📄</span>
                <div>
                  <span className="block text-xs font-bold text-slate-800 group-hover:text-amber-900">
                    Solo suprimir Hoja de Ruta
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    Quita el PDF y la barra de progreso de Zoom. Las guías escaneadas se conservarán en la tabla.
                  </span>
                </div>
              </button>

              {/* Option 2: Reset everything from scratch */}
              <button
                type="button"
                onClick={() => {
                  onResetAll?.();
                  setShowResetModal(false);
                }}
                className="w-full p-3 rounded-2xl border border-red-200 hover:border-red-400 bg-red-50/50 hover:bg-red-100/70 text-left transition-all cursor-pointer group flex items-start gap-3"
              >
                <span className="text-xl mt-0.5">🔄</span>
                <div>
                  <span className="block text-xs font-bold text-red-900">
                    Reiniciar TODO desde cero
                  </span>
                  <span className="block text-[11px] text-red-700/80 mt-0.5">
                    Elimina la Hoja de Ruta Y borra las guías escaneadas. Listo para una jornada o lote nuevo.
                  </span>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
