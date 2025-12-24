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
  MessageSquareQuote,
  Building,
  Clock,
  Star,
  CheckCircle,
  Inbox,
  Send,
  MessageCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandsoft, type QuotationRequest, type Quotation } from '@/hooks/use-brandsoft';
import { QuotationRequestList } from '@/components/quotations/quotation-request-list';
import { PublicQuotationRequestList } from '@/components/quotations/public-quotation-request-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function QuotationRequestsPage() {
  const { config, updateQuotationRequest, deleteQuotationRequest } = useBrandsoft();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeSubTab, setActiveSubTab] = useState(searchParams.get('subtab') || 'incoming');
  
  const [isRequestDeleteOpen, setIsRequestDeleteOpen] = useState(false);
  const [isRequestCloseOpen, setIsRequestCloseOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null);

  // Get current user's company ID
  const currentUserId = useMemo(() => {
    if (!config || !config.brand) return null;
    const myCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
    return myCompany?.id || null;
  }, [config]);

  // Get current user's industry
  const myIndustry = useMemo(() => {
    if (!config || !currentUserId) return null;
    const myCompany = config.companies?.find(c => c.id === currentUserId);
    return myCompany?.industry || null;
  }, [config, currentUserId]);

  // Filter and categorize requests
  const filteredRequests = useMemo(() => {
    if (!config || !currentUserId) {
      return { 
        incoming: [], 
        outgoing: [], 
        responses: [], 
        expired: [], 
        sorted: [], 
        favourites: [] 
      };
    }
    
    const now = new Date();
    
    // INCOMING: Requests from OTHER businesses that I can respond to
    const allIncoming = (config.incomingRequests || []).filter(req => {
      // Don't show my own requests in incoming
      if (req.requesterId === currentUserId) return false;
      
      // Check if request is still open and not expired
      const isOpen = req.status === 'open' && new Date(req.dueDate) >= now;
      if (!isOpen) return false;
      
      if (req.isPublic) {
        // Public request - show to everyone
        if (!req.industries || req.industries.length === 0) return true;
        // If industries specified, still show (for demo purposes)
        return true;
      } else {
        // Private request - show only if I'm targeted
        return req.companyIds?.includes(currentUserId) || false;
      }
    });

    // OUTGOING: Requests I sent to suppliers
    const allOutgoing = config.outgoingRequests || [];
    const myOutgoing = allOutgoing.filter(req => req.requesterId === currentUserId);
    const activeOutgoing = myOutgoing.filter(req => 
      req.status === 'open' && new Date(req.dueDate) >= now
    );

    // EXPIRED
    const expiredOutgoing = myOutgoing.filter(req => 
      new Date(req.dueDate) < now || req.status === 'expired' || req.status === 'closed'
    );

    // RESPONSES: Quotations I received from suppliers for my outgoing requests
    const myOutgoingRequestIds = myOutgoing.map(q => q.id);
    const responses = (config.requestResponses || []).filter(
      (quote: Quotation) => quote.requestId && myOutgoingRequestIds.includes(quote.requestId)
    );

    // SORTED: My requests marked as sorted
    const sorted = myOutgoing.filter(req => req.isSorted);

    // FAVOURITES: Any requests I've marked as favourite
    const favourites = [...allIncoming, ...myOutgoing].filter(req => req.isFavourite);

    return {
      incoming: allIncoming,
      outgoing: activeOutgoing,
      responses,
      expired: expiredOutgoing,
      sorted,
      favourites,
    };
  }, [config, currentUserId, myIndustry]);
  
  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('subtab', activeSubTab);
    router.replace(`/quotation-requests?${params.toString()}`, { scroll: false });
  }, [activeSubTab, router, searchParams]);

  const handleRequestAction = (action: 'view' | 'edit' | 'delete' | 'close' | 'favourite' | 'sort', request: QuotationRequest) => {
    setSelectedRequest(request);
    switch (action) {
      case 'view':
        router.push(`/quotation-requests/${request.id}`);
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
      case 'favourite':
        updateQuotationRequest(request.id, { isFavourite: !request.isFavourite });
        break;
      case 'sort':
        updateQuotationRequest(request.id, { isSorted: true, status: 'closed' });
        break;
    }
  };

  const handleCloseRequest = () => {
    if (selectedRequest) {
      updateQuotationRequest(selectedRequest.id, { status: 'closed', isSorted: true });
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

  // Empty state component
  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
      <Icon className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground text-center max-w-md px-4">{description}</p>
    </div>
  );

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quotation Requests</h1>
          <p className="text-muted-foreground">
            Manage incoming and outgoing quotation requests.
          </p>
        </div>
        <Button asChild>
          <Link href="/quotation-requests/new">
            <MessageSquareQuote className="mr-2 h-4 w-4" /> New Request
          </Link>
        </Button>
      </div>
      
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="incoming" className="gap-1">
            <Inbox className="h-4 w-4 hidden sm:block" />
            <span>Incoming</span>
            {filteredRequests.incoming.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filteredRequests.incoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-1">
            <Send className="h-4 w-4 hidden sm:block" />
            <span>Outgoing</span>
            {filteredRequests.outgoing.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filteredRequests.outgoing.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="response" className="gap-1">
            <MessageCircle className="h-4 w-4 hidden sm:block" />
            <span>Responses</span>
            {filteredRequests.responses.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filteredRequests.responses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sorted" className="gap-1">
            <CheckCircle className="h-4 w-4 hidden sm:block" />
            <span>Sorted</span>
          </TabsTrigger>
          <TabsTrigger value="expired" className="gap-1">
            <Clock className="h-4 w-4 hidden sm:block" />
            <span>Expired</span>
          </TabsTrigger>
          <TabsTrigger value="favourites" className="gap-1">
            <Star className="h-4 w-4 hidden sm:block" />
            <span>Favourites</span>
          </TabsTrigger>
        </TabsList>

        {/* INCOMING TAB */}
        <TabsContent value="incoming" className="pt-4">
          {filteredRequests.incoming.length > 0 ? (
            <PublicQuotationRequestList 
              requests={filteredRequests.incoming}
              currentUserId={currentUserId}
            />
          ) : (
            <EmptyState 
              icon={Inbox}
              title="No Incoming Requests"
              description="Quotation requests from other businesses will appear here."
            />
          )}
        </TabsContent>

        {/* OUTGOING TAB */}
        <TabsContent value="outgoing" className="pt-4">
          {filteredRequests.outgoing.length > 0 ? (
            <QuotationRequestList 
              requests={filteredRequests.outgoing} 
              onSelectAction={handleRequestAction} 
            />
          ) : (
            <EmptyState 
              icon={Send}
              title="No Outgoing Requests"
              description="Requests you've sent to suppliers will appear here."
            />
          )}
        </TabsContent>

        {/* RESPONSES TAB */}
        <TabsContent value="response" className="pt-4">
          {filteredRequests.responses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.responses.map((quote) => {
                const relatedRequest = config?.outgoingRequests?.find(r => r.id === quote.requestId);
                const supplier = config?.companies?.find(c => c.id === quote.senderId);
                
                return (
                  <Card key={quote.quotationId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={supplier?.logo} />
                          <AvatarFallback>
                            <Building className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {supplier?.companyName || 'Unknown Supplier'}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            Re: {relatedRequest?.title || 'Request'}
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quote ID:</span>
                          <span className="font-mono text-xs">{quote.quotationId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-semibold">
                            {quote.currency} {quote.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{new Date(quote.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button asChild className="w-full" size="sm">
                        <Link href={`/quotations/${quote.quotationId.toLowerCase()}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={MessageCircle}
              title="No Responses Yet"
              description="When suppliers respond to your requests, their quotations will appear here."
            />
          )}
        </TabsContent>

        {/* SORTED TAB */}
        <TabsContent value="sorted" className="pt-4">
          {filteredRequests.sorted.length > 0 ? (
            <QuotationRequestList 
              requests={filteredRequests.sorted} 
              onSelectAction={handleRequestAction} 
            />
          ) : (
            <EmptyState 
              icon={CheckCircle}
              title="No Sorted Requests"
              description="Requests you've marked as 'sorted' will appear here."
            />
          )}
        </TabsContent>

        {/* EXPIRED TAB */}
        <TabsContent value="expired" className="pt-4">
          {filteredRequests.expired.length > 0 ? (
            <QuotationRequestList 
              requests={filteredRequests.expired} 
              onSelectAction={handleRequestAction} 
            />
          ) : (
            <EmptyState 
              icon={Clock}
              title="No Expired Requests"
              description="Expired or closed requests will appear here."
            />
          )}
        </TabsContent>

        {/* FAVOURITES TAB */}
        <TabsContent value="favourites" className="pt-4">
          {filteredRequests.favourites.length > 0 ? (
            <QuotationRequestList 
              requests={filteredRequests.favourites} 
              onSelectAction={handleRequestAction} 
            />
          ) : (
            <EmptyState 
              icon={Star}
              title="No Favourite Requests"
              description="Star requests to add them to your favourites."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isRequestDeleteOpen} onOpenChange={setIsRequestDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedRequest?.title}". This action cannot be undone.
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

      {/* Close/Sort Confirmation Dialog */}
      <AlertDialog open={isRequestCloseOpen} onOpenChange={setIsRequestCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Request as Sorted?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the request and prevent new suppliers from responding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseRequest}>
              Mark as Sorted
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}