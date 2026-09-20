/**
 * Audio feedback utilities for TradeWeb Scanner
 * Provides audio confirmation for successful scans, invalid formats, and duplicates.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a crisp, high-pitch scanner confirmation beep (POS scanner style).
 * Uses Web Audio API for zero latency with fallback to /audio/success-beep.mp3.
 */
export function playSuccessBeep() {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Crisp barcode scanner tone: slight upward ramp
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 note (1760 Hz)
      osc.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.08);

      // Volume envelope: instant attack, quick smooth decay
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      return;
    }
  } catch (e) {
    console.debug('Web Audio API unavailable, falling back to HTML5 Audio', e);
  }

  try {
    const audio = new Audio('/audio/success-beep.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {}
}

/**
 * Play voice/audio alert for invalid format scan.
 */
export function playErrorSound() {
  try {
    const audio = new Audio('/audio/error-voice.mp3');
    audio.volume = 0.8;
    audio.play().catch((e) => console.log('Audio error:', e));
  } catch {}
}

/**
 * Play voice/audio alert for duplicate guide scan.
 */
export function playDuplicateSound() {
  try {
    const audio = new Audio('/audio/duplicate-error-voice.mp3');
    audio.volume = 0.8;
    audio.play().catch((e) => console.log('Audio error:', e));
  } catch {}
}
