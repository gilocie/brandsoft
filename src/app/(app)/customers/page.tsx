
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Customer, type Product } from '@/hooks/use-brandsoft.tsx';
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
import { PlusCircle, ArrowRight, ArrowLeft, Trash2, MoreHorizontal, Eye, FilePenLine } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';

const productAssociationSchema = z.object({
    productId: z.string().min(1, "Product is required"),
});

const formSchema = z.object({
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

const CustomerActions = ({ customer }: { customer: Customer }) => {
    // In a real app, these would trigger modals or navigation
    const handleView = () => console.log('View', customer.id);
    const handleEdit = () => console.log('Edit', customer.id);
    const handleDelete = () => console.log('Delete', customer.id);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleView}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Edit Customer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Customer
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function CustomersPage() {
  const { config, addCustomer } = useBrandsoft();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [customerType, setCustomerType] = useState<'personal' | 'company'>('personal');

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        customerType: 'personal',
        name: '',
        email: '',
        phone: '',
        address: '',
        companyName: '',
        vatNumber: '',
        companyAddress: '',
        associatedProducts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'associatedProducts',
  });

  const onSubmit = (data: CustomerFormData) => {
    const customerToSave: Omit<Customer, 'id' | 'associatedProductIds'> & { associatedProductIds?: string[] } = {
        name: data.customerType === 'company' ? `${data.companyName} (${data.name})` : data.name,
        email: data.email,
        phone: data.phone,
        address: data.customerType === 'company' ? data.companyAddress : data.address,
    };
    if (data.customerType === 'company' && data.associatedProducts) {
        customerToSave.associatedProductIds = data.associatedProducts.map(p => p.productId);
    }

    addCustomer(customerToSave);
    form.reset();
    setFormStep(1);
    setCustomerType('personal');
    setIsDialogOpen(false);
  };

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof CustomerFormData)[] = ['name', 'email'];
    if (customerType === 'company') {
        fieldsToValidate.push('companyName');
    }
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
        if (customerType === 'company') {
            setFormStep(2);
        } else {
            // For personal customer, we need to validate all fields before submitting
            const personalFields: (keyof CustomerFormData)[] = ['phone', 'address'];
            const isPersonalValid = await form.trigger(personalFields);
            if(isPersonalValid) {
                form.handleSubmit(onSubmit)();
            }
        }
    }
  }

  const handleCustomerTypeChange = (value: 'personal' | 'company') => {
    if (value) {
        setCustomerType(value);
        form.setValue('customerType', value);
        // Always reset to step 1 when changing type
        setFormStep(1);
    }
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer profiles here.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); form.reset(); setFormStep(1); setCustomerType('personal'); }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Select customer type and fill in the details.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <ToggleGroup type="single" defaultValue="personal" value={customerType} onValueChange={handleCustomerTypeChange} className="grid grid-cols-2">
                    <ToggleGroupItem value="personal" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Personal</ToggleGroupItem>
                    <ToggleGroupItem value="company" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Company</ToggleGroupItem>
                 </ToggleGroup>
                
                <Separator />
                
                {formStep === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{customerType === 'personal' ? 'Personal Details' : 'Contact Person Details'}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        {customerType === 'personal' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        )}
                        {customerType === 'company' && (
                            <div className="grid grid-cols-1 gap-4">
                                <FormField control={form.control} name="companyName" render={({ field }) => (
                                    <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        )}
                    </div>
                )}

                {formStep === 2 && customerType === 'company' && (
                     <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Company Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <FormField control={form.control} name="vatNumber" render={({ field }) => (
                                    <FormItem><FormLabel>VAT / Tax ID (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="companyAddress" render={({ field }) => (
                                <FormItem className="mt-4"><FormLabel>Company Address (Optional)</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-medium">Contact Person Details</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
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
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  {customerType === 'personal' || formStep === 2 ? (
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
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config?.customers && config.customers.length > 0 ? (
                config.customers.map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <CustomerActions customer={customer} />
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
    </div>
  );
}
