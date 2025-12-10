

'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Customer, type Invoice } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
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
import { PlusCircle, ArrowRight, ArrowLeft, Trash2, MoreHorizontal, Eye, FilePenLine, Send, UploadCloud, Download, Search } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  id: z.string().optional(),
  customerType: z.enum(['personal', 'company']).default('personal'),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
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

const ITEMS_PER_PAGE = 20;

export default function CustomersPage() {
  const { config, addCustomer, updateCustomer, deleteCustomer, saveConfig } = useBrandsoft();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { customerType: 'personal' }
  });

  const customerType = form.watch('customerType');

  const filteredCustomers = useMemo(() => {
    let customers = config?.customers || [];
    if (activeTab !== 'all') {
      customers = customers.filter(c => (c.companyName ? 'company' : 'personal') === activeTab);
    }
    if (searchTerm) {
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return customers;
  }, [config?.customers, activeTab, searchTerm]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const handleOpenForm = (customer: Customer | null = null) => {
    setSelectedCustomer(customer);
    if (customer) {
      form.reset({
        id: customer.id,
        customerType: customer.companyName ? 'company' : 'personal',
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        companyName: customer.companyName || '',
        address: customer.address || '',
      });
    } else {
      form.reset({ id: undefined, customerType: 'personal', name: '', email: '', phone: '', companyName: '', address: '' });
    }
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
        companyName: data.customerType === 'company' ? data.companyName : undefined,
        address: data.address,
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
        const header = rows.shift()?.trim().toLowerCase().split(',') || [];
        
        if (!header.includes('name') || !header.includes('email')) {
            toast({ variant: 'destructive', title: 'Invalid CSV Header', description: 'File must contain "name" and "email" columns.' });
            return;
        }

        let importedCount = 0;
        let errorCount = 0;
        const newCustomers: Omit<Customer, 'id'>[] = [];

        rows.forEach((row) => {
            try {
                const values = row.split(',');
                const customerData: { [key: string]: string } = {};
                header.forEach((h, i) => { customerData[h] = values[i]?.trim() || ''; });

                const parsed = formSchema.pick({ name: true, email: true, phone: true, companyName: true, address: true }).safeParse(customerData);

                if (parsed.success) {
                    newCustomers.push({
                      ...parsed.data,
                      customerType: parsed.data.companyName ? 'company' : 'personal'
                    } as Omit<Customer, 'id'>);
                    importedCount++;
                } else {
                    errorCount++;
                }
            } catch {
                errorCount++;
            }
        });
        
        if (newCustomers.length > 0) {
            const currentCustomers = config.customers || [];
            const updatedCustomers = [...currentCustomers, ...newCustomers.map(c => ({...c, id: `CUST-${Date.now()}-${Math.random()}`}))];
            saveConfig({ ...config, customers: updatedCustomers }, { redirect: false });
        }

        toast({
            title: 'Bulk Upload Complete',
            description: `${importedCount} customers imported. ${errorCount > 0 ? `${errorCount} rows failed.` : ''}`,
        });
    };
    reader.readAsText(file);
    setIsBulkUploadOpen(false);
  };
  
  const handleDownloadSample = () => {
    const csvHeader = "name,email,phone,companyName,address\n";
    const csvExample = "John Doe,john@example.com,123-456-7890,,123 Main St\nJane Smith,jane@smith.co,,Smith & Co.,456 Oak Ave\n";
    const csvContent = csvHeader + csvExample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "sample-customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = () => {
    if (!config?.customers || config.customers.length === 0) {
        toast({ variant: "destructive", title: "No Customers to Export" });
        return;
    }
    const csvHeader = "name,email,phone,companyName,address\n";
    const csvRows = config.customers.map(c => `"${c.name}","${c.email}","${c.phone || ''}","${c.companyName || ''}","${c.address || ''}"`).join("\n");
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const customerInvoice = useMemo(() => {
    if (!selectedCustomer || !config?.invoices) return undefined;
    return config.invoices.find(inv => inv.customer === selectedCustomer.name && (inv.status === 'Pending' || inv.status === 'Overdue'));
  }, [selectedCustomer, config]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Customers</h1>
          <p className="text-muted-foreground">Manage your customer profiles here.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportAll}><Download className="mr-2 h-4 w-4" /> Export All</Button>
            <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Customer</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
           <div className="flex items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(0); }}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="company">Company</TabsTrigger>
              </TabsList>
            </Tabs>
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, email, company..." className="pl-10" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}/>
            </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell>{customer.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <CustomerActions customer={customer} onSelectAction={handleSelectAction} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-48">No customers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between pt-4">
                 <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1}>Next</Button>
                </div>
            </CardFooter>
        )}
      </Card>
      
       {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader className="flex-row justify-between items-start">
              <div>
                <DialogTitle>{selectedCustomer ? 'Edit' : 'Add New'} Customer</DialogTitle>
                <DialogDescription>Select customer type and fill in the details.</DialogDescription>
              </div>
               <Button variant="outline" onClick={() => { setIsFormOpen(false); setIsBulkUploadOpen(true); }}><UploadCloud className="mr-2 h-4 w-4" /> Bulk Upload</Button>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="customerType" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleGroup type="single" value={field.value} onValueChange={(value) => { if(value) field.onChange(value); }} className="grid grid-cols-2">
                          <ToggleGroupItem value="personal">Personal</ToggleGroupItem>
                          <ToggleGroupItem value="company">Company</ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                    </FormItem>
                )} />
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{customerType === 'personal' ? 'Personal Details' : 'Company & Contact Details'}</h3>
                    {customerType === 'company' && ( <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/> )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{customerType === 'company' ? 'Contact Person Name' : 'Full Name'}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{customerType === 'company' ? 'Contact Person Email' : 'Email'}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                     <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                     <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Customer</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
      </Dialog>
      
        {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Customers</DialogTitle>
            <DialogDescription>Upload a CSV with columns: `name`, `email`, `phone`, `companyName`, `address`.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="flex items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleBulkUpload(file); }} onClick={() => document.getElementById('bulk-upload-input')?.click()}>
                <input type="file" id="bulk-upload-input" accept=".csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleBulkUpload(file); }} />
                <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Drag & drop a CSV file here, or click to select</p>
                </div>
            </div>
             <Button variant="default" className="w-full" onClick={handleDownloadSample}><Download className="mr-2 h-4 w-4" /> Download Sample CSV</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>Cancel</Button>
          </DialogFooter>
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
            {customerInvoice && (
                <>
                <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold text-muted-foreground col-span-1">Outstanding</div>
                    <Badge variant={customerInvoice.status === 'Overdue' ? 'destructive' : 'secondary'} className="w-fit col-span-2">{customerInvoice.status} - {config?.profile.defaultCurrency}{customerInvoice.amount.toFixed(2)}</Badge>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold text-muted-foreground col-span-1">Due Date</div>
                    <div className="font-medium col-span-2">{customerInvoice.dueDate}</div>
                </div>
                </>
            )}
          </div>
          <DialogFooter className="justify-between">
            <Button size="sm" disabled={!customerInvoice}>
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
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the customer "{selectedCustomer?.name}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

