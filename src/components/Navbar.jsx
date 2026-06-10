/**
 * Navbar — logo + app title
 */
export default function Navbar() {
  return (
    <nav
      style={{ borderBottom: '1px solid rgba(30,58,95,0.8)' }}
      className="sticky top-0 z-40 backdrop-blur-md bg-[#080b11]/80"
    >
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
        {/* Barcode icon */}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <BarcodeIcon />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight text-slate-100">
            TradeWeb
            <span className="ml-2 text-xs font-medium text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
              Scanner
            </span>
          </span>
          <span className="text-xs text-slate-500 font-normal">
            Gestión de guías de envío
          </span>
        </div>

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">Listo para escanear</span>
        </div>
      </div>
    </nav>
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
      <rect x="2"  y="4" width="2" height="16" rx="0.5" />
      <rect x="6"  y="4" width="1" height="16" rx="0.5" />
      <rect x="9"  y="4" width="2" height="16" rx="0.5" />
      <rect x="13" y="4" width="1" height="16" rx="0.5" />
      <rect x="16" y="4" width="3" height="16" rx="0.5" />
      <rect x="21" y="4" width="1" height="16" rx="0.5" />
    </svg>
  );
}
