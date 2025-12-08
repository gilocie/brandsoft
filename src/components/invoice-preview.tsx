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
            "text-[10rem] font-black tracking-widest leading-none transform -rotate-12 select-none pointer-events-none",
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
    
    const rawInvoiceDate = invoiceData.invoiceDate || invoiceData.date;
    const rawDueDate = invoiceData.dueDate || invoiceData.date;
    const invoiceDate = typeof rawInvoiceDate === 'string' ? parseISO(rawInvoiceDate) : rawInvoiceDate;
    const dueDate = typeof rawDueDate === 'string' ? parseISO(rawDueDate) : rawDueDate;
    
    const taxName = invoiceData.taxName || 'Tax';
    
    const accentColor = design.primaryColor || '#F97316';
    const footerColor = design.secondaryColor || '#1E40AF';

    return (
        <div className={cn(forPdf ? "" : "bg-gray-100 p-4 sm:p-8", "font-sans flex justify-center")}>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "bg-white shadow-lg relative text-black overflow-hidden flex flex-col",
                    "w-[210mm] min-h-[297mm]" 
                )}
                style={{
                    backgroundColor: design.backgroundColor || '#FFFFFF',
                }}
            >
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="background"/>
                )}
                
                {invoiceData.status && <InvoiceStatusWatermark status={invoiceData.status} />}
                
                {/* Header Section */}
                <header className="flex-shrink-0 relative z-10">
                    <div className="h-10" style={{ backgroundColor: accentColor }}></div>
                    <div className="px-12 py-8 flex justify-between items-start">
                         <div className="flex items-center gap-4">
                            {design.logo && (
                                <img src={design.logo} alt={config.brand.businessName} className="h-14 w-14 object-contain" />
                            )}
                            <h1 className="text-4xl font-bold uppercase tracking-wide" style={{color: accentColor}}>Invoice</h1>
                        </div>
                        <div className="text-right text-xs">
                            <p className="font-bold text-sm">{config.brand.businessName}</p>
                            <p>{config.profile.address}</p>
                            <p>{config.profile.email}</p>
                            <p>{config.profile.phone}</p>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow px-12 relative z-10">
                    <section className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                            <p className="font-bold text-lg">{customer.companyName || customer.name}</p>
                        </div>
                        <div className="text-right">
                            <div className="space-y-1 text-sm">
                                <div className="grid grid-cols-2 items-center">
                                    <span className="font-semibold text-gray-500">INVOICE #</span>
                                    <span className="font-medium">{invoiceId || `${config.profile?.invoicePrefix || 'INV-'}${String(config.profile?.invoiceStartNumber || 1).padStart(3, '0')}`}</span>
                                </div>
                                <div className="grid grid-cols-2 items-center">
                                    <span className="font-semibold text-gray-500">DATE</span>
                                    <span className="font-medium">{format(invoiceDate || new Date(), 'MM/dd/yy')}</span>
                                </div>
                                <div className="grid grid-cols-2 items-center">
                                    <span className="font-semibold text-gray-500">DUE DATE</span>
                                    <span className="font-medium">{format(dueDate || new Date(), 'MM/dd/yy')}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-2 border-gray-300 hover:bg-transparent">
                                    <TableHead className="text-gray-500 font-bold uppercase tracking-wider text-xs">Item</TableHead>
                                    <TableHead className="text-gray-500 font-bold uppercase tracking-wider text-xs">Description</TableHead>
                                    <TableHead className="text-right text-gray-500 font-bold uppercase tracking-wider text-xs">Qty</TableHead>
                                    <TableHead className="text-right text-gray-500 font-bold uppercase tracking-wider text-xs">Price</TableHead>
                                    <TableHead className="text-right text-gray-500 font-bold uppercase tracking-wider text-xs">Tax</TableHead>
                                    <TableHead className="text-right text-gray-500 font-bold uppercase tracking-wider text-xs">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceData.lineItems?.map((item, index) => {
                                     const product = config?.products?.find(p => p.name === item.description);
                                    return (
                                        <TableRow key={index} className="border-b border-gray-200">
                                            <TableCell className="font-medium py-3 align-top">{product ? product.name : item.description}</TableCell>
                                            <TableCell className="py-3 align-top text-gray-600 text-xs">{product?.description || ''}</TableCell>
                                            <TableCell className="text-right py-3 align-top">{item.quantity}</TableCell>
                                            <TableCell className="text-right py-3 align-top">{formatCurrency(item.price)}</TableCell>
                                            <TableCell className="text-right py-3 align-top">{taxRateDisplay}</TableCell>
                                            <TableCell className="text-right py-3 align-top font-semibold">{formatCurrency(item.quantity * item.price)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </section>

                    <section className="flex flex-row gap-8 items-start mb-8">
                        <div className="w-[60%] text-xs">
                             {config.profile.paymentDetails && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h3>
                                    <p className="text-gray-600 whitespace-pre-wrap">{config.profile.paymentDetails}</p>
                                </div>
                            )}
                        </div>
                        <div className="w-[40%] space-y-2 text-sm">
                             <div className="flex justify-between items-center border-b border-gray-100 py-1">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center border-b border-gray-100 py-1">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="font-medium">- {formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {taxAmount > 0 && (
                                <div className="flex justify-between items-center border-b border-gray-100 py-1">
                                    <span className="text-gray-600">{taxName}</span>
                                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                                </div>
                            )}
                            <div className="pt-2 mt-2">
                                <div className="flex items-center justify-between font-bold text-lg py-3 px-4 rounded" style={{backgroundColor: accentColor, color: '#fff'}}>
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer Section */}
                <footer className="w-full mt-auto relative z-10 flex-shrink-0">
                    <div className="h-4" style={{ backgroundColor: footerColor }}></div>
                     {design.brandsoftFooter && (
                        <div className="bg-gray-100 py-2 text-center text-[10px] text-gray-500">
                            Created by <span className="font-bold">BrandSoft</span>
                        </div>
                     )}
                </footer>
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
        windowWidth: invoiceElement.scrollWidth,
        windowHeight: invoiceElement.scrollHeight,
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
