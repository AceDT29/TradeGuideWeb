import { useState } from 'react';
import Navbar        from './components/Navbar';
import GuideScanner  from './components/GuideScanner';
import GuideTable    from './components/GuideTable';
import ClearAllModal from './components/ClearAllModal';
import Toast         from './components/Toast';
import { useGuides } from './customHooks/useGuides';
import { useToast }  from './customHooks/useToast';

export default function App() {
  const { guides, addGuide, removeGuide, clearAll } = useGuides();
  const { toasts, addToast, removeToast }           = useToast();
  const [showClearModal, setShowClearModal]          = useState(false);

  // ── Event handlers ────────────────────────────────────────

  const handleAdd = (code) => {
    addGuide(code);
    addToast(`Guía ${code} registrada`, 'success');
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

  const handleCopyAll = () => {
    if (guides.length === 0) {
      addToast('No hay guías para copiar', 'error');
      return;
    }
    const text = guides.map((g) => g.code).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      addToast(
        `${guides.length} ${guides.length === 1 ? 'guía copiada' : 'guías copiadas'}`,
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

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080b11]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-5">
        <GuideScanner
          onAdd={handleAdd}
          onError={handleError}
        />

        <GuideTable
          guides={guides}
          onCopyOne={handleCopyOne}
          onRemove={removeGuide}
          onCopyAll={handleCopyAll}
          onClearAll={() => setShowClearModal(true)}
        />
      </main>

      {/* Confirmation modal */}
      {showClearModal && (
        <ClearAllModal
          count={guides.length}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearModal(false)}
        />
      )}

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
