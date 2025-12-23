
'use client';

import { useBrandsoft } from '@/hooks/use-brandsoft';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const OfficePageContent = dynamic(
  () => import('@/components/office/office-page-content').then(mod => mod.OfficePageContent),
  {
    ssr: false,
    loading: () => (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }
);

export default function OfficePage() {
  const { config } = useBrandsoft();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This logic ensures that if the affiliate data is cleared (e.g., in admin),
    // the user is redirected away from the office page to prevent crashes.
    // CRITICAL FIX: Only run this check if we are on the main /office page itself.
    if (pathname === '/office') {
        if (config === null) {
          // Still loading
        } else if (!config.affiliate) {
          router.push('/dashboard');
        }
    }
  }, [config, router, pathname]);


  return <OfficePageContent />;
}
