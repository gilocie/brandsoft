
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Product } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PlusCircle, MoreHorizontal, Eye, FilePenLine, Trash2, FileText, FileBarChart2, UploadCloud, Download, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, 'Price must be at least 0.01.'),
  type: z.enum(['product', 'service']).default('product'),
});
type ProductFormData = z.infer<typeof formSchema>;


const ProductActions = ({ product, onSelectAction }: { product: Product; onSelectAction: (action: 'view' | 'edit' | 'delete', product: Product) => void; }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelectAction('view', product)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectAction('edit', product)}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Edit Item
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSelectAction('delete', product)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Item
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const ITEMS_PER_PAGE = 20;

export default function ProductsPage() {
  const { config, addProduct, updateProduct, deleteProduct, saveConfig } = useBrandsoft();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', price: 0, type: 'product' },
  });

  const filteredProducts = useMemo(() => {
    let products = config?.products || [];
    if (activeTab !== 'all') {
      products = products.filter(p => p.type === activeTab);
    }
    if (searchTerm) {
      products = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return products;
  }, [config?.products, activeTab, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const handleOpenForm = (product: Product | null = null) => {
    setSelectedProduct(product);
    if (product) {
      form.reset(product);
    } else {
      form.reset({ id: undefined, name: '', description: '', price: 0, type: 'product' });
    }
    setIsFormOpen(true);
  };
  
  const handleSelectAction = (action: 'view' | 'edit' | 'delete', product: Product) => {
      setSelectedProduct(product);
      if (action === 'view') setIsViewOpen(true);
      if (action === 'edit') handleOpenForm(product);
      if (action === 'delete') setIsDeleteOpen(true);
  };

  const onSubmit = (data: ProductFormData) => {
    if (data.id) {
      updateProduct(data.id, data);
    } else {
      addProduct(data);
    }
    form.reset({ name: '', description: '', price: 0, type: 'product' });
    setIsFormOpen(false);
  };
  
  const handleDelete = () => {
    if (selectedProduct) {
        deleteProduct(selectedProduct.id);
        setIsDeleteOpen(false);
        setSelectedProduct(null);
    }
  };

  const handleBulkDelete = () => {
    if (!config || selectedProductIds.length === 0) return;
    const newProducts = config.products.filter(p => !selectedProductIds.includes(p.id));
    saveConfig({ ...config, products: newProducts }, { redirect: false });
    toast({
        title: `${selectedProductIds.length} item(s) deleted.`,
    });
    setSelectedProductIds([]);
    setIsBulkDeleteOpen(false);
  }

  const handleBulkUpload = (file: File) => {
    if (!config) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not read the file.' });
            return;
        }

        const rows = text.split('\n').filter(row => row.trim() !== '');
        const header = rows.shift()?.trim().split(',').map(h => h.toLowerCase().trim()) || [];
        
        if (!header.includes('name') || !header.includes('price') || !header.includes('type')) {
            toast({ variant: 'destructive', title: 'Invalid CSV Header', description: 'File must contain name, price, and type columns.' });
            return;
        }

        let importedCount = 0;
        let errorCount = 0;
        const newProducts: Omit<Product, 'id'>[] = [];

        rows.forEach((row, rowIndex) => {
            try {
                const values = row.split(',');
                const productData: Partial<ProductFormData> = {};
                
                header.forEach((h, i) => {
                    (productData as any)[h] = values[i] ? values[i].trim() : '';
                });

                const parsed = formSchema.pick({ name: true, price: true, type: true, description: true }).safeParse(productData);

                if (parsed.success) {
                    newProducts.push(parsed.data);
                    importedCount++;
                } else {
                    errorCount++;
                }
            } catch {
                errorCount++;
            }
        });
        
        if (newProducts.length > 0) {
           const newConfigProducts = [...(config.products || [])];
           newProducts.forEach(p => {
               newConfigProducts.push({ ...p, id: `PROD-${Date.now()}-${Math.random()}` });
           });
           saveConfig({ ...config, products: newConfigProducts }, { redirect: false });
        }

        toast({
            title: 'Bulk Upload Complete',
            description: `${importedCount} products imported. ${errorCount > 0 ? `${errorCount} rows failed.` : ''}`,
        });
    };
    reader.readAsText(file);
    setIsBulkUploadOpen(false);
  };
  
  const handleDownloadSample = () => {
    const csvHeader = "name,description,price,type\n";
    const csvExample = "Sample Product,A great product,99.99,product\nSample Service,An excellent service,49.50,service\n";
    const csvContent = csvHeader + csvExample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "sample-products.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleExportAll = () => {
    if (!config || !config.products || config.products.length === 0) {
        toast({
            variant: "destructive",
            title: "No Products to Export",
            description: "There are no products or services to export.",
        });
        return;
    }
    const csvHeader = "name,description,price,type\n";
    const csvRows = config.products.map(p =>
        `"${p.name.replace(/"/g, '""')}","${(p.description || '').replace(/"/g, '""')}",${p.price},${p.type}`
    ).join("\n");

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "products.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean | 'indeterminate') => {
    setSelectedProductIds(prev => 
        checked ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
        setSelectedProductIds(paginatedProducts.map(p => p.id));
    } else {
        setSelectedProductIds([]);
    }
  };

  const allOnPageSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.includes(p.id));
  const someOnPageSelected = paginatedProducts.some(p => selectedProductIds.includes(p.id)) && !allOnPageSelected;

  const productQueryString = selectedProductIds.join(',');
  
  const currencyCode = config?.profile.defaultCurrency || '';

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        {selectedProductIds.length === 0 && (
            <div>
              <h1 className="text-3xl font-bold font-headline">Products & Services</h1>
              <p className="text-muted-foreground">
                Manage your items for faster invoicing.
              </p>
            </div>
        )}
        <div className="flex items-center gap-2">
            {selectedProductIds.length > 0 ? (
                <>
                    <Button variant="destructive" onClick={() => setIsBulkDeleteOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedProductIds.length})
                    </Button>
                    <Button asChild>
                        <Link href={`/invoices/new?products=${productQueryString}`}>
                            <FileText className="mr-2 h-4 w-4" /> Create Invoice
                        </Link>
                    </Button>
                    <Button asChild variant="secondary">
                         <Link href={`/quotations/new?products=${productQueryString}`}>
                            <FileBarChart2 className="mr-2 h-4 w-4" /> Create Quotation
                        </Link>
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="outline" onClick={handleExportAll}>
                        <Download className="mr-2 h-4 w-4" /> Export All
                    </Button>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                    </Button>
                </>
            )}
        </div>
      </div>
      
       <Card>
        <CardHeader>
           <div className="flex items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(0); }}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="product">Products</TabsTrigger>
                <TabsTrigger value="service">Services</TabsTrigger>
              </TabsList>
            </Tabs>
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                />
            </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] px-4">
                    <Checkbox
                        checked={allOnPageSelected || (someOnPageSelected ? 'indeterminate' : false)}
                        onCheckedChange={handleSelectAll}
                    />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="px-4">
                        <Checkbox
                            checked={selectedProductIds.includes(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked)}
                        />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{product.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={product.type === 'service' ? 'secondary' : 'outline'} className="capitalize">
                        {product.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{currencyCode}{product.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <ProductActions product={product} onSelectAction={handleSelectAction} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-48">
                    No products or services found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between pt-4">
                 <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 0}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= totalPages - 1}
                    >
                        Next
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
           <DialogHeader className="flex-row justify-between items-start">
            <div>
              <DialogTitle>{selectedProduct ? 'Edit' : 'Add New'} Product or Service</DialogTitle>
              <DialogDescription>
                Fill in the details for the item.
              </DialogDescription>
            </div>
            <Button variant="outline" onClick={() => { setIsFormOpen(false); setIsBulkUploadOpen(true); }}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
               <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <ToggleGroup type="single" value={field.value} onValueChange={field.onChange} className="grid grid-cols-2">
                         <ToggleGroupItem value="product">Product</ToggleGroupItem>
                         <ToggleGroupItem value="service">Service</ToggleGroupItem>
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit">Save Item</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Products</DialogTitle>
            <DialogDescription>
              Upload a CSV file with your products. The file should have columns: `name`, `description`, `price`, `type`. The `type` column should be either 'product' or 'service'.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div 
                className="flex items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleBulkUpload(file);
                }}
                onClick={() => document.getElementById('bulk-upload-input')?.click()}
             >
                <input
                    type="file"
                    id="bulk-upload-input"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBulkUpload(file);
                    }}
                />
                <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        Drag & drop a CSV file here, or click to select
                    </p>
                </div>
            </div>
             <Button variant="default" className="w-full" onClick={handleDownloadSample}>
                <Download className="mr-2 h-4 w-4" />
                Download Sample CSV
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
       <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
             <Badge variant={selectedProduct?.type === 'service' ? 'secondary' : 'outline'} className="capitalize w-fit">
                {selectedProduct?.type}
            </Badge>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
                <Label>Price</Label>
                <div className="col-span-2 font-medium">{currencyCode}{selectedProduct?.price.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-3 items-start gap-4">
                <Label className="pt-1">Description</Label>
                <div className="col-span-2 text-muted-foreground">{selectedProduct?.description || 'No description provided.'}</div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the item
                        "{selectedProduct?.name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
       <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedProductIds.length} items?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the selected items from your product list.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
    

    
