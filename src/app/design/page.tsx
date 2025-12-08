
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type DesignSettings, type Quotation, type Invoice } from '@/hooks/use-brandsoft.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, Layers, Trash2, ArrowLeft, Loader2, PanelLeft, Settings2, Hash, Eye, Wallet, Coins } from 'lucide-react';
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';


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
  // Payments
  paymentDetails: z.string().optional(),
  // Regional
  defaultCurrency: z.string().optional(),
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
                    <p className="text-xs text-muted-foreground">{label}</p>
                )}
            </div>
            <FormField control={form.control} name={fieldName} render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <div>
                            <Input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={handleImageChange} />
                            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="w-full h-8 text-xs">
                                <UploadCloud className="mr-2 h-3 w-3" /> {field.value ? 'Change' : 'Upload'}
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
                                <AccordionItem value="payments">
                                    <AccordionTrigger className="text-sm p-2"><div className="flex items-center gap-2"><Wallet className="h-4 w-4"/> Payment Details</div></AccordionTrigger>
                                    <AccordionContent className="p-2">
                                        <FormField control={form.control} name="paymentDetails" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea placeholder="e.g., Bank Name, Account Number..." {...field} rows={4} className="text-xs" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
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

                             <Card className="border-0 shadow-none">
                                <AccordionItem value="regional">
                                    <AccordionTrigger className="text-sm p-2"><div className="flex items-center gap-2"><Coins className="h-4 w-4"/> Regional</div></AccordionTrigger>
                                    <AccordionContent className="p-2 space-y-3">
                                         <FormField control={form.control} name="defaultCurrency" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Default Currency</FormLabel><FormControl><Input placeholder="USD" {...field} className="h-8 text-xs"/></FormControl><FormMessage /></FormItem>
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
            paymentDetails: '',
            defaultCurrency: 'USD',
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
            paymentDetails: profile.paymentDetails || '',
            defaultCurrency: profile.defaultCurrency || 'USD',
        };
        
        form.reset(initialValues);
        setIsLoading(false);
    }, [config, documentId, documentType, isNew, stableGetFormData, getDefaultTemplate, form]);
    
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
                paymentDetails: values.paymentDetails,
                defaultCurrency: values.defaultCurrency,
            };

            if (isNew) {
                const templateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
                saveConfig({ ...config, profile: { ...newProfileSettings, [templateKey]: newDesignSettings } }, { redirect: false });
            } else if (document && documentId) {
                const updateFn = documentType === 'invoice' ? updateInvoice : updateQuotation;
                updateFn(documentId, { design: newDesignSettings });
                 saveConfig({ ...config, profile: newProfileSettings }, { redirect: false });
            } else {
                 const templateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
                saveConfig({ ...config, profile: { ...newProfileSettings, [templateKey]: newDesignSettings } }, { redirect: false });
            }
        });
        return () => subscription.unsubscribe();
    }, [form, isLoading, config, isNew, documentType, documentId, document, saveConfig, updateInvoice, updateQuotation]);


    const onSubmit = (data: DesignSettingsFormData) => {
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
                    className="absolute top-4 rounded-l-none rounded-r-md transition-all duration-300 z-50 right-[-40px] lg:hidden"
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
