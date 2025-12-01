import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoicePreview, type InvoicePreviewProps } from '@/components/invoice-preview';
import { createRoot } from 'react-dom/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToHsl(hex: string): { h: number, s: number, l: number } | null {
  if (!hex) return null;
  
  // Remove the hash at the start if it's there
  let r_hex = hex.startsWith('#') ? hex.slice(1) : hex;

  // If the hex is short (e.g. "FFF"), expand it
  if (r_hex.length === 3) {
    r_hex = r_hex.split('').map(char => char + char).join('');
  }

  // Parse the r, g, b values
  let r = parseInt(r_hex.substring(0, 2), 16);
  let g = parseInt(r_hex.substring(2, 4), 16);
  let b = parseInt(r_hex.substring(4, 6), 16);

  // Convert RGB to a value between 0 and 1
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export const downloadInvoiceAsPdf = async (props: InvoicePreviewProps) => {
    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.id = `pdf-container-${props.invoiceId}`;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Render the component using React's new root API
    const root = createRoot(container);
    root.render(<InvoicePreview {...props} />);

    // Allow time for images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    const invoiceElement = container.querySelector(`#invoice-preview-${props.invoiceId}`);
    if (!invoiceElement) {
        console.error("Invoice element not found for PDF generation.");
        document.body.removeChild(container);
        return;
    }

    const canvas = await html2canvas(invoiceElement as HTMLElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true, // Allow cross-origin images to be rendered
    });

    // Clean up the temporary container
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = canvas.height * pdfWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`Invoice-${props.invoiceId}.pdf`);
};

    