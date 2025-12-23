
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
  const { config, isAffiliateLoggedIn } = useBrandsoft();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAffiliateLoggedIn === false) { // Check for explicit false after initial load
      router.push('/staff/login');
    }
  }, [isAffiliateLoggedIn, router]);

  // If still loading or not logged in, show a loader
  if (!isAffiliateLoggedIn) {
      return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }

  // If logged in, show the content
  return <OfficePageContent />;
}
