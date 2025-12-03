

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Palette, Trash2, Pencil, MoreVertical, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useBrandsoft, type BrandsoftTemplate } from '@/hooks/use-brandsoft';
import { getBackgroundCSS, Page } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCanvasStore } from '@/stores/canvas-store';
import { useRouter } from 'next/navigation';


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
    const router = useRouter();

    if (!firstPage) return null;
    
    const handleEdit = () => {
        const newPages = JSON.parse(JSON.stringify(template.pages));
        setPages(newPages);
        router.push('/templates/new');
    };

    const { width, height, unit } = firstPage.pageDetails;

    return (
        <Card className="group/card relative flex flex-col">
            <CardContent className="p-0 aspect-[8.5/11] overflow-hidden">
                <TemplatePreview page={firstPage} />
            </CardContent>
            <CardHeader className="p-3">
                 <CardTitle className="text-base font-semibold truncate">{template.name}</CardTitle>
                 <CardDescription className="text-xs">{width}{unit} x {height}{unit}</CardDescription>
            </CardHeader>
            <CardFooter className="p-3 pt-0 mt-auto flex justify-between items-center">
                 <Button variant="outline" size="sm" className="h-8">
                    <Eye className="mr-2 h-3 w-3"/>
                    View
                 </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEdit}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
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
