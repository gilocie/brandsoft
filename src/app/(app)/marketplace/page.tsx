
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useBrandsoft, type Company, type Review, type QuotationRequest } from '@/hooks/use-brandsoft';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FilePenLine } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CompanyCard } from '@/components/company-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PublicQuotationRequestList } from '@/components/quotations/public-quotation-request-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getImageFromDB } from '@/hooks/use-receipt-upload'; // Changed import to use valid path if use-receipt-upload is where getImageFromDB is, otherwise change to @/hooks/use-brand-image
import { Skeleton } from '@/components/ui/skeleton';

// Note: Ensure getImageFromDB is imported from the correct file. 
// If you just updated use-brand-image.ts, you should import it from there:
// import { getImageFromDB } from '@/hooks/use-brand-image';

// Helper to check if a value is a valid image URL
const isValidImageUrl = (value: string | undefined): boolean => {
  if (!value) return false;
  if (value === 'indexed-db') return false; 
  if (value === '') return false;
  return true;
};

// Fixed Component
const CompanyCardWithImages = ({
    company,
    averageRating,
    reviewCount,
    onSelectAction,
    showActionsMenu,
    actionButton,
  }: {
    company: Company;
    averageRating: number;
    reviewCount: number;
    // FIX: Changed to accept only 1 argument to match CompanyCard's expected type
    onSelectAction: (action: 'view' | 'edit' | 'delete') => void;
    showActionsMenu?: boolean;
    actionButton?: React.ReactNode;
  }) => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      let isMounted = true;
      const fetchImages = async () => {
        setIsLoading(true);
        
        const logoKey = `company-logo-${company.id}`;
        const coverKey = `company-cover-${company.id}`;
  
        const [logo, cover] = await Promise.all([
          getImageFromDB(logoKey),
          getImageFromDB(coverKey)
        ]);
        
        if (isMounted) {
            const fallbackLogo = isValidImageUrl(company.logo) ? company.logo : null;
            const fallbackCover = isValidImageUrl(company.coverImage) ? company.coverImage : null;
            
            setLogoUrl(logo || fallbackLogo || null);
            setCoverUrl(cover || fallbackCover || null);
            setIsLoading(false);
        }
      };
  
      fetchImages();

      return () => { isMounted = false; }
    }, [company.id, company.logo, company.coverImage, company.version]);
  
    if (isLoading) {
      return (
        <Card className="w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg">
            <div className="relative">
                <Skeleton className="h-28 w-full" />
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                    <Skeleton className="h-20 w-20 rounded-full border-4 border-background" />
                </div>
            </div>
            <CardContent className="pt-12 text-center">
                 <Skeleton className="h-6 w-3/4 mx-auto" />
                 <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                 <Skeleton className="h-5 w-24 mx-auto mt-4" />
                 <Skeleton className="h-9 w-full mt-4" />
            </CardContent>
        </Card>
      );
    }
  
    const companyWithImages: Company = {
      ...company,
      logo: logoUrl || undefined,
      coverImage: coverUrl || undefined,
    };
  
    return (
      <CompanyCard
        company={companyWithImages}
        averageRating={averageRating}
        reviewCount={reviewCount}
        onSelectAction={onSelectAction}
        showActionsMenu={showActionsMenu}
        actionButton={actionButton}
      />
    );
  };


