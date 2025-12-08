'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Invoice, LineItem, DesignSettings } from '@/hooks/use-brandsoft';
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

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
            colorClass = 'text-red-500/20';
            break;
        case 'Paid':
            text = 'PAID';
            colorClass = 'text-green-500/20';
            break;
        case 'Canceled':
            text = 'CANCELED';
            colorClass = 'text-gray-500/20';
            break;
        default:
            return null;
    }

    return (
        <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0",
            "text-[8rem] font-black tracking-widest leading-none transform -rotate-12 select-none pointer-events-none",
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
        return (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
                Please fill out all required fields to see the preview.
            </div>
        );
    }
    
    // Design Priority Logic
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
        
        if (defaultTemplate.backgroundColor) mergedDesign.backgroundColor = defaultTemplate.backgroundColor;
        if (defaultTemplate.headerImage) mergedDesign.headerImage = defaultTemplate.headerImage;
        if (defaultTemplate.footerImage) mergedDesign.footerImage = defaultTemplate.footerImage;
        if (defaultTemplate.backgroundImage) mergedDesign.backgroundImage = defaultTemplate.backgroundImage;
        if (defaultTemplate.watermarkImage) mergedDesign.watermarkImage = defaultTemplate.watermarkImage;
        
        if (documentDesign.backgroundColor) mergedDesign.backgroundColor = documentDesign.backgroundColor;
        if (documentDesign.headerImage) mergedDesign.headerImage = documentDesign.headerImage;
        if (documentDesign.footerImage) mergedDesign.footerImage = documentDesign.footerImage;
        if (documentDesign.backgroundImage) mergedDesign.backgroundImage = documentDesign.backgroundImage;
        if (documentDesign.watermarkImage) mergedDesign.watermarkImage = documentDesign.watermarkImage;
        
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
            primaryColor: brand.primaryColor || '#000000',
            secondaryColor: brand.secondaryColor || '#666666',
            businessName: brand.businessName,
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
    
    const rawInvoiceDate = invoiceData.invoiceDate || invoiceData.date;
    const rawDueDate = invoiceData.dueDate || invoiceData.date;
    const invoiceDate = typeof rawInvoiceDate === 'string' ? parseISO(rawInvoiceDate) : rawInvoiceDate;
    const dueDate = typeof rawDueDate === 'string' ? parseISO(rawDueDate) : rawDueDate;
    
    const taxName = invoiceData.taxName || 'Tax';

    // Calculate margins based on if header/footer images exist
    // 20mm is standard A4 margin (~75px)
    const topMargin = design.headerImage ? 'pt-0' : 'pt-[15mm]';
    const bottomMargin = design.footerImage ? 'pb-0' : 'pb-[15mm]';

    return (
        <div className={cn(forPdf ? "" : "bg-gray-100 p-4 sm:p-8", "font-sans flex justify-center")}>
            {/* Main A4 Container */}
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "bg-white shadow-lg relative text-black overflow-hidden flex flex-col",
                    // STRICT A4 DIMENSIONS
                    "w-[210mm] min-h-[297mm]" 
                )}
                style={{
                    backgroundColor: design.backgroundColor || '#FFFFFF',
                }}
            >
                {/* 1. Background Image (Absolute) */}
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="background"/>
                )}

                {/* 2. Watermark (Absolute) */}
                {design.watermarkImage && (
                    <img src={design.watermarkImage} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 pointer-events-none max-w-[60%] max-h-[60%]" alt="watermark" />
                )}
                
                {/* 3. Status Stamp (Absolute) */}
                {invoiceData.status && !design.watermarkImage && <InvoiceStatusWatermark status={invoiceData.status} />}
                
                {/* 4. Header Image (Absolute to top) */}
                {design.headerImage && (
                    <div className="w-full h-[35mm] relative z-10">
                         <img src={design.headerImage} className="w-full h-full object-cover object-top" alt="Header" />
                    </div>
                )}

                {/* 5. Main Content Area (Flex Grow - Pushes Footer Down) */}
                <div className={cn("flex-grow relative z-10 px-[15mm]", topMargin)}>
                    
                    {/* Header Details */}
                    <header className="flex justify-between items-start mb-8 pt-6">
                        <div className="w-1/2">
                            {design.logo && (
                                <img src={design.logo} alt={config.brand.businessName} className="h-20 mb-3 object-contain" />
                            )}
                            <p className="font-bold text-lg">{config.brand.businessName}</p>
                            <div className="text-sm text-gray-600 mt-1 leading-snug">
                                <p>{config.profile.address}</p>
                                <p>{config.profile.email}</p>
                                <p>{config.profile.phone}</p>
                            </div>
                        </div>
                        <div className="w-1/2 text-right">
                            <h1 className="text-4xl font-bold uppercase tracking-wide" style={{color: design.primaryColor}}>Invoice</h1>
                            <div className="mt-4 space-y-1 text-sm">
                                <p><span className="text-gray-500 font-semibold">INVOICE #: </span>{invoiceId || `${config.profile?.invoicePrefix || 'INV-'}${String(config.profile?.invoiceStartNumber || 1).padStart(3, '0')}`}</p>
                                <p><span className="text-gray-500 font-semibold">DATE: </span>{format(invoiceDate || new Date(), 'MM/dd/yyyy')}</p>
                                <p><span className="text-gray-500 font-semibold">DUE DATE: </span>{format(dueDate || new Date(), 'MM/dd/yyyy')}</p>
                            </div>
                        </div>
                    </header>

                    <div className="h-px bg-gray-200 w-full mb-8"></div>

                    {/* Bill To Section */}
                    <section className="mb-10">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                        <p className="font-bold text-lg">{customer.companyName || customer.name}</p>
                        {config.brand.showCustomerAddress && (
                             <div className="text-sm text-gray-600 mt-1 leading-snug">
                                {customer.companyName && <p>{customer.name}</p>}
                                <p className="whitespace-pre-wrap">{customer.address || customer.companyAddress || 'No address provided'}</p>
                                <p>{customer.email}</p>
                            </div>
                        )}
                    </section>

                    {/* Table Section */}
                    <section className="mb-8">
                        <Table>
                            <TableHeader>
                                <TableRow style={{backgroundColor: design.primaryColor}} className="hover:bg-opacity-100">
                                    <TableHead className="w-[45%] text-white font-bold h-10">Description</TableHead>
                                    <TableHead className="text-right text-white font-bold h-10">Qty</TableHead>
                                    <TableHead className="text-right text-white font-bold h-10">Price</TableHead>
                                    <TableHead className="text-right text-white font-bold h-10 rounded-tr-sm">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceData.lineItems?.map((item, index) => (
                                    <TableRow key={index} className="border-b border-gray-100">
                                        <TableCell className="font-medium py-3 align-top">{item.description}</TableCell>
                                        <TableCell className="text-right py-3 align-top">{item.quantity}</TableCell>
                                        <TableCell className="text-right py-3 align-top">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-right py-3 align-top font-semibold">{formatCurrency(item.quantity * item.price)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </section>

                    {/* Footer / Totals Section */}
                    <section className="flex flex-row gap-8 items-start mb-8">
                        {/* Left Side - Notes */}
                        <div className="w-[60%] text-sm">
                            {invoiceData.notes && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
                                    <p className="text-gray-600 text-xs bg-gray-50 p-3 rounded">{invoiceData.notes}</p>
                                </div>
                            )}
                            {config.profile.paymentDetails && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h3>
                                    <p className="text-gray-600 whitespace-pre-wrap text-xs">{config.profile.paymentDetails}</p>
                                </div>
                            )}
                        </div>
                        
                         {/* Right Side - Totals */}
                         <div className="w-[40%] space-y-3">
                             <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 text-green-600">
                                    <span>Discount</span>
                                    <span>- {formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {taxAmount > 0 && (
                                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">{taxName} ({taxRateDisplay})</span>
                                    <span>{formatCurrency(taxAmount)}</span>
                                </div>
                            )}
                            {shippingAmount > 0 && (
                                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">Shipping</span>
                                    <span>{formatCurrency(shippingAmount)}</span>
                                </div>
                            )}
                            <div className="pt-2">
                                <div className="flex items-center justify-between font-bold text-lg py-3 px-4 rounded text-white" style={{backgroundColor: design.primaryColor}}>
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                
                {/* 6. Footer (In flow, not absolute) */}
                <footer className={cn("relative z-10 w-full mt-auto", bottomMargin)}>
                    {design.footerImage ? (
                        <img src={design.footerImage} className="w-full h-auto object-cover" alt="Footer" />
                    ) : (
                         <div className="border-t border-gray-200 pt-4 pb-8 px-[15mm] text-center text-xs text-gray-500">
                            {design.footerContent && <p className="mb-1">{design.footerContent}</p>}
                            {design.brandsoftFooter && <p>Generated by <span className="font-bold">BrandSoft</span></p>}
                        </div>
                    )}
                </footer>
            </div>
        </div>
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

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 2000));

    const invoiceElement = container.querySelector(`#invoice-preview-${props.invoiceId}`) as HTMLElement;
    if (!invoiceElement) {
        root.unmount();
        document.body.removeChild(container);
        return;
    }
    
    // Capture canvas
    const canvas = await html2canvas(invoiceElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794 // Force A4 width in pixels
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
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
    }

    pdf.save(`Invoice-${props.invoiceId}.pdf`);
};
