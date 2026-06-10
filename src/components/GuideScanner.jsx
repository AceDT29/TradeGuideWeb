import { useEffect, useRef, useState } from 'react';

const GUIDE_LENGTH = 10;

/**
 * GuideScanner — always-focused input that captures barcode scanner events.
 * Filters out non-numeric characters, validates exactly 10 digits on Enter.
 */
export default function GuideScanner({ onAdd, onError }) {
  const [value, setValue]   = useState('');
  const [shake, setShake]   = useState(false);
  const [focused, setFocus] = useState(true);
  const inputRef            = useRef(null);

  // Keep focus on the input whenever the user clicks anywhere
  useEffect(() => {
    const refocus = () => setTimeout(() => inputRef.current?.focus(), 50);
    document.addEventListener('click', refocus);
    inputRef.current?.focus();
    return () => document.removeEventListener('click', refocus);
  }, []);

  const handleChange = (e) => {
    // Strip non-digits, cap at 10 chars
    const clean = e.target.value.replace(/\D/g, '').slice(0, GUIDE_LENGTH);
    setValue(clean);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const trimmed = value.trim();

    if (trimmed.length === 0) return;

    if (trimmed.length !== GUIDE_LENGTH) {
      onError(
        `Guía inválida: se esperan ${GUIDE_LENGTH} dígitos, se recibieron ${trimmed.length}.`
      );
      triggerShake();
      return;
    }

    onAdd(trimmed);
    setValue('');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const progress = (value.length / GUIDE_LENGTH) * 100;
  const isFull   = value.length === GUIDE_LENGTH;

  return (
    <section className="mb-8 animate-fadeInUp">
      <label
        htmlFor="guide-input"
        className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3"
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
          inputMode="numeric"
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
            font-mono-guide text-lg text-slate-100
            placeholder:text-slate-700 placeholder:font-sans placeholder:text-base
            bg-[#0d1320] outline-none transition-all duration-200
            ${shake
              ? 'border-2 border-red-500/80 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
              : focused
                ? 'border-2 border-cyan-500/70 shadow-[0_0_0_3px_rgba(34,211,238,0.12)] animate-pulseGlow'
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
            className={`text-sm font-mono-guide font-medium transition-colors ${
              isFull ? 'text-emerald-400' : value.length > 0 ? 'text-cyan-400' : 'text-slate-600'
            }`}
          >
            {value.length}/{GUIDE_LENGTH}
          </span>
        </div>

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full overflow-hidden bg-[#1e3a5f]/40">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isFull ? 'bg-emerald-400' : 'bg-cyan-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mt-2.5 ml-1 text-xs text-slate-600">
        Presiona{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-[#1e3a5f]/60 text-slate-400 font-mono-guide text-[11px]">
          Enter
        </kbd>{' '}
        o espera el scan del lector para añadir la guía
      </p>
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
      <line x1="7"  y1="12" x2="7"  y2="12" />
      <line x1="12" y1="8"  x2="12" y2="16" />
      <line x1="17" y1="12" x2="17" y2="12" />
      <rect x="9" y="10" width="6" height="4" rx="1" />
    </svg>
  );
}
