
'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Invoice, LineItem, DesignSettings } from '@/hooks/use-brandsoft';
import { format, parseISO, isValid } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

// ... (Keep existing Type definitions here) ...
type InvoiceData = Partial<Invoice> & {
    lineItems?: LineItem[],
    currency?: string;
    invoiceDate?: Date;
    dueDate?: Date;
    taxName?: string;
    applyTax?: boolean;
    taxType?: 'percentage' | 'flat';
    taxValue?: number;
    applyDiscount?: boolean;
    discountType?: 'percentage' | 'flat';
    discountValue?: number;
    applyShipping?: boolean;
    shippingValue?: number;
    design?: DesignSettings;
};

export interface InvoicePreviewProps {
    config: BrandsoftConfig | null;
    customer: Customer | null;
    invoiceData: InvoiceData;
    invoiceId?: string;
    forPdf?: boolean;
    designOverride?: DesignSettings;
}

// ... (Keep Watermark component here) ...
const InvoiceStatusWatermark = ({ status }: { status: Invoice['status'] }) => {
    let text = '';
    let colorClass = '';

    switch (status) {
        case 'Pending':
        case 'Overdue':
            text = 'UNPAID';
            colorClass = 'text-red-500/10';
            break;
        case 'Paid':
            text = 'PAID';
            colorClass = 'text-green-500/10';
            break;
        case 'Canceled':
            text = 'CANCELED';
            colorClass = 'text-gray-500/10';
            break;
        default:
            return null;
    }

    if (!text) return null;

    return (
        <div className={cn(
            "absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0",
            "text-[8rem] sm:text-[10rem] font-black tracking-[1rem] leading-none select-none pointer-events-none uppercase",
            colorClass
        )}>
            {text}
        </div>
    );
};

