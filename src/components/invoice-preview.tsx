'use client';

import { BrandsoftConfig, Customer, Invoice } from '@/hooks/use-brandsoft.tsx';
import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';


// This props definition is intentionally verbose to support both
// the real-time form data from a new/edit page and the stored data from an existing invoice.
type InvoiceData = Partial<Invoice> & {
    lineItems?: {
        productId?: string;
        description: string;
        quantity: number;
        price: number;
    }[],
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
};


export interface InvoicePreviewProps {
    config: BrandsoftConfig | null;
    customer: Customer | null;
    invoiceData: InvoiceData;
    invoiceId?: string;
    forPdf?: boolean;
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
            "text-[8rem] font-black tracking-widest leading-none transform -rotate-15 select-none pointer-events-none",
            colorClass
        )}>
            {text}
        </div>
    );
};


export function InvoicePreview({ config, customer, invoiceData, invoiceId, forPdf = false }: InvoicePreviewProps) {

    if (!config || !customer || !invoiceData) {
        return (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
                Please fill out all required fields to see the preview.
            </div>
        );
    }
    
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


    let shippingAmount = 0;
    if (invoiceData.applyShipping && invoiceData.shippingValue) {
      shippingAmount = invoiceData.shippingValue;
    } else if (invoiceData.shipping) {
      shippingAmount = invoiceData.shipping;
    }

    const total = subtotalAfterDiscount + taxAmount + shippingAmount;
    
    const rawInvoiceDate = invoiceData.invoiceDate || invoiceData.date;
    const rawDueDate = invoiceData.dueDate || invoiceData.date;
    const invoiceDate = typeof rawInvoiceDate === 'string' ? parseISO(rawInvoiceDate) : rawInvoiceDate;
    const dueDate = typeof rawDueDate === 'string' ? parseISO(rawDueDate) : rawDueDate;

    const isProductBased = (description: string) => {
        return !!config?.products.find(p => p.name === description);
    }
    
    const taxName = invoiceData.taxName || 'Tax';

    return (
        <div className={forPdf ? "" : "bg-gray-100 p-4 sm:p-8 rounded-lg"}>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "w-full max-w-[8.5in] mx-auto bg-white shadow-lg relative font-sans flex flex-col",
                    forPdf ? "min-h-[11in]" : "min-h-[11in] p-12"
                )}
                style={forPdf ? { 
                    padding: '48px',
                    paddingTop: config.brand.headerImage ? '100px' : '58px',
                    paddingBottom: '100px'
                } : {}}
            >
                <div className="flex-grow">
                    {config.brand.backgroundImage && (
                        <img src={config.brand.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="background"/>
                    )}

                    {config.brand.watermarkImage && (
                        <img src={config.brand.watermarkImage} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 pointer-events-none" alt="watermark" />
                    )}
                    
                    {invoiceData.status && !config.brand.watermarkImage && <InvoiceStatusWatermark status={invoiceData.status} />}

                    {/* Header - Fixed positioning for PDF */}
                    {config.brand.headerImage ? (
                        <div className="absolute top-0 left-0 right-0 h-20 z-10">
                            <img src={config.brand.headerImage} className="w-full h-full object-cover" alt="Letterhead"/>
                        </div>
                    ) : (
                        <div className="absolute top-0 left-0 right-0 h-10 z-10" style={{backgroundColor: config.brand.primaryColor}}></div>
                    )}
                    
                    {/* Main Content */}
                    <header className="relative z-10 flex justify-between items-start mb-8 pt-2">
                        <div className="flex items-center gap-4">
                            {config.brand.logo && (
                            <img src={config.brand.logo} alt={config.brand.businessName} className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
                            )}
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold" style={{color: config.brand.primaryColor}}>Invoice</h1>
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

                    {/* Bill To & Dates */}
                    <section className="relative z-10 grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Bill To</h3>
                            <p className="font-bold text-lg">{customer.companyName || customer.name}</p>
                            {customer.companyName && <p className="text-gray-600">{customer.name}</p>}
                            <p className="text-gray-600">{customer.address || customer.companyAddress || 'No address provided'}</p>
                            <p className="text-gray-600">{customer.email}</p>
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

                    {/* Line Items Table */}
                    <section className="relative z-10 mb-8">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent border-b-2 border-black">
                                    <TableHead className="w-1/2 text-black font-bold uppercase tracking-wider text-xs">Items</TableHead>
                                    <TableHead className="text-right text-black font-bold uppercase tracking-wider text-xs">Quantity</TableHead>
                                    <TableHead className="text-right text-black font-bold uppercase tracking-wider text-xs">Price</TableHead>
                                    <TableHead className="text-right text-black font-bold uppercase tracking-wider text-xs">Tax</TableHead>
                                    <TableHead className="text-right text-black font-bold uppercase tracking-wider text-xs">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceData.lineItems?.map((item, index) => (
                                    <TableRow key={index} className="border-b border-gray-300">
                                        <TableCell className="font-medium py-3 align-top text-sm">
                                            {item.description}
                                            {isProductBased(item.description) && config.products.find(p => p.name === item.description)?.description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {config.products.find(p => p.name === item.description)?.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-3 align-top text-sm">{item.quantity}</TableCell>
                                        <TableCell className="text-right py-3 align-top text-sm">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-right py-3 align-top text-sm">
                                        {taxRateDisplay}
                                        </TableCell>
                                        <TableCell className="text-right py-3 align-top text-sm">{formatCurrency(item.quantity * item.price)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </section>

                    {/* Totals & Notes */}
                    <section className="relative z-10 grid grid-cols-2 gap-8 items-start mb-12">
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
                            <div className="flex items-center justify-between font-bold text-lg py-3 px-4 rounded" style={{backgroundColor: config.brand.primaryColor, color: '#fff'}}>
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer - Renders at the bottom of the flex container */}
                <footer className={cn("relative z-10", forPdf && "absolute bottom-0 left-0 right-0")}>
                    {config.brand.footerImage && (
                        <img src={config.brand.footerImage} className="w-full h-auto" alt="Footer"/>
                    )}
                     <div className="text-center text-xs py-3 px-4" style={{backgroundColor: config.brand.secondaryColor, color: 'white'}}>
                         {config.brand.footerContent && <p className="mb-1">{config.brand.footerContent}</p>}
                         {config.brand.brandsoftFooter && <p><span className="font-bold">Created by BrandSoft</span></p>}
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

    if (imgHeight <= pdfHeight) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
        const totalPages = Math.ceil(imgHeight / pdfHeight);
        
        for (let i = 0; i < totalPages; i++) {
            if (i > 0) pdf.addPage();
            
            const srcY = (canvas.height / totalPages) * i;
            const srcHeight = Math.min(canvas.height / totalPages, canvas.height - srcY);
            
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = srcHeight;
            
            const ctx = pageCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
                const pageImg = pageCanvas.toDataURL('image/png');
                const pageImgHeight = (srcHeight * pdfWidth) / canvas.width;
                pdf.addImage(pageImg, 'PNG', 0, 0, pdfWidth, pageImgHeight);
            }
        }
    }

    pdf.save(`Invoice-${props.invoiceId}.pdf`);
};
