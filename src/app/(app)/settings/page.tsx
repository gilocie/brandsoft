

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, Cog, CreditCard, SlidersHorizontal, Image as ImageIcon, FileImage, Layers, Stamp, Trash2, LayoutTemplate } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const settingsSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  font: z.string().optional(),
  defaultCurrency: z.string().min(1, "Default currency is required"),
  paymentDetails: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;


export default function SettingsPage() {
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: '',
      logo: '',
      primaryColor: '#9400D3',
      secondaryColor: '#D87093',
      font: 'Poppins',
      defaultCurrency: 'USD',
      paymentDetails: '',
    },
  });
  
  useEffect(() => {
    if (config) {
        form.reset({
            businessName: config.brand.businessName,
            logo: config.brand.logo,
            primaryColor: config.brand.primaryColor,
            secondaryColor: config.brand.secondaryColor,
            font: config.brand.font,
            defaultCurrency: config.profile.defaultCurrency,
            paymentDetails: config.profile.paymentDetails,
        });
        setLogoPreview(config.brand.logo);
    }
  }, [config, form]);
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        form.setValue('logo', dataUrl, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = (data: SettingsFormData) => {
    if (config) {
      const newConfig: BrandsoftConfig = {
        ...config,
        brand: {
          ...config.brand,
          businessName: data.businessName,
          logo: data.logo || '',
          primaryColor: data.primaryColor || '#9400D3',
          secondaryColor: data.secondaryColor || '#D87093',
          font: data.font || 'Poppins',
        },
        profile: {
          ...config.profile,
          defaultCurrency: data.defaultCurrency,
          paymentDetails: data.paymentDetails,
        },
      };
      saveConfig(newConfig);
      toast({
        title: "Settings Saved",
        description: "Your new settings have been applied.",
      });
    }
  };

  if (!config) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application-wide settings here.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="branding"><Paintbrush className="mr-2 h-4 w-4" />Branding</TabsTrigger>
                    <TabsTrigger value="general"><Cog className="mr-2 h-4 w-4" />General</TabsTrigger>
                    <TabsTrigger value="options"><SlidersHorizontal className="mr-2 h-4 w-4" />Modules</TabsTrigger>
                </TabsList>
                
                <TabsContent value="branding">
                    <Card>
                        <CardHeader>
                            <CardTitle>Brand Identity</CardTitle>
                            <CardDescription>Update your company's branding details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-4">
                                    <FormField control={form.control} name="businessName" render={({ field }) => (
                                        <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="logo" render={() => (
                                        <FormItem>
                                            <FormLabel>Logo</FormLabel>
                                            <FormControl>
                                                <div>
                                                    <Input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload}/>
                                                    <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} className="w-full">
                                                        <UploadCloud className="mr-2 h-4 w-4" /> Upload Logo
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="flex flex-col items-center justify-center space-y-2 rounded-md border border-dashed p-4 h-full">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={logoPreview || undefined} alt={config?.brand.businessName} />
                                        <AvatarFallback className="text-3xl">
                                            {config?.brand.businessName?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm text-muted-foreground">Logo Preview</p>
                                </div>
                            </div>
                            <FormField control={form.control} name="font" render={({ field }) => (
                                <FormItem><FormLabel>Font</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a font" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Poppins">Poppins</SelectItem>
                                        <SelectItem value="Belleza">Belleza</SelectItem>
                                        <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                                        <SelectItem value="Arial">Arial</SelectItem>
                                        <SelectItem value="Verdana">Verdana</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="primaryColor" render={({ field }) => (
                                <FormItem><FormLabel>Primary Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="secondaryColor" render={({ field }) => (
                                <FormItem><FormLabel>Accent Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Regional & Currency</CardTitle>
                            <CardDescription>Manage currency and default payment details for documents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="max-w-md space-y-4">
                                <FormField control={form.control} name="defaultCurrency" render={({ field }) => (
                                    <FormItem><FormLabel>Default Currency Code</FormLabel>
                                    <FormControl><Input placeholder="e.g. USD, MWK" {...field} /></FormControl>
                                    <FormDescription>Enter the 3-letter currency code for your documents.</FormDescription>
                                    <FormMessage /></FormItem>
                                )} />
                            </div>
                            <Separator />
                             <div className="space-y-4">
                               <FormField control={form.control} name="paymentDetails" render={({ field }) => (
                                    <FormItem><FormLabel>Default Payment Details</FormLabel>
                                    <FormControl><Textarea placeholder="Your bank details, mobile payment info, etc." {...field} className="min-h-[120px]" /></FormControl>
                                    <FormDescription>These are your default notes for new invoices and quotations. You can override them on each document.</FormDescription>
                                    <FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                

                <TabsContent value="options">
                     <Card>
                        <CardHeader>
                            <CardTitle>Module Options</CardTitle>
                            <CardDescription>Enable or disable specific application modules.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                                <p className="text-muted-foreground">Feature toggles will be available here soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <div className="flex justify-start pt-8">
                <Button type="submit">Save All Settings</Button>
            </div>
        </form>
      </Form>
    </div>
  );
}

    