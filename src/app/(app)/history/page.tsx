
'use client';

import { useMemo, useState } from 'react';
import { useBrandsoft, type Purchase } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoryTable } from './history-table';
import { History as HistoryIcon, Wallet } from 'lucide-react';
import { StatCard } from '@/components/office/stat-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WalletBalance } from '@/components/wallet-balance';

export default function HistoryPage() {
    const { config, saveConfig } = useBrandsoft();
    const [autoRenew, setAutoRenew] = useState(config?.profile.autoRenew || false);

    const { planPurchases, topUps } = useMemo(() => {
        if (!config?.purchases) return { planPurchases: [], topUps: [] };

        const allPurchases = config.purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const planPurchases = allPurchases.filter(p => !p.planName.toLowerCase().includes('top-up') && !p.planName.toLowerCase().includes('credit purchase'));
        const topUps = allPurchases.filter(p => p.planName.toLowerCase().includes('top-up') || p.planName.toLowerCase().includes('credit purchase'));
        
        return { planPurchases, topUps };

    }, [config?.purchases]);
    
    const handleAutoRenewChange = (checked: boolean) => {
        setAutoRenew(checked);
        if (config) {
            saveConfig({
                ...config,
                profile: { ...config.profile, autoRenew: checked }
            }, { redirect: false });
        }
    };
    
    const walletBalance = config?.profile.walletBalance || 0;

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

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatCard 
                    icon={Wallet} 
                    title="Available Wallet Balance" 
                    value={walletBalance} 
                    isCurrency
                    currencyPrefix={config?.profile.defaultCurrency}
                    footer="This balance is used for plan renewals and purchases."
                    variant="primary"
                >
                    <div className="flex justify-center">
                        <WalletBalance />
                    </div>
                </StatCard>
                <Card className="flex flex-col justify-center">
                    <CardHeader>
                        <CardTitle>Automatic Renewals</CardTitle>
                        <CardDescription>
                            Automatically renew your plan using your wallet balance when it's about to expire.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label htmlFor="auto-renew-switch" className="font-medium">
                                Enable Auto-renewal
                            </Label>
                            <Switch
                                id="auto-renew-switch"
                                checked={autoRenew}
                                onCheckedChange={handleAutoRenewChange}
                            />
                        </div>
                    </CardContent>
                </Card>
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
