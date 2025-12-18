
'use client';

import { useState, useEffect } from 'react';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Gift, Calendar } from 'lucide-react';
import { GenerateKeyDialog } from '@/components/office/dialogs/generate-key-dialog';
import { PurchaseDialog, type PlanDetails } from '@/components/purchase-dialog';
import { useRouter } from 'next/navigation';

export default function OfficeKeysPage() {
    const { config } = useBrandsoft();
    const router = useRouter();
    const [isGenerateKeyOpen, setIsGenerateKeyOpen] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState<PlanDetails | null>(null);

    const affiliate = config?.affiliate;

    useEffect(() => {
        if (config && !affiliate) {
            // If config is loaded but there's no affiliate, they shouldn't be here.
            router.push('/dashboard');
        }
    }, [config, affiliate, router]);

    if (!affiliate) {
        return <div>Loading...</div>;
    }

    const mwkBalance = affiliate.myWallet || 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Activation Keys</h1>
            <p className="text-muted-foreground">Manage your generated activation keys for new clients.</p>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Generated Keys</CardTitle>
                        <CardDescription>A list of all the keys you have purchased.</CardDescription>
                    </div>
                     <Button onClick={() => setIsGenerateKeyOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Activation Key
                    </Button>
                </CardHeader>
                <CardContent className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">Activation key management coming soon.</p>
                </CardContent>
            </Card>

            <GenerateKeyDialog
                isOpen={isGenerateKeyOpen}
                onClose={() => setIsGenerateKeyOpen(false)}
                staffId={affiliate.staffId || ''}
                walletBalance={mwkBalance}
                creditBalance={affiliate.creditBalance || 0}
            />
            {purchaseDetails && (
                <PurchaseDialog
                    plan={purchaseDetails}
                    isOpen={!!purchaseDetails}
                    onClose={() => setPurchaseDetails(null)}
                    onSuccess={() => { setPurchaseDetails(null); setIsGenerateKeyOpen(false); }}
                    isTopUp
                />
            )}
        </div>
    );
}
