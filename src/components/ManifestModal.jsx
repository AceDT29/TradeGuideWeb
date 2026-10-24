import { useState, useRef, useEffect } from 'react';
import { parseZoomManifestPDF } from '../lib/zoomPdfParser';

/**
 * ManifestModal — allows operators to upload and parse a ZOOM Hoja de Ruta PDF,
 * preview detected packages, and load them into active memory/localStorage.
 */
export default function ManifestModal({
  isOpen,
  onClose,
  manifestMeta,
  hasManifest,
  onLoadManifest,
  onClearManifest,
  addToast,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Reset internal state when modal closes or active manifest is cleared
  useEffect(() => {
    if (!isOpen || !hasManifest) {
      setParsedData(null);
      setError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, hasManifest]);

  if (!isOpen) return null;

  const handleFileProcess = async (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Por favor selecciona un archivo PDF válido');
      return;
    }

    setLoading(true);
    setError('');
    setParsedData(null);

    try {
      const result = await parseZoomManifestPDF(file);

      if (!result.items || result.items.length === 0) {
        throw new Error('No se encontraron números de guía válidos en este PDF. Asegúrate de que sea una Hoja de Ruta de Zoom.');
      }

      setParsedData(result);
    } catch (err) {
      console.error('Error parseando PDF:', err);
      setError(err.message || 'Error al procesar el archivo PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmLoad = () => {
    if (!parsedData) return;
    onLoadManifest(parsedData.items, parsedData.meta);
    addToast?.(`Manifiesto cargado: ${parsedData.items.length} guías importadas`, 'success');
    setParsedData(null);
    setError('');
    onClose();
  };

  const handleRemoveActive = () => {
    onClearManifest();
    setParsedData(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast?.('Manifiesto activo eliminado', 'info');
  };

  const handleDiscardParsed = () => {
    setParsedData(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const payCount = parsedData ? parsedData.items.filter((i) => i.hasPayment).length : 0;
  const freeCount = parsedData ? parsedData.items.filter((i) => !i.hasPayment).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <PdfDocIcon />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Manifiesto de Zoom (Hoja de Ruta)</h3>
              <p className="text-xs text-blue-100">
                Extrae destinatarios, servicios y cobros directamente del PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Active Manifest Notice */}
          {hasManifest && !parsedData && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Manifiesto Activo en Sistema
                  </h4>
                  <p className="text-xs text-emerald-700">
                    {manifestMeta?.manifestNumber ? `Mis: ${manifestMeta.manifestNumber}` : ''}
                    {manifestMeta?.route ? ` · Ruta ${manifestMeta.route}` : ''}
                    {manifestMeta?.totalItems ? ` · ${manifestMeta.totalItems} guías cargadas` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveActive}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
              >
                Eliminar Manifiesto
              </button>
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200
              ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileProcess(file);
              }}
            />

            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-700">
                  Leyendo y procesando páginas del PDF...
                </p>
                <p className="text-xs text-slate-400">
                  Extrayendo códigos de guía, nombres de clientes y cobros
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UploadIcon />
                </div>
                <div className="mt-1">
                  <span className="text-sm font-semibold text-slate-800">
                    Haz clic para seleccionar el PDF
                  </span>
                  <span className="text-sm text-slate-500"> o arrástralo y suéltalo aquí</span>
                </div>
                <p className="text-xs text-slate-400">
                  Formatos de Hoja de Ruta de Zoom Venezuela (Punto Fijo, etc.)
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Preview Card */}
          {parsedData && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Resumen detectado del PDF
                  </h4>
                  <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    {parsedData.items.length} guías encontradas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardParsed}
                  className="text-[11px] font-semibold text-slate-400 hover:text-red-600 px-2 py-0.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Descartar previsualización de este PDF"
                >
                  ✕ Descartar
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase">Ruta</span>
                  <span className="text-sm font-bold text-slate-800">
                    {parsedData.meta.route || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase">Fecha</span>
                  <span className="text-sm font-bold text-slate-800">
                    {parsedData.meta.date || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] text-amber-700 font-medium block uppercase">Pago: Sí</span>
                  <span className="text-sm font-bold text-amber-900">{payCount} paquetes</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-700 font-medium block uppercase">Pago: No</span>
                  <span className="text-sm font-bold text-emerald-900">{freeCount} paquetes</span>
                </div>
              </div>

              {/* Sample list preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                <div className="px-3 py-2 bg-slate-100/80 text-[11px] font-semibold text-slate-600 flex justify-between border-b border-slate-200">
                  <span>Muestra de paquetes extraídos (primeros 5)</span>
                  <span>{parsedData.items.length} totales</span>
                </div>
                <div className="divide-y divide-slate-200/60 max-h-44 overflow-y-auto">
                  {parsedData.items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {item.owner}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>

          {parsedData && (
            <button
              type="button"
              onClick={handleConfirmLoad}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Aplicar Manifiesto ({parsedData.items.length} guías)</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PdfDocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
