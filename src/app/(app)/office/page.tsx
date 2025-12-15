
'use client';

import { Loader2 } from 'lucide-react';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { OfficePageContent } from './office-page-content';

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
