'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type QuotationRequest, type Company } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, FileText, ArrowLeft, Send, Package, Clock, Globe, Lock, CalendarDays, Layers } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getImageFromDB } from '@/hooks/use-brand-image';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNowStrict } from 'date-fns';

// Helper to check if a value is a valid image URL
const isValidImageUrl = (value: string | undefined): boolean => {
  if (!value) return false;
  if (value === 'indexed-db') return false;
  if (value === '') return false;
  return true;
};

export default function QuotationRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { config } = useBrandsoft();
    const requestId = params.id as string;
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [requesterLogo, setRequesterLogo] = useState<string | null>(null);
    const [isLogoLoading, setIsLogoLoading] = useState(true);

    // Get current user's company ID
    const currentUserId = useMemo(() => {
        if (!config || !config.brand) return null;
        const myCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
        return myCompany?.id || null;
    }, [config]);

    // Find the request from BOTH incoming and outgoing requests
    const request = useMemo((): QuotationRequest | null => {
        if (!config) return null;
        
        // Check incoming requests first
        const incoming = (config.incomingRequests || []).find(r => r.id === requestId);
        if (incoming) return incoming;
        
        // Check outgoing requests
        const outgoing = (config.outgoingRequests || []).find(r => r.id === requestId);
        if (outgoing) return outgoing;
        
        return null;
    }, [config, requestId]);

    // Determine if this is my own request
    const isMyRequest = useMemo(() => {
        return request?.requesterId === currentUserId;
    }, [request, currentUserId]);

    // Find the requester company
    const requester = useMemo((): Company | null => {
        if (!config || !request) return null;
        return config.companies?.find(c => c.id === request.requesterId) || null;
    }, [config, request]);

    // Fetch requester logo from IndexedDB
    useEffect(() => {
        let isMounted = true;
        
        const fetchLogo = async () => {
            if (!request) {
                setIsLogoLoading(false);
                return;
            }
            
            setIsLogoLoading(true);
            
            try {
                const dbLogo = await getImageFromDB(`company-logo-${request.requesterId}`);
                
                if (isMounted) {
                    if (dbLogo) {
                        setRequesterLogo(dbLogo);
                    } else if (requester?.logo && isValidImageUrl(requester.logo)) {
                        setRequesterLogo(requester.logo);
                    } else if (request.requesterLogo && isValidImageUrl(request.requesterLogo)) {
                        setRequesterLogo(request.requesterLogo);
                    } else {
                        setRequesterLogo(null);
                    }
                    setIsLogoLoading(false);
                }
            } catch (error) {
                console.error('Error fetching requester logo:', error);
                if (isMounted) {
                    setRequesterLogo(null);
                    setIsLogoLoading(false);
                }
            }
        };
        
        fetchLogo();
        
        return () => { isMounted = false; };
    }, [request, requester]);

    // Get my products for responding
    const myProducts = useMemo(() => {
        return config?.products || [];
    }, [config?.products]);

    // Check if request is expired
    const isExpired = useMemo(() => {
        if (!request) return false;
        return new Date(request.dueDate) < new Date() || request.status === 'expired' || request.status === 'closed';
    }, [request]);

    // Calculate time info
    const timeInfo = useMemo(() => {
        if (!request) return { text: '', isUrgent: false };
        
        const dueDate = new Date(request.dueDate);
        const now = new Date();
        
        if (dueDate < now || request.status === 'closed' || request.status === 'expired') {
            return { text: 'Expired/Closed', isUrgent: true };
        }
        
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { 
            text: formatDistanceToNowStrict(dueDate, { addSuffix: true }),
            isUrgent: daysLeft <= 3
        };
    }, [request]);

    // Not found state
    if (!request) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex flex-col items-center justify-center text-center py-20">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Request Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The quotation request you're looking for doesn't exist or has been removed.
                    </p>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/quotation-requests">View My Requests</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/marketplace?tab=public-quotations">Browse Marketplace</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    
    const handleSelectProduct = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };
    
    const handleCreateQuotation = () => {
        const productQuery = selectedProductIds.join(',');
        router.push(`/quotations/new?products=${productQuery}&customerId=${request.requesterId}&senderId=${currentUserId}&requestId=${request.id}&isRequest=true`);
    };

    return (
        <div className="container mx-auto space-y-6 py-8">
            <Button asChild variant="outline">
                <Link href="/quotation-requests">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back to Requests
                </Link>
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Request Details */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-14 w-14 border">
                                {isLogoLoading ? (
                                    <Skeleton className="h-full w-full rounded-full" />
                                ) : (
                                    <>
                                        <AvatarImage src={requesterLogo || undefined} />
                                        <AvatarFallback><Building className="h-6 w-6" /></AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-xl">{request.title}</CardTitle>
                                        <CardDescription>
                                            from <span className="font-medium">{requester?.companyName || request.requesterName}</span>
                                        </CardDescription>
                                    </div>
                                    <Badge variant={request.isPublic ? "secondary" : "outline"} className="flex-shrink-0">
                                        {request.isPublic ? (
                                            <><Globe className="h-3 w-3 mr-1" /> Public</>
                                        ) : (
                                            <><Lock className="h-3 w-3 mr-1" /> Private</>
                                        )}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Status and Dates */}
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                <span>Posted: {format(new Date(request.date), 'dd MMM yyyy')}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${timeInfo.isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                                <Clock className="h-4 w-4" />
                                <span>{timeInfo.text}</span>
                            </div>
                        </div>

                        {/* Description */}
                        {request.description && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Description</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description}</p>
                                </div>
                            </>
                        )}

                        {/* Target Industries */}
                        {request.isPublic && request.industries && request.industries.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Layers className="h-4 w-4" /> Target Industries
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {request.industries.map(industry => (
                                            <Badge key={industry} variant="outline">{industry}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />
                        
                        {/* Requested Items */}
                        <div>
                            <h3 className="text-md font-semibold mb-3">Requested Items ({request.items.length})</h3>
                            <div className="space-y-3">
                                {request.items.map((item, index) => (
                                    <div key={index} className="p-4 border rounded-lg bg-muted/30">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold">{item.productName}</p>
                                            <Badge variant="secondary">Qty: {item.quantity}</Badge>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Actions */}
                {isMyRequest ? (
                    // Owner view
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Status</CardTitle>
                            <CardDescription>This is your outgoing request.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                                    <p className="text-3xl font-bold">{request.responseCount || 0}</p>
                                    <p className="text-sm text-muted-foreground">Responses</p>
                                </div>
                                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                                    <p className="text-3xl font-bold capitalize">{request.status}</p>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                </div>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/quotation-requests?subtab=response">
                                    View All Responses
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : isExpired ? (
                    // Expired
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Closed</CardTitle>
                            <CardDescription>This request is no longer accepting responses.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                <Clock className="h-12 w-12 mb-4 text-gray-300" />
                                <p>The deadline for this request has passed or it has been closed.</p>
                                <Button asChild variant="outline" className="mt-4">
                                    <Link href="/quotation-requests">Browse Other Requests</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    // Supplier view - respond
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Prepare Your Quotation</CardTitle>
                            <CardDescription>Select products from your catalog to include in your quote.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col min-h-0">
                            {myProducts.length > 0 ? (
                                <ScrollArea className="flex-1 max-h-[400px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>Product/Service</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {myProducts.map(product => (
                                                <TableRow 
                                                    key={product.id} 
                                                    className="cursor-pointer" 
                                                    onClick={() => handleSelectProduct(product.id)}
                                                >
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedProductIds.includes(product.id)}
                                                            onCheckedChange={() => handleSelectProduct(product.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-medium">{product.name}</p>
                                                        {product.description && (
                                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {product.description}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {config?.profile.defaultCurrency}{product.price.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-md">
                                    <Package className="h-12 w-12 mb-4 text-gray-300" />
                                    <h3 className="font-semibold">No Products Found</h3>
                                    <p className="text-sm">Add products to your catalog to create quotations.</p>
                                    <Button asChild variant="secondary" className="mt-4">
                                        <Link href="/products">Add Products</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                        {selectedProductIds.length > 0 && (
                            <CardContent className="p-4 border-t">
                                <Button className="w-full" onClick={handleCreateQuotation}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Create Quotation ({selectedProductIds.length} item{selectedProductIds.length !== 1 ? 's' : ''})
                                </Button>
                            </CardContent>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}