export default function MarketplacePage() {
  const { config } = useBrandsoft();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [townFilter, setTownFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'suppliers');

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', activeTab);
    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  }, [activeTab, router, searchParams]);

  const businesses = useMemo(() => {
    if (!config || !config.companies) return [];
    return config.companies;
  }, [config]);

  const businessesWithRatings = useMemo(() => {
    if (!businesses || !config?.reviews) {
      return businesses.map(biz => ({ ...biz, averageRating: 0, reviewCount: 0 }));
    }

    return businesses.map(biz => {
      const companyReviews = config.reviews!.filter(r => r.businessId === biz.id);
      const reviewCount = companyReviews.length;
      const averageRating = reviewCount > 0
        ? companyReviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        : 0;
      
      return { ...biz, averageRating, reviewCount };
    });
  }, [businesses, config?.reviews]);


  const filteredBusinesses = useMemo(() => {
    return businessesWithRatings.filter(biz => {
      const nameMatch = biz.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      const industryMatch = industryFilter === 'all' || biz.industry === industryFilter;
      const townMatch = townFilter === 'all' || biz.town === townFilter;
      return nameMatch && industryMatch && townMatch;
    });
  }, [businessesWithRatings, searchTerm, industryFilter, townFilter]);

  const industries = useMemo(() => {
    if (!businesses) return [];
    return [...new Set(businesses.map(b => b.industry).filter((i): i is string => !!i))];
  }, [businesses]);

  const towns = useMemo(() => {
    if (!businesses) return [];
    return [...new Set(businesses.map(b => b.town).filter((t): t is string => !!t))];
  }, [businesses]);
  
  const currentUserId = useMemo(() => {
    if (!config || !config.brand) return null;
    const myCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
    return myCompany?.id || null;
  }, [config]);

  const handleCardClick = (companyId: string) => {
    router.push(`/marketplace/${companyId}`);
  };

  const handleSelectAction = (action: 'view' | 'edit' | 'delete', company: Company) => {
    if (action === 'view') {
        handleCardClick(company.id);
    }
  };

   const filteredRequests = useMemo(() => {
    if (!config || !config.companies || !currentUserId) return [];
    
    let requests = (config.incomingRequests || []).filter((req: QuotationRequest) => 
        req.status === 'open' && 
        new Date(req.dueDate) >= new Date() &&
        req.requesterId !== currentUserId &&
        (req.isPublic || (req.companyIds && req.companyIds.includes(currentUserId)))
    );

    const companiesById = new Map<string, Company>(config.companies.map(c => [c.id, c]));

    return requests.filter((req: QuotationRequest) => {
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

  }, [config, searchTerm, industryFilter, townFilter, currentUserId]);

  
  const FilterControls = () => (
    <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Search by name or keyword..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-4">
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by industry" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
            </SelectContent>
            </Select>
            <Select value={townFilter} onValueChange={setTownFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by town" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Towns</SelectItem>
                {towns.map(town => <SelectItem key={town} value={town}>{town}</SelectItem>)}
            </SelectContent>
            </Select>
        </div>
        </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Town Marketplace</h1>
        <p className="text-muted-foreground">Discover and connect with local businesses and opportunities.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="public-quotations">Public Quotations</TabsTrigger>
        </TabsList>
        <TabsContent value="suppliers" className="mt-6">
            <FilterControls />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredBusinesses.map(biz => {
                    const isMyCompany = biz.id === currentUserId;
                    return (
                        <CompanyCardWithImages 
                            key={biz.id} 
                            company={biz} 
                            averageRating={biz.averageRating}
                            reviewCount={biz.reviewCount}
                            // This now works because CompanyCardWithImages expects 1 arg, and we pass a closure
                            onSelectAction={(action) => handleSelectAction(action, biz)} 
                            actionButton={
                                isMyCompany ? (
                                    <Button asChild variant="secondary" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md" onClick={(e) => e.stopPropagation()}>
                                        <Link href="/settings">
                                            <FilePenLine className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                ) : undefined
                            }
                        />
                    )
                })}
              </div>
               {filteredBusinesses.length === 0 && (
                 <div className="text-center py-16 text-muted-foreground col-span-full">
                    <p>No businesses found matching your criteria.</p>
                 </div>
               )}
        </TabsContent>
        <TabsContent value="public-quotations" className="mt-6">
            <FilterControls />
            <PublicQuotationRequestList 
              requests={filteredRequests}
              currentUserId={currentUserId}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
