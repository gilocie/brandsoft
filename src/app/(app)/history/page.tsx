
'use client';

import { useMemo } from 'react';
import { useBrandsoft, type Purchase } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoryTable } from './history-table';
import { History as HistoryIcon } from 'lucide-react';

export default function HistoryPage() {
    const { config } = useBrandsoft();

    const { planPurchases, topUps } = useMemo(() => {
        if (!config?.purchases) return { planPurchases: [], topUps: [] };

        const allPurchases = config.purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const planPurchases = allPurchases.filter(p => !p.planName.toLowerCase().includes('top-up') && !p.planName.toLowerCase().includes('credit purchase'));
        const topUps = allPurchases.filter(p => p.planName.toLowerCase().includes('top-up') || p.planName.toLowerCase().includes('credit purchase'));
        
        return { planPurchases, topUps };

    }, [config?.purchases]);

    return (
        <div className="container mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <HistoryIcon className="h-8 w-8" />
                    Transaction History
                </h1>
                <p className="text-muted-foreground">
                    Review your plan purchases and wallet top-up history.
                </p>
            </div>

            <Tabs defaultValue="plans" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="plans">Plan Purchases</TabsTrigger>
                    <TabsTrigger value="topups">Wallet Top-ups</TabsTrigger>
                </TabsList>
                <TabsContent value="plans">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plan Purchases</CardTitle>
                            <CardDescription>
                                A history of all your subscription plan activations and renewals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <HistoryTable purchases={planPurchases} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="topups">
                    <Card>
                         <CardHeader>
                            <CardTitle>Wallet Top-ups</CardTitle>
                            <CardDescription>
                                A history of all funds added to your wallet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <HistoryTable purchases={topUps} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
