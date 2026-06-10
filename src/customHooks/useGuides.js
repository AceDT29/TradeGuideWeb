import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tradeweb_guides';
const CLEANUP_KEY = 'tradeweb_last_cleanup';
const CLEANUP_MS  = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Corre sincrónicamente en el primer render (lazy initializer de useState).
 * Al ser síncrono, el save effect nunca puede pisar estos datos con [].
 */
function loadInitialGuides() {
  try {
    const now       = Date.now();
    const lastClean = localStorage.getItem(CLEANUP_KEY);
    const elapsed   = lastClean ? now - parseInt(lastClean, 10) : Infinity;

    // Primera visita o nunca se fijó el timestamp → inicializar
    if (!lastClean) {
      localStorage.setItem(CLEANUP_KEY, String(now));
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }

    // Han pasado +24h → limpiar todo
    if (elapsed >= CLEANUP_MS) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(CLEANUP_KEY, String(now));
      return [];
    }

    // Caso normal → restaurar guías guardadas
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Hook principal: gestiona la lista de guías con persistencia en localStorage.
 * La carga inicial es síncrona (lazy initializer), la limpieza automática
 * ocurre cada 24h al abrir la app.
 */
export function useGuides() {
  // Estado inicializado sincrónicamente desde localStorage
  const [guides, setGuides] = useState(loadInitialGuides);

  // ── Persistir en cada cambio ──────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
    } catch {
      // localStorage lleno — falla silenciosamente
    }
  }, [guides]);

  // ── Acciones ──────────────────────────────────────────────
  const addGuide = useCallback((code) => {
    const entry = {
      id:        crypto.randomUUID(),
      code,
      timestamp: new Date().toISOString(),
    };
    setGuides((prev) => [...prev, entry]);
    return entry;
  }, []);

  const removeGuide = useCallback((id) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setGuides([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(CLEANUP_KEY, String(Date.now()));
  }, []);

  return { guides, addGuide, removeGuide, clearAll };
}
