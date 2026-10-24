import { useState, useEffect, useCallback } from 'react';

const MANIFEST_STORAGE_KEY = 'tradeweb_zoom_manifest';
const MANIFEST_META_KEY = 'tradeweb_zoom_manifest_meta';

function loadInitialManifest() {
  try {
    const raw = localStorage.getItem(MANIFEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadInitialMeta() {
  try {
    const raw = localStorage.getItem(MANIFEST_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Custom hook to manage the ZOOM Hoja de Ruta manifest in the client.
 * Supports persistence, fast lookup, comparison, and metrics against scanned guides.
 */
export function useManifest() {
  const [manifest, setManifest] = useState(loadInitialManifest);
  const [manifestMeta, setManifestMeta] = useState(loadInitialMeta);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (manifest.length > 0) {
        localStorage.setItem(MANIFEST_STORAGE_KEY, JSON.stringify(manifest));
      } else {
        localStorage.removeItem(MANIFEST_STORAGE_KEY);
      }
    } catch {
      // storage full or disabled
    }
  }, [manifest]);

  useEffect(() => {
    try {
      if (manifestMeta) {
        localStorage.setItem(MANIFEST_META_KEY, JSON.stringify(manifestMeta));
      } else {
        localStorage.removeItem(MANIFEST_META_KEY);
      }
    } catch {
      // ignore
    }
  }, [manifestMeta]);

  // Set new manifest from parsed PDF
  const loadManifest = useCallback((items, meta) => {
    const enrichedMeta = {
      ...meta,
      totalItems: items.length,
      uploadedAt: new Date().toISOString(),
    };
    setManifest(items);
    setManifestMeta(enrichedMeta);
  }, []);

  // Clear active manifest
  const clearManifest = useCallback(() => {
    setManifest([]);
    setManifestMeta(null);
    localStorage.removeItem(MANIFEST_STORAGE_KEY);
    localStorage.removeItem(MANIFEST_META_KEY);
  }, []);

  // O(1) or fast lookup of a code in the manifest
  const lookupGuide = useCallback(
    (code) => {
      if (!code || manifest.length === 0) return null;
      const found = manifest.find((item) => item.code === code);
      return found || null;
    },
    [manifest]
  );

  // Compute comparison stats against currently scanned guides
  const getComparisonStats = useCallback(
    (scannedGuides = []) => {
      const scannedCodes = new Set(scannedGuides.map((g) => g.code));

      // Items from the manifest that have been scanned
      const matched = manifest.filter((item) => scannedCodes.has(item.code));
      
      // Items from the manifest not yet scanned
      const missing = manifest.filter((item) => !scannedCodes.has(item.code));

      // Scanned guides not found in the manifest
      const manifestCodes = new Set(manifest.map((item) => item.code));
      const unmanifested = scannedGuides.filter((g) => !manifestCodes.has(g.code));

      const totalExpected = manifest.length;
      const scannedCount = matched.length;
      const percentage = totalExpected > 0 ? Math.round((scannedCount / totalExpected) * 100) : 0;

      return {
        hasManifest: totalExpected > 0,
        totalExpected,
        scannedCount,
        missing,
        missingCount: missing.length,
        unmanifested,
        unmanifestedCount: unmanifested.length,
        percentage,
      };
    },
    [manifest]
  );

  return {
    manifest,
    manifestMeta,
    hasManifest: manifest.length > 0,
    loadManifest,
    clearManifest,
    lookupGuide,
    getComparisonStats,
  };
}
