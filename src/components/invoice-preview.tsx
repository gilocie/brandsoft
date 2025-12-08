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
    
    // Priority: designOverride > invoiceData.design > defaultInvoiceTemplate > brand
    const design = useMemo(() => {
        const brand = config.brand || {};
        const defaultTemplate = config.profile?.defaultInvoiceTemplate || {};
        const documentDesign = invoiceData?.design || {};
        const override = designOverride || {};
        
        // Check if designOverride was explicitly provided (not just undefined)
        const hasOverride = designOverride !== undefined && designOverride !== null;
        
        // Build merged design with proper priority
        let mergedDesign = {
            // Base: brand settings
            backgroundColor: brand.backgroundColor || '#FFFFFF',
            headerImage: brand.headerImage || '',
            footerImage: brand.footerImage || '',
            backgroundImage: brand.backgroundImage || '',
            watermarkImage: brand.watermarkImage || '',
        };
        
        // Apply default template (only non-empty values)
        if (defaultTemplate.backgroundColor) mergedDesign.backgroundColor = defaultTemplate.backgroundColor;
        if (defaultTemplate.headerImage) mergedDesign.headerImage = defaultTemplate.headerImage;
        if (defaultTemplate.footerImage) mergedDesign.footerImage = defaultTemplate.footerImage;
        if (defaultTemplate.backgroundImage) mergedDesign.backgroundImage = defaultTemplate.backgroundImage;
        if (defaultTemplate.watermarkImage) mergedDesign.watermarkImage = defaultTemplate.watermarkImage;
        
        // Apply document-specific design (only non-empty values)
        if (documentDesign.backgroundColor) mergedDesign.backgroundColor = documentDesign.backgroundColor;
        if (documentDesign.headerImage) mergedDesign.headerImage = documentDesign.headerImage;
        if (documentDesign.footerImage) mergedDesign.footerImage = documentDesign.footerImage;
        if (documentDesign.backgroundImage) mergedDesign.backgroundImage = documentDesign.backgroundImage;
        if (documentDesign.watermarkImage) mergedDesign.watermarkImage = documentDesign.watermarkImage;
        
        // Apply real-time override (for customization page - include empty strings to allow clearing)
        if (hasOverride) {
            mergedDesign.backgroundColor = override.backgroundColor ?? mergedDesign.backgroundColor;
            mergedDesign.headerImage = override.headerImage ?? mergedDesign.headerImage;
            mergedDesign.footerImage = override.footerImage ?? mergedDesign.footerImage;
            mergedDesign.backgroundImage = override.backgroundImage ?? mergedDesign.backgroundImage;
            mergedDesign.watermarkImage = override.watermarkImage ?? mergedDesign.watermarkImage;
        }
        
        return {
            ...mergedDesign,
            // Always preserve these from brand
            logo: brand.logo,
            primaryColor: brand.primaryColor || '#000000',
            secondaryColor: brand.secondaryColor || '#666666',
            businessName: brand.businessName,
            showCustomerAddress: brand.showCustomerAddress,
            footerContent: brand.footerContent,
            brandsoftFooter: brand.brandsoftFooter,
        };
    }, [
        config.brand, 
        config.profile?.defaultInvoiceTemplate,
        invoiceData?.design,
        designOverride,
    ]);

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
    } else if (invoiceData.tax && invoiceData.tax > 0 && subtotalAfterDiscount > 0) {
        taxAmount = invoiceData.tax;
        if (invoiceData.taxType === 'percentage' && invoiceData.taxValue) {
            taxRateDisplay = `${invoiceData.taxValue}%`;
        } else if (invoiceData.taxType === 'flat' && invoiceData.taxValue) {
            taxRateDisplay = formatCurrency(invoiceData.taxValue);
        } else {
            const effectiveTaxRate = (taxAmount / subtotalAfterDiscount) * 100;
            taxRateDisplay = `${effectiveTaxRate.toFixed(2)}%`;
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

    return (
        <div className={cn(forPdf ? "" : "bg-gray-100 p-4 sm:p-8", "font-sans")}>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "w-full max-w-4xl mx-auto bg-white shadow-lg relative text-black",
                    "aspect-[8.5/11] p-12"
                )}
                style={{
                    backgroundColor: design.backgroundColor || '#FFFFFF',
                }}
            >
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="background"/>
                )}

                {design.watermarkImage && (
                    <img src={design.watermarkImage} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 pointer-events-none max-w-[60%] max-h-[60%]" alt="watermark" />
                )}
                
                {invoiceData.status && !design.watermarkImage && <InvoiceStatusWatermark status={invoiceData.status} />}
                
                <div className="relative z-10">
                    <header className="grid grid-cols-2 gap-8 mb-12">
                        <div>
                            {design.logo && (
                                <img src={design.logo} alt={config.brand.businessName} className="h-16 mb-4 object-contain" />
                            )}
                            <p className="font-bold text-lg">{config.brand.businessName}</p>
                            <p className="text-sm text-gray-600">{config.profile.address}</p>
                            <p className="text-sm text-gray-600">{config.profile.email}</p>
                            <p className="text-sm text-gray-600">{config.profile.phone}</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-5xl font-bold uppercase" style={{color: design.primaryColor}}>Invoice</h1>
                            <div className="mt-4 space-y-1 text-sm">
                                <p><span className="text-gray-500">Invoice #: </span>{invoiceId || `${config.profile?.invoicePrefix || 'INV-'}${String(config.profile?.invoiceStartNumber || 1).padStart(3, '0')}`}</p>
                                <p><span className="text-gray-500">Date: </span>{format(invoiceDate || new Date(), 'MM/dd/yyyy')}</p>
                                <p><span className="text-gray-500">Due Date: </span>{format(dueDate || new Date(), 'MM/dd/yyyy')}</p>
                            </div>
                        </div>
                    </header>

                    <section className="mb-12">
                        <p className="text-sm text-gray-500">Bill To</p>
                        <p className="font-bold">{customer.companyName || customer.name}</p>
                        {config.brand.showCustomerAddress && (
                             <>
                                {customer.companyName && <p className="text-sm text-gray-600">{customer.name}</p>}
                                <p className="text-sm text-gray-600">{customer.address || customer.companyAddress || 'No address provided'}</p>
                                <p className="text-sm text-gray-600">{customer.email}</p>
                            </>
                        )}
                    </section>

                    <section className="mb-12">
                        <Table>
                            <TableHeader>
                                <TableRow style={{backgroundColor: design.primaryColor, color: 'white'}} className="text-white">
                                    <TableHead className="w-1/2 text-white">Item</TableHead>
                                    <TableHead className="text-right text-white">Quantity</TableHead>
                                    <TableHead className="text-right text-white">Price</TableHead>
                                    <TableHead className="text-right text-white">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceData.lineItems?.map((item, index) => (
                                    <TableRow key={index} className="border-b">
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.quantity * item.price)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </section>

                    <section className="grid grid-cols-2 gap-8 items-start">
                        <div className="text-sm">
                            {invoiceData.notes && (
                                <div>
                                    <h3 className="font-bold mb-1">Notes</h3>
                                    <p className="text-gray-600 text-xs">{invoiceData.notes}</p>
                                </div>
                            )}
                            {config.profile.paymentDetails && (
                                <div className="mt-4">
                                    <h3 className="font-bold mb-1">Payment Details</h3>
                                    <p className="text-gray-600 whitespace-pre-wrap text-xs">{config.profile.paymentDetails}</p>
                                </div>
                            )}
                        </div>
                         <div className="w-full space-y-2 text-sm">
                             <div className="flex justify-between items-center">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="font-medium">- {formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {taxAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{taxName} ({taxRateDisplay})</span>
                                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                                </div>
                            )}
                            {shippingAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium">{formatCurrency(shippingAmount)}</span>
                                </div>
                            )}
                            <div className="pt-2">
                                <div className="flex items-center justify-between font-bold text-lg py-3 px-4 rounded" style={{backgroundColor: design.primaryColor, color: '#fff'}}>
                                    <span className="mr-4">Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                
                <footer className="absolute bottom-0 left-12 right-12 text-center text-xs py-4 border-t">
                    {design.footerContent && <p className="mb-1">{design.footerContent}</p>}
                    {design.brandsoftFooter && <p><span className="font-bold">Created by BrandSoft</span></p>}
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
    container.style.width = '816px';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<InvoicePreview {...props} forPdf={true} />);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const invoiceElement = container.querySelector(`#invoice-preview-${props.invoiceId}`) as HTMLElement;
    if (!invoiceElement) {
        console.error("Invoice element not found for PDF generation.");
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
        width: 816,
        height: invoiceElement.scrollHeight
    });

    root.unmount();
    document.body.removeChild(container);

    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [816, 1056]
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        
        heightLeft -= pdfHeight;
    }

    pdf.save(`Invoice-${props.invoiceId}.pdf`);
};