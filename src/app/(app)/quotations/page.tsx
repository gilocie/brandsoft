

'use client';

import { useState, useMemo } from 'react';
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
  FileCheck2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandsoft, type Quotation } from '@/hooks/use-brandsoft';
import { QuotationPreview, downloadQuotationAsPdf } from '@/components/quotation-preview';
import { useToast } from '@/hooks/use-toast';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'accent' | 'primary';
} = {
  Draft: 'secondary',
  Sent: 'primary',
  Accepted: 'success',
  Declined: 'destructive',
};

const ActionsMenu = ({ quotation, onSelectAction }: { quotation: Quotation, onSelectAction: (action: 'view' | 'edit' | 'delete' | 'download' | 'send' | 'accept' | 'decline', quotation: Quotation) => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="default" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelectAction('view', quotation)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => onSelectAction('edit', quotation)}>
                <FilePenLine className="mr-2 h-4 w-4" />
                Edit Quotation
            </DropdownMenuItem>
            {(quotation.status === 'Sent' || quotation.status === 'Draft') && (
                <>
                <DropdownMenuItem onClick={() => onSelectAction('accept', quotation)}>
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    Mark as Accepted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectAction('decline', quotation)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Declined
                </DropdownMenuItem>
                </>
            )}
            <DropdownMenuItem onClick={() => onSelectAction('download', quotation)}>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelectAction('send', quotation)}>
                <Send className="mr-2 h-4 w-4" />
                Send Quotation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSelectAction('delete', quotation)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);


