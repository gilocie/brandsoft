
'use client';

import { useMemo, useState } from 'react';
import { useBrandsoft, type Purchase } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoryTable } from './history-table';
import { History as HistoryIcon, Wallet, Zap, TrendingUp, CreditCard } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WalletBalance } from '@/components/wallet-balance';

export function HistoryPageContent() {
    const { config, saveConfig } = useBrandsoft();
    const [autoRenew, setAutoRenew] = useState(config?.profile.autoRenew || false);

    const { 
        planPurchases, 
        topUps,
        approvedPlans,
        pendingPlans,
        declinedPlans,
        approvedTopups,
        pendingTopups,
        declinedTopups
    } = useMemo(() => {
        if (!config?.purchases) return { planPurchases: [], topUps: [], approvedPlans: [], pendingPlans: [], declinedPlans: [], approvedTopups: [], pendingTopups: [], declinedTopups: [] };

        const allPurchases = config.purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const planPurchases = allPurchases.filter(p => !p.planName.toLowerCase().includes('top-up') && !p.planName.toLowerCase().includes('credit purchase'));
        const topUps = allPurchases.filter(p => p.planName.toLowerCase().includes('top-up') || p.planName.toLowerCase().includes('credit purchase'));
        
        return { 
            planPurchases, 
            topUps,
            approvedPlans: planPurchases.filter(p => p.status === 'active'),
            pendingPlans: planPurchases.filter(p => p.status === 'pending'),
            declinedPlans: planPurchases.filter(p => p.status === 'declined'),
            approvedTopups: topUps.filter(p => p.status === 'active'),
            pendingTopups: topUps.filter(p => p.status === 'pending'),
            declinedTopups: topUps.filter(p => p.status === 'declined'),
        };

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
    const currencySymbol = config?.profile.defaultCurrency === 'MWK' ? 'K' : config?.profile.defaultCurrency || '';

    // Calculate total spent on successful purchases
    const totalSpent = useMemo(() => {
        if (!config?.purchases) return 0;
        return config.purchases
            .filter(p => p.status === 'active')
            .reduce((sum, p) => {
                const priceString = p.planPrice || '0';
                const price = parseFloat(priceString.replace(/[^0-9.-]+/g,""));
                return sum + (isNaN(price) ? 0 : price);
            }, 0);
    }, [config?.purchases]);

    return (
        <div className="container mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <HistoryIcon className="h-8 w-8" />
                        Transaction History
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Review your plan purchases and wallet top-up history.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Wallet Balance Card */}
                <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white">Wallet Balance</CardTitle>
                            <Wallet className="h-5 w-5 text-white/80" />
                        </div>
                        <CardDescription className="text-white/80">
                            Available for purchases
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-3xl font-bold text-white">
                            {currencySymbol} {walletBalance.toLocaleString()}
                        </div>
                        <WalletBalance className="bg-white text-black hover:bg-gray-200"/>
                    </CardContent>
                </Card>

                {/* Auto Renewal Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Auto-renewal</CardTitle>
                            <Zap className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardDescription>
                            Automatically renew when plan expires
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                            <Label htmlFor="auto-renew-switch" className="font-medium cursor-pointer">
                                {autoRenew ? 'Enabled' : 'Disabled'}
                            </Label>
                            <Switch
                                id="auto-renew-switch"
                                checked={autoRenew}
                                onCheckedChange={handleAutoRenewChange}
                            />
                        </div>
                        {autoRenew && (
                            <p className="text-xs text-muted-foreground">
                                ✓ Your plan will auto-renew using wallet balance
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Total Spent Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Total Spent</CardTitle>
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </div>
                         <CardDescription>
                           All-time successful spending.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {currencySymbol} {totalSpent.toLocaleString()}
                        </div>
                         <p className="text-sm text-muted-foreground mt-2">
                           {(planPurchases.length + topUps.length)} total transactions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Tabs */}
            <Tabs defaultValue="plans" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="plans" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Plan Purchases ({planPurchases.length})
                    </TabsTrigger>
                    <TabsTrigger value="topups" className="gap-2">
                        <Wallet className="h-4 w-4" />
                        Wallet Top-ups ({topUps.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plan Purchases</CardTitle>
                            <CardDescription>
                                A history of all your subscription plan activations and renewals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Tabs defaultValue="approved">
                                <TabsList>
                                    <TabsTrigger value="approved">Approved</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="declined">Declined</TabsTrigger>
                                </TabsList>
                                <TabsContent value="approved" className="pt-4">
                                    <HistoryTable purchases={approvedPlans} />
                                </TabsContent>
                                <TabsContent value="pending" className="pt-4">
                                     <HistoryTable purchases={pendingPlans} />
                                </TabsContent>
                                <TabsContent value="declined" className="pt-4">
                                     <HistoryTable purchases={declinedPlans} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="topups" className="mt-6">
                    <Card>
                         <CardHeader>
                            <CardTitle>Wallet Top-ups</CardTitle>
                            <CardDescription>
                                A history of all funds added to your wallet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="approved">
                                <TabsList>
                                    <TabsTrigger value="approved">Approved</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="declined">Declined</TabsTrigger>
                                </TabsList>
                                <TabsContent value="approved" className="pt-4">
                                    <HistoryTable purchases={approvedTopups} />
                                </TabsContent>
                                <TabsContent value="pending" className="pt-4">
                                     <HistoryTable purchases={pendingTopups} />
                                </TabsContent>
                                <TabsContent value="declined" className="pt-4">
                                     <HistoryTable purchases={declinedTopups} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
