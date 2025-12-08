
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type DesignSettings, type Quotation, type Invoice } from '@/hooks/use-brandsoft.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, Layers, Stamp, Trash2, ArrowLeft, Loader2, Image as ImageIcon, FileImage } from 'lucide-react';
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
    
    // Use useWatch for reactive updates
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


function DocumentDesignPage() {
    const { config, updateInvoice, updateQuotation, saveConfig } = useBrandsoft();
    const { getFormData } = useFormState();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const documentType = searchParams.get('documentType') as 'invoice' | 'quotation' | null;
    const documentId = searchParams.get('documentId');
    const isNew = searchParams.get('isNew') === 'true';

    const [document, setDocument] = useState<Invoice | Quotation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<DesignSettingsFormData>({
        resolver: zodResolver(designSettingsSchema),
        defaultValues: {
            backgroundColor: '#FFFFFF',
            headerImage: '',
            footerImage: '',
            backgroundImage: '',
            watermarkImage: '',
        },
    });

    const backgroundColor = useWatch({ control: form.control, name: 'backgroundColor' });
    const headerImage = useWatch({ control: form.control, name: 'headerImage' });
    const footerImage = useWatch({ control: form.control, name: 'footerImage' });
    const backgroundImage = useWatch({ control: form.control, name: 'backgroundImage' });
    const watermarkImage = useWatch({ control: form.control, name: 'watermarkImage' });

    // Current design settings derived from watched form values
    const currentDesignSettings = useMemo((): DesignSettings => ({
        backgroundColor: backgroundColor || '#FFFFFF',
        headerImage: headerImage || '',
        footerImage: footerImage || '',
        backgroundImage: backgroundImage || '',
        watermarkImage: watermarkImage || '',
    }), [backgroundColor, headerImage, footerImage, backgroundImage, watermarkImage]);

    // Get default template based on document type
    const getDefaultTemplate = useCallback((type: 'invoice' | 'quotation'): Partial<DesignSettings> => {
        if (!config?.profile) return {};
        
        if (type === 'invoice') {
            return config.profile.defaultInvoiceTemplate || {};
        } else {
            return config.profile.defaultQuotationTemplate || {};
        }
    }, [config?.profile.defaultInvoiceTemplate, config?.profile.defaultQuotationTemplate]);

    useEffect(() => {
        if (!config || !documentType) return;

        let doc: Invoice | Quotation | null = null;
        let existingDesign: Partial<DesignSettings> = {};
        const brand = config.brand || {};
        const defaultTemplate = getDefaultTemplate(documentType);

        if (isNew) {
            doc = getFormData();
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
        
        // Priority: document design > default template > brand settings
        const initialValues: DesignSettingsFormData = {
            backgroundColor: existingDesign.backgroundColor || defaultTemplate.backgroundColor || brand.backgroundColor || '#FFFFFF',
            headerImage: existingDesign.headerImage || defaultTemplate.headerImage || brand.headerImage || '',
            footerImage: existingDesign.footerImage || defaultTemplate.footerImage || brand.footerImage || '',
            backgroundImage: existingDesign.backgroundImage || defaultTemplate.backgroundImage || brand.backgroundImage || '',
            watermarkImage: existingDesign.watermarkImage || defaultTemplate.watermarkImage || brand.watermarkImage || '',
        };
        
        form.reset(initialValues);
        setIsLoading(false);
    }, [config, documentId, documentType, isNew, getFormData, getDefaultTemplate]);

    const onSubmit = (data: DesignSettingsFormData) => {
        if (!config || !documentType) return;
        
        const newDesignSettings: DesignSettings = {
            backgroundColor: data.backgroundColor || '',
            headerImage: data.headerImage || '',
            footerImage: data.footerImage || '',
            backgroundImage: data.backgroundImage || '',
            watermarkImage: data.watermarkImage || '',
        };

        if (isNew) {
            const templateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
            saveConfig({
                ...config,
                profile: {
                    ...config.profile,
                    [templateKey]: newDesignSettings,
                }
            });
            toast({
                title: "Default Design Saved",
                description: `The new design is now the default for all new ${documentType}s.`,
            });
            const returnUrl = `/${documentType}s/new`;
            router.push(returnUrl);

        } else if (document && documentId) {
            if (documentType === 'invoice') {
                updateInvoice(documentId, { design: newDesignSettings });
            } else if (documentType === 'quotation') {
                updateQuotation(documentId, { design: newDesignSettings });
            }
            toast({
                title: "Design Saved",
                description: `The custom design for ${documentType} ${documentId} has been saved.`,
            });
            const returnUrl = `/${documentType}s/${documentId}/edit`;
            router.push(returnUrl);
        } else {
            const templateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
            saveConfig({
                ...config,
                profile: {
                    ...config.profile,
                    [templateKey]: newDesignSettings,
                }
            });
            toast({
                title: "Default Design Saved",
                description: `The new design is now the default for all new ${documentType}s.`,
            });
        }
    };

    // Build final document data for preview with current design settings
    const finalDocumentData = useMemo(() => {
        const formData = getFormData();

        if (document) {
            return { ...document, design: currentDesignSettings };
        }
        
        if (isNew && formData && Object.keys(formData).length > 0) {
            return {
                ...(formData as any),
                [documentType === 'invoice' ? 'invoiceId' : 'quotationId']: 'PREVIEW',
                design: currentDesignSettings,
            };
        }
        
        // Fallback preview data
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
        
        let customerId: string | undefined;
        if (finalDocumentData) {
            customerId = (finalDocumentData as any).customerId;
        }

        if (customerId) {
            return config.customers.find(c => c.id === customerId) || config.customers[0] || null;
        }
        
        return config.customers[0] || null;
    }, [config, finalDocumentData]);

    // Generate a unique key for the preview to force re-render when design changes
    const designKey = useMemo(() => 
        JSON.stringify(currentDesignSettings),
        [currentDesignSettings]
    );

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    const returnUrl = isNew ? `/${documentType}s/new` : (documentId ? `/${documentType}s/${documentId}/edit` : `/${documentType}s`);

    const hasContentForPreview = finalDocumentData && previewCustomer;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] h-full">
            <div className="lg:col-span-1 bg-background border-r h-full flex flex-col">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <h1 className="text-lg font-semibold font-headline capitalize">Customize {documentType || 'Design'}</h1>
                            <p className="text-sm text-muted-foreground">
                                {isNew ? `Customizing default ${documentType} design.` : `Design for ${documentId}`}
                            </p>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-4 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Paintbrush className="h-4 w-4"/> Appearance</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="backgroundColor" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Page Background Color</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="color" 
                                                    {...field} 
                                                    value={field.value || '#FFFFFF'} 
                                                    className="h-10 p-1" 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <Separator />
                                    <ImageUploader 
                                        form={form}
                                        fieldName="backgroundImage"
                                        label="Background Image"
                                        description="A4 aspect ratio recommended. Use a subtle design."
                                        aspect='normal'
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4"/> Layout Images</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="header" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="header"><ImageIcon className="h-4 w-4 mr-1"/>Header</TabsTrigger>
                                            <TabsTrigger value="footer"><FileImage className="h-4 w-4 mr-1"/>Footer</TabsTrigger>
                                            <TabsTrigger value="watermark"><Stamp className="h-4 w-4 mr-1"/>Watermark</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="header" className="pt-6">
                                            <ImageUploader 
                                                form={form} 
                                                fieldName="headerImage" 
                                                label="Header" 
                                                description="2480px wide recommended." 
                                                aspect='wide' 
                                            />
                                        </TabsContent>
                                        <TabsContent value="footer" className="pt-6">
                                            <ImageUploader 
                                                form={form} 
                                                fieldName="footerImage" 
                                                label="Footer" 
                                                description="2480px wide recommended." 
                                                aspect='wide' 
                                            />
                                        </TabsContent>
                                        <TabsContent value="watermark" className="pt-6">
                                            <ImageUploader 
                                                form={form} 
                                                fieldName="watermarkImage" 
                                                label="Watermark" 
                                                description="Semi-transparent PNG works best." 
                                                aspect='normal' 
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="p-4 border-t flex gap-2">
                            <Button type="button" variant="outline" asChild className="flex-1">
                                <Link href={returnUrl}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Link>
                            </Button>
                            <Button type="submit" className="flex-1">Save Design</Button>
                        </div>
                    </form>
                </Form>
            </div>
            <div className="lg:col-span-1 flex items-center justify-center h-full overflow-y-auto p-8 bg-muted/40">
                <div className="w-full max-w-md mx-auto aspect-[8.5/11]">
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
                                />
                            )}
                        </>
                    ) : (
                        <div className="w-full bg-white shadow-lg aspect-[8.5/11] flex items-center justify-center border">
                            <div className="text-center p-8">
                                <h3 className="text-xl font-semibold mb-2">Live Preview</h3>
                                <p className="text-muted-foreground">
                                    {isNew ? "Select a customer and add items on the previous page to see a preview." : "Loading document data..."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default dynamic(() => Promise.resolve(DocumentDesignPage), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
});
