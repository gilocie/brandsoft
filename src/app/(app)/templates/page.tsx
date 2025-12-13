
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Palette, Trash2, Pencil, Eye, FileJson } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { getBackgroundCSS, getBackgroundStyle, Page, CanvasElement } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvas-store';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { BrandsoftTemplate, Invoice, Customer } from '@/types/brandsoft';


const templateCategories = [
  {
    value: 'invoice',
    label: 'Invoices',
    singular: 'Invoice',
    description: 'Browse and manage your invoice templates.',
  },
  {
    value: 'quotation',
    label: 'Quotations',
    singular: 'Quotation',
    description: 'Browse and manage your quotation templates.',
  },
  {
    value: 'certificate',
    label: 'Certificates',
    singular: 'Certificate',
    description: 'Browse and manage your certificate templates.',
  },
  {
    value: 'id-card',
    label: 'ID Cards',
    singular: 'ID Card',
    description: 'Browse and manage your ID card templates.',
  },
  {
    value: 'marketing',
    label: 'Marketing',
    singular: 'Marketing',
    description: 'Browse and manage your marketing material templates.',
  },
];

const processTextWithData = (text: string, data: any) => {
    if (!text) return '';
    return text.replace(/{{(.*?)}}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value = data;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return match;
            }
        }
        return String(value);
    });
};

export const TemplatePreview = ({ page, liveData }: { page: Page, liveData?: { invoice: Invoice, customer: Customer | null } }) => {
    
    const renderElement = (el: CanvasElement) => {
        let processedProps = { ...el.props };
        if (liveData && el.type === 'text' && el.props.text) {
             processedProps.text = processTextWithData(el.props.text, liveData);
        }

        return (
             <div
                key={el.id}
                style={{
                    position: 'absolute',
                    left: `${(el.x / page.pageDetails.width) * 100}%`,
                    top: `${(el.y / page.pageDetails.height) * 100}%`,
                    width: `${(el.width / page.pageDetails.width) * 100}%`,
                    height: `${(el.height / page.pageDetails.height) * 100}%`,
                    transform: `rotate(${el.rotation}deg)`,
                    backgroundColor: processedProps.backgroundColor || 'transparent',
                    border: processedProps.borderWidth ? `${processedProps.borderWidth}px ${processedProps.borderStyle || 'solid'} ${processedProps.borderColor || '#000'}` : 'none',
                    zIndex: el.zIndex || 1,
                    opacity: processedProps.opacity ?? 1,
                    ...getBackgroundStyle(processedProps),
                }}
            >
                {el.type === 'text' && (
                    <div style={{
                        fontSize: `${(processedProps.fontSize || 12) / 20}px`,
                        color: processedProps.color,
                        fontFamily: processedProps.fontFamily,
                        fontWeight: processedProps.fontWeight,
                        textAlign: processedProps.textAlign,
                        lineHeight: processedProps.lineHeight,
                        letterSpacing: processedProps.letterSpacing,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: processedProps.textAlign,
                        padding: '1px',
                        overflow: 'hidden',
                    }}>
                        {processedProps.text}
                    </div>
                )}
            </div>
        )
    };

    return (
        <div 
            className="w-full h-full bg-white relative overflow-hidden" 
            style={getBackgroundCSS(page.pageDetails)}
        >
            {page.elements.map(renderElement)}
        </div>
    );
};



