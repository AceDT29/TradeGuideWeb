import { useState } from "react";
import { useConnect } from "../customHooks/useConnect";
import SessionModal from "./SessionModal";

/**
 * Navbar — logo + app title + session button
 */
export default function Navbar({ addToast, onOpenManifest, hasManifest }) {
  const { onAuth, currentUser } = useConnect();
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  return (
    <>
      <nav
        style={{ borderBottom: '1px solid rgba(30,58,95,0.8)' }}
        className="sticky top-0 z-40 backdrop-blur-md bg-slate-100/80"
      >
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          {/* Barcode icon */}
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <BarcodeIcon />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight text-slate-700/90">
              TradeWeb
              <span className="ml-2 text-xs font-medium text-red-500/90 bg-cyan-400/20 px-2 py-0.5 rounded-full border-2 border-slate-400/50 animate-pulse">
                Scanner
              </span>
            </span>
            <span className="text-xs text-slate-500 font-normal">
              Gestión de guías de envío
            </span>
          </div>

          {/* Spacer & Actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Hoja de Ruta Zoom PDF Button (Desktop only) */}
            <button
              id="open-manifest-btn"
              onClick={onOpenManifest}
              className="
                hidden md:flex px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer
                bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700
                border border-slate-300 shadow-2xs transition-all duration-150 items-center gap-1.5
              "
              title="Cargar o gestionar Hoja de Ruta PDF de Zoom"
            >
              <PdfNavIcon />
              <span>Hoja de Ruta</span>
              {hasManifest && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Manifiesto cargado" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${onAuth ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
              <span className="text-xs text-slate-600 font-medium">
                {onAuth ? (currentUser?.displayName || 'Conectado') : 'No Autenticado'}
              </span>
            </div>

            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="
                px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer
                bg-[#1a2640] hover:bg-[#1e3a5f] text-slate-300 hover:text-cyan-300
                border border-[#1e3a5f] transition-all duration-150 flex items-center gap-1.5
              "
              title="Abrir inicio de sesión / perfil"
            >
              <UserNavIcon />
              <span>{onAuth ? 'Mi Cuenta' : 'Sesión'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Session Modal */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        addToast={addToast}
      />
    </>
  );
}

function UserNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PdfNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg
      width="20" height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-cyan-400"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="2" height="16" rx="0.5" />
      <rect x="6" y="4" width="1" height="16" rx="0.5" />
      <rect x="9" y="4" width="2" height="16" rx="0.5" />
      <rect x="13" y="4" width="1" height="16" rx="0.5" />
      <rect x="16" y="4" width="3" height="16" rx="0.5" />
      <rect x="21" y="4" width="1" height="16" rx="0.5" />
    </svg>
  );
}
