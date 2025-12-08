

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type DesignSettings, type Quotation, type Invoice } from '@/hooks/use-brandsoft.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, Layers, Stamp, Trash2, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useFormState } from '@/hooks/use-form-state';
import { InvoicePreview } from '@/components/invoice-preview';
import { QuotationPreview } from '@/components/quotation-preview';

const designSettingsSchema = z.object({
  backgroundColor: z.string().optional(),
  headerImage: z.string().optional(),
  footerImage: z.string().optional(),
  backgroundImage: z.string().optional(),
  watermarkImage: z.string().optional(),
});

type DesignSettingsFormData = z.infer<typeof designSettingsSchema>;

const ImageUploader = ({ form, fieldName, previewState, setPreviewState, label, description, aspect }: { form: any, fieldName: keyof DesignSettingsFormData, previewState: string | null, setPreviewState: (url: string | null) => void, label: string, description: string, aspect: 'wide' | 'normal' }) => {
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


export default function DocumentDesignPage() {
    const { config, updateInvoice, updateQuotation, saveConfig } = useBrandsoft();
    const { getFormData } = useFormState();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const documentType = searchParams.get('documentType');
    const documentId = searchParams.get('documentId');
    const isNew = searchParams.get('isNew') === 'true';

    const [document, setDocument] = useState<Invoice | Quotation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [headerPreview, setHeaderPreview] = useState<string | null>(null);
    const [footerPreview, setFooterPreview] = useState<string | null>(null);
    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
    const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);

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

    useEffect(() => {
        if (!config) return;

        let doc: Invoice | Quotation | null = null;
        let design: Partial<DesignSettings> = {};
        const brand = config.brand || {};
        
        if (isNew) {
            const newDocumentFormData = getFormData();
            if (newDocumentFormData) {
                const docTypeKey = documentType === 'invoice' ? 'invoiceId' : 'quotationId';
                 doc = {
                    ...(newDocumentFormData as any),
                    [docTypeKey]: 'PREVIEW',
                };
            }
        }
        
        if (!doc && !isNew) {
            if (documentType === 'invoice' && documentId) {
                doc = config.invoices.find(inv => inv.invoiceId === documentId) || null;
            } else if (documentType === 'quotation' && documentId) {
                doc = config.quotations.find(q => q.quotationId === documentId) || null;
            }
        }
        
        if (doc) {
            setDocument(doc);
            design = (doc as any).design || {};
        } else if (!isNew) {
             const defaultTemplateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : documentType === 'quotation' ? 'defaultQuotationTemplate' : null;
             if (defaultTemplateKey && typeof config.profile[defaultTemplateKey] === 'object') {
                design = config.profile[defaultTemplateKey] || {};
             }
        }

        const initialValues = {
            backgroundColor: design.backgroundColor || brand.backgroundColor || '#FFFFFF',
            headerImage: design.headerImage || brand.headerImage || '',
            footerImage: design.footerImage || brand.footerImage || '',
            backgroundImage: design.backgroundImage || brand.backgroundImage || '',
            watermarkImage: design.watermarkImage || brand.watermarkImage || '',
        };
        
        form.reset(initialValues);
        setHeaderPreview(initialValues.headerImage);
        setFooterPreview(initialValues.footerImage);
        setBackgroundPreview(initialValues.backgroundImage);
        setWatermarkPreview(initialValues.watermarkImage);
        setIsLoading(false);
    }, [config, documentId, documentType, isNew, form, getFormData]);

    const onSubmit = (data: DesignSettingsFormData) => {
        if (!config) return;
        
        const newDesignSettings: DesignSettings = data;

        if (isNew) {
            const templateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : 'defaultQuotationTemplate';
             saveConfig({
                ...config,
                profile: {
                    ...config.profile,
                    [templateKey]: newDesignSettings as any,
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
        }
    };
    
    const watchedValues = form.watch();
    const livePreviewConfig = useMemo(() => {
        if (!config) return null;
        
        const currentDesign: DesignSettings = {
            backgroundColor: watchedValues.backgroundColor,
            headerImage: watchedValues.headerImage,
            footerImage: watchedValues.footerImage,
            backgroundImage: watchedValues.backgroundImage,
            watermarkImage: watchedValues.watermarkImage,
        };

        const documentSpecificDesign = (document as any)?.design || {};
        
        const defaultTemplateKey = documentType === 'invoice' ? 'defaultInvoiceTemplate' : documentType === 'quotation' ? 'defaultQuotationTemplate' : null;
        const defaultTemplate = defaultTemplateKey ? config.profile[defaultTemplateKey] : {};

        return {
            ...config,
            brand: {
                ...config.brand,
                backgroundColor: currentDesign.backgroundColor ?? documentSpecificDesign.backgroundColor ?? defaultTemplate?.backgroundColor ?? config.brand.backgroundColor,
                headerImage: currentDesign.headerImage ?? documentSpecificDesign.headerImage ?? defaultTemplate?.headerImage ?? config.brand.headerImage,
                footerImage: currentDesign.footerImage ?? documentSpecificDesign.footerImage ?? defaultTemplate?.footerImage ?? config.brand.footerImage,
                backgroundImage: currentDesign.backgroundImage ?? documentSpecificDesign.backgroundImage ?? defaultTemplate?.backgroundImage ?? config.brand.backgroundImage,
                watermarkImage: currentDesign.watermarkImage ?? documentSpecificDesign.watermarkImage ?? defaultTemplate?.watermarkImage ?? config.brand.watermarkImage,
            },
        };
    }, [config, watchedValues, document, documentType]);
    
    const previewCustomer = useMemo(() => {
        if(!config || !document) return null;
        const customerId = (document as any).customerId;
        return config.customers.find(c => c.id === customerId) || config.customers[0] || null;
    }, [config, document]);


    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    const returnUrl = isNew ? `/${documentType}s/new` : (documentId ? `/${documentType}s/${documentId}/edit` : `/${documentType}s`);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            <div className="lg:col-span-1 bg-background border-r h-full flex flex-col">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <div className="p-4 border-b">
                                <h1 className="text-lg font-semibold font-headline capitalize">Customize {documentType || 'Design'}</h1>
                            <p className="text-sm text-muted-foreground">
                                {isNew ? "Customizing default design." : `Design for ${documentId}`}
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
                                            <FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </CardContent>
                            </Card>
                            <Card>
                                    <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4"/> Layout Images</CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <Tabs defaultValue="header" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4">
                                            <TabsTrigger value="header">Header</TabsTrigger>
                                            <TabsTrigger value="footer">Footer</TabsTrigger>
                                            <TabsTrigger value="background">BG</TabsTrigger>
                                            <TabsTrigger value="watermark">Watermark</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="header" className="pt-6">
                                            <ImageUploader form={form} fieldName="headerImage" previewState={headerPreview} setPreviewState={setHeaderPreview} label="Header" description="2480px wide recommended." aspect='wide' />
                                        </TabsContent>
                                        <TabsContent value="footer" className="pt-6">
                                            <ImageUploader form={form} fieldName="footerImage" previewState={footerPreview} setPreviewState={setFooterPreview} label="Footer" description="2480px wide recommended." aspect='wide' />
                                        </TabsContent>
                                        <TabsContent value="background" className="pt-6">
                                            <ImageUploader form={form} fieldName="backgroundImage" previewState={backgroundPreview} setPreviewState={setBackgroundPreview} label="Background" description="A4 aspect ratio recommended." aspect='normal' />
                                        </TabsContent>
                                        <TabsContent value="watermark" className="pt-6">
                                            <ImageUploader form={form} fieldName="watermarkImage" previewState={watermarkPreview} setPreviewState={setWatermarkPreview} label="Watermark" description="Semi-transparent PNG works best." aspect='normal' />
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
            <div className="lg:col-span-2 flex items-center justify-center h-full overflow-y-auto p-8 bg-muted/40">
                    {document ? (
                    <>
                        {documentType === 'invoice' && (
                            <InvoicePreview
                                config={livePreviewConfig}
                                customer={previewCustomer}
                                invoiceData={document as Invoice}
                                invoiceId={(document as Invoice).invoiceId}
                            />
                        )}
                        {documentType === 'quotation' && (
                            <QuotationPreview
                                config={livePreviewConfig}
                                customer={previewCustomer}
                                quotationData={document as Quotation}
                                quotationId={(document as Quotation).quotationId}
                            />
                        )}
                    </>
                ) : (
                     <div className="w-full max-w-[8.5in] mx-auto bg-white shadow-lg aspect-[8.5/11] flex items-center justify-center border">
                        <div className="text-center p-8">
                          <h3 className="text-xl font-semibold mb-2">Live Preview</h3>
                          <p className="text-muted-foreground">Select a customer and add items on the previous page to see a preview.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
