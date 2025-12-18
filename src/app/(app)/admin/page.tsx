

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Affiliate, type Transaction, type AffiliateClient, type Company, type AdminSettings, type Plan } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Users, BarChart, Clock, CheckCircle, RefreshCw, Briefcase, UserX, Trash2, Wallet, TrendingUp, TrendingDown, PackagePlus, Banknote, Shield, Lock, Unlock, AlertTriangle, Bot, Star, Zap, Pencil } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientCard } from '@/components/affiliate/client-card';
import { AffiliateCard } from '@/components/affiliate/affiliate-card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ManageReserveDialog, type ManageReserveFormData } from '@/components/admin/manage-reserve-dialog';
import { StatCard } from '@/components/admin/stat-card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';


const ADMIN_ACTIVATION_KEY = 'BRANDSOFT-ADMIN';

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'accent' | 'primary' } = {
  pending: 'accent',
  processing: 'primary',
  completed: 'success',
};

const creditSettingsSchema = z.object({
  maxCredits: z.coerce.number().min(0, "Max credits cannot be negative."),
  buyPrice: z.coerce.number().min(0, "Buy price cannot be negative."),
  sellPrice: z.coerce.number().min(0, "Sell price cannot be negative."),
  exchangeValue: z.coerce.number().min(0, "Exchange value cannot be negative."),
  isReserveLocked: z.boolean().default(false),
});
type CreditSettingsFormData = z.infer<typeof creditSettingsSchema>;


