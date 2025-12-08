
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type DesignSettings, type Quotation, type Invoice } from '@/hooks/use-brandsoft.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, Layers, Trash2, ArrowLeft, Loader2, PanelLeft, Settings2, Hash, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFormState } from '@/hooks/use-form-state';
import { InvoicePreview } from '@/components/invoice-preview';
import { QuotationPreview } from '@/components/quotation-preview';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';


const designSettingsSchema = z.object({
  logo: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  headerImage: z.string().optional(),
  headerImageOpacity: z.number().min(0).max(1).optional(),
  footerImage: z.string().optional(),
  footerImageOpacity: z.number().min(0).max(1).optional(),
  backgroundImage: z.string().optional(),
  backgroundImageOpacity: z.number().min(0).max(1).optional(),
  watermarkText: z.string().optional(),
  watermarkColor: z.string().optional(),
  watermarkOpacity: z.number().min(0).max(1).optional(),
  watermarkFontSize: z.number().min(12).max(200).optional(),
  watermarkAngle: z.number().min(-90).max(90).optional(),
  headerColor: z.string().optional(),
  footerColor: z.string().optional(),
  // Visibility
  showLogo: z.boolean().optional(),
  showBusinessAddress: z.boolean().optional(),
  showInvoiceTitle: z.boolean().optional(),
  showBillingAddress: z.boolean().optional(),
  showDates: z.boolean().optional(),
  showPaymentDetails: z.boolean().optional(),
  showNotes: z.boolean().optional(),
  showBrandsoftFooter: z.boolean().optional(),
  // Numbering
  invoicePrefix: z.string().optional(),
  invoiceStartNumber: z.coerce.number().optional(),
});


type DesignSettingsFormData = z.infer<typeof designSettingsSchema>;

