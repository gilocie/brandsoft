
'use client';

import { useMemo } from 'react';
import { useBrandsoft, type QuotationRequest, type Company } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Eye, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';

const RequestCard = ({ request, currentUserId }: { request: QuotationRequest, currentUserId: string | null }) => {
    const { config } = useBrandsoft();

    const requesterInfo = useMemo(() => {
        let logo: string | undefined;
        let name: string | undefined;

        // 1. Try to find a Company matching the requester ID exactly
        if (config?.companies) {
            const company = config.companies.find(c => c.id === request.requesterId);
            if (company) {
                logo = company.logo;
                name = company.companyName;
            }
        }

        // 2. If no logo found yet, check if it's the current user
        if (!logo && request.requesterId === currentUserId) {
            logo = config?.brand.logo;
            name = config?.brand.businessName;
        }

        // 3. Fallback names if not found in lists
        if (!name) name = request.requesterName;

        // 4. "Smart Link": If we have a name but no logo, try to find a Company 
        // in the marketplace with the same name to get the logo.
        if (!logo && name && config?.companies) {
            const matchingCompany = config.companies.find(c => c.companyName === name);
            if (matchingCompany) {
                logo = matchingCompany.logo;
            }
        }

        // 5. Final fallback to data stored on the request itself
        if (!logo) logo = request.requesterLogo;

        return { logo, name };

    }, [config, request, currentUserId]);


    const timeLeft = formatDistanceToNowStrict(new Date(request.dueDate), { addSuffix: true });


    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={requesterInfo?.logo} />
                        <AvatarFallback>{requesterInfo?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base">{request.title}</CardTitle>
                        <CardDescription>
                            by {requesterInfo?.name || request.requesterName}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
                    {request.description || 'No description provided.'}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Expires {timeLeft}</span>
                    </div>
                </div>
                <Button className="w-full" asChild>
                    <Link href={`/quotation-requests/respond/${request.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View & Respond
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
};

interface PublicQuotationRequestListProps {
  requests: QuotationRequest[];
  currentUserId: string | null;
}


export const PublicQuotationRequestList = ({ requests, currentUserId }: PublicQuotationRequestListProps) => {
    
    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-64 rounded-lg border-2 border-dashed">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No Incoming Quotation Requests</p>
                <p className="text-sm text-muted-foreground">There are currently no open requests that match your filters.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(request => (
                <RequestCard key={request.id} request={request} currentUserId={currentUserId} />
            ))}
        </div>
    );
};
