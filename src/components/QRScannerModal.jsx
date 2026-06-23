import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCAN_COOLDOWN_MS = 1500;

/**
 * QRScannerModal — fullscreen modal that uses the smartphone's rear camera
 * to scan QR codes and extract guide numbers.
 *
 * Props:
 *  - onScan(code)  : called with the validated guide code
 *  - onError(msg)  : called when the QR content isn't a valid guide
 *  - onClose()     : called when user wants to close the scanner
 */
export default function QRScannerModal({ onScan, onError, onClose }) {
  const [status, setStatus] = useState('starting'); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [flash, setFlash] = useState(''); // '' | 'success' | 'error'

  const scannerRef = useRef(null);
  const cooldownRef = useRef(false);
  const mountedRef = useRef(true);

  const triggerFlash = useCallback((type) => {
    setFlash(type);
    setTimeout(() => {
      if (mountedRef.current) setFlash('');
    }, 600);
  }, []);

  // Initialize camera and scanner
  useEffect(() => {
    mountedRef.current = true;
    const regionId = 'qr-scanner-region';
    let html5Qrcode = null;
    let scannerStarted = false;

    const startScanner = async () => {
      // Pre-flight: check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (mountedRef.current) {
          setStatus('error');
          setErrorMsg('Tu navegador no soporta acceso a la cámara. Intenta desde Chrome o Safari.');
        }
        return;
      }

      // Small delay to ensure the DOM element is mounted
      await new Promise((r) => setTimeout(r, 100));
      if (!mountedRef.current) return;

      // Verify the region element exists
      const regionEl = document.getElementById(regionId);
      if (!regionEl) {
        if (mountedRef.current) {
          setStatus('error');
          setErrorMsg('Error interno: no se encontró el contenedor de cámara.');
        }
        return;
      }

      try {
        html5Qrcode = new Html5Qrcode(regionId);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' }, // rear camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (cooldownRef.current) return;
            cooldownRef.current = true;

            const trimmed = decodedText.trim();

            // Same Zoom guide validation as GuideScanner
            const isValidZoomGuide = /^(9\d{8}|[12]\d{9})$/.test(trimmed);

            if (isValidZoomGuide) {
              // Haptic feedback
              if (navigator.vibrate) navigator.vibrate(100);

              // Play success sound
              try {
                const audio = new Audio('/audio/success-beep.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}

              setLastScanned(trimmed);
              triggerFlash('success');
              onScan(trimmed);
            } else {
              // Haptic error
              if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

              try {
                const audio = new Audio('/audio/error-voice.mp3');
                audio.play().catch(() => {});
              } catch {}

              triggerFlash('error');
              onError(`QR no contiene guía válida de Zoom: "${trimmed}"`);
            }

            // Reset cooldown
            setTimeout(() => {
              cooldownRef.current = false;
            }, SCAN_COOLDOWN_MS);
          },
          () => {} // ignore scan failures (no QR detected in frame)
        );

        // Only mark as started if .start() resolved successfully
        scannerStarted = true;

        if (mountedRef.current) {
          setStatus('scanning');
        }
      } catch (err) {
        console.error('QR Scanner error:', err);
        if (mountedRef.current) {
          setStatus('error');
          const msg = err?.message || String(err);
          if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
            setErrorMsg('Permiso de cámara denegado. Habilítalo en la configuración del navegador.');
          } else if (msg.includes('NotFoundError') || msg.includes('Requested device not found') || msg.includes('No video')) {
            setErrorMsg('No se encontró ninguna cámara en este dispositivo.');
          } else {
            setErrorMsg('No se pudo iniciar la cámara: ' + msg);
          }
        }
      }
    };

    startScanner();

    return () => {
      mountedRef.current = false;
      try {
        if (html5Qrcode && scannerStarted) {
          html5Qrcode
            .stop()
            .then(() => html5Qrcode.clear())
            .catch(() => {});
        } else if (html5Qrcode) {
          // Scanner was created but never started — just clear the DOM
          try { html5Qrcode.clear(); } catch {}
        }
      } catch {
        // Safety net — never let cleanup crash the app
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="qr-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`qr-modal-content ${flash === 'success' ? 'qr-flash-success' : flash === 'error' ? 'qr-flash-error' : ''}`}>

        {/* Header */}
        <div className="qr-modal-header">
          <div className="qr-modal-title">
            <QRIcon />
            <span>Escáner QR</span>
          </div>
          <button onClick={onClose} className="qr-close-btn" aria-label="Cerrar escáner">
            <CloseIcon />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="qr-viewport-wrapper">
          <div id="qr-scanner-region" className="qr-viewport" />

          {/* Scanning frame overlay */}
          {status === 'scanning' && (
            <div className="qr-scan-frame">
              <div className="qr-corner qr-corner-tl" />
              <div className="qr-corner qr-corner-tr" />
              <div className="qr-corner qr-corner-bl" />
              <div className="qr-corner qr-corner-br" />
              <div className="qr-scan-line" />
            </div>
          )}

          {/* Loading state */}
          {status === 'starting' && (
            <div className="qr-status-overlay">
              <div className="qr-spinner" />
              <p>Iniciando cámara…</p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="qr-status-overlay qr-error-state">
              <CameraOffIcon />
              <p>{errorMsg}</p>
              <button onClick={onClose} className="qr-retry-btn">
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="qr-modal-footer">
          {lastScanned ? (
            <p className="qr-last-scanned">
              ✅ Última guía: <span className="font-mono-guide">{lastScanned}</span>
            </p>
          ) : (
            <p className="qr-instruction">
              Apunta la cámara al código QR del paquete
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Icons ─────────────────────────────────────────────── */

function QRIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" />
      <path d="M14 14h2v2h-2z" />
      <path d="M20 14h2v2h-2z" />
      <path d="M14 20h2v2h-2z" />
      <path d="M20 20h2v2h-2z" />
      <path d="M18 14h-1v4h4v-1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9" />
      <path d="M16.5 13.5a5 5 0 0 0-7-7" />
    </svg>
  );
}
