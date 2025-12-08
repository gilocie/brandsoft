
'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Quotation, DesignSettings } from '@/hooks/use-brandsoft';
import { format, parseISO } from "date-fns";
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

const QuotationStatusWatermark = ({ status }: { status: Quotation['status'] }) => {
    let text = '';
    let colorClass = '';

    switch (status) {
        case 'Draft':
        case 'Sent':
            text = status.toUpperCase();
            colorClass = 'text-blue-500/20';
            break;
        case 'Accepted':
            text = 'ACCEPTED';
            colorClass = 'text-green-500/20';
            break;
        case 'Declined':
            text = 'DECLINED';
            colorClass = 'text-red-500/20';
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


export function QuotationPreview({ config, customer, quotationData, quotationId, forPdf = false, designOverride }: QuotationPreviewProps) {

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
        
        const hasOverride = designOverride && Object.values(designOverride).some(v => v);

        return {
            backgroundColor: brand.backgroundColor || '#FFFFFF',
            headerImage: brand.headerImage || '',
            footerImage: brand.footerImage || '',
            backgroundImage: brand.backgroundImage || '',
            watermarkImage: brand.watermarkImage || '',
            ...defaultTemplate,
            ...documentDesign,
            ...(hasOverride && override),
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
        config.profile?.defaultQuotationTemplate,
        quotationData?.design,
        designOverride
    ]);

    const currencyCode = quotationData.currency || config.profile.defaultCurrency;
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
    } else if (quotationData.tax && quotationData.tax > 0 && subtotalAfterDiscount > 0) {
      taxAmount = quotationData.tax;
      if (quotationData.taxType === 'percentage' && quotationData.taxValue) {
        taxRateDisplay = `${quotationData.taxValue}%`;
      } else if (quotationData.taxType === 'flat' && quotationData.taxValue) {
        taxRateDisplay = formatCurrency(quotationData.taxValue);
      } else {
         const effectiveTaxRate = (taxAmount / subtotalAfterDiscount) * 100;
         taxRateDisplay = `${effectiveTaxRate.toFixed(2)}%`;
      }
    } else if (quotationData.tax) {
        taxAmount = quotationData.tax;
        taxRateDisplay = formatCurrency(taxAmount);
    }


    const shippingAmount = Number(quotationData.applyShipping && quotationData.shippingValue ? quotationData.shippingValue : (quotationData.shipping || 0));
    
    const total = subtotalAfterDiscount + taxAmount + shippingAmount;
    
    const rawQuotationDate = quotationData.quotationDate || quotationData.date;
    const rawValidUntil = quotationData.validUntil || quotationData.date;
    const quotationDate = typeof rawQuotationDate === 'string' ? parseISO(rawQuotationDate) : rawQuotationDate;
    const validUntil = typeof rawValidUntil === 'string' ? parseISO(rawValidUntil) : rawValidUntil;
    
    const taxName = quotationData.taxName || 'Tax';
    
    const headerHeight = design.headerImage ? '80px' : '40px';
    const contentPaddingTop = design.headerImage ? 'pt-24' : 'pt-14';

    return (
        <div className={forPdf ? "" : "bg-gray-100 p-4 sm:p-8 rounded-lg"}>
            <div 
                id={`quotation-preview-${quotationId}`} 
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
                
                {quotationData.status && !design.watermarkImage && <QuotationStatusWatermark status={quotationData.status} />}

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
                                <h1 className="text-3xl sm:text-4xl font-bold" style={{color: design.primaryColor}}>Quotation</h1>
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
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Quote To</h3>
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
                                    <span className="text-sm font-semibold text-gray-500">QUOTATION #</span>
                                    <span className="font-medium">{quotationId || `${config.profile.quotationPrefix || 'QUO-'}${String(config.profile.quotationStartNumber || 1).padStart(3, '0')}`}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-sm font-semibold text-gray-500">DATE</span>
                                    <span className="font-medium">{format(quotationDate || new Date(), 'MM/dd/yy')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-sm font-semibold text-gray-500">VALID UNTIL</span>
                                    <span className="font-medium">{format(validUntil || new Date(), 'MM/dd/yy')}</span>
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
                                {quotationData.lineItems?.map((item, index) => {
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
                            {quotationData.notes && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notes</h3>
                                    <p className="text-gray-600 mt-1 text-xs">{quotationData.notes}</p>
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
