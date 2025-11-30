
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Product } from '@/hooks/use-brandsoft.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
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
  DialogTrigger,
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
import { PlusCircle, MoreHorizontal, Eye, FilePenLine, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

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

export default function ProductsPage() {
  const { config, addProduct, updateProduct, deleteProduct } = useBrandsoft();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', price: 0, type: 'product' },
  });

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
  
  const currencySymbol = config ? (currencySymbols[config.profile.defaultCurrency] || config.profile.defaultCurrency) : '$';

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Products & Services</h1>
          <p className="text-muted-foreground">
            Manage your items for faster invoicing.
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config?.products && config.products.length > 0 ? (
                config.products.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{product.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={product.type === 'service' ? 'secondary' : 'outline'} className="capitalize">
                        {product.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{currencySymbol}{product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <ProductActions product={product} onSelectAction={handleSelectAction} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No products or services found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit' : 'Add New'} Product or Service</DialogTitle>
            <DialogDescription>
              Fill in the details for the item.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit">Save Item</Button>
              </DialogFooter>
            </form>
          </Form>
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
                <div className="col-span-2 font-medium">{currencySymbol}{selectedProduct?.price.toFixed(2)}</div>
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

    </div>
  );
}

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: '$',
  AUD: '$',
};

    
