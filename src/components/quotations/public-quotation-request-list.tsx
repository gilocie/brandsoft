'use client';

import { useMemo, useState, useEffect } from 'react';
import { useBrandsoft, type QuotationRequest } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Eye, Clock, Globe, Lock, Star, FilePenLine, Send } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNowStrict, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getImageFromDB } from '@/hooks/use-brand-image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Helper to check if a value is a valid image URL
const isValidImageUrl = (value: string | undefined): boolean => {
  if (!value) return false;
  if (value === 'indexed-db') return false;
  if (value === '') return false;
  return true;
};

interface RequestCardProps {
  request: QuotationRequest;
  currentUserId: string | null;
  currentUserIds: string[];
}

const RequestCard = ({ request, currentUserId, currentUserIds }: RequestCardProps) => {
    const { config, updateQuotationRequest } = useBrandsoft();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isLogoLoading, setIsLogoLoading] = useState(true);

    // Check if this is the current user's own request
    const isMyRequest = useMemo(() => {
        return currentUserIds.includes(request.requesterId);
    }, [currentUserIds, request.requesterId]);

    // Find requester info
    const requesterInfo = useMemo(() => {
        let logo: string | undefined;
        let name: string | undefined;

        if (config?.companies) {
            const company = config.companies.find(c => c.id === request.requesterId);
            if (company) {
                logo = company.logo;
                name = company.companyName;
            }
        }

        if (!logo && isMyRequest) {
            logo = config?.brand.logo;
            name = config?.brand.businessName;
        }

        if (!name) name = request.requesterName;
        if (!logo) logo = request.requesterLogo;

        return { logo, name };
    }, [config, request, isMyRequest]);

    // Fetch logo from IndexedDB
    useEffect(() => {
        let isMounted = true;
        
        const fetchLogo = async () => {
            setIsLogoLoading(true);
            try {
                const dbLogo = await getImageFromDB(`company-logo-${request.requesterId}`);
                if (isMounted) {
                    if (dbLogo) {
                        setLogoUrl(dbLogo);
                    } else if (requesterInfo.logo && isValidImageUrl(requesterInfo.logo)) {
                        setLogoUrl(requesterInfo.logo);
                    } else {
                        setLogoUrl(null);
                    }
                    setIsLogoLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    setLogoUrl(null);
                    setIsLogoLoading(false);
                }
            }
        };
        
        fetchLogo();
        return () => { isMounted = false; };
    }, [request.requesterId, requesterInfo.logo]);

    const parsedDate = new Date(request.dueDate);
    const isExpired = parsedDate < new Date();
    const timeLeft = isValid(parsedDate)
        ? formatDistanceToNowStrict(parsedDate, { addSuffix: true })
        : 'Invalid date';

    const handleToggleFavourite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateQuotationRequest(request.id, { isFavourite: !request.isFavourite });
    };

    return (
        <Card className={cn("relative hover:shadow-md transition-shadow", isExpired && "opacity-60")}>
            {/* Favourite Button */}
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 z-10"
                onClick={handleToggleFavourite}
            >
                <Star className={cn("h-4 w-4", request.isFavourite && "fill-amber-400 text-amber-400")} />
            </Button>

            <CardHeader className="pb-3">
                <div className="flex items-start gap-3 pr-8">
                    <Avatar className="h-10 w-10 border flex-shrink-0">
                        {isLogoLoading ? (
                            <Skeleton className="h-full w-full rounded-full" />
                        ) : (
                            <>
                                <AvatarImage src={logoUrl || undefined} />
                                <AvatarFallback>{requesterInfo.name?.charAt(0) || '?'}</AvatarFallback>
                            </>
                        )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base truncate">{request.title}</CardTitle>
                            {isMyRequest && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                    Your Request
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="truncate">
                            by {requesterInfo.name || request.requesterName}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {request.description || 'No description provided.'}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant={request.isPublic ? "secondary" : "outline"} className="text-xs">
                        {request.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                        {request.isPublic ? 'Public' : 'Private'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {request.items.length} item{request.items.length !== 1 ? 's' : ''}
                    </Badge>
                    {(request.responseCount || 0) > 0 && (
                        <Badge variant="outline" className="text-xs">
                            {request.responseCount} response{request.responseCount !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>

                {/* Time remaining */}
                <div className={cn(
                    "flex items-center gap-1.5 text-xs",
                    isExpired ? "text-destructive" : "text-muted-foreground"
                )}>
                    <Clock className="h-3 w-3" />
                    <span>{isExpired ? 'Expired' : `Expires ${timeLeft}`}</span>
                </div>

                {/* Action Buttons - Different for own requests vs others */}
                {isMyRequest ? (
                    // Own request: Show View and Edit buttons
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" size="sm" asChild>
                            <Link href={`/quotation-requests/${request.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </Button>
                        <Button className="flex-1" size="sm" asChild disabled={isExpired}>
                            <Link href={`/quotation-requests/${request.id}/edit`}>
                                <FilePenLine className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                ) : (
                    // Other's request: Show Respond button
                    <Button className="w-full" size="sm" asChild disabled={isExpired}>
                        <Link href={`/quotation-requests/respond/${request.id}`}>
                            <Send className="mr-2 h-4 w-4" />
                            Respond to Request
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

interface PublicQuotationRequestListProps {
  requests: QuotationRequest[];
  currentUserId: string | null;
  currentUserIds: string[];
}

export const PublicQuotationRequestList = ({ requests, currentUserId, currentUserIds }: PublicQuotationRequestListProps) => {
    if (!requests || requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-64 rounded-lg border-2 border-dashed">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No Quotation Requests</p>
                <p className="text-sm text-muted-foreground">There are no open requests at the moment.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(request => (
                <RequestCard 
                    key={request.id} 
                    request={request} 
                    currentUserId={currentUserId}
                    currentUserIds={currentUserIds}
                />
            ))}
        </div>
    );
};