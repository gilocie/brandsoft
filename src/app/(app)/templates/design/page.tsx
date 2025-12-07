

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type DesignSettings, type Quotation, type Invoice } from '@/hooks/use-brandsoft.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, Layers, Stamp, Trash2, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
    const { config, updateInvoice, updateQuotation } = useBrandsoft();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const documentType = searchParams.get('documentType');
    const documentId = searchParams.get('documentId');

    const [document, setDocument] = useState<Invoice | Quotation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [headerPreview, setHeaderPreview] = useState<string | null>(null);
    const [footerPreview, setFooterPreview] = useState<string | null>(null);
    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
    const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);

    const form = useForm<DesignSettingsFormData>({
        resolver: zodResolver(designSettingsSchema),
        defaultValues: {},
    });

    useEffect(() => {
        if (config && documentType && documentId) {
            let doc;
            if (documentType === 'invoice') {
                doc = config.invoices.find(inv => inv.invoiceId === documentId);
            } else if (documentType === 'quotation') {
                doc = config.quotations.find(q => q.quotationId === documentId);
            }

            if (doc) {
                setDocument(doc);
                const design = doc.design || {};
                const brand = config.brand || {};
                form.reset({
                    backgroundColor: design.backgroundColor || brand.backgroundColor || '#FFFFFF',
                    headerImage: design.headerImage || brand.headerImage || '',
                    footerImage: design.footerImage || brand.footerImage || '',
                    backgroundImage: design.backgroundImage || brand.backgroundImage || '',
                    watermarkImage: design.watermarkImage || brand.watermarkImage || '',
                });
                setHeaderPreview(design.headerImage || brand.headerImage || null);
                setFooterPreview(design.footerImage || brand.footerImage || null);
                setBackgroundPreview(design.backgroundImage || brand.backgroundImage || null);
                setWatermarkPreview(design.watermarkImage || brand.watermarkImage || null);
            }
            setIsLoading(false);
        } else if (config) {
            setIsLoading(false);
        }
    }, [config, documentType, documentId, form]);

    const onSubmit = (data: DesignSettingsFormData) => {
        if (!document || !documentType || !documentId) return;
        
        const newDesignSettings: DesignSettings = data;

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
    };

    if (isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!document) {
        return (
             <div className="h-screen w-screen flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold">Document Not Found</h1>
                <p className="text-muted-foreground">The requested document could not be found.</p>
                <Button asChild className="mt-4"><Link href="/dashboard">Return to Dashboard</Link></Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="flex items-center justify-between gap-4">
                             <div>
                                <h1 className="text-3xl font-bold font-headline capitalize">Design {documentType}</h1>
                                <p className="text-muted-foreground">
                                Customizing design for <span className="font-semibold text-primary">{documentId}</span>. These changes will only apply to this document.
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href={`/${documentType}s/${documentId}/edit`}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Editor</Link>
                            </Button>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5"/> Document Layout & Appearance</CardTitle>
                                <CardDescription>Customize headers, footers, and background elements for this document.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="backgroundColor" render={({ field }) => (
                                    <FormItem className="max-w-xs">
                                        <FormLabel>Page Background Color</FormLabel>
                                        <FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl>
                                        <FormDescription>Overrides the default page color.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <Separator />
                                <Tabs defaultValue="header" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="header">Header</TabsTrigger>
                                        <TabsTrigger value="footer">Footer</TabsTrigger>
                                        <TabsTrigger value="background">Background</TabsTrigger>
                                        <TabsTrigger value="watermark">Watermark</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="header" className="pt-6">
                                        <ImageUploader form={form} fieldName="headerImage" previewState={headerPreview} setPreviewState={setHeaderPreview} label="Header Image" description="Recommended: 2480px wide for A4 headers." aspect='wide' />
                                    </TabsContent>
                                    <TabsContent value="footer" className="pt-6">
                                        <ImageUploader form={form} fieldName="footerImage" previewState={footerPreview} setPreviewState={setFooterPreview} label="Footer Image" description="Recommended: 2480px wide for A4 footers." aspect='wide' />
                                    </TabsContent>
                                    <TabsContent value="background" className="pt-6">
                                        <ImageUploader form={form} fieldName="backgroundImage" previewState={backgroundPreview} setPreviewState={setBackgroundPreview} label="Background Image" description="Recommended: A4 aspect ratio. Use a subtle design." aspect='normal' />
                                    </TabsContent>
                                    <TabsContent value="watermark" className="pt-6">
                                        <ImageUploader form={form} fieldName="watermarkImage" previewState={watermarkPreview} setPreviewState={setWatermarkPreview} label="Watermark Image" description="A semi-transparent PNG image works best." aspect='normal' />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                        
                        <div className="flex justify-end pt-4">
                            <Button type="submit" size="lg">Save Document Design</Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
