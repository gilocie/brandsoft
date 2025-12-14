
'use client';

import { useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type QuotationRequest } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Globe, Users, Clock, ArrowLeft, Layers } from 'lucide-react';
import Link from 'next/link';

export default function QuotationRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { config } = useBrandsoft();
  
  const requestId = params.id as string;

  // Debug: Log to see what we're working with
  useEffect(() => {
    console.log('Request ID from URL:', requestId);
    console.log('Available requests:', config?.quotationRequests);
    console.log('Looking for request...');
  }, [requestId, config]);

  const request = useMemo(() => {
    if (!config?.quotationRequests) {
      console.log('No quotation requests in config');
      return null;
    }
    
    const found = config.quotationRequests.find(r => {
      console.log(`Comparing ${r.id} with ${requestId}`);
      return r.id === requestId;
    });
    
    console.log('Found request:', found);
    return found;
  }, [config, requestId]);

  const requester = useMemo(() => {
    if (!config || !request) return null;
    
    // Try to find in companies first
    const company = config.companies?.find(c => c.id === request.requesterId);
    if (company) return company;
    
    // Try to find in customers
    const customer = config.customers?.find(c => c.id === request.requesterId);
    if (customer) {
      return {
        id: customer.id,
        companyName: customer.name,
        logo: undefined // Customers don't have logos in this model
      };
    }
    
    return null;
  }, [config, request]);

  // Show loading state
  if (!config) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show not found state
  if (!request) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <Layers className="w-10 h-10 text-muted-foreground" />
            </div>
            <CardTitle>Request Not Found</CardTitle>
            <CardDescription>
              The quotation request could not be found. Request ID: {requestId}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/quotations?tab=requests">
                Back to Requests
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visibility = request.isPublic 
    ? { text: "Public Request", icon: Globe, className: "text-blue-500" }
    : { text: `Sent to ${request.companyIds?.length || 0} supplier(s)`, icon: Users, className: "text-muted-foreground" };

  const VisibilityIcon = visibility.icon;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quotations?tab=requests">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={requester?.logo} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {requester?.companyName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{request.title}</CardTitle>
              <CardDescription className="text-base">
                Request from {requester?.companyName || request.requesterName} on {new Date(request.date).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {request.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{request.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <VisibilityIcon className={`w-4 h-4 ${visibility.className}`} />
              <span>{visibility.text}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Expires on {new Date(request.dueDate).toLocaleDateString()}</span>
            </div>
          </div>

          {request.isPublic && request.industries && request.industries.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Target Industries:</span>{' '}
              <span className="text-muted-foreground">{request.industries.join(', ')}</span>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-4">Requested Items</h3>
            <div className="space-y-3">
              {request.items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {!request.isPublic && request.companyIds && (
            <div>
              <h3 className="font-semibold mb-4">Sent To</h3>
              <div className="space-y-2">
                {request.companyIds.map(id => {
                  const company = config?.companies.find(c => c.id === id);
                  return company ? (
                    <div key={id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Building className="w-5 h-5 text-muted-foreground" />
                      <span>{company.companyName}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button asChild className="w-full" size="lg">
              <Link href={`/quotations/request/${request.id}/respond`}>Respond to Request</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

