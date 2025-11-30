

'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, Trash2, Save, Send, Eye, UserPlus } from 'lucide-react';
import { format } from "date-fns";
import Link from 'next/link';
import { useBrandsoft, type Customer, type Invoice, type Product } from '@/hooks/use-brandsoft.tsx';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InvoicePreview } from '@/components/invoice-preview';

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: '$',
  AUD: '$',
};

const lineItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be at least 0.01.'),
  price: z.coerce.number().min(0, 'Price must be non-negative.'),
});

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  invoiceDate: z.date(),
  dueDate: z.date(),
  status: z.enum(['Draft', 'Pending', 'Paid', 'Overdue', 'Canceled']),
  currency: z.string().min(1, 'Currency is required'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required.'),
  notes: z.string().optional(),
  applyTax: z.boolean().default(false),
  taxName: z.string().optional(),
  taxType: z.enum(['percentage', 'flat']).default('percentage'),
  taxValue: z.coerce.number().optional(),
  applyShipping: z.boolean().default(false),
  shippingValue: z.coerce.number().optional(),
  applyDiscount: z.boolean().default(false),
  discountType: z.enum(['percentage', 'flat']).default('percentage'),
  discountValue: z.coerce.number().optional(),
});

type InvoiceFormData = z.infer<typeof formSchema>;

const NewCustomerFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
});
type NewCustomerFormData = z.infer<typeof NewCustomerFormSchema>;