export default function AdminPage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    
    const [affiliateToActOn, setAffiliateToActOn] = useState<Affiliate | null>(null);
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isManageReserveOpen, setIsManageReserveOpen] = useState(false);
    const [isResetFinancialsOpen, setIsResetFinancialsOpen] = useState(false);
    
    const adminSettings: AdminSettings = useMemo(() => config?.admin || {
        maxCredits: 1000000,
        buyPrice: 850,
        sellPrice: 900,
        exchangeValue: 1000,
        availableCredits: 0,
        soldCredits: 0,
        isReserveLocked: false,
    }, [config?.admin]);

    const isReserveLocked = adminSettings.isReserveLocked;

    const form = useForm<CreditSettingsFormData>({
        resolver: zodResolver(creditSettingsSchema),
        defaultValues: adminSettings,
    });
    
    useEffect(() => {
        if (config?.admin) {
            form.reset(config.admin);
        }
    }, [config?.admin, form]);
    
    const watchedExchangeValue = form.watch('exchangeValue');
    const watchedSellPrice = form.watch('sellPrice');
    const watchedMaxCredits = form.watch('maxCredits');

    const affiliates = useMemo(() => (config?.affiliate ? [config.affiliate] : []), [config?.affiliate]);
    
    const distributionReserve = adminSettings.availableCredits || 0;

    const withdrawalRequests = useMemo(() => {
        if (!config?.affiliate?.transactions) return [];
        return config.affiliate.transactions
            .filter(t => t.type === 'debit' && !t.description.toLowerCase().includes('fee') && !t.description.toLowerCase().includes('manual') && !t.description.toLowerCase().includes('purchase'))
            .map(t => ({
                ...t,
                status: (t as any).status || 'pending',
                affiliateName: config.affiliate?.fullName || 'N/A'
            }));
    }, [config?.affiliate]);

    const pendingBsCreditWithdrawals = useMemo(() => {
        return withdrawalRequests.filter(req => req.status === 'pending' && (req as any).method === 'bsCredits');
    }, [withdrawalRequests]);

    const totalPendingBsCreditAmount = pendingBsCreditWithdrawals.reduce((sum, req) => sum + req.amount, 0);
    const totalPendingBsCredits = totalPendingBsCreditAmount / (adminSettings.exchangeValue || 1000);

    const availableCreditsPercentage = useMemo(() => {
        if (!watchedMaxCredits || watchedMaxCredits === 0) return 0;
        return (distributionReserve / watchedMaxCredits) * 100;
    }, [distributionReserve, watchedMaxCredits]);
    
    const soldCredits = adminSettings.soldCredits || 0;
    const netCreditRevenue = soldCredits * (adminSettings.sellPrice || 0);

    const revenueFromKeys = (adminSettings.keysSold || 0) * (adminSettings.keyPrice || 0);
    
    const revenueFromPlans = useMemo(() => {
        if (!config?.purchases) return 0;
        return config.purchases
            .filter(p => p.status === 'active' && !p.planName.toLowerCase().includes('key') && !p.planName.toLowerCase().includes('credit'))
            .reduce((sum, p) => {
                const price = parseFloat(p.planPrice.replace(/[^0-9.-]+/g,""));
                return sum + (isNaN(price) ? 0 : price);
            }, 0);
    }, [config?.purchases]);

    const combinedRevenue = (adminSettings.revenueFromKeys || 0) + (adminSettings.revenueFromPlans || 0);


    const onCreditSettingsSubmit = (data: CreditSettingsFormData) => {
        if (!config || isReserveLocked) return;
        const newSettings: AdminSettings = {
          ...adminSettings,
          ...data,
        };
        saveConfig({ ...config, admin: newSettings }, { redirect: false });
        toast({ title: "Credit Settings Saved", description: "Your BS Credit settings have been updated." });
    };
    

    const toggleReserveLock = () => {
         if (!config) return;
         const newLockState = !isReserveLocked;
         const newSettings: AdminSettings = { ...adminSettings, isReserveLocked: newLockState };
         saveConfig({ ...config, admin: newSettings }, { redirect: false });
         toast({ title: `Reserve ${newLockState ? 'Locked' : 'Unlocked'}`, description: `Credit settings are now ${newLockState ? 'protected' : 'editable'}.` });
    }

   
    const adminClients = useMemo(() => {
        if (!config?.companies) return [];

        const referredByAdmin = config.companies.filter(c => c.referredBy === ADMIN_ACTIVATION_KEY);
        const allAffiliateClientIds = affiliates.flatMap(a => a.clients.map(c => c.id));
        const unassigned = config.companies.filter(c => !c.referredBy && !allAffiliateClientIds.includes(c.id));
        
        const combined = [...referredByAdmin, ...unassigned];
        const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());

        const clientPurchases = config.purchases || [];

        return unique.map((company: Company): AffiliateClient => {
            const companyPurchases = clientPurchases
                .filter(p => p.customerId === company.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const activePurchase = companyPurchases.find(p => p.status === 'active');
            const latestPurchase = companyPurchases[0];

            let plan = 'Free Trial';
            let status: 'active' | 'expired' = 'active';
            let remainingDays;
            
            const purchaseToUse = activePurchase || latestPurchase;

            if (purchaseToUse) {
                plan = purchaseToUse.planName;
                remainingDays = purchaseToUse.remainingTime?.value;
                if(purchaseToUse.status === 'active') {
                    status = (remainingDays !== undefined && remainingDays > 0) ? 'active' : 'expired';
                } else {
                     status = 'expired';
                     remainingDays = 0;
                }
            } else {
                status = 'expired';
                remainingDays = 0;
            }
            
            return {
                id: company.id,
                name: company.companyName,
                avatar: company.logo || `https://picsum.photos/seed/${company.id}/100`,
                plan: plan,
                status: status,
                remainingDays: remainingDays,
                walletBalance: 0,
            };
        });
    }, [config?.companies, config?.purchases, affiliates]);

    const totalAffiliates = affiliates.length;
    
    const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'pending');
    const totalPendingAmount = pendingWithdrawals.reduce((sum, req) => sum + req.amount, 0);


    const handleStatusChange = (transactionId: string, newStatus: 'pending' | 'processing' | 'completed') => {
        if (!config?.affiliate || !config?.admin) return;

        const transaction = config.affiliate.transactions?.find(t => t.id === transactionId);
        if (!transaction) return;

        let newAffiliateData = { ...config.affiliate };
        let newAdminSettings = { ...config.admin };

        // Update transaction status
        newAffiliateData.transactions = newAffiliateData.transactions?.map(t => 
            t.id === transactionId ? { ...t, status: newStatus } : t
        );

        // If a BS Credit withdrawal is completed, return credits to the reserve
        if (newStatus === 'completed' && (transaction as any).method === 'bsCredits') {
            const creditAmount = transaction.amount / (adminSettings.exchangeValue || 1000);
            newAdminSettings.availableCredits = (newAdminSettings.availableCredits || 0) + creditAmount;
        }

        saveConfig({ ...config, affiliate: newAffiliateData, admin: newAdminSettings }, { redirect: false, revalidate: true });
        
        toast({
            title: "Status Updated",
            description: `Withdrawal status set to ${newStatus}.`,
        });
    };
    
     const handleSelectAction = (action: 'deactivate' | 'delete', affiliate: Affiliate) => {
        setAffiliateToActOn(affiliate);
        if (action === 'deactivate') setIsDeactivateOpen(true);
        if (action === 'delete') setIsDeleteOpen(true);
    };

    const handleDeactivateAffiliate = () => {
        if (affiliateToActOn) {
            console.log(`Deactivating ${affiliateToActOn.fullName}`);
            toast({ title: 'Affiliate Deactivated' });
            setIsDeactivateOpen(false);
        }
    };

    const handleDeleteAffiliate = () => {
        if (config && affiliateToActOn) {
             const newConfig = { ...config, affiliate: undefined };
             saveConfig(newConfig, { redirect: false });
             toast({ title: 'Affiliate Deleted' });
             setIsDeleteOpen(false);
        }
    };

    const handleManageReserve = (data: ManageReserveFormData) => {
        if (!config || isReserveLocked) return;
        const currentCredits = adminSettings.availableCredits || 0;
        const maxCredits = adminSettings.maxCredits || 0;
        let newCredits = currentCredits;

        if (data.action === 'add') {
            if (currentCredits + data.amount > maxCredits) {
                toast({ variant: 'destructive', title: 'Limit Exceeded', description: `Cannot add more than the max limit of ${maxCredits}.`});
                return;
            }
            newCredits += data.amount;
        } else {
             if (data.amount > currentCredits) {
                toast({ variant: 'destructive', title: 'Insufficient Credits', description: `Cannot deduct more than the available ${currentCredits} credits.`});
                return;
            }
            newCredits -= data.amount;
        }
        
        const newAdminSettings = { ...adminSettings, availableCredits: newCredits };
        saveConfig({ ...config, admin: newAdminSettings }, { redirect: false });
        
        toast({ title: "Reserve Updated", description: `Credit reserve is now ${newCredits.toLocaleString()}.` });
        setIsManageReserveOpen(false);
    };
    
    const handleResetFinancials = () => {
        if (!config || !config.admin) return;

        const newAdminSettings: AdminSettings = {
            ...config.admin,
            soldCredits: 0,
            availableCredits: 0,
            revenueFromKeys: 0,
            revenueFromPlans: 0,
            keysSold: 0,
        };

        let newAffiliateData = config.affiliate;
        if (newAffiliateData) {
            newAffiliateData = {
                ...newAffiliateData,
                creditBalance: 0,
                myWallet: 0,
                transactions: [],
                totalSales: 0,
                unclaimedCommission: 0,
                bonus: 0,
                generatedKeys: [],
            };
        }

        const updatedPurchases = (config.purchases || []).filter(p => !p.planName.toLowerCase().includes('key'));


        saveConfig({ ...config, admin: newAdminSettings, affiliate: newAffiliateData, purchases: updatedPurchases }, { redirect: false, revalidate: true });
        toast({ title: 'Financial Records Reset!', description: 'All credit sales and affiliate balances have been reset.' });
        setIsResetFinancialsOpen(false);
    };

    return (
        <div className="container mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your team and their withdrawal requests.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <StatCard 
                    title="Distribution Reserve" 
                    value={`BS ${distributionReserve.toLocaleString()}`} 
                    icon={Wallet}
                    description={`Value: K${(distributionReserve * (adminSettings.sellPrice || 0)).toLocaleString()}`}
                    className={cn(distributionReserve <= 100 && 'bg-destructive text-destructive-foreground')}
                 >
                    <Button size="sm" className="w-full mt-2" onClick={() => setIsManageReserveOpen(true)} disabled={isReserveLocked}>Manage</Button>
                </StatCard>
                 <StatCard 
                    title="Sold Credits" 
                    value={`BS ${soldCredits.toLocaleString()}`} 
                    description={`Value: K${(soldCredits * (adminSettings.sellPrice || 0)).toLocaleString()}`} 
                    icon={TrendingUp} 
                 />
                 <StatCard 
                    title="Net Credit Revenues" 
                    value={`K${netCreditRevenue.toLocaleString()}`} 
                    description="Total revenue from credit sales" 
                    icon={BarChart} 
                />
                 <StatCard 
                    title="Combined Revenue" 
                    value={`K${combinedRevenue.toLocaleString()}`} 
                    description="From Plans & Keys" 
                    icon={BarChart} 
                />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Affiliates" value={totalAffiliates} icon={Users} />
                 <StatCard title="BS Withdraw Requests" value={`BS ${(totalPendingBsCreditAmount).toLocaleString()}`} icon={Banknote} />
                <StatCard title="Pending Withdrawals" value={`K${totalPendingAmount.toLocaleString()}`} icon={Clock} />
            </div>

             <Tabs defaultValue="admin-clients" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="admin-clients">Admin Clients ({adminClients.length})</TabsTrigger>
                    <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>
                 <TabsContent value="admin-clients" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin-Managed Clients</CardTitle>
                            <CardDescription>Clients directly managed by Brandsoft.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                             {adminClients.length > 0 ? adminClients.map((client: AffiliateClient) => (
                                <ClientCard key={client.id} client={client} baseUrl="/admin" />
                            )) : (
                                <div className="col-span-full flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                                    <p className="text-muted-foreground">No admin-managed clients found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="options" className="pt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Options & Settings</CardTitle>
                            <CardDescription>Manage affiliate program settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="credits-reserve">
                                <TabsList>
                                    <TabsTrigger value="credits-reserve">Credits Reserve</TabsTrigger>
                                    <TabsTrigger value="system-tools">System Tools</TabsTrigger>
                                </TabsList>
                                <TabsContent value="credits-reserve" className="pt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>BS Credits Configuration</CardTitle>
                                            <CardDescription>Set the economic parameters for your affiliate credit system.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Card className="mb-6 bg-primary text-primary-foreground">
                                                <CardHeader>
                                                    <CardTitle className="flex items-center justify-between text-base">
                                                        <span>Master Reserve Status</span>
                                                        <span className="text-sm font-normal text-primary-foreground/80">{availableCreditsPercentage.toFixed(1)}% Full</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between font-mono text-sm">
                                                            <span>BS {distributionReserve.toLocaleString()}</span>
                                                            <span className="font-sans text-primary-foreground/80">/ BS {(watchedMaxCredits || 0).toLocaleString()}</span>
                                                        </div>
                                                        <Progress value={availableCreditsPercentage} className="bg-primary-foreground/20 [&>div]:bg-primary-foreground"/>
                                                        <div className="text-xs text-primary-foreground/80 pt-1">
                                                            Value at Sell Price: K{((watchedMaxCredits || 0) * (watchedSellPrice || 0)).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(onCreditSettingsSubmit)} className="space-y-4">
                                                    <FormField control={form.control} name="maxCredits" render={({ field }) => (
                                                        <FormItem>
                                                            <div className="flex items-center justify-between">
                                                                <FormLabel>Master Reserve</FormLabel>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={toggleReserveLock}>
                                                                                {isReserveLocked ? <Lock className="h-4 w-4"/> : <Unlock className="h-4 w-4"/>}
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{isReserveLocked ? 'Unlock to edit settings' : 'Lock to protect settings'}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                            <FormControl><Input type="text" {...field} disabled={isReserveLocked} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/,/g, ''), 10) || 0)} value={(field.value || 0).toLocaleString()} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="buyPrice" render={({ field }) => (
                                                        <FormItem><FormLabel>BS Credit Buying Price (from affiliates)</FormLabel><FormControl><Input type="text" {...field} disabled={isReserveLocked} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/,/g, ''), 10) || 0)} value={(field.value || 0).toLocaleString()} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="sellPrice" render={({ field }) => (
                                                        <FormItem><FormLabel>BS Credit Selling Price (to affiliates)</FormLabel><FormControl><Input type="text" {...field} disabled={isReserveLocked} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/,/g, ''), 10) || 0)} value={(field.value || 0).toLocaleString()} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="exchangeValue" render={({ field }) => (
                                                        <FormItem><FormLabel>BS Credit Exchange Value (1 Credit = K{watchedExchangeValue ? watchedExchangeValue.toLocaleString() : 0})</FormLabel><FormControl><Input type="text" {...field} disabled={isReserveLocked} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/,/g, ''), 10) || 0)} value={(field.value || 0).toLocaleString()} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <Button type="submit" disabled={isReserveLocked}>Save Credit Settings</Button>
                                                </form>
                                            </Form>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="system-tools" className="pt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Danger Zone</CardTitle>
                                            <CardDescription>These are destructive actions. Use with caution.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between p-4 border border-destructive/50 bg-destructive/5 rounded-lg">
                                                <div>
                                                    <h3 className="font-semibold">Reset Financial Records</h3>
                                                    <p className="text-sm text-muted-foreground">This will reset all credit sales and affiliate balances.</p>
                                                </div>
                                                <AlertDialog open={isResetFinancialsOpen} onOpenChange={setIsResetFinancialsOpen}>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive">Reset Records</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Reset Financial Records?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                               This will set your distribution reserve to zero and clear all financial records. This action cannot be undone. Are you sure?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleResetFinancials} className="bg-destructive hover:bg-destructive/90">Yes, Reset Records</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Withdrawal Requests</CardTitle>
                    <CardDescription>Manage pending and processed withdrawals.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Affiliate</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {withdrawalRequests.length > 0 ? withdrawalRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.affiliateName}</TableCell>
                                    <TableCell>{new Date(req.date).toLocaleDateString()}</TableCell>
                                    <TableCell>K{req.amount.toLocaleString()}</TableCell>
                                    <TableCell>{(req as any).method || 'Not specified'}</TableCell>
                                    <TableCell><Badge variant={statusVariantMap[req.status]} className="capitalize">{req.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'processing')} disabled={req.status === 'processing'}>
                                                    <RefreshCw className="mr-2 h-4 w-4" /> Mark as Processing
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'completed')} disabled={req.status === 'completed'}>
                                                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No withdrawal requests found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate {affiliateToActOn?.fullName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will temporarily suspend their account and prevent them from earning commissions. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivateAffiliate}>Deactivate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {affiliateToActOn?.fullName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is irreversible and will permanently remove this affiliate from your system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAffiliate} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <ManageReserveDialog
                isOpen={isManageReserveOpen}
                onOpenChange={setIsManageReserveOpen}
                onSubmit={handleManageReserve}
                distributionReserve={adminSettings.availableCredits || 0}
                maxCredits={adminSettings.maxCredits || 0}
            />
        </div>
    );
}

    
