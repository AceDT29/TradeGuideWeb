import { useState } from 'react';
import Navbar from './components/Navbar';
import GuideScanner from './components/GuideScanner';
import GuideTable from './components/GuideTable';
import ClearAllModal from './components/ClearAllModal';
import ManifestModal from './components/ManifestModal';
import ManifestStatusBar from './components/ManifestStatusBar';
import Toast from './components/Toast';
import { useGuides } from './customHooks/useGuides';
import { useManifest } from './customHooks/useManifest';
import { useToast } from './customHooks/useToast';
import guidesAdminBg from "./assets/guidesAdminBg.png";

export default function App() {
  const { guides, addGuide, updateGuide, removeGuide, clearAll } = useGuides();
  const {
    manifestMeta,
    hasManifest,
    loadManifest,
    clearManifest,
    lookupGuide,
    getComparisonStats,
  } = useManifest();
  const { toasts, addToast, removeToast } = useToast();
  const [showClearModal, setShowClearModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);

  const comparisonStats = getComparisonStats(guides);

  // ── Event handlers ────────────────────────────────────────

  const handleAdd = (code) => {
    const isDuplicate = guides.some((g) => g.code === code);
    if (isDuplicate) {
      addToast(`La guía ${code} ya ha sido registrada`, 'error');
      return;
    }

    // Auto-match with active Zoom Manifest
    const matched = lookupGuide(code);

    if (matched) {
      addGuide(code, matched.owner, matched.serviceType, matched.hasPayment);
      const payLabel = matched.hasPayment ? ' · Con Cobro (Pago: Sí)' : '';
      addToast(`Guía ${code} asignada a ${matched.owner}${payLabel}`, 'success');
    } else {
      addGuide(code, '', '—', null);
      if (hasManifest) {
        addToast(`Guía ${code} registrada (⚠️ No figura en Hoja de Ruta)`, 'info');
      } else {
        addToast(`Guía ${code} registrada`, 'success');
      }
    }
  };

  const handleError = (msg) => {
    addToast(msg, 'error');
  };

  const handleCopyOne = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      addToast(`${code} copiada al portapapeles`, 'success');
    }).catch(() => {
      addToast('No se pudo copiar al portapapeles', 'error');
    });
  };

  const handleCopyAll = (targetGuides) => {
    const listToCopy = Array.isArray(targetGuides) ? targetGuides : guides;
    if (listToCopy.length === 0) {
      addToast('No hay guías para copiar', 'error');
      return;
    }
    const text = listToCopy.map((g) => g.code).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      addToast(
        `${listToCopy.length} ${listToCopy.length === 1 ? 'guía copiada' : 'guías copiadas'}`,
        'success'
      );
    }).catch(() => {
      addToast('No se pudo copiar al portapapeles', 'error');
    });
  };

  const handleClearAll = () => {
    clearAll();
    setShowClearModal(false);
    addToast('Lista limpiada correctamente', 'success');
  };

  const handleClearManifestOnly = () => {
    clearManifest();
    addToast('Hoja de Ruta suprimida. Las guías escaneadas se mantuvieron.', 'info');
  };

  const handleResetAll = () => {
    clearManifest();
    clearAll();
    addToast('Lote reiniciado: Manifiesto suprimido y lista de guías limpia.', 'success');
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#15A2E4] flex flex-col justify-between">
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar
          addToast={addToast}
          onOpenManifest={() => setShowManifestModal(true)}
          hasManifest={hasManifest}
        />

        <main className="py-5 px-4 pb-24 flex-1">
          <section className="flex mx-auto flex-col gap-5 max-w-4xl">

            <GuideScanner
              onAdd={handleAdd}
              onError={handleError}
              disabled={showClearModal || showManifestModal}
            />

            <ManifestStatusBar
              manifestMeta={manifestMeta}
              comparisonStats={comparisonStats}
              onOpenUploadModal={() => setShowManifestModal(true)}
              onClearManifest={handleClearManifestOnly}
              onResetAll={handleResetAll}
            />

            <GuideTable
              guides={guides}
              onCopyOne={handleCopyOne}
              onRemove={removeGuide}
              onCopyAll={handleCopyAll}
              onClearAll={() => setShowClearModal(true)}
              onUpdateGuide={updateGuide}
              comparisonStats={comparisonStats}
            />
          </section>

          <footer>
          </footer>
        </main>
      </div>

      {/* Background vectors decoration (fijo al viewport y más abajo) */}
      <figure className="pointer-events-none select-none fixed -bottom-28 left-0 w-full z-0 flex justify-center overflow-hidden">
        <img
          src={guidesAdminBg}
          alt="Trade vectors background"
          className="w-full max-w-[1607px] h-auto object-contain object-bottom block opacity-75"
        />
      </figure>

      {/* Confirmation modal */}
      {showClearModal && (
        <ClearAllModal
          count={guides.length}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearModal(false)}
        />
      )}

      {/* ZOOM Manifest Upload / Inspection Modal */}
      <ManifestModal
        isOpen={showManifestModal}
        onClose={() => setShowManifestModal(false)}
        manifestMeta={manifestMeta}
        hasManifest={hasManifest}
        onLoadManifest={loadManifest}
        onClearManifest={clearManifest}
        addToast={addToast}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

