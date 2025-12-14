
'use client';

import { useMemo } from 'react';
import { useBrandsoft, type QuotationRequest, type Company } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Eye } from 'lucide-react';
import Link from 'next/link';

const RequestCard = ({ request }: { request: QuotationRequest }) => {
    const { config } = useBrandsoft();

    const currentUserId = useMemo(() => {
        if (!config || !config.brand) return null;
        const myCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
        return myCompany?.id || 'CUST-DEMO-ME';
    }, [config]);

    const requesterIsSelf = request.requesterId === currentUserId;
    
    const requester = useMemo(() => {
        if (!config) return null;
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
                <Button className="w-full" asChild>
                    <Link href={`/quotations/request/${request.id}/respond`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View & Respond
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
};

interface PublicQuotationRequestListProps {
  searchTerm: string;
  industryFilter: string;
  townFilter: string;
}


export const PublicQuotationRequestList = ({ searchTerm, industryFilter, townFilter }: PublicQuotationRequestListProps) => {
    const { config } = useBrandsoft();

    const filteredRequests = useMemo(() => {
        if (!config) return [];
        
        let requests = (config.quotationRequests || []).filter(req => req.isPublic && req.status === 'open');

        const companiesById = new Map<string, Company>(config.companies.map(c => [c.id, c]));

        return requests.filter(req => {
            const requester = companiesById.get(req.requesterId);

            const searchMatch = searchTerm 
              ? req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (req.description && req.description.toLowerCase().includes(searchTerm.toLowerCase()))
              : true;
            
            const requestIndustries = req.industries || [];
            const industryMatch = industryFilter === 'all' || 
                                  requestIndustries.length === 0 || 
                                  requestIndustries.includes(industryFilter);
            
            const townMatch = townFilter === 'all' || (requester && requester.town === townFilter);

            return searchMatch && industryMatch && townMatch;
        });

    }, [config, searchTerm, industryFilter, townFilter]);

    if (filteredRequests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-64 rounded-lg border-2 border-dashed">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No Public Quotation Requests</p>
                <p className="text-sm text-muted-foreground">There are currently no open requests that match your filters.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map(request => (
                <RequestCard key={request.id} request={request} />
            ))}
        </div>
    );
};
