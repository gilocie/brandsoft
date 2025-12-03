

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
import { Palette, Trash2, Pencil, MoreVertical, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useBrandsoft, type BrandsoftTemplate } from '@/hooks/use-brandsoft';
import { getBackgroundCSS, Page } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvas-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';


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

export const TemplatePreview = ({ page }: { page: Page }) => (
    <div 
        className="w-full h-full bg-white relative overflow-hidden" 
        style={getBackgroundCSS(page.pageDetails)}
    >
        {page.elements.map(el => (
            <div
                key={el.id}
                style={{
                    position: 'absolute',
                    left: `${(el.x / page.pageDetails.width) * 100}%`,
                    top: `${(el.y / page.pageDetails.height) * 100}%`,
                    width: `${(el.width / page.pageDetails.width) * 100}%`,
                    height: `${(el.height / page.pageDetails.height) * 100}%`,
                    transform: `rotate(${el.rotation}deg)`,
                    backgroundColor: el.props.backgroundColor || 'transparent',
                    border: el.props.borderWidth ? `${el.props.borderWidth}px ${el.props.borderStyle || 'solid'} ${el.props.borderColor || '#000'}` : 'none',
                }}
            >
                {el.type === 'text' && <span className="text-[4px]">{el.props.text}</span>}
            </div>
        ))}
    </div>
);


const TemplateCard = ({ template }: { template: BrandsoftTemplate }) => {
    const firstPage = template.pages[0];
    const { setPages } = useCanvasStore();
    const { config, saveConfig } = useBrandsoft();
    const router = useRouter();
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
        
        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl p-0">
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="md:col-span-2 bg-muted rounded-l-lg flex items-center justify-center p-8">
                        <div className="aspect-[8.5/11] w-full max-w-md overflow-hidden shadow-lg bg-white">
                          {firstPage && <TemplatePreview page={firstPage} />}
                        </div>
                    </div>
                    <div className="md:col-span-1 p-6 flex flex-col">
                        <div className="flex-grow">
                            <DialogHeader className="text-left mb-4">
                                <DialogTitle className="text-2xl font-bold">{template.name}</DialogTitle>
                                <DialogDescription>{template.description || 'Perfect for you business'}</DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p><strong>Category:</strong> <span className="capitalize">{template.category}</span></p>
                                <p><strong>Created:</strong> {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        
                        <Separator className="my-6"/>

                        <DialogFooter className="flex-col gap-2 items-center justify-center">
                           <Button className="w-full" onClick={handleSetAsDefault}>Use this template</Button>
                           <Button variant="outline" className="w-full" onClick={handleEdit}>Edit this template</Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation */}
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
    <div className="container mx-auto space-y-6">
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
