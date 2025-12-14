
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogDescription as ShadcnDialogDescription,
} from '@/components/ui/dialog';
import {
  PlusCircle,
  LayoutGrid,
  List,
  MessageSquareQuote,
  Globe,
  Users,
  Clock,
} from 'lucide-react';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandsoft, type Quotation, type QuotationRequest, type Company } from '@/hooks/use-brandsoft';
import { QuotationPreview, downloadQuotationAsPdf } from '@/components/quotation-preview';
import { useToast } from '@/hooks/use-toast';
import { QuotationList } from '@/components/quotations/quotation-list';
import { QuotationRequestList } from '@/components/quotations/quotation-request-list';

export default function QuotationsPage() {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const { config, deleteQuotation, updateQuotation, addInvoice, updateQuotationRequest, deleteQuotationRequest } = useBrandsoft();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [activeSubTab, setActiveSubTab] = useState(searchParams.get('subtab') || 'incoming');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  
  // State for request actions
  const [isRequestViewOpen, setIsRequestViewOpen] = useState(false);
  const [isRequestDeleteOpen, setIsRequestDeleteOpen] = useState(false);
  const [isRequestCloseOpen, setIsRequestCloseOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null);

  const quotations = config?.quotations || [];
  const currencyCode = config?.profile.defaultCurrency || '';
  
  const currentUserId = useMemo(() => {
    if (!config || !config.brand) return 'CUST-DEMO-ME';
    
    const userBusinessName = config.brand.businessName;
    
    const asCompany = config.companies?.find(c => c.companyName === userBusinessName);
    if (asCompany) return asCompany.id;

    const asCustomer = config.customers?.find(c => c.name === userBusinessName);
    if (asCustomer) return asCustomer.id;

    return 'CUST-DEMO-ME';
  }, [config]);


  const filteredQuotations = useMemo(() => {
      const myRequests = (config?.quotationRequests || []).filter(q => q.requesterId === currentUserId);
      const theirRequests = quotations.filter(q => q.isRequest && q.customerId === currentUserId);
      const modernIncomingRequests = (config?.quotationRequests || []).filter(
        q => q.companyIds && q.companyIds.includes(currentUserId)
      );

      return {
        all: quotations.filter(q => !q.isRequest),
        draft: quotations.filter(q => q.status === 'Draft' && !q.isRequest),
        sent: quotations.filter(q => q.status === 'Sent' && !q.isRequest),
        accepted: quotations.filter(q => q.status === 'Accepted' && !q.isRequest),
        declined: quotations.filter(q => q.status === 'Declined' && !q.isRequest),
        requestsIncomingQuotations: theirRequests,
        requestsIncomingModern: modernIncomingRequests,
        requestsOutgoing: myRequests,
    }
  }, [quotations, config?.quotationRequests, currentUserId]);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', activeTab);
    if (activeTab === 'requests') {
        params.set('subtab', activeSubTab);
    } else {
        params.delete('subtab');
    }
    // Use replace to avoid adding to browser history for tab changes
    router.replace(`/quotations?${params.toString()}`, { scroll: false });
  }, [activeTab, activeSubTab, router, searchParams]);


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
            const customer = config?.customers.find(c => c.id === quotation.customerId) || null;
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
  
  const handleRequestAction = (action: 'view' | 'edit' | 'delete' | 'close', request: QuotationRequest) => {
    setSelectedRequest(request);
    switch (action) {
        case 'view':
            setIsRequestViewOpen(true);
            break;
        case 'edit':
            router.push(`/quotations/request/${request.id}/edit`);
            break;
        case 'delete':
            setIsRequestDeleteOpen(true);
            break;
        case 'close':
            setIsRequestCloseOpen(true);
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
        design: selectedQuotation.design,
        origin: 'quotation' as 'quotation',
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

  const handleCloseRequest = () => {
    if (selectedRequest) {
      updateQuotationRequest(selectedRequest.id, { status: 'closed' });
      setIsRequestCloseOpen(false);
      setSelectedRequest(null);
    }
  };

  const handleDeleteRequest = () => {
    if (selectedRequest) {
      deleteQuotationRequest(selectedRequest.id);
      setIsRequestDeleteOpen(false);
      setSelectedRequest(null);
    }
  };

  const currentPreviewQuotation = config?.quotations.find(q => q.quotationId === selectedQuotation?.quotationId);
  const selectedCompany = config?.customers.find(c => c.id === currentPreviewQuotation?.customerId) || null;

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
      
       <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        
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
          <Tabs defaultValue={activeSubTab} onValueChange={setActiveSubTab}>
             <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="incoming">Incoming ({filteredQuotations.requestsIncomingQuotations.length + filteredQuotations.requestsIncomingModern.length})</TabsTrigger>
                    <TabsTrigger value="outgoing">Outgoing ({filteredQuotations.requestsOutgoing.length})</TabsTrigger>
                </TabsList>
                 <Button asChild variant="secondary" className="bg-accent hover:bg-accent/90 text-primary-foreground">
                  <Link href="/quotations/request">
                    <MessageSquareQuote className="mr-2 h-4 w-4" /> Request a Quotation
                  </Link>
                </Button>
            </div>
            <TabsContent value="incoming" className="pt-4 space-y-6">
                 <QuotationList quotations={filteredQuotations.requestsIncomingQuotations} layout={layout} onSelectAction={handleSelectAction} currencyCode={currencyCode} />
                 <QuotationRequestList requests={filteredQuotations.requestsIncomingModern} layout={layout} onSelectAction={handleRequestAction} />
            </TabsContent>
             <TabsContent value="outgoing" className="pt-4">
                 <QuotationRequestList requests={filteredQuotations.requestsOutgoing} layout={layout} onSelectAction={handleRequestAction} />
            </TabsContent>
          </Tabs>
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
            {currentPreviewQuotation && selectedCompany && (
              <QuotationPreview
                config={config}
                customer={selectedCompany}
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
                    Accept &amp; Create Invoice
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

    {/* Request View Dialog */}
    <Dialog open={isRequestViewOpen} onOpenChange={setIsRequestViewOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{selectedRequest?.title}</DialogTitle>
                <ShadcnDialogDescription>
                    Request sent on {selectedRequest ? new Date(selectedRequest.date).toLocaleDateString() : ''}. 
                    <span className="flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        Expires on {selectedRequest ? new Date(selectedRequest.dueDate).toLocaleDateString() : ''}.
                    </span>
                </ShadcnDialogDescription>
            </DialogHeader>
            {selectedRequest && (
                <div className="space-y-4 py-4">
                    {selectedRequest.description && (
                        <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                    )}
                    <Card>
                        <CardHeader className="pb-2">
                           <CardTitle className="text-sm">Requested Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm">
                                {selectedRequest.items.map((item, index) => (
                                    <li key={index} className="flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0">
                                        <span className="font-semibold w-1/3">{item.productName}</span>
                                        <p className="text-xs text-muted-foreground w-1/3 text-center">{item.description}</p>
                                        <span className="w-1/3 text-right">Qty: {item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    <div className="flex items-center gap-2 text-sm">
                        {selectedRequest.isPublic ? <Globe className="h-4 w-4 text-blue-500" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                        <span>{selectedRequest.isPublic ? 'Public Request' : `Sent to ${selectedRequest.companyIds?.length || 0} supplier(s)`}</span>
                    </div>
                     {!selectedRequest.isPublic && selectedRequest.companyIds && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Sent To</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRequest.companyIds.map(id => {
                                        const company = config?.companies.find(c => c.id === id);
                                        return company ? (
                                            <Button key={id} asChild variant="secondary" size="sm" className="hover:bg-accent hover:text-white">
                                                <Link href={`/marketplace/${company.id}`}>{company.companyName}</Link>
                                            </Button>
                                        ) : null;
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </DialogContent>
    </Dialog>

    {/* Request Delete Confirmation Dialog */}
    <AlertDialog open={isRequestDeleteOpen} onOpenChange={setIsRequestDeleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Quotation Request?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the request "{selectedRequest?.title}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRequest} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {/* Request Close Confirmation Dialog */}
    <AlertDialog open={isRequestCloseOpen} onOpenChange={setIsRequestCloseOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Close Quotation Request?</AlertDialogTitle>
                <AlertDialogDescription>
                    Marking this request as closed will prevent new suppliers from responding.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCloseRequest}>
                    Mark as Closed
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </div>
  );
}

    
