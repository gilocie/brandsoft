'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  MessageSquareQuote,
  Building,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandsoft, type QuotationRequest } from '@/hooks/use-brandsoft';
import { QuotationRequestList } from '@/components/quotations/quotation-request-list';
import { PublicQuotationRequestList } from '@/components/quotations/public-quotation-request-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function QuotationRequestsPage() {
  const { config, updateQuotationRequest, deleteQuotationRequest } = useBrandsoft();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeSubTab, setActiveSubTab] = useState(searchParams.get('subtab') || 'incoming');
  
  // State for request actions
  const [isRequestViewOpen, setIsRequestViewOpen] = useState(false);
  const [isRequestDeleteOpen, setIsRequestDeleteOpen] = useState(false);
  const [isRequestCloseOpen, setIsRequestCloseOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null);

  const currentUserId = useMemo(() => {
    if (!config || !config.brand) return null;
    const myCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
    return myCompany?.id || null;
  }, [config]);


  const filteredRequests = useMemo(() => {
    if (!config || !currentUserId) {
        return { incoming: [], outgoing: [], responses: [] };
    }
    
    // INCOMING: Requests from OTHER businesses asking ME to send quotation
    const incomingRequests = config.incomingRequests || [];

    // OUTGOING: Requests I sent to suppliers
    const myRequests = config.outgoingRequests || [];

    // RESPONSES: Quotations I received from suppliers for my outgoing requests
    const myOutgoingRequestIds = myRequests.map(q => q.id);
    const responses = config.requestResponses?.filter(
      quote => quote.requestId && myOutgoingRequestIds.includes(quote.requestId)
    ) || [];

    return {
      incoming: incomingRequests,
      outgoing: myRequests,
      responses: responses,
    }
  }, [config, currentUserId]);
  
  const selectedRequesterInfo = useMemo(() => {
    if (!config || !selectedRequest) return null;

    let logo: string | undefined;
    let name: string | undefined;

    if (config.companies) {
        const company = config.companies.find(c => c.id === selectedRequest.requesterId);
        if (company) {
            logo = company.logo;
            name = company.companyName;
        }
    }

    if (!logo && selectedRequest.requesterId === currentUserId) {
        logo = config.brand.logo;
        name = config.brand.businessName;
    }

    if (!name) name = selectedRequest.requesterName;

    if (!logo && name && config.companies) {
        const matchingCompany = config.companies.find(c => c.companyName === name);
        if (matchingCompany) {
            logo = matchingCompany.logo;
        }
    }

    if (!logo) logo = selectedRequest.requesterLogo;

    return { logo, name };
  }, [config, selectedRequest, currentUserId]);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('subtab', activeSubTab);
    router.replace(`/quotation-requests?${params.toString()}`, { scroll: false });
  }, [activeSubTab, router, searchParams]);


  const handleRequestAction = (action: 'view' | 'edit' | 'delete' | 'close', request: QuotationRequest) => {
    setSelectedRequest(request);
    switch (action) {
        case 'view':
             setIsRequestViewOpen(true);
            break;
        case 'edit':
            router.push(`/quotation-requests/${request.id}/edit`);
            break;
        case 'delete':
            setIsRequestDeleteOpen(true);
            break;
        case 'close':
            setIsRequestCloseOpen(true);
            break;
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


  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Requests</h1>
          <p className="text-muted-foreground">
            Manage incoming and outgoing quotation requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/quotation-requests/new">
                <MessageSquareQuote className="mr-2 h-4 w-4" /> Request a Quotation
              </Link>
            </Button>
        </div>
      </div>
      
       <Tabs defaultValue={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList>
                <TabsTrigger value="incoming">Incoming ({filteredRequests.incoming.length})</TabsTrigger>
                <TabsTrigger value="outgoing">Outgoing ({filteredRequests.outgoing.length})</TabsTrigger>
                <TabsTrigger value="response">Response ({filteredRequests.responses.length})</TabsTrigger>
                <TabsTrigger value="sorted">Sorted</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="favourites">Favourites</TabsTrigger>
            </TabsList>
            <TabsContent value="incoming" className="pt-4">
                 <PublicQuotationRequestList 
                    requests={filteredRequests.incoming}
                    currentUserId={currentUserId}
                />
            </TabsContent>
             <TabsContent value="outgoing" className="pt-4">
                 <QuotationRequestList requests={filteredRequests.outgoing} onSelectAction={handleRequestAction} />
            </TabsContent>
            <TabsContent value="response" className="pt-4">
                {filteredRequests.responses.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRequests.responses.map((quote) => {
                            const relatedRequest = config?.outgoingRequests?.find(r => r.id === quote.requestId);
                            const supplier = config?.companies.find(c => c.id === quote.senderId) || 
                                           config?.customers.find(c => c.id === quote.senderId);
                            
                            return (
                                <div key={quote.quotationId} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={supplier?.logo} />
                                            <AvatarFallback>
                                                <Building className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{supplier?.companyName || supplier?.name || 'Unknown Supplier'}</h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                Re: {relatedRequest?.title || 'Request'}
                                            </p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Quote ID:</span>
                                            <span className="font-medium">{quote.quotationId}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Amount:</span>
                                            <span className="font-semibold">{quote.currency} {quote.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Date:</span>
                                            <span>{new Date(quote.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Button asChild className="w-full" size="sm">
                                        <Link href={`/quotations/${quote.quotationId.toLowerCase()}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                        <p className="text-muted-foreground">No responses yet. Responses to your requests will appear here.</p>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="sorted" className="pt-4">
                <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                    <p className="text-muted-foreground">Requests you've marked as "sorted" will appear here.</p>
                </div>
            </TabsContent>
            <TabsContent value="expired" className="pt-4">
                <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                    <p className="text-muted-foreground">Expired requests will appear here.</p>
                </div>
            </TabsContent>
            <TabsContent value="favourites" className="pt-4">
                <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                    <p className="text-muted-foreground">Your favourite requests will appear here.</p>
                </div>
            </TabsContent>
        </Tabs>

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
