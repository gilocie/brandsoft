
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { ClientCard } from '@/components/affiliate/client-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getImageFromDB } from '@/hooks/use-brand-image';

// Wrapper component to load client avatar from IndexedDB
const ClientCardWithImage = ({ client, baseUrl }: { client: any, baseUrl?: string }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      setIsLoading(true);
      // Try to get the company logo from IndexedDB
      const dbImage = await getImageFromDB(`company-logo-${client.id}`);
      
      if (isMounted) {
        if (dbImage) {
          setAvatarUrl(dbImage);
        } else if (client.avatar && client.avatar !== 'indexed-db') {
          setAvatarUrl(client.avatar);
        } else {
          setAvatarUrl(null);
        }
        setIsLoading(false);
      }
    };
    
    fetchImage();
    return () => { isMounted = false; };
  }, [client.id, client.avatar]);

  return (
    <ClientCard 
      key={client.id} 
      client={{ ...client, avatar: avatarUrl }} 
      baseUrl={baseUrl}
      isLoadingImage={isLoading}
    />
  );
};

export default function OfficeClientsPage() {
  const { config } = useBrandsoft();
  const affiliate = config?.affiliate;

  // Sync logic to ensure data is ALWAYS derived from company purchases
  const syncedClients = useMemo(() => {
    if (!affiliate?.clients || !config?.companies) return [];

    return affiliate.clients.map(client => {
        const realCompany = config.companies.find(c => c.id === client.id);
        
        if (realCompany) {
            // Find active purchase - this is the ONLY source of truth for plan info
            const activePurchase = realCompany.purchases?.find(p => p.status === 'active');
            const pendingPurchase = realCompany.purchases?.find(p => p.status === 'pending');
            
            // Always derive from purchases, never use cached values
            let planName = 'Free Trial';
            let remainingDays = 0;

            if (activePurchase) {
                planName = activePurchase.planName;
                remainingDays = activePurchase.remainingTime?.value ?? 0;
            } else if (pendingPurchase) {
                planName = `${pendingPurchase.planName} (Pending)`;
                remainingDays = 0;
            }

            // Derive status from actual purchase state
            const isActive = activePurchase || planName === 'Free Trial';
            const status = isActive ? 'active' : 'expired';

            return {
                ...client,
                name: realCompany.companyName,
                avatar: realCompany.logo || client.avatar,
                walletBalance: realCompany.walletBalance ?? 0,
                plan: planName,
                remainingDays: remainingDays,
                status: status,
            };
        }
        
        // Company not found - mark as unknown/expired
        return {
            ...client,
            plan: 'Unknown',
            remainingDays: 0,
            status: 'expired' as const,
        };
    });
  }, [affiliate?.clients, config?.companies]);

  if (!config || !affiliate) {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }

  return (
    <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Clients</h1>
                <p className="text-muted-foreground">Manage all your referred clients.</p>
            </div>
            <Button variant="ghost" asChild>
                <Link href="/office"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Office</Link>
            </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {syncedClients.length > 0 ? (
                syncedClients.map(client => (
                    <ClientCardWithImage key={client.id} client={client} baseUrl="/office" />
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
                    <User className="h-12 w-12 mb-4" />
                    <p className="font-semibold">No clients yet.</p>
                    <p className="text-sm">Register a company with your Staff ID to see them here.</p>
                </div>
            )}
        </div>
    </div>
  );
}
