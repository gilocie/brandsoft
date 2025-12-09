
'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Quotation, DesignSettings, LineItem } from '@/hooks/use-brandsoft';
import { format, parseISO, isValid } from "date-fns";
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

type QuotationData = Partial<Quotation> & {
    lineItems?: LineItem[],
    currency?: string;
    quotationDate?: string;
    validUntil?: string;
    taxName?: string;
    applyTax?: boolean;
    taxType?: 'percentage' | 'flat';
    taxValue?: number;
    applyDiscount?: boolean;
    discountType?: 'percentage' | 'flat';
    discountValue?: number;
    applyShipping?: boolean;
    shippingValue?: number;
    applyPartialPayment?: boolean;
    partialPaymentType?: 'percentage' | 'flat';
    partialPaymentValue?: number;
    design?: DesignSettings;
};

export interface QuotationPreviewProps {
    config: BrandsoftConfig | null;
    customer: Customer | null;
    quotationData: QuotationData;
    quotationId?: string;
    forPdf?: boolean;
    designOverride?: DesignSettings;
    pageNumber?: number; // for multi-page PDF rendering
    totalPages?: number;
}

const Watermark = ({ status, design }: { status?: string, design: DesignSettings }) => {
    if (!status) return null;

     const hexToRgb = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (!hex) return { r, g, b };
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

const Background = ({ design }: { design: DesignSettings }) => {
    if (!design.backgroundImage) return null;
    return <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" style={{opacity: design.backgroundImageOpacity}} alt="background"/>
};

const Header = ({ design, config }: { design: DesignSettings, config: BrandsoftConfig }) => {
    if (!design.showHeader) return null;
    if (design.headerImage) {
        return (
            <div className="w-full h-auto flex-shrink-0">
                 <img src={design.headerImage} className="w-full h-full object-cover z-10" style={{maxHeight: '60px', opacity: design.headerImageOpacity}} alt="header"/>
            </div>
        );
    }
    return <div className="w-full flex-shrink-0 relative z-10" style={{ backgroundColor: design.headerColor, height: '35px' }}></div>
};

const Footer = ({ design, pageNumber, totalPages }: { design: DesignSettings, pageNumber?: number, totalPages?: number }) => {
    if (!design.showFooter) return null;
    return (
        <footer className="w-full relative z-10 mt-auto flex-shrink-0">
            {design.footerImage ? (
                <img src={design.footerImage} className="w-full h-auto object-cover z-10" style={{maxHeight: '60px', opacity: design.footerImageOpacity}} alt="footer"/>
            ) : (
               <div className="w-full flex items-center justify-center text-white py-4" style={{ backgroundColor: design.footerColor }}>
                    <div className="text-center">
                         {design.showBrandsoftFooter && (
                            <p className="text-[10px]">Created by <span className="font-bold">BrandSoft</span></p>
                        )}
                        {design.footerContent && (
                            <p className="text-xs mt-1">{design.footerContent}</p>
                        )}
                        {totalPages && totalPages > 1 && (
                            <p className="text-[10px] mt-1">Page {pageNumber} of {totalPages}</p>
                        )}
                    </div>
                </div>
            )}
        </footer>
    );
};



export function QuotationPreview({ 
    config, 
    customer, 
    quotationData, 
    quotationId, 
    forPdf = false, 
    designOverride,
    pageNumber = 1,
    totalPages = 1,
}: QuotationPreviewProps) {

    if (!config || !customer || !quotationData) return <div>Loading...</div>;
    
    const design = useMemo(() => {
        const brand = config.brand || {};
        const defaultTemplateId = config.profile?.defaultQuotationTemplate;
        const defaultTemplate = typeof defaultTemplateId === 'string' 
            ? config.templates?.find(t => t.id === defaultTemplateId)?.pages?.[0]?.pageDetails 
            : defaultTemplateId;

        const documentDesign = quotationData?.design || {};
        const override = designOverride || {};
        
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
            showLogo: brand.showLogo ?? true,
            showBusinessAddress: brand.showBusinessAddress ?? true,
            showInvoiceTitle: brand.showInvoiceTitle ?? true,
            showBillingAddress: brand.showBillingAddress ?? true,
            showDates: brand.showDates ?? true,
            showPaymentDetails: brand.showPaymentDetails ?? true,
            showNotes: brand.showNotes ?? true,
            showBrandsoftFooter: brand.brandsoftFooter ?? true,
            showHeader: brand.showHeader ?? true,
            showFooter: brand.showFooter ?? true,
            paymentDetails: config.profile.paymentDetails,
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
        merge(mergedDesign, override);
        
        return mergedDesign;
    }, [config, quotationData?.design, designOverride]);

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
    let taxRateDisplay = quotationData.taxValue !== undefined ? `${quotationData.taxValue}%` : '0%';
    if (quotationData.applyTax && quotationData.taxValue) {
        if (quotationData.taxType === 'percentage') {
            taxAmount = subtotalAfterDiscount * (quotationData.taxValue / 100);
        } else {
            taxAmount = quotationData.taxValue;
            taxRateDisplay = formatCurrency(quotationData.taxValue);
        }
    } else if (quotationData.tax) {
        taxAmount = quotationData.tax;
    }

    const shippingAmount = Number(quotationData.applyShipping && quotationData.shippingValue ? quotationData.shippingValue : (quotationData.shipping || 0));
    const total = subtotalAfterDiscount + taxAmount + shippingAmount;

    let partialPaymentAmount = 0;
    if (quotationData.applyPartialPayment && quotationData.partialPaymentValue) {
        if (quotationData.partialPaymentType === 'percentage') {
            partialPaymentAmount = total * (quotationData.partialPaymentValue / 100);
        } else {
            partialPaymentAmount = quotationData.partialPaymentValue;
        }
    } else if (quotationData.partialPayment) {
        partialPaymentAmount = quotationData.partialPayment;
    }
    const amountDue = total - partialPaymentAmount;
    
    const formatDateSafe = (dateVal: Date | string | undefined) => {
        if (!dateVal) return format(new Date(), 'MM/dd/yyyy');
        const d = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
        return isValid(d) ? format(d, 'MM/dd/yyyy') : format(new Date(), 'MM/dd/yyyy');
    };

    const quotationDateStr = formatDateSafe(quotationData.quotationDate || quotationData.date);
    const validUntilStr = formatDateSafe(quotationData.validUntil || quotationData.date);
    const taxName = quotationData.taxName || 'VAT';
    
    const watermarkText = (design.watermarkText === 'AUTO' ? quotationData.status : design.watermarkText) || quotationData.status;
    const paymentDetailsToDisplay = designOverride?.paymentDetails || design.paymentDetails || config.profile.paymentDetails;


    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        if (forPdf) return <>{children}</>;
        return (
            <div className="w-full h-full flex items-start justify-center overflow-auto bg-gray-100 p-8">
                <div className="scale-[0.8] md:scale-[0.9] lg:scale-100 origin-top shadow-2xl">
                    {children}
                </div>
            </div>
        );
    };

    const displayLogo = design.logo || config.brand.logo;
    const customerDisplayName = customer.companyName || customer.name;

    return (
        <Wrapper>
            <div 
                id={`quotation-preview-${quotationId}`} 
                className={cn(
                    "bg-white relative text-black overflow-hidden flex flex-col font-sans",
                    "w-[210mm] min-h-[297mm]" 
                )}
                style={{ backgroundColor: design.backgroundColor || '#FFFFFF', color: design.textColor || '#000000' }}
            >
                <Background design={design} />
                {quotationData.status && watermarkText && <Watermark status={watermarkText} design={design} />}
                
                 <div className='relative z-10 flex flex-col flex-grow'>
                    <Header design={design} config={config} />
                    <div className='p-[12mm] pb-0 flex-grow flex flex-col'>


                        <header className="flex justify-between items-start relative z-10">
                            <div className="flex items-center gap-4">
                                 {design.showLogo && displayLogo && (
                                    <img src={displayLogo} alt="Logo" className="h-20 w-auto object-contain" />
                                )}
                                {design.showInvoiceTitle && <h1 className="text-4xl font-bold tracking-tight ml-2" style={{ color: design.headerColor }}>Quotation</h1>}
                            </div>
                            {design.showBusinessAddress && (
                                <div className="text-right text-sm leading-relaxed ml-10" style={{color: design.textColor ? design.textColor : 'inherit'}}>
                                    <p className="font-bold text-lg mb-1" style={{color: design.textColor ? design.textColor : 'inherit'}}>{config.brand?.businessName}</p>
                                    <p>{config.profile?.address}</p>
                                    <p>{config.profile?.email}</p>
                                    <p>{config.profile?.phone}</p>
                                </div>
                            )}
                        </header>

                        <main className="flex-grow relative z-10 mt-10">
                            <section className="flex justify-between items-start mb-10">
                                {design.showBillingAddress && (
                                     <div className="w-1/2">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quote For</h3>
                                        <p className="font-bold text-xl">{customerDisplayName}</p>
                                        <p className="text-sm mt-1 whitespace-pre-wrap">{customer.companyAddress || customer.address}</p>
                                        <p className="text-sm">{customer.email}</p>
                                    </div>
                                )}

                                {design.showDates && (
                                    <div className="w-auto min-w-[200px]">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-right">
                                            <span className="font-bold text-gray-500 uppercase text-xs self-center">Quote #</span>
                                            <span className="font-bold text-base">{quotationId || 'QUO-001'}</span>

                                            <span className="font-bold text-gray-500 uppercase text-xs self-center">Date</span>
                                            <span className="font-medium">{quotationDateStr}</span>

                                            <span className="font-bold text-gray-500 uppercase text-xs self-center">Valid Until</span>
                                            <span className="font-medium">{validUntilStr}</span>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="mb-10">
                                <div className="w-full">
                                     <div className="flex border-b-2 pb-2 mb-2" style={{borderColor: design.textColor ? design.textColor : 'inherit'}}>
                                        <div className="w-[30%] font-bold uppercase text-[11px]">Item</div>
                                        <div className="w-[20%] font-bold uppercase text-[11px]">Description</div>
                                        <div className="w-[10%] font-bold uppercase text-[11px] text-center">Qty</div>
                                        <div className="w-[15%] font-bold uppercase text-[11px] text-right">Price</div>
                                        <div className="w-[10%] font-bold uppercase text-[11px] text-right">Tax</div>
                                        <div className="w-[15%] font-bold uppercase text-[11px] text-right">Amount</div>
                                    </div>
                                    
                                    {quotationData.lineItems?.map((item, index) => {
                                        const product = config?.products?.find(p => p.name === item.description);
                                        const itemName = product ? product.name : item.description;
                                        const itemDesc = product ? product.description : '';
                                        return (
                                            <div key={index} className="flex border-b py-3 text-sm" style={{borderColor: 'rgba(0,0,0,0.05)'}}>
                                                <div className="w-[30%] pr-2 font-bold">{itemName}</div>
                                                <div className="w-[20%] pr-2 text-xs text-gray-500">{itemDesc}</div>
                                                <div className="w-[10%] text-center">{item.quantity}</div>
                                                <div className="w-[15%] text-right">{formatCurrency(item.price)}</div>
                                                <div className="w-[10%] text-right">{taxRateDisplay}</div>
                                                <div className="w-[15%] text-right font-bold">{formatCurrency(item.quantity * item.price)}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            <section className="flex flex-row gap-12 items-start mt-auto mb-8">
                                <div className="flex-1 text-xs">
                                     {design.showPaymentDetails && paymentDetailsToDisplay && (
                                        <div>
                                            <h3 className="font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h3>
                                            <p className="whitespace-pre-wrap leading-relaxed">{paymentDetailsToDisplay}</p>
                                        </div>
                                    )}
                                     {design.showNotes && quotationData.notes && (
                                        <div className="mt-4 pt-4 border-t" style={{borderColor: 'rgba(0,0,0,0.05)'}}>
                                            <h3 className="font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</h3>
                                            <p>{quotationData.notes}</p>
                                        </div>
                                    )}
                                </div>

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
                                    
                                    <div 
                                        className="mt-4 flex items-center justify-between p-3 rounded-sm shadow-sm" 
                                        style={{backgroundColor: design.headerColor}}
                                    >
                                        <span className="font-bold text-white text-lg">Total</span>
                                        <span className="font-bold text-white text-xl">{formatCurrency(total)}</span>
                                    </div>

                                    {partialPaymentAmount > 0 && (
                                        <>
                                            <div className="flex justify-between mt-2 text-green-600">
                                                <span>Payment Made</span>
                                                <span className="font-bold">- {formatCurrency(partialPaymentAmount)}</span>
                                            </div>
                                             <div 
                                                className="mt-4 flex items-center justify-between p-3 rounded-sm shadow-sm" 
                                                style={{backgroundColor: design.headerColor}}
                                            >
                                                <span className="font-bold text-white text-lg">Balance</span>
                                                <span className="font-bold text-white text-xl">{formatCurrency(amountDue)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        </main>
                    </div>
                     <Footer design={design} pageNumber={pageNumber} totalPages={totalPages} />
                </div>
            </div>
        </Wrapper>
    );
}

export const downloadQuotationAsPdf = async (props: QuotationPreviewProps) => {
    const tempContainer = document.createElement('div');
    tempContainer.id = `pdf-container-${props.quotationId}`;
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    document.body.appendChild(tempContainer);
    
    const root = createRoot(tempContainer);

    // Initial render to measure content height
    root.render(<QuotationPreview {...props} forPdf={true} />);
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const contentElement = tempContainer.querySelector(`#quotation-preview-${props.quotationId} > div > div > main`) as HTMLElement;
    if (!contentElement) {
        console.error("Could not find main content for measurement.");
        root.unmount();
        document.body.removeChild(tempContainer);
        return;
    }
    
    const A4_HEIGHT_MM = 297;
    const PADDING_MM = 24; // 12mm top, 12mm bottom
    const HEADER_FOOTER_HEIGHT_MM = 30; // Approx height for header/footer elements outside main content area
    const contentHeightMm = contentElement.offsetHeight * (210 / 794); // Convert px to mm
    const availablePageHeightMm = A4_HEIGHT_MM - PADDING_MM - HEADER_FOOTER_HEIGHT_MM;
    const totalPages = Math.ceil(contentHeightMm / availablePageHeightMm);

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    for (let i = 1; i <= totalPages; i++) {
        const pageContainer = document.createElement('div');
        tempContainer.appendChild(pageContainer);
        const pageRoot = createRoot(pageContainer);

        pageRoot.render(<QuotationPreview {...props} forPdf={true} pageNumber={i} totalPages={totalPages} />);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const quotationElement = pageContainer.querySelector(`#quotation-preview-${props.quotationId}`) as HTMLElement;
        const mainContentEl = quotationElement.querySelector('main') as HTMLElement;
        if (mainContentEl) {
            const pageOffset = -(i - 1) * availablePageHeightMm;
            mainContentEl.style.transform = `translateY(${pageOffset}px)`;
        }

        const canvas = await html2canvas(quotationElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794,
        });

        if (i > 1) {
            pdf.addPage();
        }
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);

        pageRoot.unmount();
        tempContainer.removeChild(pageContainer);
    }
    
    root.unmount();
    document.body.removeChild(tempContainer);
    pdf.save(`Quotation-${props.quotationId}.pdf`);
};
