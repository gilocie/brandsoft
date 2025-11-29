
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
import { useBrandsoft, type Customer } from '@/hooks/use-brandsoft.tsx';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

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
  price: z.coerce.number().min(0.01, 'Price must be at least 0.01.'),
});

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  invoiceDate: z.date(),
  dueDate: z.date(),
  status: z.enum(['Draft', 'Pending', 'Paid', 'Overdue']),
  currency: z.string().min(1, 'Currency is required'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required.'),
  notes: z.string().optional(),
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
  const { config, addCustomer } = useBrandsoft();
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState<boolean[]>([]);
  
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceDate: new Date(),
      status: 'Draft',
      currency: config?.profile.defaultCurrency || 'USD',
      lineItems: [{ description: '', quantity: 1, price: 0 }],
      notes: '',
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

  function onSubmit(data: InvoiceFormData) {
    console.log(data);
    // Here you would typically send the data to your backend or state management
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
    }
  }

  const watchedCurrency = form.watch('currency');
  const currencySymbol = currencySymbols[watchedCurrency] || '$';

  const subtotal = form.watch('lineItems').reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.price) || 0);
  }, 0);
  
  const tax = subtotal * 0.1; // Example 10% tax
  const total = subtotal + tax;

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                                    <Select onValueChange={(value) => { field.onChange(value); handleProductSelect(value, index); }}>
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
                            {currencySymbol}{((form.watch(`lineItems.${index}.quantity`) || 0) * (form.watch(`lineItems.${index}.price`) || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>

                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { append({ description: '', quantity: 1, price: 0 }); setUseManualEntry(prev => [...prev, true]); }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-2">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (10%)</span>
                        <span>{currencySymbol}{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{currencySymbol}{total.toFixed(2)}</span>
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
             <Button type="button" variant="outline"><Eye className="mr-2 h-4 w-4"/> Preview</Button>
            <Button type="submit" variant="secondary"><Save className="mr-2 h-4 w-4"/> Save Draft</Button>
            <Button type="submit"><Send className="mr-2 h-4 w-4"/> Save and Send</Button>
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
    </div>
  );
}
