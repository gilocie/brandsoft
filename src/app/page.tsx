"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBrandsoft } from '@/hooks/use-brandsoft.tsx';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function HomePage() {
  const router = useRouter();
  const { isActivated, isConfigured } = useBrandsoft();

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
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing BrandSoft...</p>
      </div>
    </div>
  );
}
