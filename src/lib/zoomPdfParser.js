import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// Polyfill Uint8Array.prototype.toHex if the browser engine does not yet implement it
if (typeof Uint8Array.prototype.toHex !== 'function') {
  Uint8Array.prototype.toHex = function () {
    let hex = '';
    for (let i = 0; i < this.length; i++) {
      hex += this[i].toString(16).padStart(2, '0');
    }
    return hex;
  };
}

// Configure the worker source using Vite's URL asset import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extracts metadata and guide items from a ZOOM Hoja de Ruta PDF file.
 * @param {File | ArrayBuffer} fileOrBuffer
 * @returns {Promise<{
 *   meta: { route: string, date: string, manifestNumber: string, totalPages: number },
 *   items: Array<{ code: string, owner: string, serviceType: string, hasPayment: boolean }>
 * }>}
 */
export async function parseZoomManifestPDF(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Formato de archivo no válido para procesar PDF');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  let meta = {
    route: '',
    date: '',
    manifestNumber: '',
    totalPages: numPages,
  };

  const allItems = [];
  const seenCodes = new Set();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruct text preserving layout and spaces
    const pageText = textContent.items
      .map((item) => (item.hasEOL ? item.str + '\n' : item.str + ' '))
      .join('');

    // Extract metadata from the first page
    if (pageNum === 1) {
      const routeMatch = pageText.match(/Ruta:\s*([A-Za-z0-9-]+)/i);
      const dateMatch = pageText.match(/Fecha:\s*([\d/]+)/i);
      const misMatch = pageText.match(/Hoja de Ruta Mis:\s*([0-9]+)/i);

      meta.route = routeMatch ? routeMatch[1].trim() : '';
      meta.date = dateMatch ? dateMatch[1].trim() : '';
      meta.manifestNumber = misMatch ? misMatch[1].trim() : '';
    }

    // Parse guides from this page text
    const pageGuides = parseGuidesFromPageText(pageText);

    for (const guide of pageGuides) {
      if (!seenCodes.has(guide.code)) {
        seenCodes.add(guide.code);
        allItems.push(guide);
      }
    }
  }

  return {
    meta,
    items: allItems,
  };
}

/**
 * Parses individual guide rows from the text of a single page of ZOOM manifest.
 * @param {string} pageText
 * @returns {Array<{ code: string, owner: string, serviceType: string, hasPayment: boolean }>}
 */
function parseGuidesFromPageText(pageText) {
  const guides = [];

  // Match 9-digit (starts with 9) or 10-digit (starts with 1 or 2) Zoom codes
  const guideCodeRegex = /\b(9\d{8}|[12]\d{9})\b/g;
  const matches = [];
  let match;

  while ((match = guideCodeRegex.exec(pageText)) !== null) {
    const code = match[0];
    matches.push({
      code,
      index: match.index,
    });
  }

  if (matches.length === 0) return guides;

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index + current.code.length;
    // The slice ends at the next guide code, or at the footer/end of text
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : pageText.length;
    const slice = pageText.slice(startIndex, endIndex);

    // 1. Detect Payment (hasPayment)
    // Looks for USD$ amount. E.g. "USD$ 9.82" vs "USD$ 0.00"
    let hasPayment = false;
    const usdMatch = slice.match(/USD\$\s*([\d.,]+)/i);
    if (usdMatch) {
      const rawAmount = usdMatch[1].replace(',', '.');
      const numericAmount = parseFloat(rawAmount);
      hasPayment = !isNaN(numericAmount) && numericAmount > 0;
    } else {
      // Fallback check: Bs. amount > 0
      const bsMatch = slice.match(/Bs\.\s*([\d.,]+)/i);
      if (bsMatch) {
        const rawBs = bsMatch[1].replace(/\./g, '').replace(',', '.');
        const numericBs = parseFloat(rawBs);
        hasPayment = !isNaN(numericBs) && numericBs > 0;
      }
    }

    // 2. Detect Service Type and Weight (SERV. and PZA/KG)
    // In Zoom tables: "SERV. PZA/KG" e.g. "BCD 1 / 0.26" or "GP6 1 / -"
    let serviceType = '—';
    let afterPzaKg = slice;

    const pzaKgRegex = /([A-Z0-9]{2,5})\s+(\d+\s*\/\s*[\d.-]+)/i;
    const pzaKgMatch = slice.match(pzaKgRegex);

    if (pzaKgMatch) {
      serviceType = pzaKgMatch[1].toUpperCase();
      const pzaKgIndex = pzaKgMatch.index + pzaKgMatch[0].length;
      afterPzaKg = slice.slice(pzaKgIndex);
    }

    // 3. Detect Recipient Name (DESTINATARIO)
    // The recipient name follows PZA/KG and comes before phone numbers or address keywords
    const stopKeywords = /(?:0\d{9,10}|\d{8,11}|AV\b|CALLE\b|URB\b|CLL\b|PARROQUIA\b|MUNICIPIO\b|SECTOR\b|LOCAL\b|ZOOM PUERTA\b)/i;
    const ownerStopMatch = afterPzaKg.match(stopKeywords);

    const rawOwnerChunk = ownerStopMatch
      ? afterPzaKg.slice(0, ownerStopMatch.index)
      : afterPzaKg.slice(0, 50);

    // Clean up owner name: letters, accents, spaces
    let owner = rawOwnerChunk
      .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    // Guard against empty owner or garbage
    if (!owner || owner.length < 2) {
      owner = '—';
    }

    guides.push({
      code: current.code,
      owner,
      serviceType,
      hasPayment,
    });
  }

  return guides;
}
