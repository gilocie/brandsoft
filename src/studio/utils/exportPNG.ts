
import html2canvas from 'html2canvas';

// This utility will handle exporting the canvas content to a PNG image.

function downloadURI(uri: string, name: string) {
  const link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export async function exportToPNG(canvasId: string, fileName: string) {
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
  downloadURI(imgData, `${fileName}.png`);
}
