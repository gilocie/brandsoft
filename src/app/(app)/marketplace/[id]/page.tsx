
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type Company, type Product } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, MapPin, Globe, Phone, Mail, FileBarChart2, ArrowLeft, Info, Package, Star } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

const fallBackCover = 'https://picsum.photos/seed/shopcover/1200/400';


export default function VirtualShopPage() {
  const params = useParams();
  const router = useRouter();
  const { config } = useBrandsoft();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const business = useMemo(() => {
    return config?.companies.find(c => c.id === params.id) || null;
  }, [config?.companies, params.id]);

  const products = useMemo(() => {
    // In a real app, this would filter products by the business ID.
    // For now, we show all products as a demonstration.
    return config?.products || [];
  }, [config?.products]);

  const myCompanyId = useMemo(() => {
    if (!config) return null;
    const myBusinessAsCompany = config.companies.find(c => c.companyName === config.brand.businessName);
    return myBusinessAsCompany?.id || null;
  }, [config]);

  if (!business) {
    return <div className="text-center py-10">Business not found.</div>;
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  const handleRequestQuotation = () => {
    if (selectedProductIds.length > 0 && myCompanyId) {
      const productQuery = selectedProductIds.join(',');
      router.push(`/quotations/new?products=${productQuery}&customerId=${business.id}&senderId=${myCompanyId}`);
    }
  };
  
  const currencyCode = config?.profile.defaultCurrency || '';

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/marketplace"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Marketplace</Link>
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="p-0">
           <div className="relative h-48 w-full">
                <Image
                    src={business.coverImage || fallBackCover}
                    alt={`${business.companyName} cover`}
                    fill
                    className="object-cover"
                    data-ai-hint="office workspace"
                />
                <div className="absolute inset-0 bg-black/50" />
                 <div className="absolute inset-0 p-6 flex flex-col md:flex-row items-start gap-6">
                    <Avatar className="h-24 w-24 border-4 border-background flex-shrink-0">
                        <AvatarImage src={business.logo} />
                        <AvatarFallback><Building className="h-10 w-10" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-white pt-2">
                        <CardTitle className="text-3xl font-headline">{business.companyName}</CardTitle>
                        <CardDescription className="mt-1 text-gray-300">{business.description || 'Leading provider in our industry.'}</CardDescription>
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                            {business.industry && <div className="flex items-center gap-2"><Building className="h-4 w-4" /> {business.industry}</div>}
                            {business.town && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {business.town}</div>}
                            {business.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> <a href={business.website} target="_blank" rel="noreferrer" className="text-primary-foreground hover:underline">{business.website}</a></div>}
                            {business.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {business.phone}</div>}
                            {business.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {business.email}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </CardHeader>
      </Card>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-headline">Product & Service Catalog</h2>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <Star className="h-5 w-5 text-gray-300" />
                </div>
                <Button variant="outline">Rate Business</Button>
            </div>
        </div>

         <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Demonstration Catalog</AlertTitle>
            <AlertDescription>
                This catalog shows all products available in the application for demonstration purposes. In a real-world scenario, it would only display products belonging to this specific business.
            </AlertDescription>
         </Alert>

        <Card>
            <CardContent className="p-0">
                 {products.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedProductIds.includes(product.id)}
                                            onCheckedChange={() => handleSelectProduct(product.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-sm truncate">{product.description || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{currencyCode}{product.price.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mb-4 text-gray-300" />
                        <h3 className="font-semibold">No Products Yet</h3>
                        <p className="text-sm">This business hasn't listed any products or services in the marketplace.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        
         {selectedProductIds.length > 0 && (
            <div className="sticky bottom-6 flex justify-center">
                <Button size="lg" className="shadow-lg animate-in fade-in zoom-in-95" onClick={handleRequestQuotation} disabled={!myCompanyId}>
                    <FileBarChart2 className="mr-2 h-4 w-4" />
                    Request Quotation for {selectedProductIds.length} Item(s)
                </Button>
            </div>
        )}
      </div>

    </div>
  );
}
