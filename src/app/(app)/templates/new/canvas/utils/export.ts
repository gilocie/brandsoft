
'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { Page } from '@/stores/canvas-store';

const renderPageToCanvas = async (pageId: string): Promise<HTMLCanvasElement> => {
    const pageElement = document.getElementById(pageId) as HTMLElement;
    if (!pageElement) throw new Error(`Page element ${pageId} not found`);

    return await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
    });
};

export const exportAsImage = async (element: HTMLElement, format: 'png' | 'jpeg', filename: string) => {
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
    });

    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, 1.0);
    link.click();
};

export const exportAsPdf = async (pages: Page[], filename: string) => {
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4' // Standard A4 size, jspdf will calculate pixels
    });
    
    // Hide original pages from view and create a temporary container
    const originalContainer = document.querySelector('.flex-1.bg-gray-200 > .absolute') as HTMLElement;
    if (originalContainer) originalContainer.style.visibility = 'hidden';

    const tempContainer = document.createElement('div');
    document.body.appendChild(tempContainer);
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    
    for (let i = 0; i < pages.length; i++) {
        const pageId = `page-${i}`;
        const pageElement = document.getElementById(pageId);
        
        if (pageElement) {
             const clonedPage = pageElement.cloneNode(true) as HTMLElement;
             tempContainer.appendChild(clonedPage);
             
             const canvas = await html2canvas(clonedPage, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff', // Ensure a white background for PDF
                width: clonedPage.offsetWidth,
                height: clonedPage.offsetHeight,
            });

            tempContainer.removeChild(clonedPage);

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            if (i > 0) pdf.addPage();
            
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
        }
    }
    
    // Cleanup
    document.body.removeChild(tempContainer);
    if (originalContainer) originalContainer.style.visibility = 'visible';
    
    pdf.save(`${filename}.pdf`);
};


export const exportAsZip = async (pages: Page[], format: 'png' | 'jpeg', filename: string) => {
    const zip = new JSZip();

    // Hide original pages from view and create a temporary container
    const originalContainer = document.querySelector('.flex-1.bg-gray-200 > .absolute') as HTMLElement;
    if (originalContainer) originalContainer.style.visibility = 'hidden';

    const tempContainer = document.createElement('div');
    document.body.appendChild(tempContainer);
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';

    for (let i = 0; i < pages.length; i++) {
        const pageId = `page-${i}`;
        const pageElement = document.getElementById(pageId);
        if (pageElement) {
            const clonedPage = pageElement.cloneNode(true) as HTMLElement;
            tempContainer.appendChild(clonedPage);

            const canvas = await html2canvas(clonedPage, { scale: 2, useCORS: true, allowTaint: true });
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, `image/${format}`));
            
            if (blob) {
                zip.file(`page_${i + 1}.${format}`, blob);
            }
            tempContainer.removeChild(clonedPage);
        }
    }
    
    // Cleanup
    document.body.removeChild(tempContainer);
    if (originalContainer) originalContainer.style.visibility = 'visible';

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${filename}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
};
