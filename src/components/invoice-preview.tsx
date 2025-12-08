
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

const InvoiceStatusWatermark = ({ status, color }: { status: string, color: string }) => {
    return (
        <div
            className={cn(
                "absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0",
                "text-[8rem] sm:text-[10rem] font-black tracking-[1rem] leading-none select-none pointer-events-none uppercase",
            )}
            style={{ color: color || 'rgba(0, 0, 0, 0.05)' }}
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
        return <div className="p-10">Loading...</div>;
    }
    
    const design = useMemo(() => {
        const brand = config.brand || {};
        const defaultTemplate = config.profile?.defaultInvoiceTemplate || {};
        const documentDesign = invoiceData?.design || {};
        const override = designOverride || {};
        const hasOverride = designOverride !== undefined && designOverride !== null;
        
        let mergedDesign: DesignSettings = {
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
        };
        
        const merge = (target: any, source: any) => {
            if (source.backgroundColor) target.backgroundColor = source.backgroundColor;
            if (source.textColor) target.textColor = source.textColor;
            if (source.headerImage) target.headerImage = source.headerImage;
            if (source.headerImageOpacity !== undefined) target.headerImageOpacity = source.headerImageOpacity;
            if (source.footerImage) target.footerImage = source.footerImage;
            if (source.footerImageOpacity !== undefined) target.footerImageOpacity = source.footerImageOpacity;
            if (source.backgroundImage) target.backgroundImage = source.backgroundImage;
            if (source.backgroundImageOpacity !== undefined) target.backgroundImageOpacity = source.backgroundImageOpacity;
            if (source.watermarkText) target.watermarkText = source.watermarkText;
            if (source.watermarkColor) target.watermarkColor = source.watermarkColor;
        };

        merge(mergedDesign, defaultTemplate);
        merge(mergedDesign, documentDesign);
        if (hasOverride) {
           Object.assign(mergedDesign, Object.fromEntries(Object.entries(override).filter(([_, v]) => v != null)));
        }
        
        return {
            ...mergedDesign,
            logo: brand.logo,
            primaryColor: brand.primaryColor || '#F97316',
            secondaryColor: brand.secondaryColor || '#1E40AF',
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

    const watermarkText = design.watermarkText || invoiceData.status;

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        if (forPdf) return <>{children}</>;
        return (
             <div className="w-full h-full flex items-start justify-center overflow-auto p-0">{children}</div>
        );
    };
    
    const topPadding = design.headerImage ? 'pt-[40px]' : 'pt-[10mm]';
    const bottomPadding = design.footerImage ? 'pb-[95px]' : 'pb-[55px]';

    return (
        <Wrapper>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "bg-white relative overflow-hidden",
                    "w-[210mm] h-[297mm]" 
                )}
                style={{ backgroundColor: design.backgroundColor || '#FFFFFF', color: design.textColor || '#000000' }}
            >
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" style={{opacity: design.backgroundImageOpacity ?? 1}} alt="background"/>
                )}
                
                {watermarkText && <InvoiceStatusWatermark status={watermarkText} color={design.watermarkColor || 'rgba(0,0,0,0.05)'} />}
                
                <div className="h-[50px] w-full flex-shrink-0 relative z-10" style={{ backgroundColor: accentColor }}></div>

                {design.headerImage && (
                     <div className="absolute top-0 left-0 w-full h-[40px] z-10">
                        <img src={design.headerImage} className="w-full h-full object-cover" style={{ opacity: design.headerImageOpacity ?? 1 }} alt="header" />
                    </div>
                )}
                
                <footer className="absolute bottom-0 left-0 w-full z-20">
                     {design.footerImage && (
                        <div className="w-full h-[40px]">
                           <img src={design.footerImage} className="w-full h-full object-cover" style={{ opacity: design.footerImageOpacity ?? 1 }} alt="footer" />
                        </div>
                    )}
                   {design.brandsoftFooter && (
                        <div className="text-center text-xs py-2 px-4" style={{backgroundColor: footerColor, color: '#fff'}}>
                            Created by BrandSoft
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

                        <div className="text-right text-sm leading-relaxed" style={{color: design.textColor ? design.textColor : 'inherit'}}>
                            <p className="font-bold text-base mb-1" style={{color: design.textColor ? design.textColor : 'inherit'}}>{config.brand.businessName}</p>
                            <p>{config.profile.address}</p>
                            <p>{config.profile.email}</p>
                            <p>{config.profile.phone}</p>
                        </div>
                    </header>

                    <main className="flex-grow flex flex-col">
                        <section className="grid grid-cols-2 gap-10 mb-10">
                            
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: design.textColor ? design.textColor : 'rgb(107 114 128)' }}>Bill To</h3>
                                <p className="font-bold text-xl mb-1" style={{color: design.textColor ? design.textColor : 'inherit'}}>{customer.companyName || customer.name}</p>
                                {customer.companyName && <p className="text-sm font-medium" style={{color: design.textColor ? design.textColor : 'inherit'}}>{customer.name}</p>}
                                <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed" style={{color: design.textColor ? design.textColor : 'rgb(75 85 99)'}}>
                                    {customer.address || customer.companyAddress}
                                </p>
                                <p className="text-sm" style={{color: design.textColor ? design.textColor : 'rgb(75 85 99)'}}>{customer.email}</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                    <span className="font-bold text-xs uppercase tracking-wider" style={{ color: design.textColor ? design.textColor : 'rgb(107 114 128)' }}>Invoice #</span>
                                    <span className="font-bold text-base" style={{color: design.textColor ? design.textColor : 'inherit'}}>{invoiceId || 'INV-001'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                    <span className="font-bold text-xs uppercase tracking-wider" style={{ color: design.textColor ? design.textColor : 'rgb(107 114 128)' }}>Date</span>
                                    <span className="font-medium text-sm" style={{color: design.textColor ? design.textColor : 'inherit'}}>{invoiceDateStr}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                    <span className="font-bold text-xs uppercase tracking-wider" style={{ color: design.textColor ? design.textColor : 'rgb(107 114 128)' }}>Due Date</span>
                                    <span className="font-medium text-sm" style={{color: design.textColor ? design.textColor : 'inherit'}}>{dueDateStr}</span>
                                </div>
                            </div>
                        </section>

                        <section className="mb-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b-2 hover:bg-transparent" style={{ borderColor: design.textColor ? design.textColor : 'rgb(31 41 55)' }}>
                                        <TableHead className="w-[40%] font-bold uppercase text-[11px] h-10 pl-0" style={{color: design.textColor ? design.textColor : 'inherit'}}>Item</TableHead>
                                        <TableHead className="w-[20%] font-bold uppercase text-[11px] h-10" style={{color: design.textColor ? design.textColor : 'inherit'}}>Description</TableHead>
                                        <TableHead className="text-right font-bold uppercase text-[11px] h-10" style={{color: design.textColor ? design.textColor : 'inherit'}}>Qty</TableHead>
                                        <TableHead className="text-right font-bold uppercase text-[11px] h-10" style={{color: design.textColor ? design.textColor : 'inherit'}}>Price</TableHead>
                                        <TableHead className="text-right font-bold uppercase text-[11px] h-10" style={{color: design.textColor ? design.textColor : 'inherit'}}>Tax</TableHead>
                                        <TableHead className="text-right font-bold uppercase text-[11px] h-10 pr-0" style={{color: design.textColor ? design.textColor : 'inherit'}}>Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoiceData.lineItems?.map((item, index) => {
                                        const product = config?.products?.find(p => p.id === item.productId);
                                        return (
                                            <TableRow key={index} className="border-b border-gray-200 hover:bg-transparent">
                                                <TableCell className="py-4 align-top pl-0">
                                                    <span className="font-bold text-sm" style={{color: design.textColor ? design.textColor : 'inherit'}}>{product ? product.name : item.description}</span>
                                                </TableCell>
                                                <TableCell className="py-4 align-top text-xs" style={{color: design.textColor ? design.textColor : 'rgb(75 85 99)'}}>
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
                        
                         <div className="flex flex-col gap-4 mt-8">
                             <div className="flex flex-row gap-12 items-start">
                                 <div className="flex-1">
                                     <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: design.textColor ? design.textColor : 'rgb(107 114 128)' }}>Payment Details</h3>
                                     {config.profile.paymentDetails ? (
                                         <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: design.textColor ? design.textColor : 'rgb(75 85 99)' }}>
                                             {config.profile.paymentDetails}
                                         </p>
                                     ) : (
                                         <p className="text-xs italic" style={{ color: design.textColor ? design.textColor : 'rgb(156 163 175)' }}>No payment details provided.</p>
                                     )}
                                 </div>
                                <div className="w-[40%] min-w-[260px] space-y-2 text-sm">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <span style={{color: design.textColor ? design.textColor : 'rgb(75 85 99)'}}>Subtotal</span>
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
                                            <span style={{color: design.textColor ? design.textColor : 'rgb(75 85 99)'}}>{taxName} ({taxRateDisplay})</span>
                                            <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                                        </div>
                                    )}
                                     {shippingAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                            <span style={{color: design.textColor ? design.textColor : 'rgb(75 85 99)'}}>Shipping</span>
                                            <span className="font-semibold">{formatCurrency(shippingAmount)}</span>
                                        </div>
                                    )}
                                </div>
                             </div>
                            <div className="flex flex-row gap-12 items-start">
                                <div className="flex-1">
                                     {invoiceData.notes && (
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: design.textColor ? design.textColor : 'rgb(107 114 128)' }}>Notes</h3>
                                            <p className="text-xs" style={{ color: design.textColor ? design.textColor : 'rgb(75 85 99)' }}>{invoiceData.notes}</p>
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
