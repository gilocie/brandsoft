
'use client';

import { BrandsoftConfig, Customer, Invoice, InvoiceLineItem } from '@/hooks/use-brandsoft.tsx';
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface InvoicePreviewProps {
    config: BrandsoftConfig | null;
    customer: Customer | null;
    invoiceData: Partial<Invoice> & {
        lineItems?: InvoiceLineItem[],
        currency?: string;
        invoiceDate?: Date;
        dueDate?: Date;
    };
    invoiceId?: string;
}

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: '$',
  AUD: '$',
};

const statusColors = {
  Paid: 'bg-green-500 text-white',
  Pending: 'bg-yellow-500 text-white',
  Overdue: 'bg-red-500 text-white',
  Draft: 'bg-gray-400 text-white',
  Canceled: 'bg-neutral-500 text-white',
};

export function InvoicePreview({ config, customer, invoiceData, invoiceId }: InvoicePreviewProps) {

    if (!config || !customer || !invoiceData) {
        return (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
                Please fill out all required fields to see the preview.
            </div>
        );
    }
    
    const currencySymbol = currencySymbols[invoiceData.currency || config.profile.defaultCurrency] || (invoiceData.currency || config.profile.defaultCurrency);
    const formatCurrency = (value: number) => `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const subtotal = invoiceData.lineItems?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
    
    let discountAmount = 0;
    if ('applyDiscount' in invoiceData && invoiceData.applyDiscount && 'discountValue' in invoiceData && invoiceData.discountValue) {
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
    if ('applyTax' in invoiceData && invoiceData.applyTax && 'taxValue' in invoiceData && invoiceData.taxValue) {
        if (invoiceData.taxType === 'percentage') {
            taxAmount = subtotalAfterDiscount * (invoiceData.taxValue / 100);
        } else {
            taxAmount = invoiceData.taxValue;
        }
    } else if (invoiceData.tax) {
      taxAmount = invoiceData.tax;
    }

    let shippingAmount = 0;
    if ('applyShipping' in invoiceData && invoiceData.applyShipping && 'shippingValue' in invoiceData && invoiceData.shippingValue) {
      shippingAmount = invoiceData.shippingValue;
    } else if (invoiceData.shipping) {
      shippingAmount = invoiceData.shipping;
    }

    const total = subtotalAfterDiscount + taxAmount + shippingAmount;

    return (
        <div className="bg-gray-100 p-4 sm:p-8 rounded-lg">
            <div className="w-full max-w-[8.5in] min-h-[11in] mx-auto bg-white shadow-lg p-8 sm:p-12 relative">
                
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <span className={cn(
                        "text-7xl sm:text-9xl font-black uppercase transform -rotate-45 opacity-10",
                        statusColors[invoiceData.status || 'Draft']
                    )}>
                        {invoiceData.status}
                    </span>
                </div>
                
                {/* Header */}
                <header className="relative z-10 flex justify-between items-start pb-8 border-b-2">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                            <AvatarImage src={config.brand.logo} alt={config.brand.businessName} />
                            <AvatarFallback>{config.brand.businessName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold" style={{color: config.brand.primaryColor}}>{config.brand.businessName}</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">{config.profile.address}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{config.profile.email} | {config.profile.phone}</p>
                            {config.profile.website && <p className="text-xs sm:text-sm text-muted-foreground">{config.profile.website}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 uppercase">Invoice</h2>
                        <p className="text-sm text-gray-500">{invoiceId || `INV-XXXX`}</p>
                    </div>
                </header>

                {/* Bill To & Dates */}
                <section className="relative z-10 grid sm:grid-cols-2 gap-8 mt-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Bill To</h3>
                        <p className="font-bold text-lg">{customer.name}</p>
                        <p className="text-muted-foreground">{customer.email}</p>
                        {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                        {customer.address && <p className="text-muted-foreground">{customer.address}</p>}
                    </div>
                    <div className="text-left sm:text-right">
                         <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                            <div className="sm:mb-2">
                                <p className="text-sm font-semibold text-gray-500 uppercase">Invoice Date</p>
                                <p className="font-medium">{format(invoiceData.invoiceDate || new Date(), 'PPP')}</p>
                            </div>
                             <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase">Due Date</p>
                                <p className="font-medium">{format(invoiceData.dueDate || new Date(), 'PPP')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Line Items Table */}
                <section className="relative z-10 mt-8">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-100">
                                <TableHead className="w-1/2">Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoiceData.lineItems?.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.quantity * item.price)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>

                {/* Totals */}
                <section className="relative z-10 mt-8 flex justify-end">
                    <div className="w-full max-w-sm space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                         {discountAmount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount</span>
                                <span className="font-medium">- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        {taxAmount > 0 && (
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">{invoiceData.taxName || 'Tax'}</span>
                                <span className="font-medium">{formatCurrency(taxAmount)}</span>
                            </div>
                        )}
                         {shippingAmount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="font-medium">{formatCurrency(shippingAmount)}</span>
                            </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg" style={{color: config.brand.primaryColor}}>
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </section>
                
                {/* Notes */}
                {invoiceData.notes && (
                    <section className="relative z-10 mt-8">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Notes</h3>
                        <p className="text-muted-foreground text-sm mt-2">{invoiceData.notes}</p>
                    </section>
                )}


                {/* Footer */}
                <footer className="absolute bottom-8 left-8 right-8 z-10 text-center text-xs text-gray-400">
                    {config.brand.brandsoftFooter && <p>Created by BrandSoft</p>}
                </footer>
            </div>
        </div>
    );
}