const TemplateCard = ({ template }: { template: BrandsoftTemplate }) => {
    const firstPage = template.pages[0];
    const { setPages } = useCanvasStore();
    const { config, saveConfig } = useBrandsoft();
    const router = useRouter();
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

    const invoices = useMemo(() => {
        if (!config || template.category !== 'invoice' || !config.invoices) return {};
        return {
            Pending: config.invoices.filter(inv => inv.status === 'Pending'),
            Paid: config.invoices.filter(inv => inv.status === 'Paid'),
            Overdue: config.invoices.filter(inv => inv.status === 'Overdue'),
            Canceled: config.invoices.filter(inv => inv.status === 'Canceled'),
        };
    }, [config, template.category]);
    
    const previewCustomer = useMemo(() => {
        if (!config || !previewInvoice || !config.customers) return null;
        return config.customers.find(c => c.name === previewInvoice.customer) || null;
    }, [config, previewInvoice]);


    if (!firstPage) return null;
    
    const handleEdit = () => {
        const newPages = JSON.parse(JSON.stringify(template.pages));
        setPages(newPages);
        router.push('/templates/new');
    };
    
    const handleDelete = () => {
      if (!config) return;
      const newTemplates = config.templates.filter(t => t.id !== template.id);
      saveConfig({ ...config, templates: newTemplates }, { redirect: false });
      setIsDeleteOpen(false);
    };

    const handleSetAsDefault = () => {
        if (!config) return;
        saveConfig({ ...config, profile: { ...config.profile, defaultInvoiceTemplate: template.id } }, { redirect: false });
        alert(`"${template.name}" has been set as your default invoice template.`);
    };

    const { width, height, unit } = firstPage.pageDetails;

    return (
      <>
        <Card className="group/card relative flex flex-col transition-shadow hover:shadow-lg">
            <CardHeader className="p-3">
                 <CardTitle className="text-base font-semibold truncate text-center">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex-grow flex items-start gap-2">
                <div className="aspect-[8.5/11] w-full overflow-hidden bg-gray-100 border rounded-md">
                    <TemplatePreview page={firstPage} />
                </div>
                <div className="flex flex-col gap-1">
                    <TooltipProvider>
                        <Tooltip><TooltipTrigger asChild><Button variant="default" size="icon" className="h-7 w-7" onClick={() => setIsViewOpen(true)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="default" size="icon" className="h-7 w-7" onClick={handleEdit}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => setIsDeleteOpen(true)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
             <CardFooter className="p-3 pt-0">
                <CardDescription className="text-xs w-full text-center">{width}{unit} x {height}{unit}</CardDescription>
            </CardFooter>
        </Card>
        
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-5xl p-0 h-[85vh] flex flex-col overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full w-full">
                    
                    {/* Preview area with scroll */}
                    <div className="md:col-span-2 bg-muted/50 rounded-l-lg flex items-start justify-center p-4 md:p-8 overflow-y-auto h-full">
                        <div className="aspect-[8.5/11] w-full max-w-md overflow-hidden shadow-xl bg-white ring-1 ring-black/5 my-auto">
                            <TemplatePreview
                                page={firstPage}
                                liveData={previewInvoice && previewCustomer ? { invoice: previewInvoice, customer: previewCustomer } : undefined}
                            />
                        </div>
                    </div>

                    {/* Right sidebar with proper scroll */}
                    <div className="md:col-span-1 flex flex-col h-full border-l bg-background overflow-hidden">
                        {/* Fixed header */}
                        <div className="p-6 flex-shrink-0">
                            <DialogHeader className="text-left mb-4">
                                <DialogTitle className="text-2xl font-bold">{template.name}</DialogTitle>
                                <DialogDescription>{template.description || 'Perfect for your business'}</DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 text-sm">
                                <div className="bg-muted/40 p-4 rounded-lg space-y-2 border">
                                    <p className="flex justify-between"><strong>Category:</strong> <span className="capitalize">{template.category}</span></p>
                                    <p className="flex justify-between"><strong>Created:</strong> {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}</p>
                                    <p className="flex justify-between"><strong>Size:</strong> {width}{unit} x {height}{unit}</p>
                                </div>
                            </div>
                        </div>
                        
                        <Separator className="flex-shrink-0" />
                        
                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {template.category === 'invoice' && config?.invoices && (
                                <div className="space-y-2">
                                     <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 sticky top-0 bg-background py-3 px-6 z-10 border-b">
                                        <FileJson className="h-4 w-4" /> Live Preview Data
                                     </h3>
                                     <div className="px-6">
                                     <Accordion type="multiple" className="w-full">
                                        {Object.entries(invoices).map(([status, invs]) => invs.length > 0 && (
                                            <AccordionItem value={status} key={status}>
                                                <AccordionTrigger className="text-xs py-2 no-underline hover:no-underline">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={status === 'Paid' ? 'success' : status === 'Overdue' ? 'destructive' : 'secondary'} className="w-16 justify-center">{status}</Badge>
                                                        <span>({invs.length})</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                                                        {invs.map((inv: Invoice) => (
                                                            <button key={inv.invoiceId} onClick={() => setPreviewInvoice(inv)} className={cn("w-full text-left p-1.5 rounded-md text-xs hover:bg-muted transition-colors no-underline", previewInvoice?.invoiceId === inv.invoiceId && "bg-muted font-semibold")}>
                                                                {inv.invoiceId}: {inv.customer}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Fixed footer with buttons */}
                        <div className="p-6 pt-4 border-t bg-background flex-shrink-0">
                            <DialogFooter className="flex-col gap-3 sm:space-x-0">
                               <Button className="w-full" onClick={handleSetAsDefault}>Use this template</Button>
                               <Button variant="outline" className="w-full" onClick={handleEdit}>Edit this template</Button>
                            </DialogFooter>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        
         <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete Template</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the "{template.name}" template? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    )
}

export default function TemplatesPage() {
    const { config } = useBrandsoft();

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Template Marketplace</h1>
          <p className="text-muted-foreground">
            Browse, download, and manage your document templates.
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Palette className="mr-2 h-4 w-4" /> Create New Template
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="invoice" className="space-y-4">
        <TabsList>
          {templateCategories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {templateCategories.map((cat) => {
            const templatesForCategory = config?.templates?.filter(t => t.category === cat.value) || [];
            return (
                <TabsContent key={cat.value} value={cat.value}>
                    <Card>
                    <CardHeader>
                        <CardTitle>{cat.label} Templates</CardTitle>
                        <CardDescription>{cat.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {templatesForCategory.length > 0 ? (
                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {templatesForCategory.map(template => (
                                    <TemplateCard key={template.id} template={template} />
                                ))}
                           </div>
                        ) : (
                            <div className="flex h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                                <p className="mb-4 text-muted-foreground">No {cat.label.toLowerCase()} templates yet.</p>
                                <Button asChild>
                                <Link href="/templates/new">
                                    <Palette className="mr-2 h-4 w-4" /> Design {cat.singular}
                                </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                    </Card>
                </TabsContent>
            )
        })}
      </Tabs>
    </div>
  );
}
