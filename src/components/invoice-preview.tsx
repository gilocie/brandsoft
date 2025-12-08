'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Invoice, LineItem, DesignSettings } from '@/hooks/use-brandsoft';
import { format, parseISO, isValid } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

// ... (Keep your Type Definitions here) ...
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

    if (!config || !customer || !invoiceData) {
        return <div className="p-10">Loading...</div>;
    }
    
    const design = useMemo(() => {
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
        
        // Merge logic
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

    const currencyCode = invoiceData.currency || config.profile.defaultCurrency || 'K';
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
    const accentColor = design.primaryColor;
    const footerColor = design.secondaryColor;

    // === SCALING LOGIC ===
    // This wrapper ensures the A4 page fits in the preview area
    // 'forPdf' mode disables scaling so the PDF generator gets full resolution
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        if (forPdf) return <>{children}</>;
        return (
            <div className="w-full h-full flex items-start justify-center overflow-auto bg-gray-100/50 p-4 sm:p-8">
                {/* Scale down on small screens, scale up on large */}
                <div className="scale-[0.5] sm:scale-[0.6] md:scale-[0.75] lg:scale-[0.85] xl:scale-100 origin-top shadow-2xl">
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
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="background"/>
                )}
                
                {invoiceData.status && <InvoiceStatusWatermark status={invoiceData.status} />}
                
                {/* 1. Header Bar (Full Width) */}
                <div className="h-6 w-full flex-shrink-0 relative z-10" style={{ backgroundColor: accentColor }}></div>

                {/* 2. Header Content */}
                <header className="px-[12mm] py-8 flex justify-between items-start relative z-10">
                    {/* Logo & Title Left */}
                    <div className="flex items-center gap-5">
                        {design.logo && (
                            <img src={design.logo} alt="Logo" className="h-20 w-auto object-contain" />
                        )}
                        <h1 className="text-5xl font-bold tracking-tight" style={{ color: accentColor }}>Invoice</h1>
                    </div>

                    {/* Company Details Right */}
                    <div className="text-right text-sm leading-relaxed text-gray-800">
                        <p className="font-bold text-base mb-1 text-black">{config.brand.businessName}</p>
                        <p>{config.profile.address}</p>
                        <p>{config.profile.email}</p>
                        <p>{config.profile.phone}</p>
                    </div>
                </header>

                <main className="flex-grow px-[12mm] relative z-10 mt-4">
                    
                    {/* 3. Grid Layout for "Bill To" vs "Invoice Details" 
                        Using Grid instead of Flex prevents squashing */}
                    <section className="grid grid-cols-2 gap-10 mb-10">
                        
                        {/* Left: Bill To */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Bill To</h3>
                            <p className="font-bold text-xl text-black mb-1">{customer.companyName || customer.name}</p>
                            {customer.companyName && <p className="text-sm text-gray-800 font-medium">{customer.name}</p>}
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">
                                {customer.address || customer.companyAddress}
                            </p>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>

                        {/* Right: Invoice Data */}
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Invoice #</span>
                                <span className="font-bold text-base text-black">{invoiceId || 'INV-001'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Date</span>
                                <span className="font-medium text-sm text-black">{invoiceDateStr}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Due Date</span>
                                <span className="font-medium text-sm text-black">{dueDateStr}</span>
                            </div>
                        </div>
                    </section>

                    {/* 4. Table - Using Strict widths to look like the target image */}
                    <section className="mb-10">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-2 border-gray-800 hover:bg-transparent">
                                    <TableHead className="w-[40%] text-black font-bold uppercase text-[11px] h-10 pl-0">Item</TableHead>
                                    <TableHead className="w-[20%] text-black font-bold uppercase text-[11px] h-10">Description</TableHead>
                                    <TableHead className="w-[10%] text-right text-black font-bold uppercase text-[11px] h-10">Qty</TableHead>
                                    <TableHead className="w-[15%] text-right text-black font-bold uppercase text-[11px] h-10">Price</TableHead>
                                    <TableHead className="w-[15%] text-right text-black font-bold uppercase text-[11px] h-10 pr-0">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceData.lineItems?.map((item, index) => {
                                    const product = config?.products?.find(p => p.name === item.description);
                                    return (
                                        <TableRow key={index} className="border-b border-gray-200 hover:bg-transparent">
                                            <TableCell className="py-4 align-top pl-0">
                                                <span className="font-bold text-sm text-black">{product ? product.name : item.description}</span>
                                            </TableCell>
                                            <TableCell className="py-4 align-top text-xs text-gray-600">
                                                {product?.description || 'Standard Item'}
                                            </TableCell>
                                            <TableCell className="text-right py-4 align-top text-sm">{item.quantity}</TableCell>
                                            <TableCell className="text-right py-4 align-top text-sm">{formatCurrency(item.price)}</TableCell>
                                            <TableCell className="text-right py-4 align-top font-bold text-sm pr-0">{formatCurrency(item.quantity * item.price)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                                {/* Fill empty rows visually if needed, but not strictly required */}
                            </TableBody>
                        </Table>
                    </section>

                    {/* 5. Bottom Section */}
                    <section className="flex flex-row gap-12 items-start mt-auto mb-16">
                        {/* Payment Details (Left) */}
                        <div className="flex-1">
                             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Details</h3>
                             {config.profile.paymentDetails ? (
                                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                                    {config.profile.paymentDetails}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400 italic">No payment details provided.</p>
                            )}
                            
                            {invoiceData.notes && (
                                <div className="mt-6">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                                    <p className="text-xs text-gray-600">{invoiceData.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Totals (Right) */}
                        <div className="w-[40%] min-w-[260px]">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Subtotal</span>
                                <span className="font-bold text-sm">{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center mb-2 text-green-700">
                                    <span className="text-sm">Discount</span>
                                    <span className="font-bold text-sm">- {formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {taxAmount > 0 && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">{taxName} ({taxRateDisplay})</span>
                                    <span className="font-bold text-sm">{formatCurrency(taxAmount)}</span>
                                </div>
                            )}
                            
                            {/* Total Block - Matching Target Image */}
                            <div className="mt-4 flex items-center justify-between p-3 rounded-sm" style={{backgroundColor: accentColor}}>
                                <span className="font-bold text-white text-lg">Total</span>
                                <span className="font-bold text-white text-xl">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </section>
                </main>

                {/* 6. Footer */}
                <footer className="relative z-10 w-full mt-auto">
                    <div className="h-4 w-full" style={{ backgroundColor: footerColor }}></div>
                    {design.brandsoftFooter && (
                        <div className="text-center py-2 bg-white text-[10px] text-gray-400">
                            Created by BrandSoft
                        </div>
                    )}
                </footer>
            </div>
        </Wrapper>
    );
}

export const downloadInvoiceAsPdf = async (props: InvoicePreviewProps) => {
    // 1. Create a container off-screen
    const container = document.createElement('div');
    container.id = `pdf-container-${props.invoiceId}`;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    // 210mm in pixels at ~96DPI is approx 794px. 
    // Setting width explicitly ensures html2canvas renders at the correct break points.
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
    
    // Calculate precise width for A4 at 96 DPI (~793.7px)
    // We use a high scale for sharp text
    const canvas = await html2canvas(invoiceElement, {
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // Force A4 width in pixels
    });

    root.unmount();
    document.body.removeChild(container);

    // Initialize jsPDF with A4 format
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First Page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Subsequent Pages
    while (heightLeft > 0) {
        position = heightLeft - imgHeight; // This seems incorrect, should be negative
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
    }

    pdf.save(`Invoice-${props.invoiceId}.pdf`);
};
