
'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Quotation, DesignSettings } from '@/hooks/use-brandsoft';
import { format, parseISO, isValid } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

type QuotationData = Partial<Quotation> & {
    lineItems?: {
        productId?: string;
        description: string;
        quantity: number;
        price: number;
    }[],
    currency?: string;
    quotationDate?: Date;
    validUntil?: Date;
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

export interface QuotationPreviewProps {
    config: BrandsoftConfig | null;
    customer: Customer | null;
    quotationData: QuotationData;
    quotationId?: string;
    forPdf?: boolean;
    designOverride?: DesignSettings;
}

const QuotationStatusWatermark = ({ status, design }: { status?: string, design: DesignSettings }) => {
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

export function QuotationPreview({ 
    config, 
    customer, 
    quotationData, 
    quotationId, 
    forPdf = false, 
    designOverride 
}: QuotationPreviewProps) {

    if (!config || !customer || !quotationData) {
        return (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
                Please fill out all required fields to see the preview.
            </div>
        );
    }
    
    const design = useMemo(() => {
        const brand = config.brand || {};
        const defaultTemplate = config.profile?.defaultQuotationTemplate || {};
        const documentDesign = quotationData?.design || {};
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
            headerColor: brand.primaryColor || '#000000',
            footerColor: brand.secondaryColor || '#666666',
        };
        
        const merge = (target: any, source: any) => {
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
    }, [config, quotationData?.design, designOverride]);

    const currencyCode = quotationData.currency || config.profile?.defaultCurrency || '$';
    const formatCurrency = (value: number) => `${currencyCode}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const subtotal = quotationData.lineItems?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || quotationData.subtotal || 0;
    
    let discountAmount = 0;
    if (quotationData.applyDiscount && quotationData.discountValue) {
        if (quotationData.discountType === 'percentage') {
            discountAmount = subtotal * (quotationData.discountValue / 100);
        } else {
            discountAmount = quotationData.discountValue;
        }
    } else if (quotationData.discount) {
        discountAmount = quotationData.discount;
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    
    let taxAmount = 0;
    let taxRateDisplay = '0%';
    if (quotationData.applyTax && quotationData.taxValue) {
        if (quotationData.taxType === 'percentage') {
            taxAmount = subtotalAfterDiscount * (quotationData.taxValue / 100);
            taxRateDisplay = `${quotationData.taxValue}%`;
        } else {
            taxAmount = quotationData.taxValue;
            taxRateDisplay = formatCurrency(quotationData.taxValue);
        }
    } else if (quotationData.tax) {
        taxAmount = quotationData.tax;
        taxRateDisplay = formatCurrency(taxAmount);
    }

    const shippingAmount = Number(quotationData.applyShipping && quotationData.shippingValue ? quotationData.shippingValue : (quotationData.shipping || 0));
    
    const total = subtotalAfterDiscount + taxAmount + shippingAmount;
    
    const formatDateSafe = (dateVal: Date | string | undefined) => {
        if (!dateVal) return format(new Date(), 'MM/dd/yyyy');
        const d = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
        return isValid(d) ? format(d, 'MM/dd/yyyy') : format(new Date(), 'MM/dd/yyyy');
    };

    const quotationDateStr = formatDateSafe(quotationData.quotationDate || quotationData.date);
    const validUntilStr = formatDateSafe(quotationData.validUntil || quotationData.date);
    
    const taxName = quotationData.taxName || 'Tax';
    
    const watermarkText = design.watermarkText || quotationData.status;

    return (
        <div className={forPdf ? "" : "bg-gray-100 p-4 sm:p-8 rounded-lg"}>
            <div 
                id={`quotation-preview-${quotationId}`} 
                className={cn(
                    "w-[8.5in] h-[11in] mx-auto bg-white shadow-lg relative font-sans flex flex-col",
                )}
                style={{
                    backgroundColor: design.backgroundColor || '#FFFFFF',
                    color: design.textColor || '#000000',
                }}
            >
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" style={{opacity: design.backgroundImageOpacity}} alt="background"/>
                )}

                 {watermarkText && <QuotationStatusWatermark status={watermarkText} design={design} />}

                <div className="relative z-10 flex-grow flex flex-col pt-12 px-12 pb-2">
                    {/* Header bar and image */}
                    <div className="absolute top-0 left-0 right-0 h-[60px] z-0">
                        <div className="absolute top-0 left-0 right-0 h-full" style={{backgroundColor: design.headerColor}}></div>
                        {design.headerImage && (
                            <img src={design.headerImage} className="w-full h-full object-cover" style={{opacity: design.headerImageOpacity}} alt="Letterhead"/>
                        )}
                    </div>
                    
                    <header className="flex justify-between items-start mb-5 relative z-10">
                         <div className="flex items-center gap-4">
                            {(design.logo || config.brand?.logo) && (
                                <img src={design.logo || config.brand.logo} alt={config.brand?.businessName || 'Logo'} className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
                            )}
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold" style={{color: design.headerColor}}>Quotation</h1>
                            </div>
                        </div>
                        <div className="text-right text-sm ml-10" style={{color: design.textColor}}>
                            <p className="font-bold text-base">{config.brand?.businessName}</p>
                            <p>{config.profile?.address}</p>
                            <p>{config.profile?.email}</p>
                            <p>{config.profile?.phone}</p>
                            {config.profile?.website && <p>{config.profile.website}</p>}
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 mb-4 relative z-10">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-1" style={{color: design.textColor ? design.textColor : 'rgb(107 114 128)'}}>Quote To</h3>
                            <p className="font-bold text-lg">{customer.companyName || customer.name}</p>
                            {config.brand?.showCustomerAddress ? (
                                <>
                                    {customer.companyName && <p style={{color: design.textColor}}>{customer.name}</p>}
                                    <p style={{color: design.textColor}}>{customer.address || customer.companyAddress || 'No address provided'}</p>
                                    <p style={{color: design.textColor}}>{customer.email}</p>
                                </>
                            ) : null}
                        </div>
                        <div className="text-right">
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-sm font-semibold" style={{color: design.textColor ? design.textColor : 'rgb(107 114 128)'}}>QUOTATION #</span>
                                    <span className="font-medium">{quotationId || `${config.profile?.quotationPrefix || 'QUO-'}${String(config.profile?.quotationStartNumber || 1).padStart(3, '0')}`}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-sm font-semibold" style={{color: design.textColor ? design.textColor : 'rgb(107 114 128)'}}>DATE</span>
                                    <span className="font-medium">{quotationDateStr}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-sm font-semibold" style={{color: design.textColor ? design.textColor : 'rgb(107 114 128)'}}>VALID UNTIL</span>
                                    <span className="font-medium">{validUntilStr}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8 relative z-10">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent border-b-2" style={{borderColor: design.textColor}}>
                                    <TableHead className="w-2/5 font-bold uppercase tracking-wider text-xs" style={{color: design.textColor}}>Item</TableHead>
                                    <TableHead className="w-2/5 font-bold uppercase tracking-wider text-xs" style={{color: design.textColor}}>Description</TableHead>
                                    <TableHead className="text-right font-bold uppercase tracking-wider text-xs" style={{color: design.textColor}}>Qty</TableHead>
                                    <TableHead className="text-right font-bold uppercase tracking-wider text-xs" style={{color: design.textColor}}>Price</TableHead>
                                    <TableHead className="text-right font-bold uppercase tracking-wider text-xs" style={{color: design.textColor}}>Tax</TableHead>
                                    <TableHead className="text-right font-bold uppercase tracking-wider text-xs" style={{color: design.textColor}}>Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotationData.lineItems?.map((item, index) => {
                                    const product = config?.products?.find(p => p.name === item.description);
                                    return (
                                        <TableRow key={index} className="border-b" style={{borderColor: design.textColor ? `${design.textColor}20` : '#e5e7eb'}}>
                                            <TableCell className="font-medium py-3 align-top text-sm">{product ? product.name : item.description}</TableCell>
                                            <TableCell className="py-3 align-top text-sm" style={{color: design.textColor ? `${design.textColor}b3` : '#6b7280'}}>{product?.description || ''}</TableCell>
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

                    <section className="grid grid-cols-2 gap-8 items-start mt-auto relative z-10">
                        <div className="text-sm">
                            {quotationData.notes && (
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{color: design.textColor ? design.textColor : 'rgb(107 114 128)'}}>Notes</h3>
                                    <p className="mt-1 text-xs" style={{color: design.textColor}}>{quotationData.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="w-full space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span style={{color: design.textColor}}>Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span style={{color: design.textColor}}>Discount</span>
                                    <span className="font-medium">- {formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {taxAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span style={{color: design.textColor}}>{taxName}</span>
                                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                                </div>
                            )}
                            {shippingAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span style={{color: design.textColor}}>Shipping</span>
                                    <span className="font-medium">{formatCurrency(shippingAmount)}</span>
                                </div>
                            )}
                            <div className="pt-2">
                                <div className="flex items-center justify-between font-bold text-lg py-3 px-4 rounded" style={{backgroundColor: design.headerColor, color: '#fff'}}>
                                    <span className="mr-4">Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="absolute bottom-0 left-0 right-0 z-20">
                    {design.footerImage && (
                        <div className="w-full h-[60px]">
                            <img src={design.footerImage} className="w-full h-full object-cover" style={{opacity: design.footerImageOpacity}} alt="Footer"/>
                        </div>
                    )}
                    <div className="text-center text-xs py-3 px-4" style={{backgroundColor: design.footerColor, color: 'white'}}>
                        {design.footerContent && <p className="mb-1">{design.footerContent}</p>}
                        {design.brandsoftFooter && <p><span className="font-bold">Created by BrandSoft</span></p>}
                    </div>
                </footer>
            </div>
        </div>
    );
}

export const downloadQuotationAsPdf = async (props: QuotationPreviewProps) => {
    const container = document.createElement('div');
    container.id = `pdf-container-${props.quotationId}`;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '816px';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<QuotationPreview {...props} forPdf={true} />);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const quotationElement = container.querySelector(`#quotation-preview-${props.quotationId}`) as HTMLElement;
    if (!quotationElement) {
        console.error("Quotation element not found for PDF generation.");
        root.unmount();
        document.body.removeChild(container);
        return;
    }
    
    const headerClone = quotationElement.querySelector('header')?.cloneNode(true) as HTMLElement | null;
    const footerClone = quotationElement.querySelector('footer.absolute')?.cloneNode(true) as HTMLElement | null;

    const canvas = await html2canvas(quotationElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 816,
        height: quotationElement.scrollHeight
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

    pdf.save(`Quotation-${props.quotationId}.pdf`);
};
