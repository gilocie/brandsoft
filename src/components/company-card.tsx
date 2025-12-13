
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Phone, Building2, MapPin, Plus } from 'lucide-react';
import type { Company } from '@/hooks/use-brandsoft';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';

const fallBackCover = 'https://picsum.photos/seed/companycover/600/200';

export function CompanyCard({ company, onSelectAction }: { company: Company, onSelectAction: (action: 'view' | 'edit' | 'delete') => void }) {
    const router = useRouter();
    const handleCardClick = () => {
        router.push(`/marketplace/${company.id}`);
    };

    return (
        <Card 
            className="w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg transform transition-all hover:-translate-y-1 hover:shadow-2xl"
            onClick={handleCardClick}
        >
            <div className="relative">
                {/* Cover Image */}
                <div className="h-28 bg-gray-200">
                     <Image
                        src={company.coverImage || fallBackCover}
                        alt={`${company.companyName} cover`}
                        width={600}
                        height={200}
                        className="w-full h-full object-cover"
                        data-ai-hint="office workspace"
                    />
                </div>

                {/* Follow Button */}
                <Button variant="secondary" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); alert('Follow functionality to be added!'); }}>
                    <Plus className="h-4 w-4" />
                </Button>
                
                {/* Avatar */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                    <Avatar className="h-20 w-20 border-4 border-background ring-1 ring-border">
                        <AvatarImage src={company.logo} alt={company.companyName} />
                        <AvatarFallback>
                           <Building2 className="h-8 w-8" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Card Content */}
            <CardContent className="pt-14 text-center">
                <h3 className="text-xl font-bold font-headline">{company.companyName}</h3>
                <p className="text-sm text-muted-foreground mt-1">{company.industry || 'Business'}</p>
                
                <div className="mt-4 flex justify-around border-t pt-4">
                    <div className="text-center">
                        <p className="text-sm font-semibold text-muted-foreground">Town</p>
                        <p className="font-bold text-lg">{company.town || 'N/A'}</p>
                    </div>
                    <div className="text-center">
                         <p className="text-sm font-semibold text-muted-foreground">Phone</p>
                         <p className="font-bold text-lg">{company.phone ? 'Available' : 'N/A'}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm font-semibold text-muted-foreground">Action</p>
                         <Button variant="default" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); onSelectAction('view'); }}>
                            View
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
