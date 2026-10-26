import { useState, useEffect, useCallback } from 'react';
import { useConnect } from './useConnect';

const STORAGE_KEY = 'tradeweb_guides';
const CLEANUP_KEY = 'tradeweb_last_cleanup';
const CLEANUP_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Corre sincrónicamente en el primer render (lazy initializer de useState).
 * Al ser síncrono, el save effect nunca puede pisar estos datos con [].
 */
function loadInitialGuides() {
  try {
    const now = Date.now();
    const lastClean = localStorage.getItem(CLEANUP_KEY);
    const elapsed = lastClean ? now - parseInt(lastClean, 10) : Infinity;

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

const MANIFEST_STORAGE_KEY = 'tradeweb_zoom_manifest';

function getActiveManifestMap() {
  try {
    const raw = localStorage.getItem(MANIFEST_STORAGE_KEY);
    if (!raw) return new Map();
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return new Map();
    const map = new Map();
    for (const item of list) {
      if (item?.code) {
        map.set(String(item.code).trim(), item);
      }
    }
    return map;
  } catch {
    return new Map();
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
  const { onAuth, socket } = useConnect();

  // ── Persistir en cada cambio ──────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
    } catch {
      // localStorage lleno — falla silenciosamente
    }
  }, [guides]);

  // ── Escuchar nuevas guías desde el servidor ───────────────
  useEffect(() => {
    if (!onAuth || !socket) return;

    const handleInitialGuides = (serverGuides) => {
      if (!Array.isArray(serverGuides)) return;
      const manifestMap = getActiveManifestMap();
      const updatesToEmit = [];

      setGuides((prev) => {
        const map = new Map();
        prev.forEach((g) => {
          const key = g.id || g.code;
          if (key) map.set(key, g);
        });

        serverGuides.forEach((g) => {
          if (!g) return;
          const key = g.id || g.code;
          if (key && !map.has(key)) {
            let enriched = g;
            const codeKey = String(g.code || '').trim();
            if ((!g.owner || g.owner.trim() === '') && manifestMap.has(codeKey)) {
              const matched = manifestMap.get(codeKey);
              enriched = {
                ...g,
                owner: matched.owner,
                serviceType: matched.serviceType || g.serviceType || '—',
                hasPayment: typeof matched.hasPayment === 'boolean' ? matched.hasPayment : g.hasPayment,
              };
              updatesToEmit.push(enriched);
            }
            map.set(key, enriched);
          }
        });
        return Array.from(map.values());
      });

      if (updatesToEmit.length > 0) {
        updatesToEmit.forEach((u) => {
          socket.emit("updateGuide", {
            id: u.id,
            owner: u.owner,
            serviceType: u.serviceType,
            hasPayment: u.hasPayment,
          });
        });
      }
    };

    const handleNewGuide = (newGuide) => {
      if (!newGuide) return;
      if (Array.isArray(newGuide)) {
        handleInitialGuides(newGuide);
        return;
      }

      const manifestMap = getActiveManifestMap();
      let enriched = newGuide;
      const codeKey = String(newGuide.code || '').trim();

      if ((!newGuide.owner || newGuide.owner.trim() === '') && manifestMap.has(codeKey)) {
        const matched = manifestMap.get(codeKey);
        enriched = {
          ...newGuide,
          owner: matched.owner,
          serviceType: matched.serviceType || newGuide.serviceType || '—',
          hasPayment: typeof matched.hasPayment === 'boolean' ? matched.hasPayment : newGuide.hasPayment,
        };

        if (enriched.id) {
          socket.emit("updateGuide", {
            id: enriched.id,
            owner: enriched.owner,
            serviceType: enriched.serviceType,
            hasPayment: enriched.hasPayment,
          });
        }
      }

      setGuides((prev) => {
        const exists = prev.some((g) => (g.id && g.id === enriched.id) || (g.code && g.code === enriched.code));
        if (exists) return prev;
        return [...prev, enriched];
      });
    };

    const handleGuidesCleared = () => {
      setGuides([]);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(CLEANUP_KEY, String(Date.now()));
    };

    const handleUpdateGuide = (updatedGuide) => {
      if (!updatedGuide?.id) return;
      setGuides((prev) =>
        prev.map((g) => (g.id === updatedGuide.id ? { ...g, ...updatedGuide } : g))
      );
    };

    socket.on("initialGuides", handleInitialGuides);
    socket.on("chatGuide", handleNewGuide);
    socket.on("updateGuide", handleUpdateGuide);
    socket.on("guidesCleared", handleGuidesCleared);

    // Limpiar el evento cuando se desmonte o cambie la conexión/socket
    return () => {
      socket.off("initialGuides", handleInitialGuides);
      socket.off("chatGuide", handleNewGuide);
      socket.off("updateGuide", handleUpdateGuide);
      socket.off("guidesCleared", handleGuidesCleared);
    };
  }, [onAuth, socket]);

  // ── Reconciliación con Manifiesto (Retroactiva y en Tiempo Real) ───────
  const reconcileWithManifest = useCallback((manifestItems = null) => {
    let items = manifestItems;
    if (!items || !Array.isArray(items)) {
      try {
        const raw = localStorage.getItem(MANIFEST_STORAGE_KEY);
        items = raw ? JSON.parse(raw) : [];
      } catch {
        items = [];
      }
    }

    if (!Array.isArray(items) || items.length === 0) return 0;

    const manifestMap = new Map();
    for (const item of items) {
      if (item?.code) {
        manifestMap.set(String(item.code).trim(), item);
      }
    }

    let updatedCount = 0;
    const updatesToEmit = [];

    setGuides((prev) => {
      let changed = false;
      const next = prev.map((g) => {
        const codeKey = String(g.code || '').trim();
        const matched = manifestMap.get(codeKey);
        if (matched) {
          const needsUpdate =
            !g.owner ||
            g.owner.trim() === '' ||
            g.owner !== matched.owner ||
            g.serviceType !== matched.serviceType ||
            g.hasPayment !== matched.hasPayment;

          if (needsUpdate) {
            changed = true;
            updatedCount++;
            const updated = {
              ...g,
              owner: matched.owner,
              serviceType: matched.serviceType || '—',
              hasPayment: typeof matched.hasPayment === 'boolean' ? matched.hasPayment : null,
            };
            updatesToEmit.push(updated);
            return updated;
          }
        }
        return g;
      });

      return changed ? next : prev;
    });

    // Sincronizar en tiempo real con trade-server y otros clientes
    if (onAuth && socket && updatesToEmit.length > 0) {
      updatesToEmit.forEach((u) => {
        socket.emit("updateGuide", {
          id: u.id,
          owner: u.owner,
          serviceType: u.serviceType,
          hasPayment: u.hasPayment,
        });
      });
    }

    return updatedCount;
  }, [onAuth, socket]);

  // ── Acciones ──────────────────────────────────────────────
  const addGuide = useCallback((code, owner = '', serviceType = '', hasPayment = null) => {
    const entry = {
      id: crypto.randomUUID(),
      code,
      owner,
      serviceType: serviceType || '—',
      hasPayment,
      timestamp: new Date().toISOString(),
    };
    setGuides((prev) => [...prev, entry]);

    if (onAuth && socket) {
      console.log("el codigo paso por la entrada de guia asincrona");
      socket.emit("createGuide", entry, (response) => {
        if (response?.offset && socket.auth) {
          socket.auth.serverOffset = response.offset;
        }
        if (response?.error) {
          console.log("Error del servidor al crear guía:", response.error);
          return;
        }
      });
    }

    return entry;
  }, [onAuth, socket]);

  const updateGuide = useCallback((id, updates) => {
    setGuides((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );

    if (onAuth && socket) {
      socket.emit("updateGuide", { id, ...updates }, (response) => {
        if (response?.error) {
          console.log("Error del servidor al actualizar guía:", response.error);
        }
      });
    }
  }, [onAuth, socket]);

  const removeGuide = useCallback((id) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setGuides([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(CLEANUP_KEY, String(Date.now()));
  }, []);

  return { guides, addGuide, updateGuide, removeGuide, clearAll, reconcileWithManifest };
}
