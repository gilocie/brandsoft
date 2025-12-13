
'use client';

import { useState } from 'react';
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
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
});

type FormData = z.infer<typeof formSchema>;

export default function RequestQuotationPage() {
  const { config, addQuotationRequest } = useBrandsoft();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isPublic: true,
      items: [{ productName: '', description: '', quantity: 1 }],
      companyIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const isPublic = form.watch('isPublic');

  const onSubmit = (data: FormData) => {
    if (!config?.profile.email) {
      toast({
        variant: 'destructive',
        title: 'Profile Incomplete',
        description: 'Please set your email in your profile before making requests.',
      });
      return;
    }
    
    addQuotationRequest({
        ...data,
        id: `QR-${Date.now()}`,
        requesterId: config.customers.find(c => c.name === config.brand.businessName)?.id || '',
        requesterName: config.brand.businessName,
        date: new Date().toISOString(),
        status: 'open',
    })

    toast({
      title: 'Quotation Request Sent!',
      description: 'Your request has been submitted.',
    });
    router.push('/quotations?tab=requests');
  };
  
  const businesses = config?.customers.filter(c => c.companyName && c.id !== config?.customers.find(me => me.name === config.brand.businessName)?.id) || [];

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
                                <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <CardTitle>Visibility</CardTitle>
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

                    {!isPublic && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">Select Companies</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {businesses.map(biz => (
                                    <FormField key={biz.id} control={form.control} name="companyIds" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(biz.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                        ? field.onChange([...(field.value || []), biz.id])
                                                        : field.onChange(field.value?.filter(id => id !== biz.id))
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">{biz.companyName}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                            {businesses.length === 0 && <p className="text-sm text-muted-foreground">No other businesses found in your customer list.</p>}
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