const QuotationList = ({quotations, layout, onSelectAction, currencyCode}: {quotations: Quotation[], layout: 'grid' | 'list', onSelectAction: any, currencyCode: string}) => {
    
    const { config } = useBrandsoft();

    if (quotations.length === 0) {
        return (
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                <p className="text-muted-foreground">No quotations found in this category.</p>
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
            {quotations.map((quotation) => {
              const customer = config?.customers.find(c => c.name === quotation.customer);
              const customerName = customer?.companyName || customer?.name || quotation.customer;
              
              return (
              <Card key={quotation.quotationId} className={cn(
                "flex flex-col",
                layout === 'list' && "flex-row items-center"
              )}>
                <div className={cn("flex-grow", layout === 'list' && "w-full")}>
                    <CardHeader className={cn(layout === 'list' ? "p-4" : "p-6")}>
                        <CardTitle className={cn("truncate", layout === 'list' && "text-base font-semibold")}>{customerName}</CardTitle>
                        <CardDescription className={cn(layout === 'list' && "text-xs")}>{quotation.quotationId}</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("flex-grow space-y-2", layout === 'list' ? "p-4 pt-0 md:flex md:items-center md:justify-between md:space-y-0" : "p-6 pt-0")}>
                      <div className={cn("text-2xl font-bold", layout === 'list' && "text-base font-bold w-1/4")}>
                        {quotation.currency || currencyCode}{quotation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={cn("text-sm text-muted-foreground", layout === 'list' && "text-xs w-1/4")}>
                        <p>Date: {quotation.date}</p>
                        <p>Valid Until: {quotation.validUntil}</p>
                      </div>
                       <div className={cn("flex items-center justify-between", layout === 'list' && "w-auto")}>
                            <Badge variant={statusVariantMap[quotation.status]} className="w-auto">
                                {quotation.status}
                            </Badge>
                            <div className={cn(layout === 'grid' ? "flex" : "hidden")}>
                                <ActionsMenu quotation={quotation} onSelectAction={onSelectAction} />
                            </div>
                       </div>
                    </CardContent>
                </div>
                 <div className={cn(layout === 'list' ? "flex items-center p-4" : "hidden")}>
                    <ActionsMenu quotation={quotation} onSelectAction={onSelectAction} />
                </div>
    
              </Card>
            )})}
          </div>
    )
}

export default function QuotationsPage() {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const { config, deleteQuotation, updateQuotation, addInvoice } = useBrandsoft();
  const router = useRouter();
  const { toast } = useToast();

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const quotations = config?.quotations || [];
  const currencyCode = config?.profile.defaultCurrency || '';
  
  const filteredQuotations = useMemo(() => ({
    all: quotations.filter(q => !q.isRequest),
    draft: quotations.filter(q => q.status === 'Draft' && !q.isRequest),
    sent: quotations.filter(q => q.status === 'Sent' && !q.isRequest),
    accepted: quotations.filter(q => q.status === 'Accepted' && !q.isRequest),
    declined: quotations.filter(q => q.status === 'Declined' && !q.isRequest),
    requests: quotations.filter(q => q.isRequest),
  }), [quotations]);


  const handleSelectAction = async (action: 'view' | 'edit' | 'delete' | 'download' | 'send' | 'accept' | 'decline', quotation: Quotation) => {
    setSelectedQuotation(quotation);
    switch (action) {
        case 'view':
            setIsViewOpen(true);
            break;
        case 'edit':
            router.push(`/quotations/${quotation.quotationId.toLowerCase()}/edit`);
            break;
        case 'delete':
            setIsDeleteOpen(true);
            break;
        case 'accept':
            setIsAcceptOpen(true);
            break;
        case 'decline':
            setIsDeclineOpen(true);
            break;
        case 'download':
            const customer = config?.customers.find(c => c.name === quotation.customer) || null;
            if (config && customer) {
                await downloadQuotationAsPdf({ config, customer, quotationData: quotation, quotationId: quotation.quotationId });
            } else {
                console.error("Missing data for PDF generation.");
            }
            break;
        case 'send':
            alert(`Sending quotation ${quotation.quotationId}`);
            break;
    }
  };

  const handleDelete = () => {
    if (selectedQuotation) {
      deleteQuotation(selectedQuotation.quotationId);
      setIsDeleteOpen(false);
      setSelectedQuotation(null);
    }
  };
  
  const handleAccept = () => {
    if (selectedQuotation) {
      updateQuotation(selectedQuotation.quotationId, { status: 'Accepted' });

      // Convert to invoice
      const newInvoiceData = {
        customer: selectedQuotation.customer,
        customerId: selectedQuotation.customerId,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: selectedQuotation.amount,
        status: 'Pending' as 'Pending',
        subtotal: selectedQuotation.subtotal,
        discount: selectedQuotation.discount,
        tax: selectedQuotation.tax,
        shipping: selectedQuotation.shipping,
        notes: `Based on Quotation #${selectedQuotation.quotationId}\n${selectedQuotation.notes || ''}`,
        lineItems: selectedQuotation.lineItems,
        currency: selectedQuotation.currency,
        design: selectedQuotation.design
      };
      const newInvoice = addInvoice(newInvoiceData);
      
      toast({
        title: "Quotation Accepted!",
        description: `Invoice ${newInvoice.invoiceId} has been created.`,
      });

      setIsAcceptOpen(false);
      setSelectedQuotation(null);
    }
  };
  
  const handleDecline = () => {
    if (selectedQuotation) {
      updateQuotation(selectedQuotation.quotationId, { status: 'Declined' });
      setIsDeclineOpen(false);
      setSelectedQuotation(null);
    }
  };

  const currentPreviewQuotation = config?.quotations.find(q => q.quotationId === selectedQuotation?.quotationId);
  const selectedCustomer = config?.customers.find(c => c.name === currentPreviewQuotation?.customer) || null;

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quotation Engine</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your professional quotations here.
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
              <Link href="/quotations/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Quotation
              </Link>
            </Button>
        </div>
      </div>
      
       <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <QuotationList quotations={filteredQuotations.all} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="requests">
          <QuotationList quotations={filteredQuotations.requests} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="draft">
           <QuotationList quotations={filteredQuotations.draft} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
         <TabsContent value="sent">
           <QuotationList quotations={filteredQuotations.sent} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="accepted">
            <QuotationList quotations={filteredQuotations.accepted} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
        <TabsContent value="declined">
           <QuotationList quotations={filteredQuotations.declined} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
        </TabsContent>
      </Tabs>


       {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Quotation Preview</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-y-auto">
            {currentPreviewQuotation && (
              <QuotationPreview
                config={config}
                customer={selectedCustomer}
                quotationData={currentPreviewQuotation}
                quotationId={currentPreviewQuotation.quotationId}
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
                    This action cannot be undone. This will permanently delete quotation
                    "{selectedQuotation?.quotationId}".
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
    
    {/* Accept Confirmation Dialog */}
      <AlertDialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Acceptance</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to mark quotation "{selectedQuotation?.quotationId}" as accepted? This will automatically generate a new invoice.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAccept}>
                    Accept & Create Invoice
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    
    {/* Decline Confirmation Dialog */}
      <AlertDialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Decline</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to mark quotation "{selectedQuotation?.quotationId}" as declined?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDecline}>
                    Mark as Declined
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}
