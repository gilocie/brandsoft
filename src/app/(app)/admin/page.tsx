

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Affiliate, type Transaction, type AffiliateClient, type Company, type AdminSettings } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Users, BarChart, Clock, CheckCircle, RefreshCw, Briefcase, UserX, Trash2, Wallet, TrendingUp, TrendingDown, PackagePlus, Banknote, Shield, Lock, Unlock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientCard } from '@/components/affiliate/client-card';
import { AffiliateCard } from '@/components/affiliate/affiliate-card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


const ADMIN_ACTIVATION_KEY = 'BRANDSOFT-ADMIN';

const StatCard = ({ title, value, icon: Icon, description, children, className }: { title: string, value: string | number, icon: React.ElementType, description?: string, children?: React.ReactNode, className?: string }) => (
    <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {children && <div className="mt-2">{children}</div>}
        </CardContent>
    </Card>
);

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'accent' | 'primary' } = {
  pending: 'accent',
  processing: 'primary',
  completed: 'success',
};

const plans = [
    { name: 'Free Trial', price: 'K0', features: ['Up to 10 invoices', 'Up to 10 customers', 'Basic templates'] },
    { name: 'Standard', price: 'K5,000/mo', features: ['Unlimited invoices', 'Unlimited customers', 'Premium templates', 'Email support'] },
    { name: 'Pro', price: 'K15,000/mo', features: ['All Standard features', 'API access', 'Priority support', 'Advanced analytics'] },
    { name: 'Enterprise', price: 'Custom', features: ['All Pro features', 'Dedicated support', 'Custom integrations', 'On-premise option'] },
];

const creditSettingsSchema = z.object({
  maxCredits: z.coerce.number().min(0, "Max credits cannot be negative."),
  buyPrice: z.coerce.number().min(0, "Buy price cannot be negative."),
  sellPrice: z.coerce.number().min(0, "Sell price cannot be negative."),
  exchangeValue: z.coerce.number().min(0, "Exchange value cannot be negative."),
  isReserveLocked: z.boolean().default(false),
});
type CreditSettingsFormData = z.infer<typeof creditSettingsSchema>;

const manageReserveSchema = z.object({
  action: z.enum(['add', 'deduct']),
  amount: z.coerce.number().min(0.01, "Amount must be a positive number."),
  reason: z.string().min(5, "A reason is required for this action."),
});

type ManageReserveFormData = z.infer<typeof manageReserveSchema>;

