
'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useBrandsoft } from '@/hooks/use-brandsoft';

const OfficePageContent = dynamic(
  () => import('./office-page-content').then((mod) => mod.OfficePageContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    ),
  }
);

export default function OfficePage() {
  const { config } = useBrandsoft();

  if (!config) {
     return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     )
  }
  
  return <OfficePageContent />;
}