const ImageUploader = ({
    form,
    fieldName,
    opacityFieldName,
    label,
    aspect
}: {
    form: any,
    fieldName: keyof DesignSettingsFormData,
    opacityFieldName?: keyof DesignSettingsFormData,
    label: string,
    aspect: 'wide' | 'normal'
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const fieldValue = useWatch({ control: form.control, name: fieldName });
    const opacityValue = opacityFieldName ? useWatch({ control: form.control, name: opacityFieldName }) : 1;

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                form.setValue(fieldName, dataUrl, { shouldDirty: true, shouldValidate: true });
                 if (opacityFieldName && form.getValues(opacityFieldName) === undefined) {
                    form.setValue(opacityFieldName, 1, { shouldDirty: true });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteImage = () => {
        form.setValue(fieldName, '', { shouldDirty: true, shouldValidate: true });
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <div className={`relative flex flex-col items-center justify-center space-y-2 rounded-md border border-dashed p-2 w-full ${aspect === 'wide' ? 'h-16' : 'h-32'}`}>
                {fieldValue ? (
                    <>
                        <img src={fieldValue} alt={`${label} preview`} className="max-h-full max-w-full object-contain" style={{ opacity: opacityValue ?? 1 }} />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={handleDeleteImage}>
                           <Trash2 className="h-3 w-3" />
                        </Button>
                    </>
                ) : (
                    <p className="text-xs text-muted-foreground">No {label.toLowerCase()}</p>
                )}
            </div>
            <FormField control={form.control} name={fieldName} render={() => (
                <FormItem>
                    <FormControl>
                        <div>
                            <Input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={handleImageChange} />
                            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="w-full h-8 text-xs">
                                <UploadCloud className="mr-2 h-3 w-3" /> Upload {label}
                            </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            {opacityFieldName && fieldValue && (
                 <FormField
                    control={form.control}
                    name={opacityFieldName}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Opacity</FormLabel>
                            <FormControl>
                               <Slider
                                    value={[ (field.value ?? 1) * 100]}
                                    onValueChange={(value) => field.onChange(value[0] / 100)}
                                    max={100}
                                    step={1}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
};

const WATERMARK_PRESETS = ['PAID', 'DRAFT', 'PENDING', 'OVERDUE', 'CANCELED', 'CUSTOM'];

function SettingsPanel({ form, documentType, documentId, isNew, onSubmit, returnUrl }: {
  form: any,
  documentType: string | null,
  documentId: string | null,
  isNew: boolean,
  onSubmit: (data: any) => void,
  returnUrl: string
}) {
  const [customWatermark, setCustomWatermark] = useState(form.getValues('watermarkText') && !WATERMARK_PRESETS.includes(form.getValues('watermarkText')));
  
  const handleWatermarkPresetChange = (value: string) => {
    if (value === 'CUSTOM') {
        setCustomWatermark(true);
        form.setValue('watermarkText', '');
    } else {
        setCustomWatermark(false);
        form.setValue('watermarkText', value);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
        <Form {...form}>
            <div className="flex flex-col h-full">
                <div className="border-0 shadow-none rounded-none flex-1 flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold capitalize">Customize {documentType || 'Design'}</h2>
                        <p className="text-sm text-muted-foreground">
                            {isNew ? `Customizing default ${documentType} design.` : `Design for ${documentId}`}
                        </p>
                    </div>
                    <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                        <Accordion type="multiple" defaultValue={['appearance']} className="w-full">
                             <Card className="border-0 shadow-none">
                                <AccordionItem value="appearance">
                                    <AccordionTrigger className="text-sm p-2"><div className="flex items-center gap-2"><Paintbrush className="h-4 w-4"/> Appearance</div></AccordionTrigger>
                                    <AccordionContent className="p-2 space-y-3">
                                        <ImageUploader form={form} fieldName="logo" label="Custom Logo" aspect='normal' />
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-2">
                                            <FormField control={form.control} name="backgroundColor" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Page BG</FormLabel><FormControl><Input type="color" {...field} value={field.value || '#FFFFFF'} className="h-8 w-full p-1 cursor-pointer" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={form.control} name="textColor" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Text</FormLabel><FormControl><Input type="color" {...field} value={field.value || '#000000'} className="h-8 w-full p-1 cursor-pointer" /></FormControl></FormItem>
                                            )} />
                                        </div>
                                        <Separator />
                                        <ImageUploader form={form} fieldName="backgroundImage" opacityFieldName="backgroundImageOpacity" label="Background Image" aspect='normal' />
                                    </AccordionContent>
                                </AccordionItem>
                             </Card>
                             
                              <Card className="border-0 shadow-none">
                                <AccordionItem value="elements">
                                    <AccordionTrigger className="text-sm p-2"><div className="flex items-center gap-2"><Eye className="h-4 w-4"/> Visible Elements</div></AccordionTrigger>
                                    <AccordionContent className="p-2 space-y-2">
                                        {[
                                            {name: 'showLogo', label: 'Company Logo'},
                                            {name: 'showBusinessAddress', label: 'Company Address'},
                                            {name: 'showInvoiceTitle', label: 'Document Title'},
                                            {name: 'showBillingAddress', label: 'Billing Address'},
                                            {name: 'showDates', label: 'Dates'},
                                            {name: 'showPaymentDetails', label: 'Payment Details'},
                                            {name: 'showNotes', label: 'Notes Section'},
                                            {name: 'showBrandsoftFooter', label: '"Created By" Footer'},
                                        ].map(item => (
                                             <FormField key={item.name} control={form.control} name={item.name as any} render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-md border p-2">
                                                    <FormLabel className="text-xs">{item.label}</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                             )} />
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                             </Card>

                             <Card className="border-0 shadow-none">
                                <AccordionItem value="layout">
                                    <AccordionTrigger className="text-sm p-2"><div className="flex items-center gap-2"><Layers className="h-4 w-4"/> Layout & Watermark</div></AccordionTrigger>
                                    <AccordionContent className="p-2">
                                        <Tabs defaultValue="header" className="w-full">
                                            <TabsList className="grid w-full grid-cols-3 h-8">
                                                <TabsTrigger value="header" className="text-xs h-6">Header</TabsTrigger>
                                                <TabsTrigger value="footer" className="text-xs h-6">Footer</TabsTrigger>
                                                <TabsTrigger value="watermark" className="text-xs h-6">Watermark</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="header" className="pt-3 space-y-3">
                                                <FormField control={form.control} name="headerColor" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-xs">Header Bar Color</FormLabel><FormControl><Input type="color" {...field} value={field.value || '#000000'} className="h-8 w-full p-1 cursor-pointer" /></FormControl></FormItem>
                                                )} />
                                                <ImageUploader form={form} fieldName="headerImage" opacityFieldName="headerImageOpacity" label="Header Image" aspect='wide' />
                                            </TabsContent>
                                            <TabsContent value="footer" className="pt-3 space-y-3">
                                                <FormField control={form.control} name="footerColor" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-xs">Footer Bar Color</FormLabel><FormControl><Input type="color" {...field} value={field.value || '#000000'} className="h-8 w-full p-1 cursor-pointer" /></FormControl></FormItem>
                                                )} />
                                                <ImageUploader form={form} fieldName="footerImage" opacityFieldName="footerImageOpacity" label="Footer Image" aspect='wide' />
                                            </TabsContent>
                                            <TabsContent value="watermark" className="pt-3 space-y-3">
                                                <div className="space-y-1"><FormLabel className="text-xs">Watermark Text</FormLabel>
                                                    <Select onValueChange={handleWatermarkPresetChange} defaultValue={customWatermark ? 'CUSTOM' : form.getValues('watermarkText') || ''}>
                                                        <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="Select preset or custom" /></SelectTrigger>
                                                        <SelectContent>{WATERMARK_PRESETS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                            {customWatermark && (
                                                    <FormField control={form.control} name="watermarkText" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-xs">Custom Text</FormLabel><FormControl><Input placeholder="CONFIDENTIAL" {...field} className="h-8 text-xs" /></FormControl></FormItem>
                                                )} />
                                            )}
                                            <FormField control={form.control} name="watermarkColor" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Color</FormLabel><FormControl><Input type="color" {...field} value={field.value || '#dddddd'} className="h-8 w-full p-1" /></FormControl></FormItem>
                                            )} />
                                                <FormField control={form.control} name="watermarkOpacity" render={({ field }) => (<FormItem><FormLabel className="text-xs">Opacity</FormLabel><FormControl><Slider value={[ (field.value ?? 1) * 100]} onValueChange={(v) => field.onChange(v[0] / 100)} max={100} step={1} /></FormControl></FormItem>)} />
                                                <FormField control={form.control} name="watermarkFontSize" render={({ field }) => (<FormItem><FormLabel className="text-xs">Font Size</FormLabel><FormControl><Slider value={[field.value ?? 96]} onValueChange={(v) => field.onChange(v[0])} min={12} max={200} step={1} /></FormControl></FormItem>)} />
                                                <FormField control={form.control} name="watermarkAngle" render={({ field }) => (<FormItem><FormLabel className="text-xs">Angle</FormLabel><FormControl><Slider value={[field.value ?? 0]} onValueChange={(v) => field.onChange(v[0])} min={-90} max={90} step={5} /></FormControl></FormItem>)} />
                                            </TabsContent>
                                        </Tabs>
                                    </AccordionContent>
                                </AccordionItem>
                             </Card>

                             <Card className="border-0 shadow-none">
                                <AccordionItem value="numbering">
                                    <AccordionTrigger className="text-sm p-2"><div className="flex items-center gap-2"><Hash className="h-4 w-4"/> Document Numbering</div></AccordionTrigger>
                                    <AccordionContent className="p-2 space-y-3">
                                         <FormField control={form.control} name="invoicePrefix" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Invoice Prefix</FormLabel><FormControl><Input placeholder="INV-" {...field} className="h-8 text-xs"/></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="invoiceStartNumber" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Next Invoice Number</FormLabel><FormControl><Input type="number" placeholder="101" {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </AccordionContent>
                                </AccordionItem>
                             </Card>
                        </Accordion>
                    </div>
                    <div className="p-4 border-t bg-background flex-shrink-0 flex gap-2 sticky bottom-0">
                        <Button type="button" variant="outline" asChild className="flex-1">
                            <Link href={returnUrl}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Link>
                        </Button>
                        <Button type="button" onClick={form.handleSubmit(onSubmit)} className="flex-1">Save Design</Button>
                    </div>
                </div>
            </div>
        </Form>
    </div>
  );
}

function DocumentDesignPage() {
    const { config, updateInvoice, updateQuotation, saveConfig } = useBrandsoft();
    const { getFormData } = useFormState();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const documentType = searchParams.get('documentType') as 'invoice' | 'quotation' | null;
    const documentId = searchParams.get('documentId');
    const isNew = searchParams.get('isNew') === 'true';

    const [document, setDocument] = useState<Invoice | Quotation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<DesignSettingsFormData>({
        resolver: zodResolver(designSettingsSchema),
        defaultValues: {
            logo: '',
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            headerImage: '',
            headerImageOpacity: 1,
            footerImage: '',
            footerImageOpacity: 1,
            backgroundImage: '',
            backgroundImageOpacity: 1,
            watermarkText: '',
            watermarkColor: '#dddddd',
            watermarkOpacity: 0.05,
            watermarkFontSize: 96,
            watermarkAngle: 0,
            headerColor: '#F97316',
            footerColor: '#1E40AF',
            showLogo: true,
            showBusinessAddress: true,
            showInvoiceTitle: true,
            showBillingAddress: true,
            showDates: true,
            showPaymentDetails: true,
            showNotes: true,
            showBrandsoftFooter: true,
            invoicePrefix: 'INV-',
            invoiceStartNumber: 101,
        },
    });

    const watchedValues = form.watch();

    const currentDesignSettings: DesignSettings = useMemo(() => ({
        logo: watchedValues.logo,
        backgroundColor: watchedValues.backgroundColor,
        textColor: watchedValues.textColor,
        headerImage: watchedValues.headerImage,
        headerImageOpacity: watchedValues.headerImageOpacity,
        footerImage: watchedValues.footerImage,
        footerImageOpacity: watchedValues.footerImageOpacity,
        backgroundImage: watchedValues.backgroundImage,
        backgroundImageOpacity: watchedValues.backgroundImageOpacity,
        watermarkText: watchedValues.watermarkText,
        watermarkColor: watchedValues.watermarkColor,
        watermarkOpacity: watchedValues.watermarkOpacity,
        watermarkFontSize: watchedValues.watermarkFontSize,
        watermarkAngle: watchedValues.watermarkAngle,
        headerColor: watchedValues.headerColor,
        footerColor: watchedValues.footerColor,
        showLogo: watchedValues.showLogo,
        showBusinessAddress: watchedValues.showBusinessAddress,
        showInvoiceTitle: watchedValues.showInvoiceTitle,
        showBillingAddress: watchedValues.showBillingAddress,
        showDates: watchedValues.showDates,
        showPaymentDetails: watchedValues.showPaymentDetails,
        showNotes: watchedValues.showNotes,
        showBrandsoftFooter: watchedValues.showBrandsoftFooter,
    }), [watchedValues]);

    const getDefaultTemplate = useCallback((type: 'invoice' | 'quotation'): Partial<DesignSettings> => {
        if (!config?.profile) return {};
        const key = type === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
        const templateOrId = (config.profile as any)[key];
        
        if (typeof templateOrId === 'string' && config.templates) {
            const template = config.templates.find(t => t.id === templateOrId);
            return template?.pages?.[0]?.pageDetails || {};
        }
        return templateOrId || {};
    }, [config]);

    const stableGetFormData = useCallback(getFormData, []);

    useEffect(() => {
        if (!config || !documentType) return;

        let doc: Invoice | Quotation | null = null;
        let existingDesign: Partial<DesignSettings> = {};
        const brand = config.brand || {};
        const profile = config.profile || {};
        const defaultTemplate = getDefaultTemplate(documentType);

        if (isNew) {
            doc = stableGetFormData();
            existingDesign = (doc as any)?.design || {};
        } else if (documentId) {
            if (documentType === 'invoice') {
                doc = config.invoices.find(inv => inv.invoiceId === documentId) || null;
            } else if (documentType === 'quotation') {
                doc = config.quotations.find(q => q.quotationId === documentId) || null;
            }
            existingDesign = (doc as any)?.design || {};
        }
        
        if (doc) setDocument(doc);
        
        const initialValues: DesignSettingsFormData = {
            logo: existingDesign.logo ?? '',
            backgroundColor: existingDesign.backgroundColor ?? defaultTemplate.backgroundColor ?? brand.backgroundColor ?? '#FFFFFF',
            textColor: existingDesign.textColor ?? defaultTemplate.textColor ?? brand.textColor ?? '#000000',
            headerImage: existingDesign.headerImage ?? defaultTemplate.headerImage ?? brand.headerImage ?? '',
            headerImageOpacity: existingDesign.headerImageOpacity ?? defaultTemplate.headerImageOpacity ?? 1,
            footerImage: existingDesign.footerImage ?? defaultTemplate.footerImage ?? brand.footerImage ?? '',
            footerImageOpacity: existingDesign.footerImageOpacity ?? defaultTemplate.footerImageOpacity ?? 1,
            backgroundImage: existingDesign.backgroundImage ?? defaultTemplate.backgroundImage ?? brand.backgroundImage ?? '',
            backgroundImageOpacity: existingDesign.backgroundImageOpacity ?? defaultTemplate.backgroundImageOpacity ?? 1,
            watermarkText: existingDesign.watermarkText ?? defaultTemplate.watermarkText ?? (doc as Invoice)?.status,
            watermarkColor: existingDesign.watermarkColor ?? defaultTemplate.watermarkColor ?? '#dddddd',
            watermarkOpacity: existingDesign.watermarkOpacity ?? defaultTemplate.watermarkOpacity ?? 0.05,
            watermarkFontSize: existingDesign.watermarkFontSize ?? defaultTemplate.watermarkFontSize ?? 96,
            watermarkAngle: existingDesign.watermarkAngle ?? defaultTemplate.watermarkAngle ?? -45,
            headerColor: existingDesign.headerColor ?? defaultTemplate.headerColor ?? brand.primaryColor ?? '#F97316',
            footerColor: existingDesign.footerColor ?? defaultTemplate.footerColor ?? brand.secondaryColor ?? '#1E40AF',
            showLogo: existingDesign.showLogo ?? brand.showLogo ?? true,
            showBusinessAddress: existingDesign.showBusinessAddress ?? brand.showBusinessAddress ?? true,
            showInvoiceTitle: existingDesign.showInvoiceTitle ?? brand.showInvoiceTitle ?? true,
            showBillingAddress: existingDesign.showBillingAddress ?? brand.showBillingAddress ?? true,
            showDates: existingDesign.showDates ?? brand.showDates ?? true,
            showPaymentDetails: existingDesign.showPaymentDetails ?? brand.showPaymentDetails ?? true,
            showNotes: existingDesign.showNotes ?? brand.showNotes ?? true,
            showBrandsoftFooter: existingDesign.showBrandsoftFooter ?? brand.brandsoftFooter ?? true,
            invoicePrefix: profile.invoicePrefix || 'INV-',
            invoiceStartNumber: profile.invoiceStartNumber || 101,
        };
        
        form.reset(initialValues);
        setIsLoading(false);
    }, [config, documentId, documentType, isNew, stableGetFormData, getDefaultTemplate, form]);
    
    // This effect listens to form changes and saves them to the config immediately.
    useEffect(() => {
        const subscription = form.watch((values) => {
            if (isLoading || !config) return;

            const newDesignSettings: DesignSettings = {
                logo: values.logo, backgroundColor: values.backgroundColor, textColor: values.textColor,
                headerImage: values.headerImage, headerImageOpacity: values.headerImageOpacity,
                footerImage: values.footerImage, footerImageOpacity: values.footerImageOpacity,
                backgroundImage: values.backgroundImage, backgroundImageOpacity: values.backgroundImageOpacity,
                watermarkText: values.watermarkText, watermarkColor: values.watermarkColor,
                watermarkOpacity: values.watermarkOpacity, watermarkFontSize: values.watermarkFontSize,
                watermarkAngle: values.watermarkAngle, headerColor: values.headerColor, footerColor: values.footerColor,
                showLogo: values.showLogo, showBusinessAddress: values.showBusinessAddress, showInvoiceTitle: values.showInvoiceTitle,
                showBillingAddress: values.showBillingAddress, showDates: values.showDates,
                showPaymentDetails: values.showPaymentDetails, showNotes: values.showNotes, showBrandsoftFooter: values.showBrandsoftFooter,
            };
            
             const newProfileSettings = {
                ...config.profile,
                invoicePrefix: values.invoicePrefix,
                invoiceStartNumber: values.invoiceStartNumber,
            };

            if (isNew) {
                const templateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
                saveConfig({ ...config, profile: { ...config.profile, ...newProfileSettings, [templateKey]: newDesignSettings } }, { redirect: false });
            } else if (document && documentId) {
                const updateFn = documentType === 'invoice' ? updateInvoice : updateQuotation;
                updateFn(documentId, { design: newDesignSettings });
            }
        });
        return () => subscription.unsubscribe();
    }, [form, isLoading, config, isNew, documentType, documentId, document, saveConfig, updateInvoice, updateQuotation]);


    const onSubmit = (data: DesignSettingsFormData) => {
        // The useEffect now handles saving, so this can just be for feedback.
        toast({ title: "Design Saved", description: "Your changes have been saved." });
        router.push(returnUrl);
    };

    const finalDocumentData = useMemo(() => {
        const formData = getFormData();
        if (document) {
            return { ...document, design: currentDesignSettings };
        }
        if (isNew && formData && Object.keys(formData).length > 0) {
            return { ...(formData as any), [documentType === 'invoice' ? 'invoiceId' : 'quotationId']: 'PREVIEW', design: currentDesignSettings };
        }
        return {
            date: new Date().toISOString(),
            status: 'Pending',
            [documentType === 'invoice' ? 'invoiceId' : 'quotationId']: 'PREVIEW',
            [documentType === 'invoice' ? 'dueDate' : 'validUntil']: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
            lineItems: [{ description: 'Sample Item', quantity: 1, price: 100 }],
            design: currentDesignSettings,
        } as Invoice | Quotation;
    }, [document, isNew, getFormData, documentType, currentDesignSettings]);

    const previewCustomer = useMemo(() => {
        if (!config) return null;
        let customerId: string | undefined = (finalDocumentData as any).customerId;
        return config.customers.find(c => c.id === customerId) || config.customers[0] || null;
    }, [config, finalDocumentData]);

    const designKey = useMemo(() => JSON.stringify(currentDesignSettings), [currentDesignSettings]);

    if (isLoading) {
        return (
          <div className="w-full h-screen flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }
    
    const returnUrl = isNew ? `/${documentType}s/new` : (documentId ? `/${documentType}s/${documentId}/edit` : `/${documentType}s`);
    const hasContentForPreview = finalDocumentData && previewCustomer;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 relative">
            
            <aside className={cn(
                "fixed lg:relative top-0 left-0 z-40 w-80 h-screen transition-transform duration-300 bg-white border-r",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                "lg:translate-x-0" 
            )}>
                 <Button 
                    size="icon" 
                    variant="primary"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute top-4 -translate-y-1/2 rounded-l-none rounded-r-md transition-all duration-300 z-50 right-[-40px] lg:hidden"
                 >
                    <PanelLeft className="h-5 w-5"/>
                </Button>
                <SettingsPanel 
                    form={form} 
                    documentType={documentType} 
                    documentId={documentId} 
                    isNew={isNew} 
                    onSubmit={onSubmit} 
                    returnUrl={returnUrl}
                />
            </aside>

            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <main className="flex-1 w-full bg-slate-100 overflow-y-auto flex justify-center items-start p-4 md:p-8">
                    <div className="flex-shrink-0 shadow-2xl transform origin-top scale-[0.8] md:scale-[0.9] lg:scale-100">
                        {hasContentForPreview ? (
                            <>
                                {documentType === 'invoice' && (
                                    <InvoicePreview
                                        key={designKey}
                                        config={config}
                                        customer={previewCustomer}
                                        invoiceData={finalDocumentData as Invoice}
                                        invoiceId={(finalDocumentData as Invoice).invoiceId}
                                        designOverride={currentDesignSettings}
                                        forPdf={true}
                                    />
                                )}
                                {documentType === 'quotation' && (
                                    <QuotationPreview
                                        key={designKey}
                                        config={config}
                                        customer={previewCustomer}
                                        quotationData={finalDocumentData as Quotation}
                                        quotationId={(finalDocumentData as Quotation).quotationId}
                                        designOverride={currentDesignSettings}
                                        forPdf={true}
                                    />
                                )}
                            </>
                        ) : (
                            <div className="w-[8.5in] h-[11in] bg-white shadow-lg flex items-center justify-center border flex-shrink-0">
                                <div className="text-center p-8">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Loading Preview...</h3>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default dynamic(() => Promise.resolve(DocumentDesignPage), {
    ssr: false,
    loading: () => <div className="w-full h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
});

```</content>
  </change>
  <change>
    <file>src/hooks/use-brandsoft.tsx</file>
    <content><![CDATA[
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { hexToHsl } from '@/lib/utils';
import { Page } from '@/stores/canvas-store';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const VALID_SERIAL = 'BRANDSOFT-2024';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
  companyAddress?: string;
  vatNumber?: string;
  associatedProductIds?: string[];
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: 'product' | 'service';
};

export type LineItem = {
    productId?: string;
    description: string;
    quantity: number;
    price: number;
};

export interface DesignSettings {
    logo?: string;
    backgroundColor?: string;
    textColor?: string;
    headerImage?: string;
    headerImageOpacity?: number;
    footerImage?: string;
    footerImageOpacity?: number;
    backgroundImage?: string;
    backgroundImageOpacity?: number;
    watermarkText?: string;
    watermarkColor?: string;
    watermarkOpacity?: number;
    watermarkFontSize?: number;
    watermarkAngle?: number;
    headerColor?: string;
    footerColor?: string;
    // Visibility toggles
    showLogo?: boolean;
    showBusinessAddress?: boolean;
    showInvoiceTitle?: boolean;
    showBillingAddress?: boolean;
    showDates?: boolean;
    showPaymentDetails?: boolean;
    showNotes?: boolean;
    showBrandsoftFooter?: boolean;
}

export type Invoice = {
    invoiceId: string;
    customer: string;
    customerId?: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'Paid' | 'Pending' | 'Overdue' | 'Canceled' | 'Draft';
    subtotal?: number;
    discount?: number;
    discountType?: 'percentage' | 'flat';
    discountValue?: number;
    tax?: number;
    taxName?: string;
    taxType?: 'percentage' | 'flat';
    taxValue?: number;
    shipping?: number;
    notes?: string;
    lineItems?: LineItem[];
    design?: DesignSettings;
};

export type Quotation = {
    quotationId: string;
    customer: string;
    customerId?: string;
    date: string;
    validUntil: string;
    amount: number;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
    subtotal?: number;
    discount?: number;
    discountType?: 'percentage' | 'flat';
    discountValue?: number;
    tax?: number;
    taxName?: string;
    taxType?: 'percentage' | 'flat';
    taxValue?: number;
    shipping?: number;
    notes?: string;
    lineItems?: LineItem[];
    design?: DesignSettings;
};


export type BrandsoftTemplate = {
  id: string;
  name: string;
  description?: string;
  category: 'invoice' | 'quotation' | 'certificate' | 'id-card' | 'marketing';
  pages: Page[];
  previewImage?: string; // data URL
  createdAt?: string;
};


export type BrandsoftConfig = {
  brand: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    font: string;
    businessName: string;
    brandsoftFooter: boolean;
    headerImage?: string;
    footerImage?: string;
    backgroundImage?: string;
    watermarkImage?: string;
    footerContent?: string;
    showCustomerAddress: boolean;
    backgroundColor?: string;
    textColor?: string;
    // Default visibility
    showLogo?: boolean;
    showBusinessAddress?: boolean;
    showInvoiceTitle?: boolean;
    showBillingAddress?: boolean;
    showDates?: boolean;
    showPaymentDetails?: boolean;
    showNotes?: boolean;
    showBrandsoftFooter?: boolean;
  };
  profile: {
    address: string;
    phone: string;
    email: string;
    website: string;
    taxNumber: string;
    defaultCurrency: string;
    paymentDetails?: string;
    invoicePrefix?: string;
    invoiceStartNumber?: number;
    quotationPrefix?: string;
    quotationStartNumber?: number;
    defaultInvoiceTemplate?: DesignSettings | string;
    defaultQuotationTemplate?: DesignSettings | string;
  };
  modules: {
    invoice: boolean;
    certificate: boolean;
    idCard: boolean;
    quotation: boolean;
    marketing: boolean;
  };
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  quotations: Quotation[];
  templates: BrandsoftTemplate[];
  currencies: string[];
};

interface BrandsoftContextType {
  isActivated: boolean | null;
  isConfigured: boolean | null;
  config: BrandsoftConfig | null;
  activate: (serial: string) => boolean;
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean }) => void;
  logout: () => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (customerId: string, data: Partial<Omit<Customer, 'id'>>) => void;
  deleteCustomer: (customerId: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (productId: string, data: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (productId: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'invoiceId'>) => Invoice;
  updateInvoice: (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => void;
  deleteInvoice: (invoiceId: string) => void;
  addQuotation: (quotation: Omit<Quotation, 'quotationId'>) => Quotation;
  updateQuotation: (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => void;
  deleteQuotation: (quotationId: string) => void;
  addCurrency: (currency: string) => void;
}

const BrandsoftContext = createContext<BrandsoftContextType | undefined>(undefined);

const initialCustomers: Customer[] = [
    { id: 'CUST-1625243511000', name: 'Liam Johnson', email: 'liam@example.com', address: '123 Main St, Anytown, USA' },
    { id: 'CUST-1625243512000', name: 'Olivia Smith', email: 'olivia@example.com', companyName: 'Smith Designs', companyAddress: '456 Oak Ave, Anytown, USA' },
    { id: 'CUST-1625243513000', name: 'Noah Williams', email: 'noah@example.com', address: '789 Pine Ln, Anytown, USA' },
    { id: 'CUST-1625243514000', name: 'Emma Brown', email: 'emma@example.com', companyName: 'Brown & Co.', companyAddress: '321 Elm Rd, Anytown, USA' },
    { id: 'CUST-1625243515000', name: 'James Jones', email: 'james@example.com', address: '654 Maple Dr, Anytown, USA' },
    { id: 'CUST-1625243516000', name: 'Sophia Garcia', email: 'sophia@example.com', address: '987 Birch Ct, Anytown, USA' },
];


const initialInvoices: Invoice[] = [
  {
    invoiceId: 'INV001',
    customer: 'Liam Johnson',
    date: '2023-06-23',
    dueDate: '2023-07-23',
    amount: 250.0,
    status: 'Paid',
    subtotal: 250,
    discount: 0,
    tax: 0,
    shipping: 0,
    lineItems: [{ description: 'Web Design Consultation', quantity: 2, price: 125 }],
  },
  {
    invoiceId: 'INV002',
    customer: 'Olivia Smith',
    date: '2023-07-15',
    dueDate: '2023-08-15',
    amount: 150.0,
    status: 'Pending',
    subtotal: 150,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Logo Design', quantity: 1, price: 150 }],
  },
  {
    invoiceId: 'INV003',
    customer: 'Noah Williams',
    date: '2023-08-01',
    dueDate: '2023-09-01',
    amount: 350.0,
    status: 'Paid',
    subtotal: 350,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Social Media Campaign', quantity: 1, price: 350 }],
  },
  {
    invoiceId: 'INV004',
    customer: 'Emma Brown',
    date: '2023-09-10',
    dueDate: '2023-10-10',
    amount: 450.0,
    status: 'Overdue',
    subtotal: 450,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'SEO Audit', quantity: 1, price: 450 }],
  },
  {
    invoiceId: 'INV005',
    customer: 'James Jones',
    date: '2023-10-20',
    dueDate: '2023-11-20',
    amount: 550.0,
    status: 'Pending',
    subtotal: 550,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Complete Branding Package', quantity: 1, price: 550 }],
  },
   {
    invoiceId: 'INV006',
    customer: 'Sophia Garcia',
    date: '2023-10-22',
    dueDate: '2023-11-22',
    amount: 300.0,
    status: 'Canceled',
    subtotal: 300,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Business Card Design', quantity: 200, price: 1.5 }],
  },
];

const initialQuotations: Quotation[] = [
    {
        quotationId: 'QUO-001',
        customer: 'Liam Johnson',
        date: '2023-11-01',
        validUntil: '2023-11-30',
        amount: 500.0,
        status: 'Sent',
        subtotal: 500,
        lineItems: [{ description: 'Website Redesign', quantity: 1, price: 500 }],
    },
    {
        quotationId: 'QUO-002',
        customer: 'Olivia Smith',
        date: '2023-11-05',
        validUntil: '2023-12-05',
        amount: 1200.0,
        status: 'Accepted',
        subtotal: 1200,
        lineItems: [{ description: 'E-commerce Platform Development', quantity: 1, price: 1200 }],
    },
    {
        quotationId: 'QUO-003',
        customer: 'Emma Brown',
        date: '2023-11-10',
        validUntil: '2023-12-10',
        amount: 300.0,
        status: 'Declined',
        subtotal: 300,
        lineItems: [{ description: 'Quarterly Social Media Management', quantity: 1, price: 300 }],
    },
    {
        quotationId: 'QUO-004',
        customer: 'Noah Williams',
        date: '2023-11-12',
        validUntil: '2023-12-12',
        amount: 800.0,
        status: 'Draft',
        subtotal: 800,
        lineItems: [{ description: 'Mobile App UI/UX Design', quantity: 1, price: 800 }],
    }
];


export function BrandsoftProvider({ children }: { children: ReactNode }) {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [config, setConfig] = useState<BrandsoftConfig | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const license = localStorage.getItem(LICENSE_KEY);
      const configData = localStorage.getItem(CONFIG_KEY);

      setIsActivated(!!license);
      setIsConfigured(!!configData);
      if (configData) {
        const parsedConfig = JSON.parse(configData);
        if (parsedConfig.brand.brandsoftFooter === undefined) {
          parsedConfig.brand.brandsoftFooter = true;
        }
        if (parsedConfig.brand.showCustomerAddress === undefined) {
            parsedConfig.brand.showCustomerAddress = true;
        }
        if (!parsedConfig.invoices) {
            parsedConfig.invoices = initialInvoices;
        }
         if (!parsedConfig.customers || parsedConfig.customers.length === 0) {
            parsedConfig.customers = initialCustomers;
        }
        if (!parsedConfig.templates) {
            parsedConfig.templates = [];
        }
        if (!parsedConfig.quotations || parsedConfig.quotations.length === 0) {
            parsedConfig.quotations = initialQuotations;
        }
        setConfig(parsedConfig);
      }
    } catch (error) {
      console.error("Error accessing localStorage", error);
      setIsActivated(false);
      setIsConfigured(false);
    }
  }, []);

  useEffect(() => {
    if (config?.brand.primaryColor) {
      const primaryHsl = hexToHsl(config.brand.primaryColor);
      if (primaryHsl) {
        document.documentElement.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
      }
    }
    if (config?.brand.secondaryColor) {
      const accentHsl = hexToHsl(config.brand.secondaryColor);
       if (accentHsl) {
        document.documentElement.style.setProperty('--accent', `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`);
      }
    }
  }, [config]);

  const activate = (serial: string) => {
    if (serial.trim() === VALID_SERIAL) {
      try {
        localStorage.setItem(LICENSE_KEY, JSON.stringify({ serial, activatedAt: new Date() }));
        setIsActivated(true);
        router.push('/setup');
        return true;
      } catch (error) {
        console.error("Error setting license in localStorage", error);
        return false;
      }
    }
    return false;
  };

  const saveConfig = (newConfig: BrandsoftConfig, options: { redirect?: boolean } = { redirect: true }) => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
      setIsConfigured(true);
      setConfig(newConfig);

      if (options.redirect) {
        const nonRedirectPaths = ['/dashboard', '/settings', '/products', '/invoices', '/quotations', '/templates', '/design'];
        const isCustomerPage = window.location.pathname.startsWith('/customers');
        const isProductsPage = window.location.pathname.startsWith('/products');
        const isInvoicePage = window.location.pathname.startsWith('/invoices');
        const isQuotationPage = window.location.pathname.startsWith('/quotations');

        
        const shouldRedirect = !nonRedirectPaths.includes(window.location.pathname) && !isCustomerPage && !isProductsPage && !isInvoicePage && !isQuotationPage;
        
        if (shouldRedirect) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error("Error saving config to localStorage", error);
    }
  };
  
  const logout = () => {
    try {
      console.log("Logout function called, but it's a no-op for offline version.");
    } catch (error) {
        console.error("Error during logout", error);
    }
  };

  const addCustomer = (customerData: Omit<Customer, 'id'>): Customer => {
    if (!config) throw new Error("Config not loaded");
    const newCustomer: Customer = {
      ...customerData,
      id: `CUST-${Date.now()}`
    };
    const newConfig: BrandsoftConfig = {
      ...config,
      customers: [...(config.customers || []), newCustomer],
    };
    saveConfig(newConfig, { redirect: false });
    return newCustomer;
  };
  
  const updateCustomer = (customerId: string, data: Partial<Omit<Customer, 'id'>>) => {
    if (!config) throw new Error("Config not loaded");
    const updatedCustomers = config.customers.map(c =>
      c.id === customerId ? { ...c, ...data } : c
    );
    const newConfig: BrandsoftConfig = {
      ...config,
      customers: updatedCustomers,
    };
    saveConfig(newConfig, { redirect: false });
  };
  
  const deleteCustomer = (customerId: string) => {
    if (!config) throw new Error("Config not loaded");
    const updatedCustomers = config.customers.filter(c => c.id !== customerId);
    const newConfig: BrandsoftConfig = {
        ...config,
        customers: updatedCustomers,
    };
    saveConfig(newConfig, { redirect: false });
  }

  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    if (!config) throw new Error("Config not loaded");
    const newProduct: Product = {
      ...productData,
      id: `PROD-${Date.now()}`
    };
    const newConfig: BrandsoftConfig = {
      ...config,
      products: [...(config.products || []), newProduct],
    };
    saveConfig(newConfig, { redirect: false });
    return newProduct;
  };

  const updateProduct = (productId: string, data: Partial<Omit<Product, 'id'>>) => {
    if (!config) throw new Error("Config not loaded");
    const updatedProducts = config.products.map(p =>
      p.id === productId ? { ...p, ...data } : p
    );
    const newConfig: BrandsoftConfig = {
      ...config,
      products: updatedProducts,
    };
    saveConfig(newConfig, { redirect: false });
  };
  
  const deleteProduct = (productId: string) => {
    if (!config) throw new Error("Config not loaded");
    const updatedProducts = config.products.filter(p => p.id !== productId);
    const newConfig: BrandsoftConfig = {
        ...config,
        products: updatedProducts,
    };
    saveConfig(newConfig, { redirect: false });
  }

  const addInvoice = (invoiceData: Omit<Invoice, 'invoiceId'>): Invoice => {
    if (!config) throw new Error("Config not loaded");
    
    let nextIdNumber = config.profile.invoiceStartNumber || 1;
    const existingIds = new Set(config.invoices.map(inv => inv.invoiceId));
    const prefix = config.profile.invoicePrefix || 'INV-';

    let newInvoiceId = `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
    while(existingIds.has(newInvoiceId)) {
        nextIdNumber++;
        newInvoiceId = `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
    }

    const newInvoice: Invoice = {
      ...invoiceData,
      invoiceId: newInvoiceId,
    };
    
    const newConfig: BrandsoftConfig = {
      ...config,
      invoices: [...config.invoices, newInvoice],
      profile: {
        ...config.profile,
        invoiceStartNumber: nextIdNumber + 1,
      }
    };
    saveConfig(newConfig, { redirect: false });
    return newInvoice;
  };

  const updateInvoice = (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => {
    if (!config) throw new Error("Config not loaded");
    const updatedInvoices = config.invoices.map(inv =>
      inv.invoiceId === invoiceId ? { ...inv, ...data, invoiceId } : inv
    );
     const newConfig: BrandsoftConfig = {
      ...config,
      invoices: updatedInvoices,
    };
    saveConfig(newConfig, { redirect: false });
  };

  const deleteInvoice = (invoiceId: string) => {
    if (!config) throw new Error("Config not loaded");
    const updatedInvoices = config.invoices.filter(inv => inv.invoiceId !== invoiceId);
    const newConfig: BrandsoftConfig = {
      ...config,
      invoices: updatedInvoices,
    };
    saveConfig(newConfig, { redirect: false });
  };
  
    const addQuotation = (quotationData: Omit<Quotation, 'quotationId'>): Quotation => {
        if (!config) throw new Error("Config not loaded");
        
        let nextIdNumber = config.profile.quotationStartNumber || 1;
        const existingIds = new Set(config.quotations.map(q => q.quotationId));
        const prefix = config.profile.quotationPrefix || 'QUO-';

        let newQuotationId = `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
        while(existingIds.has(newQuotationId)) {
            nextIdNumber++;
            newQuotationId = `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
        }

        const newQuotation: Quotation = {
        ...quotationData,
        quotationId: newQuotationId,
        };
        
        const newConfig: BrandsoftConfig = {
        ...config,
        quotations: [...config.quotations, newQuotation],
        profile: {
            ...config.profile,
            quotationStartNumber: nextIdNumber + 1,
        }
        };
        saveConfig(newConfig, { redirect: false });
        return newQuotation;
    };

    const updateQuotation = (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => {
        if (!config) throw new Error("Config not loaded");
        const updatedQuotations = config.quotations.map(q =>
        q.quotationId === quotationId ? { ...q, ...data, quotationId } : q
        );
        const newConfig: BrandsoftConfig = {
        ...config,
        quotations: updatedQuotations,
        };
        saveConfig(newConfig, { redirect: false });
    };

    const deleteQuotation = (quotationId: string) => {
        if (!config) throw new Error("Config not loaded");
        const updatedQuotations = config.quotations.filter(q => q.quotationId !== quotationId);
        const newConfig: BrandsoftConfig = {
        ...config,
        quotations: updatedQuotations,
        };
        saveConfig(newConfig, { redirect: false });
    };


  const addCurrency = (currency: string) => {
    if (!config) throw new Error("Config not loaded");
    if (!config.currencies.includes(currency)) {
        const newConfig: BrandsoftConfig = {
            ...config,
            currencies: [...config.currencies, currency]
        };
        saveConfig(newConfig, { redirect: false });
    }
  };


  const value = { isActivated, isConfigured, config, activate, saveConfig, logout, addCustomer, updateCustomer, deleteCustomer, addProduct, updateProduct, deleteProduct, addInvoice, updateInvoice, deleteInvoice, addQuotation, updateQuotation, deleteQuotation, addCurrency };

  return <BrandsoftContext.Provider value={value}>{children}</BrandsoftContext.Provider>;
}

export function useBrandsoft() {
  const context = useContext(BrandsoftContext);
  if (context === undefined) {
    throw new Error('useBrandsoft must be used within a BrandsoftProvider');
  }
  return context;
}
```</content>
  </change>
  <change>
    <file>src/components/invoice-preview.tsx</file>
    <content><![CDATA[
'use client';

import React, { useMemo } from 'react';
import { BrandsoftConfig, Customer, Invoice, LineItem, DesignSettings } from '@/hooks/use-brandsoft';
import { format, parseISO, isValid } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';

type InvoiceData = Partial<Invoice> & {
    lineItems?: LineItem[],
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
    design?: DesignSettings;
};

export interface InvoicePreviewProps {
    config: BrandsoftConfig | null;
    customer: Customer | null;
    invoiceData: InvoiceData;
    invoiceId?: string;
    forPdf?: boolean;
    designOverride?: DesignSettings;
}

const InvoiceStatusWatermark = ({ status, design }: { status?: string, design: DesignSettings }) => {
    if (!status) return null;

    const hexToRgb = (hex: string) => {
        let r = 0, g = 0, b = 0;
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


export function InvoicePreview({ 
    config, 
    customer, 
    invoiceData, 
    invoiceId, 
    forPdf = false, 
    designOverride 
}: InvoicePreviewProps) {
    if (!config || !customer || !invoiceData) {
        return (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
                Please fill out all required fields to see the preview.
            </div>
        );
    }
    
    const design = useMemo(() => {
        const brand = config.brand || {};
        const defaultTemplateId = config.profile?.defaultInvoiceTemplate;
        const defaultTemplate = typeof defaultTemplateId === 'string' 
            ? config.templates?.find(t => t.id === defaultTemplateId)?.pages?.[0]?.pageDetails 
            : defaultTemplateId;

        const documentDesign = invoiceData?.design || {};
        const override = designOverride || {};
        const hasOverride = designOverride !== undefined && designOverride !== null;
        
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
            showBrandsoftFooter: brand.showBrandsoftFooter ?? true,
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
        if (hasOverride) {
           merge(mergedDesign, override);
        }
        
        return mergedDesign;
    }, [config, invoiceData?.design, designOverride]);

    const currencyCode = invoiceData.currency || config.profile?.defaultCurrency || '$';
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
    } else if (invoiceData.tax) {
        taxAmount = invoiceData.tax;
        taxRateDisplay = formatCurrency(taxAmount);
    }

    const shippingAmount = Number(invoiceData.applyShipping && invoiceData.shippingValue ? invoiceData.shippingValue : (invoiceData.shipping || 0));
    
    const total = subtotalAfterDiscount + taxAmount + shippingAmount;
    
    const formatDateSafe = (dateVal: Date | string | undefined) => {
        if (!dateVal) return format(new Date(), 'MM/dd/yyyy');
        const d = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
        return isValid(d) ? format(d, 'MM/dd/yyyy') : format(new Date(), 'MM/dd/yyyy');
    };

    const invoiceDateStr = formatDateSafe(invoiceData.invoiceDate || invoiceData.date);
    const dueDateStr = formatDateSafe(invoiceData.dueDate || invoiceData.date);
    
    const taxName = invoiceData.taxName || 'Tax';
    
    const watermarkText = design.watermarkText || invoiceData.status;

    const accentColor = design.headerColor;
    const footerColor = design.footerColor;

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

    return (
        <Wrapper>
            <div 
                id={`invoice-preview-${invoiceId}`} 
                className={cn(
                    "bg-white relative text-black overflow-hidden flex flex-col font-sans",
                    "w-[8.5in] h-[11in]" 
                )}
                style={{ backgroundColor: design.backgroundColor || '#FFFFFF', color: design.textColor || '#000000' }}
            >
                {/* Backgrounds */}
                {design.backgroundImage && (
                    <img src={design.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0" style={{opacity: design.backgroundImageOpacity}} alt="background"/>
                )}
                
                {invoiceData.status && watermarkText && <InvoiceStatusWatermark status={watermarkText} design={design} />}
                
                <div className='relative z-10 flex flex-col flex-grow'>
                    <div className='p-[12mm] flex-grow flex flex-col'>

                        {design.headerImage ? (
                            <img src={design.headerImage} className="w-full h-auto object-contain z-10 mb-5" style={{maxHeight: '60px', opacity: design.headerImageOpacity}} alt="header"/>
                        ) : (
                            <div className="w-full flex-shrink-0 relative z-10 mb-5" style={{ backgroundColor: accentColor, height: '35px' }}></div>
                        )}

                        <header className="flex justify-between items-start relative z-10">
                            <div className="flex items-center gap-4">
                                {design.showLogo && (design.logo || config.brand.logo) && (
                                    <img src={design.logo || config.brand.logo} alt="Logo" className="h-20 w-auto object-contain" />
                                )}
                                {design.showInvoiceTitle && <h1 className="text-4xl font-bold tracking-tight ml-2" style={{ color: accentColor }}>Invoice</h1>}
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
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bill To</h3>
                                        <p className="font-bold text-xl">{customer.companyName || customer.name}</p>
                                        {customer.companyName && <p className="text-sm font-medium">{customer.name}</p>}
                                        <p className="text-sm mt-1 whitespace-pre-wrap">{customer.address}</p>
                                        <p className="text-sm">{customer.email}</p>
                                    </div>
                                )}

                                {design.showDates && (
                                    <div className="w-auto min-w-[200px]">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-right">
                                            <span className="font-bold text-gray-500 uppercase text-xs self-center">Invoice #</span>
                                            <span className="font-bold text-base">{invoiceId || 'INV-001'}</span>

                                            <span className="font-bold text-gray-500 uppercase text-xs self-center">Date</span>
                                            <span className="font-medium">{invoiceDateStr}</span>

                                            <span className="font-bold text-gray-500 uppercase text-xs self-center">Due Date</span>
                                            <span className="font-medium">{dueDateStr}</span>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="mb-10">
                                <div className="w-full">
                                    <div className="flex border-b-2 pb-2 mb-2" style={{borderColor: design.textColor ? design.textColor : 'inherit'}}>
                                        <div className="w-[45%] font-bold uppercase text-[11px]">Item / Description</div>
                                        <div className="w-[10%] font-bold uppercase text-[11px] text-center">Qty</div>
                                        <div className="w-[20%] font-bold uppercase text-[11px] text-right">Price</div>
                                        <div className="w-[10%] font-bold uppercase text-[11px] text-right">Tax</div>
                                        <div className="w-[15%] font-bold uppercase text-[11px] text-right">Amount</div>
                                    </div>
                                    
                                    {invoiceData.lineItems?.map((item, index) => {
                                        const product = config?.products?.find(p => p.name === item.description);
                                        return (
                                            <div key={index} className="flex border-b py-3 text-sm" style={{borderColor: 'rgba(0,0,0,0.05)'}}>
                                                <div className="w-[45%] pr-2">
                                                    <p className="font-bold">{item.description}</p>
                                                    <p className="text-xs text-gray-500">{product?.description}</p>
                                                </div>
                                                <div className="w-[10%] text-center">{item.quantity}</div>
                                                <div className="w-[20%] text-right">{formatCurrency(item.price)}</div>
                                                <div className="w-[10%] text-right">{taxRateDisplay}</div>
                                                <div className="w-[15%] text-right font-bold">{formatCurrency(item.quantity * item.price)}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            <section className="flex flex-row gap-12 items-start mt-auto mb-8">
                                <div className="flex-1 text-xs">
                                    {design.showPaymentDetails && config.profile?.paymentDetails && (
                                        <div>
                                            <h3 className="font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h3>
                                            <p className="whitespace-pre-wrap leading-relaxed">{config.profile.paymentDetails}</p>
                                        </div>
                                    )}
                                    
                                    {design.showNotes && invoiceData.notes && (
                                        <div className="mt-4 pt-4 border-t" style={{borderColor: 'rgba(0,0,0,0.05)'}}>
                                            <h3 className="font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</h3>
                                            <p>{invoiceData.notes}</p>
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
                                        style={{backgroundColor: accentColor}}
                                    >
                                        <span className="font-bold text-white text-lg">Total</span>
                                        <span className="font-bold text-white text-xl">{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </section>
                        </main>
                    </div>

                    <footer className="w-full relative z-10 mt-auto">
                        {design.footerImage ? (
                            <img src={design.footerImage} className="w-full h-auto object-contain z-10 mb-2" style={{maxHeight: '60px', opacity: design.footerImageOpacity}} alt="footer"/>
                        ) : (
                           <div className="w-full flex items-center justify-center text-white py-4" style={{ backgroundColor: footerColor }}>
                                <div className="text-center">
                                    {design.showBrandsoftFooter && (
                                        <p className="text-[10px]">Created by <span className="font-bold">BrandSoft</span></p>
                                    )}
                                    {design.footerContent && (
                                        <p className="text-xs mt-1">{design.footerContent}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </footer>
                </div>
            </div>
        </Wrapper>
    );
}

export const downloadInvoiceAsPdf = async (props: InvoicePreviewProps) => {
    const container = document.createElement('div');
    container.id = `pdf-container-${props.invoiceId}`;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<InvoicePreview {...props} forPdf={true} />);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const invoiceElement = container.querySelector(`#invoice-preview-${props.invoiceId}`) as HTMLElement;
    if (!invoiceElement) {
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
        windowWidth: 794,
    });

    root.unmount();
    document.body.removeChild(container);

    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
    }
    pdf.save(`Invoice-${props.invoiceId}.pdf`);
};
