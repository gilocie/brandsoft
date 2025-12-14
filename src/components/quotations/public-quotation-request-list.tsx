
'use client';

import { useMemo } from 'react';
import { useBrandsoft, type QuotationRequest } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Eye } from 'lucide-react';

const RequestCard = ({ request }: { request: QuotationRequest }) => {
    const { config } = useBrandsoft();

    const requesterIsSelf = useMemo(() => {
        if (!config || !request.requesterId) return false;
        // This logic needs to mirror how we find the current user's ID elsewhere
        const myCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
        return myCompany?.id === request.requesterId || request.requesterId === 'CUST-DEMO-ME';
    }, [config, request.requesterId]);
    
    const requester = useMemo(() => {
        if (!config || !request.requesterId) return null;
        if (requesterIsSelf) {
            return {
                logo: config.brand.logo,
                name: config.brand.businessName
            };
        }
        const company = config.companies?.find(c => c.id === request.requesterId);
        return company ? { logo: company.logo, name: company.companyName } : { logo: undefined, name: request.requesterName };
    }, [config, request.requesterId, requesterIsSelf]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={requester?.logo} />
                        <AvatarFallback>{requester?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base">{request.title}</CardTitle>
                        <CardDescription>
                            by {requester?.name || request.requesterName} on {new Date(request.date).toLocaleDateString()}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
                    {request.description || 'No description provided.'}
                </p>
                <Button className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    View & Respond
                </Button>
            </CardContent>
        </Card>
    );
};

export const PublicQuotationRequestList = () => {
    const { config } = useBrandsoft();

    const publicRequests = useMemo(() => {
        return (config?.quotationRequests || []).filter(req => req.isPublic && req.status === 'open');
    }, [config?.quotationRequests]);

    if (publicRequests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-64 rounded-lg border-2 border-dashed">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No Public Quotation Requests</p>
                <p className="text-sm text-muted-foreground">There are currently no open requests for quotations.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicRequests.map(request => (
                <RequestCard key={request.id} request={request} />
            ))}
        </div>
    );
};