export function InvoicePreview({ 
    config, 
    customer, 
    invoiceData, 
    invoiceId, 
    forPdf = false,
    designOverride 
}: InvoicePreviewProps) {

    // ... (Keep existing Data preparation & Design Memo logic here) ...
    if (!config || !customer || !invoiceData) return null;

    const design = useMemo(() => {
        // ... (Keep existing merge logic) ...
        const brand = config.brand || {};
        const defaultTemplate = config.profile?.defaultInvoiceTemplate || {};
        const documentDesign = invoiceData?.design || {};
        const override = designOverride || {};
        const hasOverride = designOverride !== undefined && designOverride !== null;
        
        let mergedDesign = {
            backgroundColor: brand.backgroundColor || '#FFFFFF',
            headerImage: brand.headerImage || '',
            footerImage: brand.footerImage || '',
            backgroundImage: brand.backgroundImage || '',
            watermarkImage: brand.watermarkImage || '',
        };
        
        const merge = (target: any, source: any) => {
            if (source.backgroundColor) target.backgroundColor = source.backgroundColor;
            if (source.headerImage) target.headerImage = source.headerImage;
            if (source.footerImage) target.footerImage = source.footerImage;
            if (source.backgroundImage) target.backgroundImage = source.backgroundImage;
            if (source.watermarkImage) target.watermarkImage = source.watermarkImage;
        };

        merge(mergedDesign, defaultTemplate);
        merge(mergedDesign, documentDesign);
        if (hasOverride) {
            mergedDesign.backgroundColor = override.backgroundColor ?? mergedDesign.backgroundColor;
            mergedDesign.headerImage = override.headerImage ?? mergedDesign.headerImage;
            mergedDesign.footerImage = override.footerImage ?? mergedDesign.footerImage;
            mergedDesign.backgroundImage = override.backgroundImage ?? mergedDesign.backgroundImage;
            mergedDesign.watermarkImage = override.watermarkImage ?? mergedDesign.watermarkImage;
        }
        
        return {
            ...mergedDesign,
            logo: brand.logo,
            primaryColor: brand.primaryColor || '#F97316', // Default Orange
            secondaryColor: brand.secondaryColor || '#1E40AF', // Default Blue
            businessName: brand.businessName,
            showCustomerAddress: brand.showCustomerAddress,
            footerContent: brand.footerContent,
            brandsoftFooter: brand.brandsoftFooter,
        };
    }, [config, invoiceData?.design, designOverride]);

    // ... (Keep formatting helpers: formatCurrency, subtotal, total etc.) ...
     const currencyCode = invoiceData.currency || config.profile.defaultCurrency || 'K';
     const formatCurrency = (value: number) => `${currencyCode}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
 
     const subtotal = invoiceData.lineItems?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || invoiceData.subtotal || 0;
     const total = subtotal; // Placeholder, use your calculation

    const accentColor = design.primaryColor;
    const footerColor = design.secondaryColor;
    
    // --- LAYOUT FIX STARTS HERE ---
    
    // Determine margins based on images to prevent overlap
    const topPadding = design.headerImage ? 'pt-[35mm]' : 'pt-[10mm]';
    const bottomPadding = design.footerImage ? 'pb-[35mm]' : 'pb-[15mm]';

    return (
        <div className={cn(forPdf ? "" : "flex justify-center", "font-sans")}>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "bg-white relative text-black overflow-hidden shadow-2xl",
                    // FIXED A4 SIZE: 210mm x 297mm. This forces the "Paper" look.
                    "w-[210mm] h-[297mm]" 
                )}
                style={{ backgroundColor: design.backgroundColor || '#FFFFFF' }}
            >
                {/* 1. Background Layer (Absolute) */}
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="background"/>
                )}
                
                {/* 2. Header Image (Absolute Top) */}
                {design.headerImage ? (
                     <div className="absolute top-0 left-0 w-full h-[35mm] z-10">
                        <img src={design.headerImage} className="w-full h-full object-cover" alt="header" />
                    </div>
                ) : (
                    // Default Color Bar if no image
                    <div className="absolute top-0 left-0 w-full h-4 z-10" style={{ backgroundColor: accentColor }}></div>
                )}

                {/* 3. Footer Image/Content (Absolute Bottom) */}
                {/* This fixes the "Footer not at bottom" issue */}
                <footer className="absolute bottom-0 left-0 w-full z-20">
                    {design.footerImage ? (
                        <div className="w-full h-[30mm]">
                            <img src={design.footerImage} className="w-full h-full object-cover" alt="footer" />
                        </div>
                    ) : (
                        <div className="w-full">
                            <div className="h-4 w-full" style={{ backgroundColor: footerColor }}></div>
                            {design.brandsoftFooter && (
                                <div className="bg-white py-2 text-center text-[10px] text-gray-400 border-t">
                                    Created by BrandSoft
                                </div>
                            )}
                        </div>
                    )}
                </footer>

                {/* 4. Main Content Scrollable Area */}
                {/* We use padding top/bottom to ensure text doesn't hide behind absolute header/footer */}
                <div className={cn("relative z-10 w-full h-full flex flex-col px-[12mm]", topPadding, bottomPadding)}>
                    
                    {/* Header Details */}
                    <div className="flex justify-between items-start mb-8 mt-4">
                         <div className="flex items-center gap-4">
                            {design.logo && (
                                <img src={design.logo} alt="Logo" className="h-16 w-auto max-w-[150px] object-contain" />
                            )}
                            {!design.logo && !design.headerImage && (
                                <h1 className="text-4xl font-bold uppercase tracking-wide" style={{color: accentColor}}>Invoice</h1>
                            )}
                        </div>
                        <div className="text-right text-sm text-gray-800">
                            <p className="font-bold text-base mb-1">{config.brand.businessName}</p>
                            <p>{config.profile.address}</p>
                            <p>{config.profile.email}</p>
                            <p>{config.profile.phone}</p>
                        </div>
                    </div>
                    
                    {/* Grid Layout for Bill To / Invoice Details */}
                    <section className="grid grid-cols-2 gap-10 mb-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bill To</h3>
                            <p className="font-bold text-xl text-black">{customer.companyName || customer.name}</p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.address}</p>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                             <div className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="font-bold text-xs text-gray-500 uppercase">Invoice #</span>
                                <span className="font-bold text-sm">{invoiceId}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="font-bold text-xs text-gray-500 uppercase">Date</span>
                                <span className="font-medium text-sm">{format(new Date(), 'MM/dd/yyyy')}</span>
                            </div>
                        </div>
                    </section>

                    {/* Table */}
                    <div className="mb-8">
                         <Table>
                            <TableHeader>
                                <TableRow className="border-b-2 border-gray-800 hover:bg-transparent">
                                    <TableHead className="w-[45%] text-black font-bold uppercase text-[11px] h-8 pl-0">Item</TableHead>
                                    <TableHead className="w-[15%] text-right text-black font-bold uppercase text-[11px] h-8">Price</TableHead>
                                    <TableHead className="w-[15%] text-right text-black font-bold uppercase text-[11px] h-8">Qty</TableHead>
                                    <TableHead className="w-[25%] text-right text-black font-bold uppercase text-[11px] h-8 pr-0">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceData.lineItems?.map((item, index) => (
                                    <TableRow key={index} className="border-b border-gray-100">
                                        <TableCell className="py-2 pl-0 text-sm font-medium">{item.description}</TableCell>
                                        <TableCell className="py-2 text-right text-sm">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="py-2 text-right text-sm">{item.quantity}</TableCell>
                                        <TableCell className="py-2 text-right text-sm font-bold pr-0">{formatCurrency(item.price * item.quantity)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totals Section - Pushed to bottom of flex container */}
                    <div className="mt-auto mb-4 flex gap-8">
                        <div className="flex-1 text-xs text-gray-500">
                            {config.profile.paymentDetails && (
                                <>
                                    <h3 className="font-bold uppercase mb-1">Payment Details</h3>
                                    <p className="whitespace-pre-wrap">{config.profile.paymentDetails}</p>
                                </>
                            )}
                        </div>
                        <div className="w-[40%]">
                             <div className="flex justify-between mb-2 text-sm">
                                <span>Subtotal</span>
                                <span className="font-bold">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="p-3 rounded flex justify-between items-center" style={{backgroundColor: accentColor}}>
                                <span className="font-bold text-white text-lg">Total</span>
                                <span className="font-bold text-white text-xl">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const downloadInvoiceAsPdf = async (props: InvoicePreviewProps) => {
    const container = document.createElement('div');
    container.id = `pdf-container-${props.invoiceId}`;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<InvoicePreview {...props} forPdf={true} />);

    // Wait for fonts/images
    await new Promise(resolve => setTimeout(resolve, 2000));

    const invoiceElement = container.querySelector(`#invoice-preview-${props.invoiceId}`) as HTMLElement;
    if (!invoiceElement) {
        root.unmount();
        document.body.removeChild(container);
        return;
    }

    const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794
    });

    root.unmount();
    document.body.removeChild(container);

    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
    }

    pdf.save(`Invoice-${props.invoiceId}.pdf`);
};

    