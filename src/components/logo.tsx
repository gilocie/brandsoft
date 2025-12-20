
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
      <Avatar className="h-10 w-10 bg-transparent">
        <Image src={BrandsoftLogo} alt={businessName} width={40} height={40} />
      </Avatar>
      <h1 className="text-4xl font-body font-bold text-primary">{businessName}</h1>
    </div>
  );
}
