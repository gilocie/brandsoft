

'use client';

import { useMemo, useState } from 'react';
import { useBrandsoft, type Transaction, type Affiliate } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, CreditCard, Gift, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/office/stat-card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WithdrawDialog } from '@/components/office/withdraw-dialog';
import { BuyCreditsDialog } from '@/components/office/buy-credits-dialog';
import { SellCreditsDialog } from '@/components/office/dialogs/sell-credits-dialog';
import { PurchaseDialog, type PlanDetails } from '@/components/purchase-dialog';
import { useToast } from '@/hooks/use-toast';
import { BonusProgressDialog } from '@/components/office/bonus-progress-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


const CREDIT_TO_MWK = 1000;

const ITEMS_PER_PAGE = 10;


export default function StaffWalletPage() {
    const { config, saveConfig } = useBrandsoft();
    const [payoutsPage, setPayoutsPage] = useState(0);
    const { toast } = useToast();
    const [purchaseDetails, setPurchaseDetails] = useState<PlanDetails | null>(null);
    const [isSellCreditsOpen, setIsSellCreditsOpen] = useState(false);

    const affiliate = config?.affiliate;

    const handlePushToWallet = () => {
        if (!config || !affiliate) return;
        const amountToPush = affiliate.unclaimedCommission || 0;
        if (amountToPush <= 0) return;

        const newAffiliateData: Affiliate = {
            ...affiliate,
            myWallet: (affiliate.myWallet || 0) + amountToPush,
            unclaimedCommission: 0,
            transactions: [
                {
                    id: `TRN-PUSH-${Date.now()}`,
                    date: new Date().toISOString(),
                    description: 'Pushed commission to wallet',
                    amount: amountToPush,
                    type: 'credit' as const,
                },
                ...(affiliate.transactions || [])
            ],
        };
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
        toast({
            title: "Funds Transferred!",
            description: `K${amountToPush.toLocaleString()} has been pushed to your wallet.`,
        });
    };

    const handleWithdraw = (amount: number, source: 'commission' | 'combined' | 'bonus', method: string) => {
        if (!config || !affiliate) return;
        
        const newTransaction: Transaction = {
          id: `TRN-WTH-${Date.now()}`,
          date: new Date().toISOString(),
          description: `Withdrawal via ${method}`,
          amount: amount,
          type: 'debit',
          status: 'pending',
        } as any;

        const newAffiliateData = { ...affiliate };
        
        const amountToWithdraw = amount;

        if (source === 'combined') {
            let remainingAmount = amountToWithdraw;
            const bonusDeduction = Math.min(newAffiliateData.bonus || 0, remainingAmount);
            newAffiliateData.bonus = (newAffiliateData.bonus || 0) - bonusDeduction;
            remainingAmount -= bonusDeduction;
            if (remainingAmount > 0) {
                newAffiliateData.myWallet = (newAffiliateData.myWallet || 0) - remainingAmount;
            }
        } else {
            newAffiliateData.myWallet = (newAffiliateData.myWallet || 0) - amountToWithdraw;
        }
        
        newAffiliateData.transactions = [newTransaction, ...(affiliate.transactions || [])];
        
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });

        toast({
            title: 'Withdrawal Request Submitted!',
            description: `Your request for K${amount.toLocaleString()} is being processed.`,
        });
    }

    const handleSellCredits = (amount: number) => {
        if (!config || !affiliate || !config.admin) return;
        const cashValue = amount * (config.admin.buyPrice || 850);

        const newAffiliateData: Affiliate = {
            ...affiliate,
            creditBalance: affiliate.creditBalance - amount,
            myWallet: affiliate.myWallet + cashValue,
            transactions: [
                {
                    id: `TRN-SELL-${Date.now()}`,
                    date: new Date().toISOString(),
                    description: `Sold ${amount} BS Credits`,
                    amount: cashValue,
                    type: 'credit',
                },
                ...(affiliate.transactions || []),
            ],
        };
        
        const newAdminSettings = {
            ...config.admin,
            creditsBoughtBack: (config.admin.creditsBoughtBack || 0) + amount,
            revenueFromKeys: (config.admin.revenueFromKeys || 0) + cashValue, // Using this to track cost
        };

        saveConfig({ ...config, affiliate: newAffiliateData, admin: newAdminSettings }, { revalidate: true });

        toast({
            title: 'Credits Sold!',
            description: `K${cashValue.toLocaleString()} has been added to your wallet.`,
        });
    };

    const commissionTransactions = useMemo(() => {
        if (!affiliate?.transactions) return [];
        return affiliate.transactions
        .filter(t => t.type === 'credit')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [affiliate?.transactions]);
    
    const purchaseTransactions = useMemo(() => {
        if (!affiliate?.transactions) return [];
        return affiliate.transactions
            .filter(t => t.description.toLowerCase().startsWith('purchased'))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [affiliate?.transactions]);

    const withdrawalTransactions = useMemo(() => {
        if (!affiliate?.transactions) return [];
        return affiliate.transactions
        .filter(t => t.type === 'debit' && (t as any).status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [affiliate?.transactions]);
    

    if (!config || !affiliate) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">My Wallet</h1>
            <p className="text-muted-foreground">Manage your earnings, credits, and transactions.</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={DollarSign} 
                    title="Unclaimed Commission" 
                    value={affiliate.unclaimedCommission || 0}
                    isCurrency 
                    footer="Ready to push to your wallet"
                >
                    <Button 
                        size="sm" 
                        className="w-full mt-2" 
                        disabled={(affiliate.unclaimedCommission || 0) <= 0}
                        onClick={handlePushToWallet}
                    >
                       Push to Wallet
                    </Button>
                </StatCard>
                 <StatCard 
                    icon={CreditCard} 
                    title="Credit Balance" 
                    value={affiliate.creditBalance || 0}
                    valuePrefix={`BS `}
                    footer={`Value: K${((affiliate.creditBalance || 0) * (config.admin?.buyPrice || 850)).toLocaleString()}`}
                >
                   <div className="flex gap-2 mt-2">
                        <BuyCreditsDialog
                            walletBalance={affiliate.myWallet || 0}
                            onManualPayment={(details) => setPurchaseDetails(details)}
                         />
                        <SellCreditsDialog
                            creditBalance={affiliate.creditBalance || 0}
                            isOpen={isSellCreditsOpen}
                            onOpenChange={setIsSellCreditsOpen}
                            buyPrice={config?.admin?.buyPrice || 850}
                            onSellConfirm={handleSellCredits}
                            affiliatePin={config?.affiliate?.pin}
                            isPinSet={config?.affiliate?.isPinSet}
                        />
                    </div>
                </StatCard>
                <BonusProgressDialog affiliate={affiliate} />
                 <Card className="bg-gradient-to-br from-primary to-orange-500 text-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Wallet Balance</CardTitle>
                            <Wallet className="h-5 w-5" />
                        </div>
                         <CardDescription className="text-white/80">
                           {affiliate.bonus > 0 ? `Includes K${affiliate.bonus.toLocaleString()} bonus` : 'Available for withdrawal'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">K{affiliate.myWallet.toLocaleString()}</p>
                    </CardContent>
                    <CardContent>
                        <WithdrawDialog 
                            commissionBalance={affiliate.myWallet || 0} 
                            bonusBalance={affiliate.bonus || 0} 
                            onWithdraw={handleWithdraw} 
                            isVerified={true}
                        />
                    </CardContent>
                 </Card>
            </div>

            <Tabs defaultValue="commissions">
                <TabsList>
                    <TabsTrigger value="commissions">Commissions</TabsTrigger>
                    <TabsTrigger value="my-purchases">My Purchases</TabsTrigger>
                    <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                </TabsList>

                <TabsContent value="commissions" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Commission History</CardTitle>
                            <CardDescription>All incoming funds from sales and renewals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {commissionTransactions.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{t.description}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-green-600">+ K{t.amount.toLocaleString()}</p>
                                    </div>
                                ))}
                                {commissionTransactions.length === 0 && (
                                     <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                                        <p className="text-muted-foreground">No commission transactions found.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="my-purchases" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Purchase History</CardTitle>
                            <CardDescription>Your history of credit and key purchases.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseTransactions.length > 0 ? purchaseTransactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell className="text-right font-medium text-red-600">
                                                - K{t.amount.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No purchases found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="withdrawals" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdrawal History</CardTitle>
                            <CardDescription>Your history of completed withdrawals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Channel</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawalTransactions.length > 0 ? withdrawalTransactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{new Date(t.date).toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-xs">{t.id}</TableCell>
                                            <TableCell>{(t as any).description || 'Unknown'}</TableCell>
                                            <TableCell>K{t.amount.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="success">Completed</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No completed withdrawals yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

