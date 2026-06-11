import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF file from the list of guides, styled as a "Hoja de Ruta".
 * @param {Array} guides - Array of guide objects with {id, code, timestamp}
 */
export function exportGuidesToPDF(guides) {
  if (!guides || guides.length === 0) return;

  const doc = new jsPDF();

  const now = new Date();

  // Helper to draw header
  const drawHeader = () => {
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Hoja de Ruta - Trade Express', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateString = `Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    doc.text(dateString, 14, 30);
  };

  const tableColumn = ["#", "Fecha de Registro", "Nro. de Guía"];

  // Chunk guides into arrays of 10
  const chunkedGuides = [];
  for (let i = 0; i < guides.length; i += 10) {
    chunkedGuides.push(guides.slice(i, i + 10));
  }

  chunkedGuides.forEach((chunk, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
    }

    drawHeader();

    const tableRows = chunk.map((guide, localIndex) => {
      const globalIndex = pageIndex * 10 + localIndex;
      const dateObj = guide.timestamp ? new Date(guide.timestamp) : new Date();
      return [
        globalIndex + 1,
        dateObj.toLocaleString(),
        guide.code
      ];
    });

    // Generate Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 38,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [65, 114, 213] }, // Primary blue color matching app UI
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 38 }
    });
  });

  // Save the PDF
  const filename = `Hoja_de_Ruta_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
