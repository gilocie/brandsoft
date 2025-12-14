
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Send, Trash2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { SupplierPicker } from '@/components/supplier-picker';
import { Badge } from '@/components/ui/badge';
import { useFormState } from '@/hooks/use-form-state';
import { cn } from '@/lib/utils';

const requestItemSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

const formSchema = z.object({
  title: z.string().min(5, 'Request title is required'),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  companyIds: z.array(z.string()).optional(),
  items: z.array(requestItemSchema).min(1, 'At least one item is required.'),
  industries: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function RequestQuotationPage() {
  const { config, addQuotationRequest } = useBrandsoft();
  const { toast } = useToast();
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { setFormData, getFormData } = useFormState('newQuotationRequestData');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isPublic: true,
      items: [{ productName: '', description: '', quantity: 1 }],
      companyIds: [],
      industries: [],
    },
  });
  
  useEffect(() => {
    const storedData = getFormData();
    if (storedData && Object.keys(storedData).length > 0) {
        form.reset(storedData);
    }
  }, []);

  useEffect(() => {
    const subscription = form.watch((value) => {
        setFormData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, setFormData]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const isPublic = form.watch('isPublic');
  const selectedCompanyIds = form.watch('companyIds') || [];
  const selectedIndustries = form.watch('industries') || [];
  
  const industries = useMemo(() => {
    if (!config?.companies) return [];
    return [...new Set(config.companies.map(b => b.industry).filter((i): i is string => !!i))];
  }, [config?.companies]);


  const onSubmit = (data: FormData) => {
    if (!config?.profile.email) {
      toast({
        variant: 'destructive',
        title: 'Profile Incomplete',
        description: 'Please set your email in your profile before making requests.',
      });
      return;
    }
    
    let myId: string | undefined;
    const userBusinessName = (config?.brand?.businessName || "").toLowerCase();

    const myCompany = config?.companies?.find(c => (c.companyName || "").toLowerCase() === userBusinessName);
    if (myCompany) {
      myId = myCompany.id;
    }

    if (!myId) {
      const myCustomer = config?.customers?.find(c => (c.name || "").toLowerCase() === userBusinessName);
      if (myCustomer) {
        myId = myCustomer.id;
      }
    }
    
    if (!myId) {
        myId = 'CUST-DEMO-ME'; 
    }

    addQuotationRequest({
      id: `QR-${Date.now()}`,
      title: data.title,
      description: data.description,
      requesterId: myId,
      requesterName: config.brand.businessName,
      date: new Date().toISOString(),
      isPublic: data.isPublic,
      companyIds: data.companyIds,
      items: data.items,
      status: 'open',
      industries: data.industries,
    });
    
    setFormData(null); 

    toast({
      title: 'Quotation Request Sent!',
      description: 'Your request has been submitted.',
    });
    
    setTimeout(() => {
        router.push('/quotations?tab=requests&subtab=outgoing');
    }, 100);
  };
  
  const businesses = config?.companies?.filter(c => c.companyName !== config.brand.businessName) || [];
  
  const handlePickerSelect = (selectedIds: string[]) => {
    form.setValue('companyIds', selectedIds);
    setIsPickerOpen(false);
  };
  
  const removeCompany = (idToRemove: string) => {
    form.setValue('companyIds', selectedCompanyIds.filter(id => id !== idToRemove));
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Request a Quotation</h1>
        <p className="text-muted-foreground">
          Submit a request to one or more businesses in the marketplace.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Request Title</FormLabel><FormControl><Input placeholder="e.g., Office Supplies for Q3" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>General Description (Optional)</FormLabel><FormControl><Textarea placeholder="Provide more details about your overall needs..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Requested Items</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-[1fr_auto] gap-4 items-start border p-4 rounded-md">
                           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <FormField control={form.control} name={`items.${index}.productName`} render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel>Product/Service Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                <FormItem className="md:col-span-1"><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                           </div>
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="mt-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => append({ productName: '', description: '', quantity: 1 })}>
                       <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Visibility & Targeting</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <FormField control={form.control} name="isPublic" render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>Make Request Public</FormLabel>
                                <FormDescription>Allow any business on the marketplace to respond.</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />

                    {isPublic && (
                        <FormField
                            control={form.control}
                            name="industries"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Target Industries (Optional)</FormLabel>
                                <FormDescription>Help suppliers find your request by tagging relevant industries.</FormDescription>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" className={cn("w-full justify-start font-normal h-auto py-2", !field.value?.length && "text-muted-foreground")}>
                                            <div className="flex gap-2 flex-wrap">
                                            {field.value?.length ? field.value.map(industry => <Badge key={industry}>{industry}</Badge>) : 'Select industries'}
                                            </div>
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search industries..." />
                                        <CommandList>
                                        <CommandEmpty>No results found.</CommandEmpty>
                                        <CommandGroup>
                                            {industries.map(industry => (
                                                <CommandItem
                                                    key={industry}
                                                    onSelect={() => {
                                                        const currentValue = field.value || [];
                                                        const newValue = currentValue.includes(industry)
                                                        ? currentValue.filter(i => i !== industry)
                                                        : [...currentValue, industry];
                                                        field.onChange(newValue);
                                                    }}
                                                >
                                                    <Checkbox className="mr-2" checked={field.value?.includes(industry)} />
                                                    {industry}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        </CommandList>
                                    </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {!isPublic && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">Select Companies ({selectedCompanyIds.length})</h3>
                            {selectedCompanyIds.length > 0 && (
                                <div className="p-3 bg-muted rounded-md flex flex-wrap gap-2">
                                    {selectedCompanyIds.map(id => {
                                        const biz = businesses.find(b => b.id === id);
                                        return biz ? (
                                            <Badge key={id} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                                                {biz.companyName}
                                                <button type="button" onClick={() => removeCompany(id)} className="ml-1 rounded-full p-0.5 hover:bg-background">
                                                    <X className="h-3 w-3"/>
                                                </button>
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            )}

                             <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                                <DialogTrigger asChild>
                                     <Button variant="outline" className="w-full">
                                        <Search className="mr-2 h-4 w-4" />
                                        Select Suppliers from Marketplace
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>Select Suppliers</DialogTitle>
                                    </DialogHeader>
                                    <SupplierPicker
                                        allBusinesses={businesses}
                                        initialSelection={selectedCompanyIds}
                                        onSelectionChange={handlePickerSelect}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                 </CardContent>
            </Card>


            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/quotations">Cancel</Link>
                </Button>
                <Button type="submit">
                    <Send className="mr-2 h-4 w-4" /> Submit Request
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
