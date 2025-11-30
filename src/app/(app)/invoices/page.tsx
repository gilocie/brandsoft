

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogDescription,
  DialogFooter,
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
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useBrandsoft, type Invoice } from '@/hooks/use-brandsoft.tsx';
import { Separator } from '@/components/ui/separator';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive';
} = {
  Paid: 'default',
  Pending: 'secondary',
  Overdue: 'destructive',
  Canceled: 'destructive',
  Draft: 'secondary',
};

const ActionsMenu = ({ invoice, onSelectAction }: { invoice: Invoice, onSelectAction: (action: 'view' | 'edit' | 'delete' | 'download' | 'send', invoice: Invoice) => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary-foreground hover:bg-primary">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelectAction('view', invoice)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
            </DropdownMenuItem>
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


export default function InvoicesPage() {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const { config, deleteInvoice } = useBrandsoft();
  const router = useRouter();

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const invoices = config?.invoices || [];
  const currencyCode = config?.profile.defaultCurrency || '';

  const handleSelectAction = (action: 'view' | 'edit' | 'delete' | 'download' | 'send', invoice: Invoice) => {
    setSelectedInvoice(invoice);
    switch (action) {
        case 'view':
            setIsViewOpen(true);
            break;
        case 'edit':
            router.push(`/invoices/${invoice.invoiceId}/edit`);
            break;
        case 'delete':
            setIsDeleteOpen(true);
            break;
        case 'download':
            // Placeholder for download logic
            alert(`Downloading PDF for ${invoice.invoiceId}`);
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

      <div className={cn(
        "gap-6",
        layout === 'grid' 
            ? "grid md:grid-cols-2 lg:grid-cols-3" 
            : "flex flex-col"
      )}>
        {invoices.map((invoice) => (
          <Card key={invoice.invoiceId} className={cn(
            "flex flex-col",
            layout === 'list' && "flex-row items-center"
          )}>
            <div className={cn("flex-grow", layout === 'list' && "w-full")}>
                <CardHeader className={cn(layout === 'list' && "p-4")}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className={cn(layout === 'list' && "text-base font-semibold")}>{invoice.customer}</CardTitle>
                      <CardDescription className={cn(layout === 'list' && "text-xs")}>{invoice.invoiceId}</CardDescription>
                    </div>
                     <div className={cn(layout === 'grid' ? "flex" : "hidden")}>
                        <ActionsMenu invoice={invoice} onSelectAction={handleSelectAction} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={cn("flex-grow space-y-2", layout === 'list' && "p-4 pt-0 md:flex md:items-center md:justify-between md:space-y-0")}>
                  <div className={cn("text-2xl font-bold", layout === 'list' && "text-base font-bold w-1/4")}>
                    {currencyCode}{invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={cn("text-sm text-muted-foreground", layout === 'list' && "text-xs w-1/4")}>
                    <p>Date: {invoice.date}</p>
                    <p>Due: {invoice.dueDate}</p>
                  </div>
                   <div className={cn(layout === 'list' && "w-1/4")}>
                      <Badge variant={statusVariantMap[invoice.status]} className={cn(layout === 'grid' ? "w-full justify-center" : "w-auto")}>
                        {invoice.status}
                      </Badge>
                   </div>
                </CardContent>
            </div>
             <div className={cn(layout === 'list' ? "flex items-center p-4" : "hidden")}>
                <ActionsMenu invoice={invoice} onSelectAction={handleSelectAction} />
            </div>

            <CardFooter className={cn(layout === 'grid' ? "flex" : "hidden")}>
              {/* The duplicate badge was here and has been removed */}
            </CardFooter>
          </Card>
        ))}
      </div>

       {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceId}</DialogTitle>
            <DialogDescription>To: {selectedInvoice?.customer}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              {selectedInvoice && <Badge variant={statusVariantMap[selectedInvoice.status]}>{selectedInvoice.status}</Badge>}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Date</span>
              <span>{selectedInvoice?.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span>{selectedInvoice?.dueDate}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{currencyCode}{selectedInvoice?.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{currencyCode}{selectedInvoice?.discount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{currencyCode}{selectedInvoice?.tax?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{currencyCode}{selectedInvoice?.shipping?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total Amount</span>
              <span>{currencyCode}{selectedInvoice?.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
    </div>
  );
}

    