const ManageReserveDialog = ({
    isOpen,
    onOpenChange,
    onSubmit,
    totalReserve,
    maxCredits
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ManageReserveFormData) => void;
    totalReserve: number;
    maxCredits: number;
}) => {
    const form = useForm<ManageReserveFormData>({
      resolver: zodResolver(manageReserveSchema),
      defaultValues: { action: 'add', amount: 1, reason: '' },
    });

    const watchedAmount = form.watch('amount');
    const watchedAction = form.watch('action');

    useEffect(() => {
        form.reset({ action: 'add', amount: 1, reason: '' });
    }, [isOpen, form]);
    
    const finalReserve = watchedAction === 'add' 
        ? totalReserve + (Number(watchedAmount) || 0)
        : totalReserve - (Number(watchedAmount) || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Credits Reserve</DialogTitle>
                     <DialogDescription>
                        Manually adjust the total credits in your central reserve.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="action"
                            render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Action</FormLabel>
                                <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <div className="flex flex-col gap-2 rounded-lg border p-3">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="font-normal flex items-center gap-2">
                                                 <FormControl><RadioGroupItem value="add" /></FormControl>
                                                 Add to Reserve
                                            </FormLabel>
                                             <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Current</p>
                                                <p className="text-lg font-bold">{totalReserve.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-3">
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="deduct" /></FormControl>
                                            <FormLabel className="font-normal">Deduct from Reserve</FormLabel>
                                        </FormItem>
                                    </div>
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                        <FormDescription>
                                            Total reserve will be <span className="font-bold">{finalReserve.toLocaleString()}</span> after this change.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl><Textarea placeholder="e.g., Initial stock, correction..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


export default function AdminPage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    
    const [affiliateToActOn, setAffiliateToActOn] = useState<Affiliate | null>(null);
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isManageReserveOpen, setIsManageReserveOpen] = useState(false);
    
    const adminSettings: AdminSettings = useMemo(() => config?.admin || {
        maxCredits: 1000000,
        buyPrice: 850,
        sellPrice: 900,
        exchangeValue: 1000,
        availableCredits: 100000,
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
    
    const circulatingCredits = useMemo(() => {
        return affiliates.reduce((sum, aff) => sum + (aff.creditBalance || 0), 0);
    }, [affiliates]);
    
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
    const boughtBackCredits = circulatingCredits; // This is a simplification
    const netProfit = (soldCredits * (adminSettings.sellPrice || 0)) - (boughtBackCredits * (adminSettings.buyPrice || 0));


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
        // Find companies referred by Admin.
        const referredByAdmin = config.companies.filter(c => c.referredBy === ADMIN_ACTIVATION_KEY);
        // Find companies not in ANY affiliate list (fallback, in case referredBy is not set).
        const allAffiliateClientIds = affiliates.flatMap(a => a.clients.map(c => c.id));
        const unassigned = config.companies.filter(c => !c.referredBy && !allAffiliateClientIds.includes(c.id));
        
        const combined = [...referredByAdmin, ...unassigned];
        const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());

        // Map Company to AffiliateClient for display consistency
        return unique.map((company: Company): AffiliateClient => ({
            id: company.id,
            name: company.companyName,
            avatar: company.logo || `https://picsum.photos/seed/${company.id}/100`,
            plan: 'N/A', // Admin clients don't have plans in this context
            status: 'active', // Assuming they are active
            remainingDays: undefined,
            walletBalance: 0,
        }));
    }, [config?.companies, affiliates]);

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

    return (
        <div className="container mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Affiliate Admin</h1>
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
                 <StatCard title="Circulating Credits" value={`BS ${circulatingCredits.toLocaleString()}`} description="Held by affiliates" icon={TrendingDown} />
                 <StatCard title="Net Profit" value={`K${netProfit.toLocaleString()}`} description="Overall credit profit" icon={BarChart} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Affiliates" value={totalAffiliates} icon={Users} />
                 <StatCard title="BS Withdraw Requests" value={`BS ${(totalPendingBsCredits).toLocaleString()}`} icon={Banknote} />
                <StatCard title="Pending Withdrawals" value={`K${totalPendingAmount.toLocaleString()}`} icon={Clock} />
            </div>

             <Tabs defaultValue="staff" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="admin-clients">Admin Clients ({adminClients.length})</TabsTrigger>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                    <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>
                <TabsContent value="staff" className="pt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Affiliates</CardTitle>
                            <CardDescription>Your registered affiliate partners.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {affiliates.map(affiliate => (
                                <AffiliateCard 
                                    key={affiliate.username} 
                                    affiliate={affiliate} 
                                    onSelectAction={(action) => handleSelectAction(action, affiliate)}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
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
                <TabsContent value="plans" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plans</CardTitle>
                            <CardDescription>Plans available for clients to purchase.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                           {plans.map(plan => (
                                <Card key={plan.name}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Briefcase className="h-5 w-5" />
                                            {plan.name}
                                        </CardTitle>
                                        <CardDescription className="text-2xl font-bold pt-1">{plan.price}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {plan.features.map(feature => (
                                                <li key={feature} className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
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
                                    <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                                        <p className="text-muted-foreground">System Tools coming soon.</p>
                                    </div>
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
                                    <TableCell><Badge variant={statusVariantMap[req.status] || 'default'} className="capitalize">{req.status}</Badge></TableCell>
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
                totalReserve={adminSettings.availableCredits || 0}
                maxCredits={adminSettings.maxCredits || 0}
            />
        </div>
    );
}

    
