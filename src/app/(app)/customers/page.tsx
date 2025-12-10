

'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Customer, type Product, type Invoice } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, ArrowRight, ArrowLeft, Trash2, MoreHorizontal, Eye, FilePenLine, Send } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const productAssociationSchema = z.object({
    productId: z.string().min(1, "Product is required"),
});

const formSchema = z.object({
  id: z.string().optional(),
  customerType: z.enum(['personal', 'company']).default('personal'),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
  vatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  associatedProducts: z.array(productAssociationSchema).optional(),
});

type CustomerFormData = z.infer<typeof formSchema>;

const CustomerActions = ({ customer, onSelectAction }: { customer: Customer; onSelectAction: (action: 'view' | 'edit' | 'delete', customer: Customer) => void; }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelectAction('view', customer)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectAction('edit', customer)}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Edit Customer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSelectAction('delete', customer)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Customer
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function CustomersPage() {
  const { config, addCustomer, updateCustomer, deleteCustomer } = useBrandsoft();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formStep, setFormStep] = useState(1);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerType: 'personal',
    }
  });

  const customerType = form.watch('customerType');

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'associatedProducts',
  });
  
  const handleOpenForm = (customer: Customer | null = null) => {
    setSelectedCustomer(customer);
    if (customer) {
      form.reset({
        id: customer.id,
        customerType: customer.companyName ? 'company' : 'personal',
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        companyName: customer.companyName || '',
        vatNumber: customer.vatNumber || '',
        companyAddress: customer.companyAddress || '',
        associatedProductIds: customer.associatedProductIds?.map(id => ({ productId: id })) || [],
      });
    } else {
      form.reset({
          id: undefined,
          customerType: 'personal',
          name: '', 
          email: '', 
          phone: '', 
          address: '',
          companyName: '', 
          vatNumber: '', 
          companyAddress: '',
          associatedProducts: [],
      });
    }
    setFormStep(1);
    setIsFormOpen(true);
  };
  
  const handleSelectAction = (action: 'view' | 'edit' | 'delete', customer: Customer) => {
      setSelectedCustomer(customer);
      if (action === 'view') setIsViewOpen(true);
      if (action === 'edit') handleOpenForm(customer);
      if (action === 'delete') setIsDeleteOpen(true);
  };

  const onSubmit = (data: CustomerFormData) => {
    const customerToSave: Partial<Customer> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        companyName: data.customerType === 'company' ? data.companyName : undefined,
        vatNumber: data.customerType === 'company' ? data.vatNumber : undefined,
        companyAddress: data.customerType === 'company' ? data.companyAddress : undefined,
        associatedProductIds: data.associatedProducts?.map(p => p.productId) || []
    };
    
    if (data.id) {
        updateCustomer(data.id, customerToSave);
    } else {
        addCustomer(customerToSave as Omit<Customer, 'id'>);
    }
    
    setIsFormOpen(false);
  };
  
  const handleDelete = () => {
    if (selectedCustomer) {
        deleteCustomer(selectedCustomer.id);
        setIsDeleteOpen(false);
        setSelectedCustomer(null);
    }
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof CustomerFormData)[] = ['name', 'email'];
    if(customerType === 'company') {
        fieldsToValidate.push('companyName');
    }
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      setFormStep(2);
    }
  }

  const getCustomerInvoice = (customerName: string | undefined): Invoice | undefined => {
    if (!customerName || !config?.invoices) return undefined;
    const customer = config.customers.find(c => c.name === customerName || c.companyName === customerName);
    if (!customer) return undefined;

    return config.invoices.find(
      inv => inv.customer === customer.name && (inv.status === 'Pending' || inv.status === 'Overdue')
    );
  };

  const customerInvoice = useMemo(() => getCustomerInvoice(selectedCustomer?.name), [selectedCustomer, config]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer profiles here.
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config?.customers && config.customers.length > 0 ? (
                config.customers.map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <CustomerActions customer={customer} onSelectAction={handleSelectAction} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? 'Edit' : 'Add New'} Customer</DialogTitle>
              <DialogDescription>
                Select customer type and fill in the details.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleGroup type="single" value={field.value} onValueChange={(value) => { if(value) field.onChange(value); setFormStep(1); }} className="grid grid-cols-2">
                          <ToggleGroupItem value="personal">Personal</ToggleGroupItem>
                          <ToggleGroupItem value="company">Company</ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Separator />
                
                {formStep === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{customerType === 'personal' ? 'Personal Details' : 'Company & Contact Details'}</h3>
                        {customerType === 'company' && (
                             <FormField control={form.control} name="companyName" render={({ field }) => (
                                <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        )}
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>{customerType === 'company' ? 'Contact Person Name' : 'Full Name'}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>{customerType === 'company' ? 'Contact Person Email' : 'Email'}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                )}

                {formStep === 2 && (
                     <div className="space-y-6">
                        {customerType === 'company' && (
                          <div>
                            <h3 className="text-lg font-medium">Company Address & Tax</h3>
                            <div className="space-y-4 mt-2">
                                <FormField control={form.control} name="vatNumber" render={({ field }) => (
                                    <FormItem><FormLabel>VAT / Tax ID (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="companyAddress" render={({ field }) => (
                                    <FormItem><FormLabel>Company Address (Optional)</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                           </div>
                        )}
                        
                        <Separator />
                        <div>
                            <h3 className="text-lg font-medium">{customerType === 'company' ? 'Contact Person Details' : 'Contact Details'}</h3>
                             <div className="space-y-4 mt-2">
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>{customerType === 'company' ? 'Contact Person Address (Optional)' : 'Address (Optional)'}</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                         <Separator />
                        <div>
                            <h3 className="text-lg font-medium">Associated Products</h3>
                            <div className="space-y-2 mt-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`associatedProducts.${index}.productId`}
                                            render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a product" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {config?.products.map((p: Product) => (
                                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ productId: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Product
                            </Button>
                        </div>
                    </div>
                )}
                
                <DialogFooter className="pt-4">
                  {formStep === 2 && (
                    <Button type="button" variant="outline" onClick={() => setFormStep(1)} className="mr-auto">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                  {formStep === 2 ? (
                     <Button type="submit">Save Customer</Button>
                  ) : (
                     <Button type="button" onClick={handleNextStep}>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
      </Dialog>
      
      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.companyName || selectedCustomer?.name}</DialogTitle>
            {selectedCustomer?.companyName && <DialogDescription>{selectedCustomer?.name}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="grid grid-cols-3 gap-2">
                <div className="font-semibold text-muted-foreground col-span-1">Email</div>
                <div className="font-medium col-span-2">{selectedCustomer?.email}</div>
            </div>
             <div className="grid grid-cols-3 gap-2">
                <div className="font-semibold text-muted-foreground col-span-1">Phone</div>
                <div className="font-medium col-span-2">{selectedCustomer?.phone || 'N/A'}</div>
            </div>
             <div className="grid grid-cols-3 gap-2">
                <div className="font-semibold text-muted-foreground col-span-1">Address</div>
                <div className="font-medium col-span-2">{selectedCustomer?.address || 'N/A'}</div>
            </div>
            {selectedCustomer?.companyName && (
              <>
                <Separator />
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-semibold text-muted-foreground col-span-1">Company Address</div>
                  <div className="font-medium col-span-2">{selectedCustomer?.companyAddress || 'N/A'}</div>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                  <div className="font-semibold text-muted-foreground col-span-1">VAT/Tax ID</div>
                  <div className="font-medium col-span-2">{selectedCustomer?.vatNumber || 'N/A'}</div>
                </div>
              </>
            )}

            {selectedCustomer?.associatedProductIds && selectedCustomer.associatedProductIds.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold">Associated Products</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.associatedProductIds.map(id => {
                        const product = config?.products.find(p => p.id === id);
                        return product ? <Badge key={id} variant="secondary">{product.name}</Badge> : null;
                    })}
                  </div>
                </div>
              </>
            )}
            
            <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold">Outstanding Invoice</h4>
                  {customerInvoice ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="font-semibold text-muted-foreground">Invoice Status</div>
                        <Badge variant={customerInvoice.status === 'Overdue' ? 'destructive' : 'secondary'} className="w-fit">{customerInvoice.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="font-semibold text-muted-foreground">Amount Due</div>
                        <div className="font-medium">{config?.profile.defaultCurrency}{customerInvoice.amount.toFixed(2)}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="font-semibold text-muted-foreground">Due Date</div>
                        <div className="font-medium">{customerInvoice.dueDate}</div>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="font-semibold text-muted-foreground">Invoice Status</div>
                      <div className="font-medium text-muted-foreground">No outstanding invoice</div>
                    </div>
                  )}
                </div>
              </>
          </div>
          <DialogFooter className="justify-between">
            <Button size="sm" disabled>
              <Send className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
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
                        This action cannot be undone. This will permanently delete the customer
                        "{selectedCustomer?.name}" and remove their data from our servers.
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

    

    