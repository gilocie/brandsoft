
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Customer } from '@/hooks/use-brandsoft.tsx';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  customerType: z.enum(['personal', 'company']).default('personal'),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
  vatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
});

type CustomerFormData = z.infer<typeof formSchema>;

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
        companyAddress: ''
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    // We can decide how to map this to the single Customer object.
    // For now, let's just combine the names if it's a company.
    const customerToSave = {
        name: data.customerType === 'company' ? `${data.companyName} (${data.name})` : data.name,
        email: data.email,
        phone: data.phone,
        address: data.customerType === 'company' ? data.companyAddress : data.address,
    };
    addCustomer(customerToSave);
    form.reset();
    setFormStep(1);
    setCustomerType('personal');
    setIsDialogOpen(false);
  };

  const handleNextStep = async () => {
    const isValid = await form.trigger(['name', 'email', 'phone', 'address']);
    if (isValid) {
        if (customerType === 'company') {
            setFormStep(2);
        } else {
            form.handleSubmit(onSubmit)();
        }
    }
  }

  const handleCustomerTypeChange = (value: 'personal' | 'company') => {
    if (value) {
        setCustomerType(value);
        form.setValue('customerType', value);
        if (value === 'personal') {
            setFormStep(1); // always go back to step 1 for personal
        }
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
                    <ToggleGroupItem value="personal">Personal</ToggleGroupItem>
                    <ToggleGroupItem value="company">Company</ToggleGroupItem>
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
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        {customerType === 'personal' && (
                             <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
                            )} />
                        )}
                    </div>
                )}

                {formStep === 2 && customerType === 'company' && (
                     <div className="space-y-4">
                        <h3 className="text-lg font-medium">Company Details</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="companyName" render={({ field }) => (
                                <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="vatNumber" render={({ field }) => (
                                <FormItem><FormLabel>VAT / Tax ID (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                         </div>
                        <FormField control={form.control} name="companyAddress" render={({ field }) => (
                            <FormItem><FormLabel>Company Address (Optional)</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
                        )} />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {config?.customers && config.customers.length > 0 ? (
                config.customers.map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
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
