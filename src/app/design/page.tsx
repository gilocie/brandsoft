
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
import { UploadCloud, Paintbrush, Layers, Stamp, Trash2, ArrowLeft, Loader2, Image as ImageIcon, FileImage, SlidersHorizontal, PanelLeft, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFormState } from '@/hooks/use-form-state';
import { InvoicePreview } from '@/components/invoice-preview';
import { QuotationPreview } from '@/components/quotation-preview';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const designSettingsSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  headerImage: z.string().optional(),
  footerImage: z.string().optional(),
  backgroundImage: z.string().optional(),
  watermarkImage: z.string().optional(),
});

type DesignSettingsFormData = z.infer<typeof designSettingsSchema>;

const ImageUploader = ({ 
    form, 
    fieldName, 
    label, 
    description, 
    aspect 
}: { 
    form: any, 
    fieldName: keyof DesignSettingsFormData, 
    label: string, 
    description: string, 
    aspect: 'wide' | 'normal' 
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    const fieldValue = useWatch({
        control: form.control,
        name: fieldName,
    });

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                form.setValue(fieldName, dataUrl, { shouldDirty: true, shouldValidate: true });
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
        <div className="space-y-4">
            <div className={`relative flex flex-col items-center justify-center space-y-2 rounded-md border border-dashed p-4 w-full ${aspect === 'wide' ? 'h-24' : 'h-48'}`}>
                {fieldValue ? (
                    <>
                        <img src={fieldValue} alt={`${label} preview`} className="max-h-full max-w-full object-contain"/>
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleDeleteImage}>
                           <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">No ${label.toLowerCase()} uploaded</p>
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

function SettingsPanel({ form, documentType, documentId, isNew, onSubmit, returnUrl, onClose }: {
  form: any,
  documentType: string | null,
  documentId: string | null,
  isNew: boolean,
  onSubmit: (data: any) => void,
  returnUrl: string,
  onClose?: () => void
}) {
  return (
    <div className="h-full overflow-y-auto">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <Card className="border-0 shadow-none rounded-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="capitalize">Customize {documentType || 'Design'}</CardTitle>
                            <CardDescription>
                                {isNew ? `Customizing default ${documentType} design.` : `Design for ${documentId}`}
                            </CardDescription>
                        </div>
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto p-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><Paintbrush className="h-4 w-4"/> Appearance</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="backgroundColor" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Page Background</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input type="color" {...field} value={field.value || '#FFFFFF'} className="h-10 w-16 p-1 cursor-pointer" />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="textColor" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Text Color</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input type="color" {...field} value={field.value || '#000000'} className="h-10 w-16 p-1 cursor-pointer" />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                                <Separator />
                                <ImageUploader form={form} fieldName="backgroundImage" label="Background Image" description="A4 aspect ratio recommended." aspect='normal' />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4"/> Layout Images</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="header" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="header">Header</TabsTrigger>
                                        <TabsTrigger value="footer">Footer</TabsTrigger>
                                        <TabsTrigger value="watermark">Watermark</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="header" className="pt-4">
                                        <ImageUploader form={form} fieldName="headerImage" label="Header" description="Full width top banner." aspect='wide' />
                                    </TabsContent>
                                    <TabsContent value="footer" className="pt-4">
                                        <ImageUploader form={form} fieldName="footerImage" label="Footer" description="Full width bottom banner." aspect='wide' />
                                    </TabsContent>
                                    <TabsContent value="watermark" className="pt-4">
                                        <ImageUploader form={form} fieldName="watermarkImage" label="Watermark" description="Center page image." aspect='normal' />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </CardContent>
                    <CardFooter className="p-4 border-t bg-background flex-shrink-0 flex gap-2 sticky bottom-0">
                        <Button type="button" variant="outline" asChild className="flex-1">
                            <Link href={returnUrl}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Link>
                        </Button>
                        <Button type="submit" className="flex-1">Save Design</Button>
                    </CardFooter>
                </Card>
            </form>
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const documentType = searchParams.get('documentType') as 'invoice' | 'quotation' | null;
    const documentId = searchParams.get('documentId');
    const isNew = searchParams.get('isNew') === 'true';

    const [document, setDocument] = useState<Invoice | Quotation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<DesignSettingsFormData>({
        resolver: zodResolver(designSettingsSchema),
        defaultValues: {
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            headerImage: '',
            footerImage: '',
            backgroundImage: '',
            watermarkImage: '',
        },
    });

    const watchedValues = form.watch();
    
    const currentDesignSettings = useMemo((): DesignSettings => ({
        backgroundColor: watchedValues.backgroundColor || '#FFFFFF',
        textColor: watchedValues.textColor || '#000000',
        headerImage: watchedValues.headerImage || '',
        footerImage: watchedValues.footerImage || '',
        backgroundImage: watchedValues.backgroundImage || '',
        watermarkImage: watchedValues.watermarkImage || '',
    }), [watchedValues]);
    
    const getDefaultTemplate = useCallback((type: 'invoice' | 'quotation'): Partial<DesignSettings> => {
        if (!config?.profile) return {};
        const key = type === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
        const templateId = config.profile[key as keyof typeof config.profile];
        if (typeof templateId === 'string' && config.templates) {
            const template = config.templates.find(t => t.id === templateId);
            return template?.pages?.[0]?.pageDetails || {};
        }
        return (config.profile as any)[key] || {};
    }, [config]);

    const stableGetFormData = useCallback(getFormData, []);

    useEffect(() => {
        if (!config || !documentType) return;

        let doc: Invoice | Quotation | null = null;
        let existingDesign: Partial<DesignSettings> = {};
        const brand = config.brand || {};
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
            backgroundColor: existingDesign.backgroundColor ?? defaultTemplate.backgroundColor ?? brand.backgroundColor ?? '#FFFFFF',
            textColor: existingDesign.textColor ?? defaultTemplate.textColor ?? brand.textColor ?? '#000000',
            headerImage: existingDesign.headerImage ?? defaultTemplate.headerImage ?? brand.headerImage ?? '',
            footerImage: existingDesign.footerImage ?? defaultTemplate.footerImage ?? brand.footerImage ?? '',
            backgroundImage: existingDesign.backgroundImage ?? defaultTemplate.backgroundImage ?? brand.backgroundImage ?? '',
            watermarkImage: existingDesign.watermarkImage ?? defaultTemplate.watermarkImage ?? brand.watermarkImage ?? '',
        };
        
        form.reset(initialValues);
        setIsLoading(false);
    }, [config, documentId, documentType, isNew, stableGetFormData, getDefaultTemplate, form]);

    const onSubmit = (data: DesignSettingsFormData) => {
        if (!config || !documentType) return;
        
        const newDesignSettings: DesignSettings = {
            backgroundColor: data.backgroundColor || '',
            textColor: data.textColor || '',
            headerImage: data.headerImage || '',
            footerImage: data.footerImage || '',
            backgroundImage: data.backgroundImage || '',
            watermarkImage: data.watermarkImage || '',
        };

        const templateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
        
        if (isNew) {
            saveConfig({ ...config, profile: { ...config.profile, [templateKey]: newDesignSettings } });
            toast({ title: "Default Design Saved", description: `The new design is now the default for all new ${documentType}s.` });
            router.push(`/${documentType}s/new`);
        } else if (document && documentId) {
            const updateFn = documentType === 'invoice' ? updateInvoice : updateQuotation;
            updateFn(documentId, { design: newDesignSettings });
            toast({ title: "Design Saved", description: `The custom design for ${documentType} ${documentId} has been saved.` });
            router.push(`/${documentType}s/${documentId}/edit`);
        } else {
            saveConfig({ ...config, profile: { ...config.profile, [templateKey]: newDesignSettings } });
            toast({ title: "Default Design Saved", description: `The new design is now the default for all new ${documentType}s.` });
        }
        setIsSidebarOpen(false);
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
            date: new Date(),
            [documentType === 'invoice' ? 'invoiceId' : 'quotationId']: 'PREVIEW',
            [documentType === 'invoice' ? 'dueDate' : 'validUntil']: new Date(new Date().setDate(new Date().getDate() + 30)),
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
        return <div className="w-full h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    const returnUrl = isNew ? `/${documentType}s/new` : (documentId ? `/${documentType}s/${documentId}/edit` : `/${documentType}s`);
    const hasContentForPreview = finalDocumentData && previewCustomer;

    return (
        <div className="flex h-screen overflow-hidden">
            <aside className={cn(
                "fixed top-0 left-0 z-40 w-80 h-screen transition-transform bg-background border-r",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                "md:translate-x-0 md:relative md:w-80 md:shrink-0"
            )}>
                <SettingsPanel form={form} documentType={documentType} documentId={documentId} isNew={isNew} onSubmit={onSubmit} returnUrl={returnUrl} onClose={() => setIsSidebarOpen(false)} />
            </aside>

            <div className={cn(
                "flex-1 transition-all duration-300 h-screen flex flex-col"
            )}>
                <header className="h-16 flex-shrink-0 bg-background border-b flex items-center px-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
                        <PanelLeft className="h-5 w-5"/>
                    </Button>
                    <div className="flex-1 text-center font-semibold capitalize">{documentType} Design</div>
                </header>
                <main className="flex-1 w-full bg-slate-100 overflow-y-auto p-8 flex justify-center items-start">
                     <div className="flex-shrink-0 shadow-2xl transform origin-top md:scale-[0.55] xl:scale-[0.85] 2xl:scale-100 scale-[0.55]">
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
                            <div className="w-[210mm] h-[297mm] bg-white shadow-lg flex items-center justify-center border flex-shrink-0">
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

    