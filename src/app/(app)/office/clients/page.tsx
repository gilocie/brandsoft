'use client';

import { useMemo } from 'react';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { ClientCard } from '@/components/affiliate/client-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ClientCardWithImage } from '@/components/office/office-page-content';

export default function OfficeClientsPage() {
  const { config } = useBrandsoft();
  const affiliate = config?.affiliate;

  // Same logic as OfficePageContent to ensure data consistency
  const syncedClients = useMemo(() => {
    if (!affiliate?.clients || !config?.companies) return [];

    return affiliate.clients.map(client => {
        const realCompany = config.companies.find(c => c.id === client.id);
        if (realCompany) {
            // Find active purchase
            const activePurchase = realCompany.purchases?.find(p => p.status === 'active');
            const pendingPurchase = realCompany.purchases?.find(p => p.status === 'pending');
            
            let planName = 'Free Trial';
            let remainingDays = 0;

            if (activePurchase) {
                planName = activePurchase.planName;
                remainingDays = activePurchase.remainingTime?.value || 0;
            } else if (pendingPurchase) {
                planName = `${pendingPurchase.planName} (Pending)`;
                remainingDays = 0;
            }

            return {
                ...client,
                name: realCompany.companyName,
                avatar: realCompany.logo || client.avatar,
                walletBalance: realCompany.walletBalance,
                plan: planName,
                remainingDays: remainingDays,
            };
        }
        return client;
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
