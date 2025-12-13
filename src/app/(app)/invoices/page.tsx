

'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  PlusCircle,
  LayoutGrid,
  List,
  FilePenLine,
  Trash2,
  FileDown,
  Send,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandsoft, type Company, type Customer, type Invoice } from '@/hooks/use-brandsoft';
import { InvoicePreview, downloadInvoiceAsPdf } from '@/components/invoice-preview';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'accent';
} = {
  Paid: 'success',
  Pending: 'accent',
  Overdue: 'destructive',
  Canceled: 'outline',
  Draft: 'secondary',
};

const ActionsMenu = ({ invoice, onSelectAction }: { invoice: Invoice, onSelectAction: (action: 'view' | 'edit' | 'delete' | 'download' | 'send' | 'markPaid', invoice: Invoice) => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="default" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelectAction('view', invoice)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
            </DropdownMenuItem>
             {(invoice.status === 'Pending' || invoice.status === 'Overdue') && (
                <DropdownMenuItem onClick={() => onSelectAction('markPaid', invoice)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark As Paid
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onSelectAction('edit', invoice)}>
                <FilePenLine className="mr-2 h-4 w-4" />
                Edit Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelectAction('download', invoice)}>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelectAction('send', invoice)}>
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSelectAction('delete', invoice)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);


const InvoiceList = ({invoices, layout, onSelectAction, currencyCode}: {invoices: Invoice[], layout: 'grid' | 'list', onSelectAction: any, currencyCode: string}) => {
    
    const { config } = useBrandsoft();

    if (invoices.length === 0) {
        return (
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                <p className="text-muted-foreground">No invoices found in this category.</p>
            </div>
        )
    }

    return (
        <div className={cn(
            "gap-6",
            layout === 'grid' 
                ? "grid md:grid-cols-2 lg:grid-cols-3" 
                : "flex flex-col"
          )}>
            {invoices.map((invoice) => {
              const customer = config?.customers?.find(c => c.id === invoice.customerId) || null;
              const customerName = customer?.companyName || customer?.name || invoice.customer;
              
              return (
              <Card key={invoice.invoiceId} className={cn(
                "flex flex-col",
                layout === 'list' && "flex-row items-center"
              )}>
                <div className={cn("flex-grow", layout === 'list' && "w-full")}>
                    <CardHeader className={cn(layout === 'list' ? "p-4" : "p-6")}>
                        <CardTitle className={cn("truncate", layout === 'list' && "text-base font-semibold")}>{customerName}</CardTitle>
                        <CardDescription className={cn(layout === 'list' && "text-xs")}>{invoice.invoiceId}</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("flex-grow space-y-2", layout === 'list' ? "p-4 pt-0 md:flex md:items-center md:justify-between md:space-y-0" : "p-6 pt-0")}>
                      <div className={cn("text-2xl font-bold", layout === 'list' && "text-base font-bold w-1/4")}>
                        {invoice.currency || currencyCode}{invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={cn("text-sm text-muted-foreground", layout === 'list' && "text-xs w-1/4")}>
                        <p>Date: {invoice.date}</p>
                        <p>Due: {invoice.dueDate}</p>
                      </div>
                       <div className={cn("flex items-center justify-between", layout === 'list' && "w-auto")}>
                            <Badge variant={statusVariantMap[invoice.status]} className="w-auto">
                                {invoice.status}
                            </Badge>
                            <div className={cn(layout === 'grid' ? "flex" : "hidden")}>
                                <ActionsMenu invoice={invoice} onSelectAction={onSelectAction} />
                            </div>
                       </div>
                    </CardContent>
                </div>
                 <div className={cn(layout === 'list' ? "flex items-center p-4" : "hidden")}>
                    <ActionsMenu invoice={invoice} onSelectAction={onSelectAction} />
                </div>
    
              </Card>
            )})}
          </div>
    )
}

export default function InvoicesPage() {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const { config, deleteInvoice, updateInvoice } = useBrandsoft();
  const router = useRouter();

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const invoices = config?.invoices || [];
  const currencyCode = config?.profile.defaultCurrency || '';
  
  const filteredInvoices = useMemo(() => ({
    all: invoices,
    pending: invoices.filter(inv => inv.status === 'Pending'),
    overdue: invoices.filter(inv => inv.status === 'Overdue'),
    paid: invoices.filter(inv => inv.status === 'Paid'),
    canceled: invoices.filter(inv => inv.status === 'Canceled'),
    draft: invoices.filter(inv => inv.status === 'Draft'),
    generated: invoices.filter(inv => inv.origin === 'quotation'),
  }), [invoices]);


  const handleSelectAction = async (action: 'view' | 'edit' | 'delete' | 'download' | 'send' | 'markPaid', invoice: Invoice) => {
    setSelectedInvoice(invoice);
    switch (action) {
        case 'view':
            setIsViewOpen(true);
            break;
        case 'edit':
            router.push(`/invoices/${invoice.invoiceId.toLowerCase()}/edit`);
            break;
        case 'delete':
            setIsDeleteOpen(true);
            break;
        case 'markPaid':
            setIsMarkPaidOpen(true);
            break;
        case 'download':
            const customer = config?.customers?.find(c => c.id === invoice.customerId) || null;
            if (config && customer) {
                await downloadInvoiceAsPdf({ config, customer, invoiceData: invoice, invoiceId: invoice.invoiceId });
            } else {
                console.error("Missing data for PDF generation.");
            }
            break;
        case 'send':
            // Placeholder for send logic
            alert(`Sending invoice ${invoice.invoiceId}`);
            break;
    }
  };

  const handleDelete = () => {
    if (selectedInvoice) {
      deleteInvoice(selectedInvoice.invoiceId);
      setIsDeleteOpen(false);
      setSelectedInvoice(null);
    }
  };
  
  const handleMarkAsPaid = () => {
    if (selectedInvoice) {
      updateInvoice(selectedInvoice.invoiceId, { status: 'Paid' });
      setIsMarkPaidOpen(false);
      setSelectedInvoice(null);
    }
  };

  const currentPreviewInvoice = config?.invoices.find(inv => inv.invoiceId === selectedInvoice?.invoiceId);
  const selectedCustomer = config?.customers?.find(c => c.id === currentPreviewInvoice?.customerId) || null;


  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Invoice Engine</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your professional invoices here.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={layout} onValueChange={(value) => { if(value) setLayout(value as 'grid' | 'list')}} className="hidden md:flex">
                <ToggleGroupItem value="grid" aria-label="Grid view">
                    <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
            <Button asChild>
              <Link href="/invoices/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
              </Link>
            </Button>
        </div>
      </div>
      
       <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="generated">Generated</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <InvoiceList invoices={filteredInvoices.all} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="draft">
           <InvoiceList invoices={filteredInvoices.draft} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="pending">
           <InvoiceList invoices={filteredInvoices.pending} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
         <TabsContent value="overdue">
           <InvoiceList invoices={filteredInvoices.overdue} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="paid">
            <InvoiceList invoices={filteredInvoices.paid} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="generated">
            <InvoiceList invoices={filteredInvoices.generated} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="canceled">
           <InvoiceList invoices={filteredInvoices.canceled} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
      </Tabs>


       {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-y-auto">
            {currentPreviewInvoice && (
              <InvoicePreview
                config={config}
                customer={selectedCustomer}
                invoiceData={currentPreviewInvoice}
                invoiceId={currentPreviewInvoice.invoiceId}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete invoice
                    "{selectedInvoice?.invoiceId}".
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
    
    {/* Mark as Paid Confirmation Dialog */}
      <AlertDialog open={isMarkPaidOpen} onOpenChange={setIsMarkPaidOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to mark invoice "{selectedInvoice?.invoiceId}" as paid?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAsPaid}>
                    Mark as Paid
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}
