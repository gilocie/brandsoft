
'use client';

import { useMemo, useState } from 'react';
import { useBrandsoft, type Company, type Review } from '@/hooks/use-brandsoft';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CompanyCard } from '@/components/company-card';


export default function MarketplacePage() {
  const { config, deleteCompany } = useBrandsoft();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [townFilter, setTownFilter] = useState('all');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const businesses = useMemo(() => {
    if (!config || !config.companies) return [];
    // We filter out the user's own company from the marketplace view
    return config.companies.filter(c => c.companyName !== config.brand.businessName);
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

  const handleCardClick = (companyId: string) => {
    router.push(`/marketplace/${companyId}`);
  };

  const handleSelectAction = (action: 'view' | 'edit' | 'delete', company: Company) => {
    if (action === 'view') {
        handleCardClick(company.id);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Town Marketplace</h1>
        <p className="text-muted-foreground">Discover and connect with local businesses.</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name..."
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredBusinesses.map(biz => (
            <CompanyCard 
                key={biz.id} 
                company={biz} 
                averageRating={biz.averageRating}
                reviewCount={biz.reviewCount}
                onSelectAction={(action) => handleSelectAction(action, biz)} 
            />
        ))}
      </div>
       {filteredBusinesses.length === 0 && (
         <div className="text-center py-16 text-muted-foreground col-span-full">
            <p>No businesses found matching your criteria.</p>
         </div>
       )}
    </div>
  );
}
