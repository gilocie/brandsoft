
'use client';

import { useBrandsoft } from '@/hooks/use-brandsoft.tsx';
import { BriefcaseBusiness } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import BrandsoftLogo from '@/app/brandsoftlogo.png';
import Image from 'next/image';

export function Logo() {
  const { config } = useBrandsoft();

  const businessName = config?.brand?.businessName || 'BrandSoft';
  const logoUrl = config?.brand?.logo;

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8 bg-transparent">
        <Image src={BrandsoftLogo} alt={businessName} width={32} height={32} />
      </Avatar>
      <h1 className="text-3xl font-body font-bold text-primary">{businessName}</h1>
    </div>
  );
}
