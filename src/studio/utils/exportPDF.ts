
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// This utility will handle exporting the canvas content to a PDF.
// It will take the canvas element, convert it to an image, and then place that image in a PDF.

export async function exportToPDF(canvasId: string, fileName: string) {
  const canvasElement = document.getElementById(canvasId);
  if (!canvasElement) {
    console.error('Canvas element not found!');
    return;
  }

  const canvas = await html2canvas(canvasElement, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    // Use the dimensions of the canvas element for the PDF page size
    format: [canvasElement.offsetWidth, canvasElement.offsetHeight]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvasElement.offsetWidth, canvasElement.offsetHeight);
  pdf.save(`${fileName}.pdf`);
}
