'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Invoice, LineItem, DesignSettings } from '@/hooks/use-brandsoft';
import { format, parseISO, isValid } from "date-fns";
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

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        if (forPdf) return <>{children}</>;
        return (
            <div className="w-full h-full flex items-start justify-center overflow-auto bg-gray-100/50 p-4 sm:p-8">
                <div className="scale-[0.5] sm:scale-[0.6] md:scale-[0.75] lg:scale-[0.85] xl:scale-100 origin-top shadow-2xl">
                    {children}
                </div>
            </div>
        );
    };
    
    const topPadding = design.headerImage ? 'pt-[35mm]' : 'pt-[10mm]';
    const bottomPadding = design.footerImage ? 'pb-[35mm]' : 'pb-[15mm]';

    return (
        <Wrapper>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "bg-white relative text-black overflow-hidden flex flex-col font-sans",
                    "w-[210mm] h-[297mm]" 
                )}
                style={{ backgroundColor: design.backgroundColor || '#FFFFFF' }}
            >
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="background"/>
                )}
                
                {invoiceData.status && <InvoiceStatusWatermark status={invoiceData.status} />}
                
                <div className="h-6 w-full flex-shrink-0 relative z-10" style={{ backgroundColor: accentColor }}></div>

                {design.headerImage && (
                     <div className="absolute top-0 left-0 w-full h-[35mm] z-10">
                        <img src={design.headerImage} className="w-full h-full object-cover" alt="header" />
                    </div>
                )}

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

                <div className={cn("relative z-10 w-full h-full flex flex-col px-[12mm]", topPadding, bottomPadding)}>
                    
                    <header className="flex justify-between items-start mb-8 mt-4">
                        <div className="flex items-center gap-5">
                            {design.logo && (
                                <img src={design.logo} alt="Logo" className="h-20 w-auto object-contain" />
                            )}
                            <h1 className="text-5xl font-bold tracking-tight" style={{ color: accentColor }}>Invoice</h1>
                        </div>

                        <div className="text-right text-sm leading-relaxed text-gray-800">
                            <p className="font-bold text-base mb-1 text-black">{config.brand.businessName}</p>
                            <p>{config.profile.address}</p>
                            <p>{config.profile.email}</p>
                            <p>{config.profile.phone}</p>
                        </div>
                    </header>

                    <main className="flex-grow flex flex-col">
                        <section className="grid grid-cols-2 gap-10 mb-10">
                            
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Bill To</h3>
                                <p className="font-bold text-xl text-black mb-1">{customer.companyName || customer.name}</p>
                                {customer.companyName && <p className="text-sm text-gray-800 font-medium">{customer.name}</p>}
                                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">
                                    {customer.address || customer.companyAddress}
                                </p>
                                <p className="text-sm text-gray-600">{customer.email}</p>
                            </div>

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

                        <section className="mb-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b-2 border-gray-800 hover:bg-transparent">
                                        <TableHead className="w-[40%] text-black font-bold uppercase text-[11px] h-10 pl-0">Item</TableHead>
                                        <TableHead className="w-[20%] text-black font-bold uppercase text-[11px] h-10">Description</TableHead>
                                        <TableHead className="text-right text-black font-bold uppercase text-[11px] h-10">Qty</TableHead>
                                        <TableHead className="text-right text-black font-bold uppercase text-[11px] h-10">Price</TableHead>
                                        <TableHead className="text-right text-black font-bold uppercase text-[11px] h-10">Tax</TableHead>
                                        <TableHead className="text-right text-black font-bold uppercase text-[11px] h-10 pr-0">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoiceData.lineItems?.map((item, index) => {
                                        const product = config?.products?.find(p => p.id === item.productId);
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
                                                <TableCell className="text-right py-4 align-top text-sm">{taxRateDisplay}</TableCell>
                                                <TableCell className="text-right py-4 align-top font-semibold text-sm pr-0">{formatCurrency(item.quantity * item.price)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </section>
                        
                        <div className="mt-8">
                           <div className="flex flex-row gap-12 items-start">
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Details</h3>
                                    {config.profile.paymentDetails ? (
                                        <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                                            {config.profile.paymentDetails}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No payment details provided.</p>
                                    )}
                                </div>
                                <div className="w-[40%] min-w-[260px] space-y-2 text-sm">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 text-green-700">
                                            <span>Discount</span>
                                            <span>- {formatCurrency(discountAmount)}</span>
                                        </div>
                                    )}
                                    {taxAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">{taxName} ({taxRateDisplay})</span>
                                            <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                                        </div>
                                    )}
                                     {shippingAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                            <span className="text-gray-600">Shipping</span>
                                            <span className="font-semibold">{formatCurrency(shippingAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                             <div className="flex flex-row gap-12 items-start mt-4">
                                <div className="flex-1">
                                     {invoiceData.notes && (
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                                            <p className="text-xs text-gray-600">{invoiceData.notes}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="w-[40%] min-w-[260px]">
                                     <div className="mt-4 flex items-center justify-between p-3 rounded-sm" style={{backgroundColor: accentColor}}>
                                        <span className="font-bold text-white text-lg">Total</span>
                                        <span className="font-bold text-white text-xl">{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </Wrapper>
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
        windowWidth: 794,
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
