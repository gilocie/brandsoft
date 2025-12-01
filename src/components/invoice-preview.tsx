

'use client';

import { BrandsoftConfig, Customer, Invoice } from '@/hooks/use-brandsoft.tsx';
import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';

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


interface InvoicePreviewProps {
    config: BrandsoftConfig | null;
    customer: Customer | null;
    invoiceData: InvoiceData;
    invoiceId?: string;
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
            "text-[8rem] font-black tracking-widest leading-none transform -rotate-15 select-none",
            colorClass
        )}>
            {text}
        </div>
    );
};


export function InvoicePreview({ config, customer, invoiceData, invoiceId }: InvoicePreviewProps) {

    if (!config || !customer || !invoiceData) {
        return (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
                Please fill out all required fields to see the preview.
            </div>
        );
    }
    
    const currencyCode = invoiceData.currency || config.profile.defaultCurrency;
    const formatCurrency = (value: number) => `${currencyCode}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const subtotal = invoiceData.lineItems?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
    
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
    if (invoiceData.applyTax && invoiceData.taxValue) {
        if (invoiceData.taxType === 'percentage') {
            taxAmount = subtotalAfterDiscount * (invoiceData.taxValue / 100);
        } else {
            taxAmount = invoiceData.taxValue;
        }
    } else if (invoiceData.tax) {
      taxAmount = invoiceData.tax;
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

    return (
        <div className="bg-gray-100 p-4 sm:p-8 rounded-lg">
            <div className="w-full max-w-[8.5in] min-h-[11in] mx-auto bg-white shadow-lg p-8 sm:p-12 relative font-sans">
                
                 {invoiceData.status && <InvoiceStatusWatermark status={invoiceData.status} />}

                {config.brand.letterheadImage ? (
                    <div className="absolute top-0 left-0 right-0 h-40">
                         <img src={config.brand.letterheadImage} className="w-full h-full object-cover" alt="Letterhead"/>
                    </div>
                ) : (
                    <div className="absolute top-0 left-0 right-0 h-10" style={{backgroundColor: config.brand.primaryColor}}></div>
                )}
                
                {/* Header */}
                <header className="relative z-10 flex justify-between items-start mb-12 pt-10">
                    <div className="flex items-center gap-4">
                        {config.brand.logo && (
                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                                <AvatarImage src={config.brand.logo} alt={config.brand.businessName} />
                                <AvatarFallback>{config.brand.businessName.charAt(0)}</AvatarFallback>
                            </Avatar>
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
                <section className="relative z-10 grid sm:grid-cols-2 gap-8 mt-8 mb-12">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Bill To</h3>
                        <p className="font-bold text-lg">{customer.companyName || customer.name}</p>
                        {customer.companyName && <p className="text-gray-600">{customer.name}</p>}
                        <p className="text-gray-600">{customer.address}</p>
                        <p className="text-gray-600">{customer.email}</p>
                    </div>
                    <div className="text-left sm:text-right">
                         <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                           <div className="space-y-1 sm:mb-2">
                                <p className="text-sm font-semibold text-gray-500">INVOICE #</p>
                                <p className="font-medium">{invoiceId || `${config.profile.invoicePrefix || 'INV-'}${String(config.profile.invoiceStartNumber || 1).padStart(3, '0')}`}</p>
                            </div>
                            <div className="space-y-1 sm:mb-2">
                                <p className="text-sm font-semibold text-gray-500">DATE</p>
                                <p className="font-medium">{format(invoiceDate || new Date(), 'MM/dd/yy')}</p>
                            </div>
                             <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-500">INVOICE DUE DATE</p>
                                <p className="font-medium">{format(dueDate || new Date(), 'MM/dd/yy')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Line Items Table */}
                <section className="relative z-10 mt-8">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-transparent border-b-2 border-black">
                                <TableHead className="w-1/2 text-black font-bold uppercase tracking-wider">Items</TableHead>
                                <TableHead className="text-right text-black font-bold uppercase tracking-wider">Quantity</TableHead>
                                <TableHead className="text-right text-black font-bold uppercase tracking-wider">Price</TableHead>
                                <TableHead className="text-right text-black font-bold uppercase tracking-wider">Tax</TableHead>
                                <TableHead className="text-right text-black font-bold uppercase tracking-wider">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoiceData.lineItems?.map((item, index) => (
                                <TableRow key={index} className="border-b border-gray-300">
                                    <TableCell className="font-medium py-3">{item.description}</TableCell>
                                    <TableCell className="text-right py-3">{item.quantity}</TableCell>
                                    <TableCell className="text-right py-3">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right py-3">
                                       { (invoiceData.applyTax && invoiceData.taxValue) ?
                                           (invoiceData.taxType === 'percentage' ? `${invoiceData.taxValue}%` : formatCurrency(invoiceData.taxValue))
                                         : '0%'
                                       }
                                    </TableCell>
                                    <TableCell className="text-right py-3">{formatCurrency(item.quantity * item.price)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>

                {/* Totals & Notes */}
                <section className="relative z-10 mt-8 grid grid-cols-2 gap-8 items-start">
                    <div className="text-sm">
                        {invoiceData.notes && (
                             <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notes</h3>
                                <p className="text-gray-600 mt-1">{invoiceData.notes}</p>
                            </div>
                        )}
                         {config.profile.paymentDetails && (
                             <div className="mt-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Payment Details</h3>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{config.profile.paymentDetails}</p>
                            </div>
                        )}
                    </div>
                    <div className="w-full space-y-2 text-sm text-right">
                         <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                         {discountAmount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Discount</span>
                                <span className="font-medium">- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        {taxAmount > 0 && (
                             <div className="flex justify-between">
                                <span className="text-gray-600">{invoiceData.taxName || 'Tax'}</span>
                                <span className="font-medium">{formatCurrency(taxAmount)}</span>
                            </div>
                        )}
                         {shippingAmount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium">{formatCurrency(shippingAmount)}</span>
                            </div>
                        )}
                        <div className="pt-2">
                           <div className="flex justify-between font-bold text-xl py-2 px-4 rounded" style={{backgroundColor: config.brand.primaryColor, color: '#fff'}}>
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </section>
                

                {/* Footer */}
                <footer className="absolute bottom-8 left-8 right-8 z-10 text-center text-xs text-gray-400">
                    {config.brand.footerContent && <p className="mb-1">{config.brand.footerContent}</p>}
                    {config.brand.brandsoftFooter && <p>Created by BrandSoft</p>}
                </footer>
            </div>
        </div>
    );
}
