
'use client';

import { useMemo } from 'react';
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

    const request = useMemo(() => {
        return config?.quotationRequests?.find(r => r.id === requestId);
    }, [config, requestId]);

    const requester = useMemo(() => {
        if (!config || !request) return null;
        return config.companies.find(c => c.id === request.requesterId);
    }, [config, request]);

    if (!request) {
        return (
            <div className="flex h-[80vh] items-center justify-center text-center">
                <div>
                    <h2 className="text-xl font-semibold">Request Not Found</h2>
                    <p className="text-muted-foreground">The quotation request could not be located.</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link href="/quotations?tab=requests">Back to Requests</Link>
                    </Button>
                </div>
            </div>
        );
    }
    
    const visibility = request.isPublic 
        ? { text: "Public Request", icon: Globe, className: "text-blue-500" } 
        : { text: `Sent to ${request.companyIds?.length || 0} supplier(s)`, icon: Users, className: "text-muted-foreground" };


    return (
        <div className="container mx-auto max-w-3xl space-y-6">
            <Button variant="outline" asChild>
                <Link href="/quotations?tab=requests"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Requests</Link>
            </Button>
            <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage src={requester?.logo} />
                            <AvatarFallback>{requester?.companyName?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl font-headline">{request.title}</CardTitle>
                            <CardDescription>
                                Request from {requester?.companyName || request.requesterName} on {new Date(request.date).toLocaleDateString()}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     {request.description && (
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                            <visibility.icon className={cn("h-4 w-4", visibility.className)} />
                            <span>{visibility.text}</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Expires on {new Date(request.dueDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                     {request.isPublic && request.industries && request.industries.length > 0 && (
                        <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-md">
                           <Layers className="h-4 w-4 text-muted-foreground" />
                           <span>Target Industries: {request.industries.join(', ')}</span>
                        </div>
                    )}
                    
                    <div>
                        <h3 className="font-semibold mb-2 mt-4">Requested Items</h3>
                        <div className="space-y-3">
                            {request.items.map((item, index) => (
                                <div key={index} className="p-3 border rounded-md">
                                    <p className="font-semibold">{item.productName}</p>
                                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                                    <p className="text-sm font-bold mt-1">Quantity: {item.quantity}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                     {!request.isPublic && request.companyIds && (
                         <div>
                            <h3 className="font-semibold mb-2 mt-4">Sent To</h3>
                            <div className="flex flex-wrap gap-2">
                                {request.companyIds.map(id => {
                                    const company = config?.companies.find(c => c.id === id);
                                    return company ? (
                                        <Button key={id} asChild variant="secondary" size="sm" className="hover:bg-accent hover:text-white">
                                            <Link href={`/marketplace/${company.id}`}>{company.companyName}</Link>
                                        </Button>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}

