
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
    designOverride?: DesignSettings; // New prop for real-time design updates
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
        
        // Check if designOverride has any actual values
        const hasOverride = designOverride && Object.values(designOverride).some(v => v);
        
        // Merge in priority order
        const mergedDesign = {
            // Base: brand settings
            backgroundColor: brand.backgroundColor || '#FFFFFF',
            headerImage: brand.headerImage || '',
            footerImage: brand.footerImage || '',
            backgroundImage: brand.backgroundImage || '',
            watermarkImage: brand.watermarkImage || '',
            // Override with default template
            ...(defaultTemplate.backgroundColor && { backgroundColor: defaultTemplate.backgroundColor }),
            ...(defaultTemplate.headerImage && { headerImage: defaultTemplate.headerImage }),
            ...(defaultTemplate.footerImage && { footerImage: defaultTemplate.footerImage }),
            ...(defaultTemplate.backgroundImage && { backgroundImage: defaultTemplate.backgroundImage }),
            ...(defaultTemplate.watermarkImage && { watermarkImage: defaultTemplate.watermarkImage }),
            // Override with document-specific design
            ...(documentDesign.backgroundColor && { backgroundColor: documentDesign.backgroundColor }),
            ...(documentDesign.headerImage && { headerImage: documentDesign.headerImage }),
            ...(documentDesign.footerImage && { footerImage: documentDesign.footerImage }),
            ...(documentDesign.backgroundImage && { backgroundImage: documentDesign.backgroundImage }),
            ...(documentDesign.watermarkImage && { watermarkImage: documentDesign.watermarkImage }),
            // Override with real-time design settings (for customization page)
            ...(hasOverride && override),
            // Always preserve these from brand
            logo: brand.logo,
            primaryColor: brand.primaryColor || '#000000',
            secondaryColor: brand.secondaryColor || '#666666',
            businessName: brand.businessName,
            showCustomerAddress: brand.showCustomerAddress,
            footerContent: brand.footerContent,
            brandsoftFooter: brand.brandsoftFooter,
        };
        
        return mergedDesign;
    }, [
        config.brand, 
        config.profile?.defaultInvoiceTemplate,
        invoiceData?.design?.backgroundColor,
        invoiceData?.design?.headerImage,
        invoiceData?.design?.footerImage,
        invoiceData?.design?.backgroundImage,
        invoiceData?.design?.watermarkImage,
        designOverride?.backgroundColor,
        designOverride?.headerImage,
        designOverride?.footerImage,
        designOverride?.backgroundImage,
        designOverride?.watermarkImage,
    ]);

    const currencyCode = invoiceData.currency || config.profile.defaultCurrency;
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
    
    const headerHeight = design.headerImage ? '80px' : '40px';
    const contentPaddingTop = design.headerImage ? 'pt-24' : 'pt-14';

    return (
        <div className={forPdf ? "" : "bg-gray-100 p-4 sm:p-8 rounded-lg"}>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "w-full max-w-[8.5in] mx-auto bg-white shadow-lg relative font-sans",
                    forPdf ? "min-h-[11in]" : "min-h-[11in]"
                )}
                style={{
                    backgroundColor: design.backgroundColor || '#FFFFFF',
                    paddingLeft: '48px',
                    paddingRight: '48px',
                    paddingBottom: '100px',
                }}
            >
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="background"/>
                )}

                {design.watermarkImage && (
                    <img src={design.watermarkImage} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 pointer-events-none max-w-[60%] max-h-[60%]" alt="watermark" />
                )}
                
                {invoiceData.status && !design.watermarkImage && <InvoiceStatusWatermark status={invoiceData.status} />}

                {design.headerImage ? (
                    <div className="absolute top-0 left-0 right-0 h-20 z-30">
                        <img src={design.headerImage} className="w-full h-full object-cover" alt="Letterhead"/>
                    </div>
                ) : (
                    <div className="absolute top-0 left-0 right-0 h-10 z-30" style={{backgroundColor: design.primaryColor}}></div>
                )}
                
                <div className={cn("relative z-10", contentPaddingTop)} style={{ paddingTop: headerHeight }}>
                    <header className="flex justify-between items-start mb-8 pt-2">
                        <div className="flex items-center gap-4">
                            {design.logo && (
                                <img src={design.logo} alt={config.brand.businessName} className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
                            )}
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold" style={{color: design.primaryColor}}>Invoice</h1>
                            </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                            <p className="font-bold text-base text-black">{config.brand.businessName}</p>
                            <p>{config.profile.address}</p>
                            <p>{config.profile.email}</p>
                            <p>{config.profile.phone}</p>
                            {config.profile.website && <p>{config.profile.website}</p>}
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Bill To</h3>
                            <p className="font-bold text-lg">{customer.companyName || customer.name}</p>
                            {config.brand.showCustomerAddress ? (
                                <>
                                    {customer.companyName && <p className="text-gray-600">{customer.name}</p>}
                                    <p className="text-gray-600">{customer.address || customer.companyAddress || 'No address provided'}</p>
                                    <p className="text-gray-600">{customer.email}</p>
                                </>
                            ) : null}
                        </div>
                        <div className="text-right">
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-sm font-semibold text-gray-500">INVOICE #</span>
                                    <span className="font-medium">{invoiceId || `${config.profile.invoicePrefix || 'INV-'}${String(config.profile.invoiceStartNumber || 1).padStart(3, '0')}`}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-sm font-semibold text-gray-500">DATE</span>
                                    <span className="font-medium">{format(invoiceDate || new Date(), 'MM/dd/yy')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-sm font-semibold text-gray-500">DUE DATE</span>
                                    <span className="font-medium">{format(dueDate || new Date(), 'MM/dd/yy')}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent border-b-2 border-black">
                                    <TableHead className="w-2/5 text-black font-bold uppercase tracking-wider text-xs">Item</TableHead>
                                    <TableHead className="w-2/5 text-black font-bold uppercase tracking-wider text-xs">Description</TableHead>
                                    <TableHead className="text-right text-black font-bold uppercase tracking-wider text-xs">Qty</TableHead>
                                    <TableHead className="text-right text-black font-bold uppercase tracking-wider text-xs">Price</TableHead>
                                    <TableHead className="text-right text-black font-bold uppercase tracking-wider text-xs">Tax</TableHead>
                                    <TableHead className="text-right text-black font-bold uppercase tracking-wider text-xs">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceData.lineItems?.map((item, index) => {
                                    const product = config?.products.find(p => p.name === item.description);
                                    return (
                                        <TableRow key={index} className="border-b border-gray-300">
                                            <TableCell className="font-medium py-3 align-top text-sm">{product ? product.name : item.description}</TableCell>
                                            <TableCell className="py-3 align-top text-sm text-muted-foreground">{product?.description || ''}</TableCell>
                                            <TableCell className="text-right py-3 align-top text-sm">{item.quantity}</TableCell>
                                            <TableCell className="text-right py-3 align-top text-sm">{formatCurrency(item.price)}</TableCell>
                                            <TableCell className="text-right py-3 align-top text-sm">{taxRateDisplay}</TableCell>
                                            <TableCell className="text-right py-3 align-top text-sm">{formatCurrency(item.quantity * item.price)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </section>

                    <section className="grid grid-cols-2 gap-8 items-start mb-12">
                        <div className="text-sm">
                            {invoiceData.notes && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notes</h3>
                                    <p className="text-gray-600 mt-1 text-xs">{invoiceData.notes}</p>
                                </div>
                            )}
                            {config.profile.paymentDetails && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Payment Details</h3>
                                    <p className="text-gray-600 mt-1 whitespace-pre-wrap text-xs">{config.profile.paymentDetails}</p>
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
                                    <span className="text-gray-600">{taxName}</span>
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

                <footer className="absolute bottom-0 left-0 right-0 z-30">
                    {design.footerImage && (
                        <img src={design.footerImage} className="w-full h-auto" alt="Footer"/>
                    )}
                    <div className="text-center text-xs py-3 px-4" style={{backgroundColor: design.secondaryColor, color: 'white'}}>
                        {design.footerContent && <p className="mb-1">{design.footerContent}</p>}
                        {design.brandsoftFooter && <p><span className="font-bold">Created by BrandSoft</span></p>}
                    </div>
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
    
    const headerClone = invoiceElement.querySelector('header')?.cloneNode(true) as HTMLElement | null;
    const footerClone = invoiceElement.querySelector('footer.absolute')?.cloneNode(true) as HTMLElement | null;

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

        if (headerClone) {
            const headerCanvas = await html2canvas(headerClone, {backgroundColor: null});
            pdf.addImage(headerCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, headerClone.offsetHeight);
        }
        if (footerClone) {
            const footerCanvas = await html2canvas(footerClone, {backgroundColor: null});
            pdf.addImage(footerCanvas.toDataURL('image/png'), 'PNG', 0, pdfHeight - footerClone.offsetHeight, pdfWidth, footerClone.offsetHeight);
        }
        
        heightLeft -= pdfHeight;
    }

    pdf.save(`Invoice-${props.invoiceId}.pdf`);
};