export default function NewInvoicePage() {
  const { config, addCustomer, addInvoice } = useBrandsoft();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState<boolean[]>([true]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      status: 'Draft',
      currency: config?.profile.defaultCurrency || 'USD',
      lineItems: [{ description: '', quantity: 1, price: 0 }],
      notes: '',
      applyTax: false,
      taxName: config?.profile.taxNumber ? 'Tax' : '',
      taxType: 'percentage',
      taxValue: 10,
      applyShipping: false,
      shippingValue: 0,
      applyDiscount: false,
      discountType: 'percentage',
      discountValue: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const newCustomerForm = useForm<NewCustomerFormData>({
    resolver: zodResolver(NewCustomerFormSchema),
    defaultValues: { name: "", email: "", phone: "", address: "" },
  });

  function onAddNewCustomer(data: NewCustomerFormData) {
    const newCustomer = addCustomer(data);
    form.setValue('customerId', newCustomer.id, { shouldValidate: true });
    setIsAddCustomerOpen(false);
    newCustomerForm.reset();
  }

  const handleFormSubmit = (status: 'Draft' | 'Pending') => {
    form.setValue('status', status);
    form.handleSubmit(onSubmit)();
  }

  function onSubmit(data: InvoiceFormData) {
    if (!config) return;

    const customer = config.customers.find(c => c.id === data.customerId);
    if (!customer) return;
    
    const subtotal = data.lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    let discountAmount = 0;
    if (data.applyDiscount && data.discountValue) {
        if (data.discountType === 'percentage') {
            discountAmount = subtotal * (data.discountValue / 100);
        } else {
            discountAmount = data.discountValue;
        }
    }
    const subtotalAfterDiscount = subtotal - discountAmount;
    
    let taxAmount = 0;
    if (data.applyTax && data.taxValue) {
        if (data.taxType === 'percentage') {
            taxAmount = subtotalAfterDiscount * (data.taxValue / 100);
        } else {
            taxAmount = data.taxValue;
        }
    }
    
    const shipping = data.applyShipping && data.shippingValue ? data.shippingValue : 0;
    const total = subtotalAfterDiscount + taxAmount + shipping;

    const newInvoice: Omit<Invoice, 'invoiceId'> = {
        customer: customer.name,
        date: format(data.invoiceDate, 'yyyy-MM-dd'),
        dueDate: format(data.dueDate, 'yyyy-MM-dd'),
        amount: total,
        status: data.status,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        shipping,
        notes: data.notes,
        lineItems: data.lineItems,
    };
    
    const savedInvoice = addInvoice(newInvoice);
    
    toast({
        title: "Invoice Saved!",
        description: `Invoice ${savedInvoice.invoiceId} for ${customer.name} has been saved as a ${data.status.toLowerCase()}.`
    });

    router.push('/invoices');
  }
  
  const handleProductSelect = (productId: string, index: number) => {
    const product = config?.products.find(p => p.id === productId);
    if (product) {
      update(index, {
        productId: product.id,
        description: product.name,
        price: product.price,
        quantity: 1,
      });
      setUseManualEntry(prev => {
        const next = [...prev];
        next[index] = false; 
        return next;
      });
    }
  }

  const watchedValues = form.watch();
  const currencySymbol = config ? (currencySymbols[watchedValues.currency] || watchedValues.currency) : '$';
  
  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const subtotal = watchedValues.lineItems ? watchedValues.lineItems.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.price) || 0);
  }, 0) : 0;
  
  let discountAmount = 0;
  if (watchedValues.applyDiscount && watchedValues.discountValue) {
      if (watchedValues.discountType === 'percentage') {
          discountAmount = subtotal * (watchedValues.discountValue / 100);
      } else {
          discountAmount = watchedValues.discountValue;
      }
  }

  const subtotalAfterDiscount = subtotal - discountAmount;
  
  let taxAmount = 0;
  if (watchedValues.applyTax && watchedValues.taxValue) {
      if (watchedValues.taxType === 'percentage') {
          taxAmount = subtotalAfterDiscount * (watchedValues.taxValue / 100);
      } else {
          taxAmount = watchedValues.taxValue;
      }
  }

  const shippingAmount = watchedValues.applyShipping && watchedValues.shippingValue ? Number(watchedValues.shippingValue) : 0;
  const total = subtotalAfterDiscount + taxAmount + shippingAmount;

  const handlePreview = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setIsPreviewOpen(true);
    } else {
      toast({
        title: "Incomplete Form",
        description: "Please fill out all required fields before previewing.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">New Invoice</h1>
            <p className="text-muted-foreground">Fill in the details below to create a new invoice.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/invoices">Cancel</Link>
          </Button>
       </div>
      <Form {...form}>
        <form onSubmit={e => e.preventDefault()} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {config?.customers?.map((c: Customer) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setIsAddCustomerOpen(true)}>
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
             <CardContent className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Overdue">Overdue</SelectItem>
                          <SelectItem value="Canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
             <CardContent>
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-2 border rounded-md space-y-2">
                       <div className="flex gap-4 items-start">
                         <div className="flex-grow space-y-2">
                           <div className="flex items-center space-x-2">
                              <Switch id={`manual-entry-${index}`} checked={useManualEntry[index]} onCheckedChange={(checked) => setUseManualEntry(prev => { const next = [...prev]; next[index] = checked; return next; })} />
                              <Label htmlFor={`manual-entry-${index}`}>Enter Manually</Label>
                           </div>

                          {useManualEntry[index] ? (
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only">Description</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Item or service description" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : (
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.productId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only">Product</FormLabel>
                                    <Select onValueChange={(value) => { field.onChange(value); handleProductSelect(value, index); }} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a product" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {config?.products?.map(p => (
                                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                         </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mt-6"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Qty</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="100.00" {...field} disabled={!useManualEntry[index]}/>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        <div className="text-right font-medium">
                          <FormLabel>Total</FormLabel>
                          <p className="h-10 flex items-center justify-end pr-3">
                            {formatCurrency(((form.watch(`lineItems.${index}.quantity`) || 0) * (form.watch(`lineItems.${index}.price`) || 0)))}
                          </p>
                        </div>
                      </div>

                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { append({ productId: '', description: '', quantity: 1, price: 0 }); setUseManualEntry(prev => [...prev, true]); }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-2">
                <div className="w-full max-w-sm space-y-2 self-end">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>

                    <Separator />
                    
                    {/* Discount Section */}
                    <FormField
                        control={form.control}
                        name="applyDiscount"
                        render={({ field }) => (
                            <FormItem className="flex justify-between items-center">
                                <FormLabel htmlFor="apply-discount-switch">Apply Discount</FormLabel>
                                <FormControl>
                                  <Switch
                                    id="apply-discount-switch"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                    {watchedValues.applyDiscount && (
                        <div className="pl-4 space-y-4 pt-2 pb-2">
                           <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="discountType" render={({ field }) => (
                                    <FormItem><FormLabel>Discount Type</FormLabel><FormControl>
                                        <ToggleGroup type="single" value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 border rounded-md h-10">
                                            <ToggleGroupItem value="percentage" className="h-full rounded-l-md rounded-r-none text-xs">Percentage</ToggleGroupItem>
                                            <ToggleGroupItem value="flat" className="h-full rounded-r-md rounded-l-none text-xs">Flat</ToggleGroupItem>
                                        </ToggleGroup>
                                    </FormControl></FormItem>
                                )} />
                               <FormField control={form.control} name="discountValue" render={({ field }) => (
                                    <FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" placeholder={watchedValues.discountType === 'percentage' ? '10' : '50'} {...field} /></FormControl></FormItem>
                                )} />
                           </div>
                           <div className="flex justify-between text-muted-foreground">
                             <span>Discount</span>
                             <span>- {formatCurrency(discountAmount)}</span>
                           </div>
                        </div>
                    )}
                    
                    <Separator />

                    {/* Tax Section */}
                    <FormField
                        control={form.control}
                        name="applyTax"
                        render={({ field }) => (
                            <FormItem className="flex justify-between items-center">
                                <FormLabel htmlFor="apply-tax-switch">Apply Tax</FormLabel>
                                <FormControl>
                                  <Switch
                                    id="apply-tax-switch"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                    {watchedValues.applyTax && (
                        <div className="pl-4 space-y-4 pt-2 pb-2">
                           <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="taxName" render={({ field }) => (
                                    <FormItem><FormLabel>Tax Name</FormLabel><FormControl><Input placeholder="e.g. VAT" {...field} /></FormControl></FormItem>
                                )} />
                               <FormField control={form.control} name="taxType" render={({ field }) => (
                                    <FormItem><FormLabel>Rate Type</FormLabel><FormControl>
                                        <ToggleGroup type="single" value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 border rounded-md h-10">
                                            <ToggleGroupItem value="percentage" className="h-full rounded-l-md rounded-r-none text-xs">Percentage</ToggleGroupItem>
                                            <ToggleGroupItem value="flat" className="h-full rounded-r-md rounded-l-none text-xs">Flat</ToggleGroupItem>
                                        </ToggleGroup>
                                    </FormControl></FormItem>
                                )} />
                           </div>
                           <FormField control={form.control} name="taxValue" render={({ field }) => (
                                <FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" placeholder={watchedValues.taxType === 'percentage' ? '16' : '100'} {...field} /></FormControl></FormItem>
                            )} />
                           <div className="flex justify-between text-muted-foreground">
                             <span>{watchedValues.taxName || 'Tax'}</span>
                             <span>{formatCurrency(taxAmount)}</span>
                           </div>
                        </div>
                    )}
                    
                    <Separator />

                    {/* Shipping Section */}
                    <FormField
                        control={form.control}
                        name="applyShipping"
                        render={({ field }) => (
                            <FormItem className="flex justify-between items-center">
                                <FormLabel htmlFor="apply-shipping-switch">Add Shipping</FormLabel>
                                <FormControl>
                                  <Switch
                                    id="apply-shipping-switch"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                    {watchedValues.applyShipping && (
                         <div className="pl-4 space-y-2 pt-2 pb-2">
                           <FormField control={form.control} name="shippingValue" render={({ field }) => (
                                <FormItem><FormLabel>Shipping Cost</FormLabel><FormControl><Input type="number" placeholder="5.00" {...field} /></FormControl></FormItem>
                            )} />
                            <div className="flex justify-between text-muted-foreground">
                                <span>Shipping</span>
                                <span>{formatCurrency(shippingAmount)}</span>
                            </div>
                        </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-bold text-lg pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>
            </CardFooter>
          </Card>
          
          <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                   <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Add any additional notes, terms, or payment instructions here." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
             <Button type="button" variant="outline" onClick={handlePreview}><Eye className="mr-2 h-4 w-4"/> Preview</Button>
            <Button type="button" variant="secondary" onClick={() => handleFormSubmit('Draft')}><Save className="mr-2 h-4 w-4"/> Save Draft</Button>
            <Button type="button" onClick={() => handleFormSubmit('Pending')}><Send className="mr-2 h-4 w-4"/> Save and Send</Button>
          </div>
        </form>
      </Form>
      
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter the details for the new customer.</DialogDescription>
          </DialogHeader>
          <Form {...newCustomerForm}>
            <form onSubmit={newCustomerForm.handleSubmit(onAddNewCustomer)} className="space-y-4">
              <FormField control={newCustomerForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={newCustomerForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={newCustomerForm.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={newCustomerForm.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>Cancel</Button>
                <Button type="submit">Save Customer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-y-auto">
            <InvoicePreview
                config={config}
                customer={config?.customers.find(c => c.id === watchedValues.customerId) || null}
                invoiceData={watchedValues}
            />
          </div>
          <DialogFooter>
             <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
