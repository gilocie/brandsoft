
'use client';

import { useMemo, useState } from 'react';
import { useBrandsoft, type Purchase } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoryTable } from './history-table';
import { History as HistoryIcon, Wallet, Zap, TrendingUp, CreditCard, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WalletBalance } from '@/components/wallet-balance';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export function HistoryPageContent() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    
    const [autoRenew, setAutoRenew] = useState(config?.profile.autoRenew || false);
    const [isAutoRenewConfirmOpen, setIsAutoRenewConfirmOpen] = useState(false);
    const [pendingAutoRenewState, setPendingAutoRenewState] = useState(false);
    const [isFundsAlertOpen, setIsFundsAlertOpen] = useState(false);

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
    
    const walletBalance = config?.profile.walletBalance || 0;
    const currencySymbol = config?.profile.defaultCurrency === 'MWK' ? 'K' : config?.profile.defaultCurrency || '';
    
    const handleAutoRenewToggle = (checked: boolean) => {
        setPendingAutoRenewState(checked);
        if (checked) { // Enabling
            if (walletBalance < 30000) {
                setIsFundsAlertOpen(true);
            } else {
                setIsAutoRenewConfirmOpen(true);
            }
        } else { // Disabling
            setIsAutoRenewConfirmOpen(true);
        }
    };

    const confirmAutoRenewChange = () => {
        setAutoRenew(pendingAutoRenewState);
        if (config) {
            saveConfig({
                ...config,
                profile: { ...config.profile, autoRenew: pendingAutoRenewState }
            }, { redirect: false });
        }
        toast({
            title: `Auto-renewal ${pendingAutoRenewState ? 'Enabled' : 'Disabled'}`,
        });
        setIsAutoRenewConfirmOpen(false);
    };
    
    const handleClearHistory = (type: 'plans' | 'topups') => {
        if (!config) return;

        const newPurchases = config.purchases.filter(p => {
            const isTopUp = p.planName.toLowerCase().includes('top-up') || p.planName.toLowerCase().includes('credit purchase');
            return type === 'plans' ? isTopUp : !isTopUp;
        });

        saveConfig({ ...config, purchases: newPurchases }, { redirect: false });
        toast({
            title: "History Cleared",
            description: `All ${type === 'plans' ? 'plan purchase' : 'top-up'} transactions have been deleted.`,
        });
    };


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
                                onCheckedChange={handleAutoRenewToggle}
                                disabled={walletBalance === 0 && !autoRenew}
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
                                <div className="flex items-center justify-between border-b">
                                    <TabsList>
                                        <TabsTrigger value="approved">Approved</TabsTrigger>
                                        <TabsTrigger value="pending">Pending</TabsTrigger>
                                        <TabsTrigger value="declined">Declined</TabsTrigger>
                                    </TabsList>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" disabled={planPurchases.length === 0}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Clear History
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete all plan purchase history. This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleClearHistory('plans')}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
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
                                 <div className="flex items-center justify-between border-b">
                                    <TabsList>
                                        <TabsTrigger value="approved">Approved</TabsTrigger>
                                        <TabsTrigger value="pending">Pending</TabsTrigger>
                                        <TabsTrigger value="declined">Declined</TabsTrigger>
                                    </TabsList>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" disabled={topUps.length === 0}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Clear History
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete all wallet top-up history. This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleClearHistory('topups')}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
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
            
            <AlertDialog open={isAutoRenewConfirmOpen} onOpenChange={setIsAutoRenewConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to {pendingAutoRenewState ? 'enable' : 'disable'} automatic plan renewals using your wallet balance.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAutoRenewChange}>
                            {pendingAutoRenewState ? 'Enable Auto-renewal' : 'Disable'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
             <AlertDialog open={isFundsAlertOpen} onOpenChange={setIsFundsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Insufficient Funds</AlertDialogTitle>
                        <AlertDialogDescription>
                            You need at least K30,000 in your wallet to enable auto-renewal. Please top up your wallet first.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <WalletBalance />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
