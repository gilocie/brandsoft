'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Invoice, LineItem, DesignSettings } from '@/hooks/use-brandsoft';
import { format, parseISO, isValid } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

// ... (Keep your Type Definitions same as before) ...
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

const InvoiceStatusWatermark = ({ status, design }: { status?: string, design: DesignSettings }) => {
    if (!status) return null;

    const hexToRgb = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        return { r, g, b };
    };

    const rgb = hexToRgb(design.watermarkColor || '#dddddd');
    const finalColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${design.watermarkOpacity ?? 0.05})`;

    return (
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 font-black tracking-[1rem] leading-none select-none pointer-events-none uppercase"
            style={{
                fontSize: `${design.watermarkFontSize || 96}px`,
                color: finalColor,
                transform: `translate(-50%, -50%) rotate(${design.watermarkAngle || 0}deg)`,
            }}
        >
            {status}
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
    if (!config || !customer || !invoiceData) {
        return (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
                Please fill out all required fields to see the preview.
            </div>
        );
    }
    
    const design = useMemo(() => {
        const brand = config.brand || {};
        const defaultTemplateId = config.profile?.defaultInvoiceTemplate;
        const defaultTemplate = typeof defaultTemplateId === 'string' 
            ? config.templates?.find(t => t.id === defaultTemplateId)?.pages?.[0]?.pageDetails 
            : defaultTemplateId;

        const documentDesign = invoiceData?.design || {};
        const override = designOverride || {};
        const hasOverride = designOverride !== undefined && designOverride !== null;
        
        let mergedDesign: DesignSettings = {
            logo: brand.logo || '',
            backgroundColor: brand.backgroundColor || '#FFFFFF',
            textColor: brand.textColor || '#000000',
            headerImage: brand.headerImage || '',
            headerImageOpacity: 1,
            footerImage: brand.footerImage || '',
            footerImageOpacity: 1,
            backgroundImage: brand.backgroundImage || '',
            backgroundImageOpacity: 1,
            watermarkText: '',
            watermarkColor: '#dddddd',
            watermarkOpacity: 0.05,
            watermarkFontSize: 96,
            watermarkAngle: 0,
            headerColor: brand.primaryColor || '#000000',
            footerColor: brand.secondaryColor || '#666666',
        };
        
        const merge = (target: any, source: any) => {
             if (!source) return;
            Object.keys(source).forEach(key => {
                if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
                    target[key] = source[key];
                }
            });
        };

        merge(mergedDesign, defaultTemplate);
        merge(mergedDesign, documentDesign);
        if (hasOverride) {
           merge(mergedDesign, override);
        }
        
        return {
            ...mergedDesign,
            showCustomerAddress: brand.showCustomerAddress,
            footerContent: brand.footerContent,
            brandsoftFooter: brand.brandsoftFooter,
        };
    }, [config, invoiceData?.design, designOverride]);

    const currencyCode = invoiceData.currency || config.profile?.defaultCurrency || '$';
    const formatCurrency = (value: number) => `${currencyCode}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const subtotal = invoiceData.lineItems?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || invoiceData.subtotal || 0;
    
    let discountAmount = 0;
    if (invoiceData.applyDiscount && invoiceData.discountValue) {
        if (invoiceData.discountType === 'percentage') {
            discountAmount = subtotal * (invoiceData.discountValue / 100);
        } else {
            discountAmount = invoiceData.discountValue;
        }
    } else if (invoiceData.discount) {
        discountAmount = invoiceData.discount;
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    
    let taxAmount = 0;
    let taxRateDisplay = '0%';
    if (invoiceData.applyTax && invoiceData.taxValue) {
        if (invoiceData.taxType === 'percentage') {
            taxAmount = subtotalAfterDiscount * (invoiceData.taxValue / 100);
            taxRateDisplay = `${invoiceData.taxValue}%`;
        } else {
            taxAmount = invoiceData.taxValue;
            taxRateDisplay = formatCurrency(invoiceData.taxValue);
        }
    } else if (invoiceData.tax) {
        taxAmount = invoiceData.tax;
        taxRateDisplay = formatCurrency(taxAmount);
    }

    const shippingAmount = Number(invoiceData.applyShipping && invoiceData.shippingValue ? invoiceData.shippingValue : (invoiceData.shipping || 0));
    
    const total = subtotalAfterDiscount + taxAmount + shippingAmount;
    
    const formatDateSafe = (dateVal: Date | string | undefined) => {
        if (!dateVal) return format(new Date(), 'MM/dd/yyyy');
        const d = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
        return isValid(d) ? format(d, 'MM/dd/yyyy') : format(new Date(), 'MM/dd/yyyy');
    };

    const invoiceDateStr = formatDateSafe(invoiceData.invoiceDate || invoiceData.date);
    const dueDateStr = formatDateSafe(invoiceData.dueDate || invoiceData.date);
    
    const taxName = invoiceData.taxName || 'Tax';
    
    const watermarkText = design.watermarkText || invoiceData.status;

    const accentColor = design.headerColor;
    const footerColor = design.footerColor;

    // --- Scaling Wrapper for Preview ---
    // This scales the 210mm A4 page down to fit on screen, but keeps internal dimensions perfect for PDF
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        if (forPdf) return <>{children}</>;
        return (
            <div className="w-full h-full flex items-start justify-center overflow-auto bg-gray-100 p-8">
                <div className="scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 origin-top shadow-2xl">
                    {children}
                </div>
            </div>
        );
    };

    return (
        <Wrapper>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "bg-white relative text-black overflow-hidden flex flex-col font-sans",
                    // EXACT A4 DIMENSIONS
                    "w-[210mm] min-h-[297mm]" 
                )}
                style={{ backgroundColor: design.backgroundColor || '#FFFFFF' }}
            >
                {/* Backgrounds */}
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0 opacity-50" alt="background"/>
                )}
                
                {invoiceData.status && watermarkText && <InvoiceStatusWatermark status={watermarkText} design={design} />}
                
                {/* 1. HEADER BAR (Color Block) */}
                <div 
                    className="w-full flex-shrink-0 relative z-10" 
                    style={{ 
                        backgroundColor: accentColor,
                        // This height corresponds to the orange bar in your image
                        height: '35px' 
                    }}
                ></div>

                {/* 2. THE GAP (Spacing between header bar and logo/text) */}
                {/* This padding-top (pt-8) creates the ~30px gap you requested */}
                <header className="px-[12mm] pt-8 pb-4 flex justify-between items-start relative z-10">
                    
                    {/* Logo Area */}
                    <div className="flex items-center gap-4">
                        {design.logo ? (
                            <img src={design.logo} alt="Logo" className="h-20 w-auto object-contain" />
                        ) : (
                            <h1 className="text-5xl font-bold tracking-tight" style={{ color: accentColor }}>Invoice</h1>
                        )}
                        {/* If logo exists, show 'Invoice' text next to it in accent color */}
                        {design.logo && (
                             <h1 className="text-4xl font-bold tracking-tight ml-2" style={{ color: accentColor }}>Invoice</h1>
                        )}
                    </div>

                    {/* Company Details (Right aligned) */}
                    <div className="text-right text-sm leading-relaxed text-gray-800">
                        <p className="font-bold text-lg text-black mb-1">{config.brand?.businessName}</p>
                        <p>{config.profile?.address}</p>
                        <p>{config.profile?.email}</p>
                        <p>{config.profile?.phone}</p>
                    </div>
                </header>

                <main className="flex-grow px-[12mm] relative z-10 mt-6">
                    
                    {/* 3. INFO GRID (Bill To & Details) */}
                    <section className="flex justify-between items-start mb-10">
                        {/* Left: Bill To */}
                        <div className="w-1/2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bill To</h3>
                            <p className="font-bold text-xl text-black">{customer.companyName || customer.name}</p>
                            {customer.companyName && <p className="text-sm font-medium text-gray-700">{customer.name}</p>}
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{customer.address}</p>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>

                        {/* Right: Invoice Meta */}
                        <div className="w-auto min-w-[200px]">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-right">
                                <span className="font-bold text-gray-500 uppercase text-xs self-center">Invoice #</span>
                                <span className="font-bold text-base text-black">{invoiceId || 'INV-001'}</span>

                                <span className="font-bold text-gray-500 uppercase text-xs self-center">Date</span>
                                <span className="font-medium text-black">{invoiceDateStr}</span>

                                <span className="font-bold text-gray-500 uppercase text-xs self-center">Due Date</span>
                                <span className="font-medium text-black">{dueDateStr}</span>
                            </div>
                        </div>
                    </section>

                    {/* 4. TABLE (Full Width) */}
                    <section className="mb-10">
                        {/* Custom Table styling to match image */}
                        <div className="w-full">
                            <div className="flex border-b-2 border-gray-800 pb-2 mb-2">
                                <div className="w-[45%] font-bold text-black uppercase text-[11px]">Item / Description</div>
                                <div className="w-[10%] font-bold text-black uppercase text-[11px] text-center">Qty</div>
                                <div className="w-[20%] font-bold text-black uppercase text-[11px] text-right">Price</div>
                                <div className="w-[10%] font-bold text-black uppercase text-[11px] text-right">Tax</div>
                                <div className="w-[15%] font-bold text-black uppercase text-[11px] text-right">Amount</div>
                            </div>
                            
                            {invoiceData.lineItems?.map((item, index) => {
                                const product = config?.products?.find(p => p.name === item.description);
                                return (
                                    <div key={index} className="flex border-b border-gray-100 py-3 text-sm">
                                        <div className="w-[45%] pr-2">
                                            <p className="font-bold text-black">{item.description}</p>
                                            <p className="text-xs text-gray-500">{product?.description}</p>
                                        </div>
                                        <div className="w-[10%] text-center">{item.quantity}</div>
                                        <div className="w-[20%] text-right">{formatCurrency(item.price)}</div>
                                        <div className="w-[10%] text-right">{taxRateDisplay}</div>
                                        <div className="w-[15%] text-right font-bold">{formatCurrency(item.quantity * item.price)}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* 5. BOTTOM SECTION (Payment Info & Totals) */}
                    <section className="flex flex-row gap-12 items-start mt-auto mb-8">
                        {/* Left: Notes/Payment */}
                        <div className="flex-1 text-xs text-gray-600">
                             <h3 className="font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h3>
                             {config.profile?.paymentDetails ? (
                                <p className="whitespace-pre-wrap leading-relaxed">{config.profile.paymentDetails}</p>
                            ) : (
                                <p className="italic text-gray-400">No payment details provided.</p>
                            )}
                            
                            {invoiceData.notes && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                     <h3 className="font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</h3>
                                     <p>{invoiceData.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Totals */}
                        <div className="w-[40%] min-w-[260px] text-sm">
                             <div className="flex justify-between mb-2">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-bold">{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between mb-2 text-green-600">
                                    <span>Discount</span>
                                    <span className="font-bold">- {formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {taxAmount > 0 && (
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">{taxName}</span>
                                    <span>{formatCurrency(taxAmount)}</span>
                                </div>
                            )}
                             {shippingAmount > 0 && (
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">Shipping</span>
                                    <span>{formatCurrency(shippingAmount)}</span>
                                </div>
                            )}
                            
                            {/* Orange Total Box */}
                            <div 
                                className="mt-4 flex items-center justify-between p-3 rounded-sm shadow-sm" 
                                style={{backgroundColor: accentColor}}
                            >
                                <span className="font-bold text-white text-lg">Total</span>
                                <span className="font-bold text-white text-xl">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </section>
                </main>

                {/* 6. FOOTER */}
                {/* The "mt-auto" in main pushes this to the bottom */}
                <footer className="w-full relative z-10">
                    
                    {/* The GAP (Spacing above footer bar) */}
                    <div className="mb-6 text-center">
                         {design.brandsoftFooter && (
                            <p className="text-[10px] text-gray-400">Created by <span className="font-bold text-gray-500">BrandSoft</span></p>
                         )}
                         {design.footerContent && (
                             <p className="text-xs text-gray-500 mt-1">{design.footerContent}</p>
                         )}
                    </div>

                    {/* Footer Color Bar */}
                    <div 
                        className="w-full" 
                        style={{ 
                            backgroundColor: accentColor, // Usually matches header, per your image
                            height: '25px' 
                        }}
                    ></div>
                </footer>
            </div>
        </Wrapper>
    );
}

export const downloadInvoiceAsPdf = async (props: InvoicePreviewProps) => {
    // 1. Create a fixed-width container for rendering
    const container = document.createElement('div');
    container.id = `pdf-container-${props.invoiceId}`;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm'; // Force A4 width
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<InvoicePreview {...props} forPdf={true} />);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 2000));

    const invoiceElement = container.querySelector(`#invoice-preview-${props.invoiceId}`) as HTMLElement;
    if (!invoiceElement) {
        root.unmount();
        document.body.removeChild(container);
        return;
    }
    
    // Capture at high resolution (scale 2 = 192dpi, scale 3 = 288dpi)
    const canvas = await html2canvas(invoiceElement, {
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // 210mm @ 96dpi
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
