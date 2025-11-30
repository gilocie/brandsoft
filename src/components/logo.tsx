
'use client';

import { useBrandsoft } from '@/hooks/use-brandsoft.tsx';
import { BriefcaseBusiness } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function Logo() {
  const { config } = useBrandsoft();

  const businessName = config?.brand?.businessName || 'BrandSoft';
  const logoUrl = config?.brand?.logo;

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={logoUrl} alt={businessName} />
        <AvatarFallback>
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>
      <h1 className="text-3xl font-headline font-bold text-primary">{businessName}</h1>
    </div>
  );
}
