
'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type QuotationRequest, type Product } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, FileText, ArrowLeft, Send, Package } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RespondToRequestPage() {
    const params = useParams();
    const router = useRouter();
    const { config } = useBrandsoft();
    const requestId = params.id as string;
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    const request = useMemo(() => {
        return config?.quotationRequests?.find(r => r.id === requestId);
    }, [config, requestId]);

    const requester = useMemo(() => {
        if (!config || !request) return null;
        return config.companies.find(c => c.id === request.requesterId);
    }, [config, request]);

    const myProducts = useMemo(() => {
        return config?.products || [];
    }, [config]);
    
    if (!request || !requester) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Request Not Found</h2>
                <p className="text-muted-foreground">The quotation request could not be found.</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/marketplace?tab=public-quotations">Back to Marketplace</Link>
                </Button>
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
        const myCompanyId = config?.companies?.find(c => c.companyName === config.brand.businessName)?.id || 'CUST-DEMO-ME';
        router.push(`/quotations/new?products=${productQuery}&customerId=${requester.id}&senderId=${myCompanyId}`);
    };

    return (
        <div className="container mx-auto space-y-6">
            <Button asChild variant="outline">
                <Link href="/marketplace?tab=public-quotations"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Requests</Link>
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Request Details */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={requester.logo} />
                                <AvatarFallback><Building /></AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{request.title}</CardTitle>
                                <CardDescription>
                                    Request from {requester.companyName} on {new Date(request.date).toLocaleDateString()}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {request.description && (
                             <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                        )}
                        <Separator className="my-4" />
                        <h3 className="text-md font-semibold mb-2">Requested Items</h3>
                        <div className="space-y-3">
                            {request.items.map((item, index) => (
                                <div key={index} className="p-3 border rounded-md bg-muted/50">
                                    <p className="font-semibold">{item.productName}</p>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                    <p className="text-sm font-bold">Quantity: {item.quantity}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Your Products */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Prepare Your Quotation</CardTitle>
                        <CardDescription>Select products from your catalog to add to the quote.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0">
                         {myProducts.length > 0 ? (
                            <ScrollArea className="flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead>Your Product/Service</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myProducts.map(product => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedProductIds.includes(product.id)}
                                                        onCheckedChange={() => handleSelectProduct(product.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="text-right">{config?.profile.defaultCurrency}{product.price.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                         ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-md">
                                <Package className="h-12 w-12 mb-4 text-gray-300" />
                                <h3 className="font-semibold">No Products Found</h3>
                                <p className="text-sm">You need to add products to your catalog before you can create a quotation.</p>
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
                                Create Quotation for {selectedProductIds.length} Item(s)
                            </Button>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}
