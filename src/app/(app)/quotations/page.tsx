
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  PlusCircle,
  LayoutGrid,
  List,
  MessageSquareQuote,
  Building,
  Globe,
  Users,
  Clock,
  Layers,
} from 'lucide-react';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandsoft, type Quotation, type QuotationRequest } from '@/hooks/use-brandsoft';
import { QuotationPreview, downloadQuotationAsPdf } from '@/components/quotation-preview';
import { useToast } from '@/hooks/use-toast';
import { QuotationList } from '@/components/quotations/quotation-list';
import { QuotationRequestList } from '@/components/quotations/quotation-request-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
  
  const selectedRequesterInfo = useMemo(() => {
    if (!config || !selectedRequest) return null;

    let logo: string | undefined;
    let name: string | undefined;

    // 1. Try to find a Company matching the requester ID exactly
    if (config.companies) {
        const company = config.companies.find(c => c.id === selectedRequest.requesterId);
        if (company) {
            logo = company.logo;
            name = company.companyName;
        }
    }

    // 2. If no logo found yet, check if it's the current user
    if (!logo && selectedRequest.requesterId === currentUserId) {
        logo = config.brand.logo;
        name = config.brand.businessName;
    }

    // 3. Fallback names if not found in lists
    if (!name) name = selectedRequest.requesterName;

    // 4. "Smart Link": If we have a name but no logo, try to find a Company with the same name
    if (!logo && name && config.companies) {
        const matchingCompany = config.companies.find(c => c.companyName === name);
        if (matchingCompany) {
            logo = matchingCompany.logo;
        }
    }

    // 5. Final fallback to data stored on the request itself
    if (!logo) logo = selectedRequest.requesterLogo;

    return { logo, name };
  }, [config, selectedRequest, currentUserId]);
  
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
                 <PublicQuotationRequestList searchTerm="" industryFilter="all" townFilter="all" currentUserId={currentUserId} />
            </TabsContent>
             <TabsContent value="outgoing" className="pt-4">
                 <QuotationRequestList requests={filteredQuotations.requestsOutgoing} onSelectAction={handleRequestAction} />
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

      {/* Outgoing Request View Details Dialog */}
      <Dialog open={isRequestViewOpen} onOpenChange={setIsRequestViewOpen}>
        <DialogContent>
            {selectedRequest && (
                <>
                    <DialogHeader>
                        <div className="flex items-start gap-4">
                           <Avatar className="w-12 h-12">
                              <AvatarImage src={selectedRequesterInfo?.logo} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                {selectedRequesterInfo?.name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <DialogTitle>{selectedRequest.title}</DialogTitle>
                                <DialogDescription>
                                    by {selectedRequesterInfo?.name} on {new Date(selectedRequest.date).toLocaleDateString()}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                         {selectedRequest.description && (
                            <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                         )}
                         <Separator />
                        <div>
                             <h3 className="text-sm font-semibold mb-2">Requested Items</h3>
                            <div className="space-y-2">
                                {selectedRequest.items.map((item, index) => (
                                    <div key={index} className="p-3 border rounded-md text-sm">
                                        <div className="flex justify-between">
                                            <p className="font-medium">{item.productName}</p>
                                            <p>Qty: {item.quantity}</p>
                                        </div>
                                        {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {selectedRequest.isPublic && selectedRequest.industries && selectedRequest.industries.length > 0 && (
                            <div className="text-sm">
                                <span className="font-medium">Target Industries:</span>{' '}
                                <span className="text-muted-foreground">{selectedRequest.industries.join(', ')}</span>
                            </div>
                        )}
                         {!selectedRequest.isPublic && selectedRequest.companyIds && (
                            <div>
                                <h3 className="font-semibold text-sm mb-2">Sent To</h3>
                                <div className="space-y-2">
                                    {selectedRequest.companyIds.map(id => {
                                    const company = config?.companies.find(c => c.id === id);
                                    return company ? (
                                        <div key={id} className="flex items-center gap-3 p-2 border rounded-lg text-sm">
                                            <Avatar className="h-6 w-6"><AvatarImage src={company.logo} /><AvatarFallback><Building className="h-4 w-4"/></AvatarFallback></Avatar>
                                            <span>{company.companyName}</span>
                                        </div>
                                    ) : null;
                                    })}
                                </div>
                            </div>
                         )}
                    </div>
                </>
            )}
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
