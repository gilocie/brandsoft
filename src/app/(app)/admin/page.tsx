
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Affiliate, type Transaction, type AffiliateClient } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Users, BarChart, Clock, CheckCircle, RefreshCw, Briefcase, UserX, Trash2, Wallet, TrendingUp, TrendingDown, PackagePlus, Banknote } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientCard } from '@/components/affiliate/client-card';
import { AffiliateCard } from '@/components/affiliate/affiliate-card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

const StatCard = ({ title, value, icon: Icon, description, children }: { title: string, value: string | number, icon: React.ElementType, description?: string, children?: React.ReactNode }) => (
    <Card>
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
    availableCredits,
    maxCredits
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ManageReserveFormData) => void;
    availableCredits: number;
    maxCredits: number;
}) => {
    const form = useForm<ManageReserveFormData>({
      resolver: zodResolver(manageReserveSchema),
      defaultValues: { action: 'add', amount: 1, reason: '' },
    });

    useEffect(() => {
        form.reset({ action: 'add', amount: 1, reason: '' });
    }, [isOpen, form]);

    const remainingCapacity = maxCredits - availableCredits;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Credits Reserve</DialogTitle>
                    <DialogDescription>
                        Manually adjust the available credits in your central reserve.
                        You have <span className="font-bold">{remainingCapacity.toLocaleString()}</span> credits remaining before you reach your max limit of {maxCredits.toLocaleString()}.
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
                                    className="flex gap-4"
                                >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="add" /></FormControl>
                                        <FormLabel className="font-normal">Add to Reserve</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="deduct" /></FormControl>
                                        <FormLabel className="font-normal">Deduct from Reserve</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
    
    const affiliateSettings = useMemo(() => config?.affiliateSettings || {
        maxCredits: 100000,
        buyPrice: 850,
        sellPrice: 900,
        exchangeValue: 1000,
        availableCredits: 0,
    }, [config?.affiliateSettings]);

    const form = useForm<CreditSettingsFormData>({
        resolver: zodResolver(creditSettingsSchema),
        defaultValues: {
            maxCredits: affiliateSettings.maxCredits,
            buyPrice: affiliateSettings.buyPrice,
            sellPrice: affiliateSettings.sellPrice,
            exchangeValue: affiliateSettings.exchangeValue,
        }
    });
    
    const watchedExchangeValue = form.watch('exchangeValue');
    const watchedSellPrice = form.watch('sellPrice');
    const watchedMaxCredits = form.watch('maxCredits');

    const availableCreditsPercentage = useMemo(() => {
        if (!affiliateSettings.maxCredits || affiliateSettings.maxCredits === 0) return 0;
        return ((affiliateSettings.availableCredits || 0) / affiliateSettings.maxCredits) * 100;
    }, [affiliateSettings]);

    const onCreditSettingsSubmit = (data: CreditSettingsFormData) => {
        if (!config) return;
        saveConfig({ ...config, affiliateSettings: { ...config.affiliateSettings, ...data } }, { redirect: false });
        toast({ title: "Credit Settings Saved", description: "Your BS Credit settings have been updated." });
    };

    const affiliates = useMemo(() => (config?.affiliate ? [config.affiliate] : []), [config?.affiliate]);
    
    const allClients = useMemo(() => {
        if (!config?.affiliate?.clients) return [];
        return config.affiliate.clients;
    }, [config?.affiliate?.clients]);

    const totalAffiliates = affiliates.length;
    const totalSales = affiliates.reduce((sum, aff) => sum + (aff.totalSales || 0), 0);
    
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

    const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'pending');
    const totalPendingAmount = pendingWithdrawals.reduce((sum, req) => sum + req.amount, 0);

    const handleStatusChange = (transactionId: string, newStatus: 'pending' | 'processing' | 'completed') => {
        if (!config?.affiliate) return;

        const updatedTransactions = config.affiliate.transactions?.map(t => 
            t.id === transactionId ? { ...t, status: newStatus } : t
        );
        
        const newAffiliateData = {
            ...config.affiliate,
            transactions: updatedTransactions,
        };

        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
        
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
        if (!config) return;
        const currentCredits = affiliateSettings.availableCredits || 0;
        const maxCredits = affiliateSettings.maxCredits || 0;
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
        
        const newAffiliateSettings = { ...affiliateSettings, availableCredits: newCredits };
        saveConfig({ ...config, affiliateSettings: newAffiliateSettings }, { redirect: false });
        
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
                 <StatCard title="Available Credits" value={`BS ${(affiliateSettings.availableCredits || 0).toLocaleString()}`} icon={Wallet}>
                    <Button size="sm" className="w-full mt-2" onClick={() => setIsManageReserveOpen(true)}>Manage</Button>
                </StatCard>
                 <StatCard title="Sold Credits" value="0" description="Value: K0" icon={TrendingUp} />
                 <StatCard title="Bought Credits" value="0" description="Paid: K0" icon={TrendingDown} />
                 <StatCard title="Net Profit" value="K0" description="Overall credit profit" icon={BarChart} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Affiliates" value={totalAffiliates} icon={Users} />
                <StatCard title="Total Sales Volume" value={`K${totalSales.toLocaleString()}`} icon={BarChart} />
                <StatCard title="Pending Withdrawals" value={`K${totalPendingAmount.toLocaleString()}`} icon={Clock} />
            </div>

             <Tabs defaultValue="staff" className="w-full">
                <TabsList>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="clients">Clients</TabsTrigger>
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
                <TabsContent value="clients" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Clients</CardTitle>
                            <CardDescription>Clients referred by all your affiliates.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {allClients.map((client: AffiliateClient) => (
                                <ClientCard key={client.id} client={client} />
                            ))}
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
                                            <Card className="mb-6">
                                                <CardHeader>
                                                    <CardTitle className="flex items-center justify-between text-base">
                                                        <span>Credit Reserve Status</span>
                                                        <span className="text-sm font-normal text-muted-foreground">{availableCreditsPercentage.toFixed(1)}% Full</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between font-mono text-sm">
                                                            <span>BS {(affiliateSettings.availableCredits || 0).toLocaleString()}</span>
                                                            <span className="font-sans text-muted-foreground">/ BS {(watchedMaxCredits || 0).toLocaleString()}</span>
                                                        </div>
                                                        <Progress value={availableCreditsPercentage} />
                                                        <div className="text-xs text-muted-foreground pt-1">
                                                            Value at Sell Price: K{((affiliateSettings.availableCredits || 0) * (watchedSellPrice || 0)).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(onCreditSettingsSubmit)} className="space-y-4">
                                                    <FormField control={form.control} name="maxCredits" render={({ field }) => (
                                                        <FormItem><FormLabel>Max BS Credits in Circulation</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="buyPrice" render={({ field }) => (
                                                        <FormItem><FormLabel>BS Credit Buying Price (from affiliates)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="sellPrice" render={({ field }) => (
                                                        <FormItem><FormLabel>BS Credit Selling Price (to affiliates)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="exchangeValue" render={({ field }) => (
                                                        <FormItem><FormLabel>BS Credit Exchange Value (1 Credit = K{watchedExchangeValue || 0})</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <Button type="submit">Save Credit Settings</Button>
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
                availableCredits={affiliateSettings.availableCredits || 0}
                maxCredits={affiliateSettings.maxCredits || 0}
            />
        </div>
    );
}
