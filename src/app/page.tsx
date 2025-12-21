

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import Image from 'next/image';
import { useBrandImage } from '@/hooks/use-brand-image';
import brandsoftBackground from '@/app/backgrounds/background.jpg';


export default function HomePage() {
  const router = useRouter();
  const { isActivated, isConfigured } = useBrandsoft();
  const { image: logoImage } = useBrandImage('logo');

  useEffect(() => {
    if (isActivated === null || isConfigured === null) {
      // Still loading from localStorage
      return;
    }

    if (!isActivated) {
      router.replace('/activation');
    } else if (!isConfigured) {
      router.replace('/setup');
    } else {
      router.replace('/dashboard');
    }
  }, [isActivated, isConfigured, router]);

  return (
    <div 
      className="flex h-screen w-full items-center justify-center bg-background bg-cover bg-center"
      style={{ backgroundImage: `url(${brandsoftBackground.src})` }}
      data-ai-hint="business building"
    >
       <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex flex-col items-center gap-4">
        <Logo logoUrl={logoImage || undefined} />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing BrandSoft...</p>
      </div>
    </div>
  );
}
