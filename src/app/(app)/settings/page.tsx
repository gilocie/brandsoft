

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig } from '@/hooks/use-brandsoft.tsx';
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
import { UploadCloud, Paintbrush, Cog, CreditCard, SlidersHorizontal, Image as ImageIcon, FileImage, Layers, Stamp, Trash2 } from 'lucide-react';
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
  brandsoftFooter: z.boolean().default(true),
  paymentDetails: z.string().optional(),
  headerImage: z.string().optional(),
  footerImage: z.string().optional(),
  backgroundImage: z.string().optional(),
  watermarkImage: z.string().optional(),
  footerContent: z.string().optional(),
  invoicePrefix: z.string().optional(),
  invoiceStartNumber: z.coerce.number().min(1, "Starting number must be at least 1").optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const ImageUploader = ({ form, fieldName, previewState, setPreviewState, label, description, aspect }: { form: any, fieldName: keyof SettingsFormData, previewState: string | null, setPreviewState: (url: string | null) => void, label: string, description: string, aspect: 'wide' | 'normal' }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setPreviewState(dataUrl);
                form.setValue(fieldName, dataUrl, { shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleDeleteImage = () => {
        setPreviewState(null);
        form.setValue(fieldName, '', { shouldDirty: true });
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className={`relative flex flex-col items-center justify-center space-y-2 rounded-md border border-dashed p-4 w-full ${aspect === 'wide' ? 'h-24' : 'h-48'}`}>
                {previewState ? (
                    <>
                        <img src={previewState} alt={`${label} preview`} className="max-h-full max-w-full object-contain"/>
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleDeleteImage}>
                           <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">No {label.toLowerCase()} uploaded</p>
                )}
            </div>
            <FormField control={form.control} name={fieldName} render={() => (
                <FormItem>
                    <FormControl>
                        <div>
                            <Input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={handleImageChange} />
                            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="w-full">
                                <UploadCloud className="mr-2 h-4 w-4" /> Upload {label}
                            </Button>
                        </div>
                    </FormControl>
                     <FormDescription>{description}</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
    );
};

export default function SettingsPage() {
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [footerPreview, setFooterPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);

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
      brandsoftFooter: true,
      paymentDetails: '',
      headerImage: '',
      footerImage: '',
      backgroundImage: '',
      watermarkImage: '',
      footerContent: '',
      invoicePrefix: 'INV-',
      invoiceStartNumber: 1,
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
            brandsoftFooter: config.brand.brandsoftFooter,
            paymentDetails: config.profile.paymentDetails || '',
            headerImage: config.brand.headerImage || '',
            footerImage: config.brand.footerImage || '',
            backgroundImage: config.brand.backgroundImage || '',
            watermarkImage: config.brand.watermarkImage || '',
            footerContent: config.brand.footerContent || '',
            invoicePrefix: config.profile.invoicePrefix || 'INV-',
            invoiceStartNumber: config.profile.invoiceStartNumber || 1,
        });
        setLogoPreview(config.brand.logo);
        setHeaderPreview(config.brand.headerImage || null);
        setFooterPreview(config.brand.footerImage || null);
        setBackgroundPreview(config.brand.backgroundImage || null);
        setWatermarkPreview(config.brand.watermarkImage || null);
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
          brandsoftFooter: data.brandsoftFooter,
          headerImage: data.headerImage || '',
          footerImage: data.footerImage || '',
          backgroundImage: data.backgroundImage || '',
          watermarkImage: data.watermarkImage || '',
          footerContent: data.footerContent || '',
        },
        profile: {
          ...config.profile,
          defaultCurrency: data.defaultCurrency,
          paymentDetails: data.paymentDetails || '',
          invoicePrefix: data.invoicePrefix,
          invoiceStartNumber: data.invoiceStartNumber,
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
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="branding"><Paintbrush className="mr-2 h-4 w-4" />Branding</TabsTrigger>
                    <TabsTrigger value="general"><Cog className="mr-2 h-4 w-4" />General</TabsTrigger>
                    <TabsTrigger value="payments"><CreditCard className="mr-2 h-4 w-4" />Payments</TabsTrigger>
                    <TabsTrigger value="options"><SlidersHorizontal className="mr-2 h-4 w-4" />Options</TabsTrigger>
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
                     <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Letterhead & Document Images</CardTitle>
                            <CardDescription>Customize headers, footers, and backgrounds for your documents.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="header" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="header"><ImageIcon className="mr-2 h-4 w-4" />Header</TabsTrigger>
                                    <TabsTrigger value="footer"><FileImage className="mr-2 h-4 w-4" />Footer</TabsTrigger>
                                    <TabsTrigger value="background"><Layers className="mr-2 h-4 w-4" />Background</TabsTrigger>
                                    <TabsTrigger value="watermark"><Stamp className="mr-2 h-4 w-4" />Watermark</TabsTrigger>
                                </TabsList>
                                <TabsContent value="header" className="pt-4">
                                     <ImageUploader 
                                        form={form}
                                        fieldName="headerImage"
                                        previewState={headerPreview}
                                        setPreviewState={setHeaderPreview}
                                        label="Header Image"
                                        description="Recommended: 2480x70px PNG/JPG for A4 headers."
                                        aspect='wide'
                                     />
                                </TabsContent>
                                <TabsContent value="footer" className="pt-4">
                                      <ImageUploader 
                                        form={form}
                                        fieldName="footerImage"
                                        previewState={footerPreview}
                                        setPreviewState={setFooterPreview}
                                        label="Footer Image"
                                        description="Recommended: 2480x70px PNG/JPG for A4 footers."
                                        aspect='wide'
                                     />
                                </TabsContent>
                                <TabsContent value="background" className="pt-4">
                                     <ImageUploader 
                                        form={form}
                                        fieldName="backgroundImage"
                                        previewState={backgroundPreview}
                                        setPreviewState={setBackgroundPreview}
                                        label="Background Image"
                                        description="Recommended: A4 aspect ratio (e.g., 2480x3508px). Use a subtle design."
                                        aspect='normal'
                                     />
                                </TabsContent>
                                <TabsContent value="watermark" className="pt-4">
                                     <ImageUploader 
                                        form={form}
                                        fieldName="watermarkImage"
                                        previewState={watermarkPreview}
                                        setPreviewState={setWatermarkPreview}
                                        label="Watermark Image"
                                        description="A semi-transparent PNG image works best."
                                        aspect='normal'
                                     />
                                </TabsContent>
                            </Tabs>
                            <Separator className="my-6" />
                            <FormField control={form.control} name="footerContent" render={({ field }) => (
                                <FormItem><FormLabel>Custom Footer Text</FormLabel>
                                <FormControl><Textarea placeholder="e.g., Thank you for your business!" {...field} rows={3} /></FormControl>
                                <FormDescription>This text appears above the footer image or at the bottom of the page.</FormDescription>
                                <FormMessage /></FormItem>
                            )} />
                            <Separator className="my-6" />
                            <FormField control={form.control} name="brandsoftFooter" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Enable BrandSoft Footer</FormLabel>
                                        <FormDescription>Show "Created by BrandSoft" on your documents. This appears below all other footer content.</FormDescription>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Regional & Currency</CardTitle>
                            <CardDescription>Manage currency and regional formats.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-md space-y-4">
                                <FormField control={form.control} name="defaultCurrency" render={({ field }) => (
                                    <FormItem><FormLabel>Default Currency Code</FormLabel>
                                    <FormControl><Input placeholder="e.g. USD, MWK" {...field} /></FormControl>
                                    <FormDescription>Enter the 3-letter currency code for your documents.</FormDescription>
                                    <FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Document Numbering</CardTitle>
                            <CardDescription>Set prefixes and starting numbers for your documents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="invoicePrefix" render={({ field }) => (
                                    <FormItem><FormLabel>Invoice Prefix</FormLabel>
                                    <FormControl><Input placeholder="INV-" {...field} /></FormControl>
                                    <FormMessage /></FormItem>
                                )} />
                                    <FormField control={form.control} name="invoiceStartNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Next Invoice Number</FormLabel>
                                    <FormControl><Input type="number" placeholder="101" {...field} /></FormControl>
                                    <FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="payments">
                     <Card>
                        <CardHeader>
                            <CardTitle>Payment Settings</CardTitle>
                            <CardDescription>Configure how you get paid.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField control={form.control} name="paymentDetails" render={({ field }) => (
                                <FormItem><FormLabel>Payment Instructions</FormLabel>
                                <FormControl><Textarea placeholder="e.g., Bank Name, Account Number, PayPal email, etc." {...field} rows={4} /></FormControl>
                                <FormDescription>This will appear on your invoices.</FormDescription>
                                <FormMessage /></FormItem>
                            )} />
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


    