import { useEffect, useRef, useState } from 'react';
import { useGuides } from "../customHooks/useGuides"
import QRScannerModal from './QRScannerModal';

const GUIDE_LENGTH = 10;

/**
 * GuideScanner — always-focused input that captures barcode scanner events.
 * Filters out non-numeric characters, validates exactly 10 digits on Enter.
 */
export default function GuideScanner({ onAdd, onError, disabled = false }) {
  const [value, setValue] = useState('');
  const valueRef = useRef(value);
  const [shake, setShake] = useState(false);
  const [focused, setFocus] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const inputRef = useRef(null);
  const { guides } = useGuides();

  // Keep valueRef synced for the global keydown listener
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Keep focus on the input whenever the user clicks anywhere,
  // EXCEPT when the click lands on another focusable input/textarea
  // (e.g. the search/indexer box in GuideTable).
  useEffect(() => {
    if (disabled) return;
    const refocus = (e) => {
      const target = e.target;
      const isOtherInput =
        target !== inputRef.current &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (isOtherInput) return; // let the search box keep focus
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    document.addEventListener('click', refocus);
    inputRef.current?.focus();
    return () => document.removeEventListener('click', refocus);
  }, [disabled]);

  // Global keydown listener to capture barcode scanner input even when focus is lost.
  // PAUSES automatically when another input/textarea holds focus (e.g. the search box).
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (disabled) return;

      // If we are already focused on the scanner input, let its own handlers deal with it
      if (document.activeElement === inputRef.current) return;

      // ── Pause for any other focused input / textarea ──────────────────────
      // This allows the search/indexer in GuideTable to receive keystrokes
      // without interference. Priority is restored as soon as the other input
      // loses focus (blur) or the user presses Escape (handled in GuideTable).
      const active = document.activeElement;
      if (
        active &&
        active !== document.body &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) return;
      // ─────────────────────────────────────────────────────────────────────

      // Ignore complex key combos
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (/^[A-Za-z0-9]$/.test(e.key)) {
        e.preventDefault();
        setValue(prev => (prev + e.key).slice(0, GUIDE_LENGTH));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitValue(valueRef.current);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setValue(prev => prev.slice(0, -1));
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [disabled, onAdd, onError]);

  const handleChange = (e) => {
    // Strip non-alphanumeric, cap at 10 chars
    const clean = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, GUIDE_LENGTH);
    setValue(clean);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const submitValue = (val) => {
    const trimmed = val.trim();

    if (trimmed.length === 0) return;

    // Validación estricta para guías Zoom:
    // - 9 dígitos que empiezan con 9 (ej: 980400009)
    // - 10 dígitos que empiezan con 1 o 2 (ej: 1680635235, 2000000000)
    const isValidZoomGuide = /^(9\d{8}|[12]\d{9})$/.test(trimmed);

    if (!isValidZoomGuide) {
      const audio = new Audio('/audio/error-voice.mp3');
      audio.play().catch(e => console.log('Audio error:', e));

      onError(`Código ignorado (no es una guía válida de Zoom): ${trimmed}`);
      triggerShake();
      setValue('');
      return;
    }

    if (guides.some((g) => g.code === trimmed)) {
      const audio = new Audio('/audio/duplicate-error-voice.mp3');
      audio.play().catch(e => console.log('Audio error:', e));

      onError(`Código ignorado (ya existe en la lista): ${trimmed}`);
      triggerShake();
      setValue('');
      return;
    }

    onAdd(trimmed);
    setValue('');
  };

  const submit = () => submitValue(value);

  const progress = (value.length / GUIDE_LENGTH) * 100;
  const isFull = value.length === GUIDE_LENGTH;

  return (
    <section className="mb-8 animate-fadeInUp">
      <label
        htmlFor="guide-input"
        className="block text-xs font-semibold text-slate-100 uppercase tracking-widest mb-3"
      >
        Número de Guía
      </label>

      <div className={`relative transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
        {/* Left icon */}
        <div
          className={`
            absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200
            ${isFull ? 'text-emerald-400' : focused ? 'text-cyan-400' : 'text-slate-600'}
          `}
        >
          <ScanIcon />
        </div>

        <input
          id="guide-input"
          ref={inputRef}
          type="text"
          disabled={disabled}
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Escanea o ingresa el número de guía…"
          maxLength={GUIDE_LENGTH}
          className={`
            w-full pl-14 pr-20 py-5 rounded-2xl
            font-mono-guide text-lg text-slate-900/60
            placeholder:text-slate-700 placeholder:font-sans placeholder:text-base
            bg-slate-100/80 outline-none transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${shake
              ? 'border-2 border-red-500/80 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
              : focused
                ? 'border-2 border-blue-900/70 shadow-[0_0_0_3px_rgba(34,211,238,0.12)] animate-pulseGlow'
                : 'border-2 border-[#1e3a5f]/60'
            }
          `}
        />

        {/* Character counter */}
        <div
          className={`
            absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2
          `}
        >
          <span
            className={`text-sm font-mono-guide font-medium transition-colors ${isFull ? 'text-emerald-600/90' : value.length > 0 ? 'text-slate-900' : 'text-slate-600'
              }`}
          >
            {value.length}/{GUIDE_LENGTH}
          </span>
        </div>

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 left-4 right-4 h-[4px] rounded-full overflow-hidden bg-slate-50/40">
          <div
            className={`h-full rounded-full transition-all duration-150 ${isFull ? 'bg-blue-400/70' : 'bg-green-600/70'
              }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mt-2.5 ml-1 text-xs text-slate-100">
        Presiona{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-[#1e3a5f]/60 text-slate-400 font-mono-guide text-[11px]">
          Enter
        </kbd>{' '}
        o espera el scan del lector para añadir la guía
      </p>

      {/* QR Scanner button — visible on mobile */}
      <button
        type="button"
        onClick={() => setShowQR(true)}
        disabled={disabled}
        className="qr-scan-button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="8" height="8" rx="1" />
          <rect x="14" y="2" width="8" height="8" rx="1" />
          <rect x="2" y="14" width="8" height="8" rx="1" />
          <path d="M14 14h2v2h-2z" />
          <path d="M20 14h2v2h-2z" />
          <path d="M14 20h2v2h-2z" />
          <path d="M20 20h2v2h-2z" />
        </svg>
        Escanear QR con cámara
      </button>

      {/* QR Scanner Modal */}
      {showQR && (
        <QRScannerModal
          onScan={(code) => {
            onAdd(code);
          }}
          onError={onError}
          onClose={() => setShowQR(false)}
        />
      )}
    </section>
  );
}

function ScanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="7" y2="12" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="17" y1="12" x2="17" y2="12" />
      <rect x="9" y="10" width="6" height="4" rx="1" />
    </svg>
  );
}
