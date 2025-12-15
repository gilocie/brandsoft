

'use client';

import { useBrandsoft, type Transaction } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, DollarSign, ExternalLink, ShieldCheck, ShieldOff, UserCheck, Users, Edit, CreditCard, Gift, KeyRound, Phone, TrendingUp, TrendingDown, MoreHorizontal, ArrowRight, Wallet, Banknote, Smartphone } from 'lucide-react';
import { ClientCard } from '@/components/affiliate/client-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SimpleImageUploadButton } from '@/components/simple-image-upload-button';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';

const affiliateSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    phone: z.string().min(1, "Phone number is required"),
    profilePic: z.string().optional(),
});

type AffiliateFormData = z.infer<typeof affiliateSchema>;

const TRANSACTION_FEE = 3000;

const withdrawSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.string().min(1, "Please select a payment method"),
  details: z.string().min(1, "Please provide payment details"),
  pin: z.string().length(4, "PIN must be 4 digits"),
  includeBonus: z.boolean().default(false),
});
type WithdrawFormData = z.infer<typeof withdrawSchema>;


const WithdrawDialog = ({ commissionBalance, bonusBalance, onWithdraw }: { commissionBalance: number, bonusBalance: number, onWithdraw: (amount: number, source: 'commission' | 'bonus' | 'combined') => void }) => {
    const [step, setStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm<WithdrawFormData>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: { amount: 0, method: '', details: '', pin: '', includeBonus: false },
    });
    
    const { toast } = useToast();
    const includeBonus = form.watch('includeBonus');

    const availableBalance = includeBonus ? commissionBalance + bonusBalance : commissionBalance;
    const withdrawableAmount = availableBalance - TRANSACTION_FEE;

    const handleNext = async () => {
        let isValid = false;
        if (step === 1) isValid = await form.trigger(["amount", "includeBonus"]);
        if (step === 2) isValid = await form.trigger(["method", "details"]);
        if (isValid) setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    const onSubmit = (data: WithdrawFormData) => {
        const totalToWithdraw = data.amount + TRANSACTION_FEE;
        
        if (totalToWithdraw > availableBalance) {
            toast({ variant: 'destructive', title: "Insufficient Funds", description: "The amount plus the transaction fee exceeds your available balance." });
            return;
        }
        if (data.pin !== "1234") { // Demo PIN
            toast({ variant: 'destructive', title: "Incorrect PIN" });
            return;
        }
        
        onWithdraw(data.amount, data.includeBonus ? 'combined' : 'commission');
        
        toast({ title: 'Withdrawal Successful!', description: `K${data.amount.toLocaleString()} has been processed.` });
        setIsOpen(false);
        form.reset();
        setStep(1);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary">Withdraw Balance</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>Follow the steps to withdraw from your wallet.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {step === 1 && (
                             <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="includeBonus"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Include Bonus Balance?</FormLabel>
                                                <FormMessage>Your bonus balance is K{bonusBalance.toLocaleString()}.</FormMessage>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={bonusBalance <= 0} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount to Withdraw</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                        <div className="text-xs text-muted-foreground flex justify-between">
                                          <span>Available: K{withdrawableAmount.toLocaleString()}</span>
                                          <span>Fee: K{TRANSACTION_FEE.toLocaleString()}</span>
                                        </div>
                                    </FormItem>
                                )}/>
                            </div>
                        )}
                         {step === 2 && (
                            <div className="space-y-4">
                                 <FormField control={form.control} name="method" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Withdrawal Method</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="airtel">Airtel Money</SelectItem>
                                                <SelectItem value="tnm">TNM Mpamba</SelectItem>
                                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="details" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Details (e.g., Phone or Account #)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        )}
                        {step === 3 && (
                            <FormField control={form.control} name="pin" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm with PIN</FormLabel>
                                    <FormControl><Input type="password" {...field} maxLength={4} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        )}
                        <DialogFooter>
                            {step > 1 && <Button type="button" variant="outline" onClick={handleBack}>Back</Button>}
                            {step < 3 && <Button type="button" onClick={handleNext}>Next</Button>}
                            {step === 3 && <Button type="submit">Confirm Withdrawal</Button>}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


const StatCard = ({ icon: Icon, title, value, footer, isCurrency = false }: { icon: React.ElementType, title: string, value: string | number, footer: string, isCurrency?: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {isCurrency && <span className="text-muted-foreground">$</span>}
        {typeof value === 'number' && isCurrency ? value.toLocaleString() : value}
      </div>
      <p className="text-xs text-muted-foreground">{footer}</p>
    </CardContent>
  </Card>
);

const VerificationItem = ({ title, status, actionText, onAction }: { title: string, status: boolean, actionText: string, onAction: () => void }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
            {status ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <ShieldOff className="h-5 w-5 text-destructive" />}
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className={`text-xs ${status ? 'text-green-600' : 'text-destructive'}`}>
                    {status ? 'Verified' : 'Not Verified'}
                </p>
            </div>
        </div>
        {!status && (
            <Button variant="secondary" size="sm" onClick={onAction}>{actionText}</Button>
        )}
    </div>
);

const ITEMS_PER_PAGE = 10;

export function OfficePageContent() {
  const { config, saveConfig } = useBrandsoft();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payoutsPage, setPayoutsPage] = useState(0);
  const { toast } = useToast();

  const affiliate = config?.affiliate;

  const form = useForm<AffiliateFormData>({
      resolver: zodResolver(affiliateSchema),
      defaultValues: {
          fullName: affiliate?.fullName || '',
          username: affiliate?.username || '',
          phone: affiliate?.phone || '',
          profilePic: affiliate?.profilePic || '',
      }
  });

  useEffect(() => {
    if (affiliate) {
        form.reset({
            fullName: affiliate.fullName,
            username: affiliate.username,
            phone: affiliate.phone,
            profilePic: affiliate.profilePic,
        });
    }
  }, [affiliate, form]);

  const onSubmit = (data: AffiliateFormData) => {
    if (!config || !affiliate) return;

    const newAffiliateData = {
        ...affiliate,
        ...data
    };
    
    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false });
    
    toast({
        title: "Profile Updated",
        description: "Your affiliate profile has been successfully updated.",
    });

    setIsEditDialogOpen(false);
  };
  
  const generateNewStaffId = () => {
    if (!config || !affiliate) return;

    const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
    const newStaffId = `BS-AFF-${randomDigits}`;
    
    saveConfig({ ...config, affiliate: { ...affiliate, staffId: newStaffId } }, { redirect: false });
    
    toast({
        title: "New Staff ID Generated!",
        description: "Your new staff ID has been saved.",
    });
  };
  
  const recentTransactions = useMemo(() => {
    if (!affiliate?.transactions) return [];
    return affiliate.transactions
      .filter(t => t.type === 'credit')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [affiliate?.transactions]);
  
  const payoutTransactions = useMemo(() => {
    if (!affiliate?.transactions) return [];
    return affiliate.transactions
      .filter(t => t.type === 'debit')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [affiliate?.transactions]);
  
  const paginatedPayouts = useMemo(() => {
    const startIndex = payoutsPage * ITEMS_PER_PAGE;
    return payoutTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [payoutTransactions, payoutsPage]);

  const totalPayoutPages = Math.ceil(payoutTransactions.length / ITEMS_PER_PAGE);

  if (!affiliate) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Affiliate data not available.</p>
      </div>
    );
  }
  
  const bonusAmount = affiliate.clients.length >= 10 ? 20 : 0;
  const displayBalance = affiliate.balance + bonusAmount;
  const activeClients = affiliate.clients.filter(c => c.status === 'active').length;

  const handleWithdraw = (amount: number, source: 'commission' | 'bonus' | 'combined') => {
    if (!config || !affiliate) return;
    
    const newTransaction: Transaction = {
      id: `TRN-${Date.now()}`,
      date: new Date().toISOString(),
      description: `Withdrawal`,
      amount: amount,
      type: 'debit',
    };
    
     const feeTransaction: Transaction = {
      id: `TRN-FEE-${Date.now()}`,
      date: new Date().toISOString(),
      description: 'Transaction Fee',
      amount: TRANSACTION_FEE,
      type: 'debit',
    };


    const newAffiliateData = { ...affiliate };
    
    if (source === 'combined') {
        let remainingAmount = amount + TRANSACTION_FEE;
        
        // Deduct from bonus first
        const bonusDeduction = Math.min(newAffiliateData.bonus, remainingAmount);
        newAffiliateData.bonus -= bonusDeduction;
        remainingAmount -= bonusDeduction;
        
        // Deduct remaining from commission
        if (remainingAmount > 0) {
            newAffiliateData.balance -= remainingAmount;
        }

    } else { // 'commission'
        newAffiliateData.balance -= (amount + TRANSACTION_FEE);
    }
    
    newAffiliateData.transactions = [newTransaction, feeTransaction, ...(affiliate.transactions || [])];
    
    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={affiliate.profilePic} />
            <AvatarFallback>{affiliate.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <div>
                <h1 className="text-2xl font-bold font-headline">{affiliate.fullName}</h1>
                <p className="text-muted-foreground">@{affiliate.username}</p>
            </div>
             <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Affiliate Profile</DialogTitle>
                        <DialogDescription>Update your public-facing affiliate information here.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <FormField
                                control={form.control}
                                name="profilePic"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Profile Picture</FormLabel>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={field.value} />
                                                <AvatarFallback>{form.getValues('fullName')?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-grow">
                                                <SimpleImageUploadButton
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    buttonText="Upload New Picture"
                                                />
                                            </div>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Input value={affiliate.affiliateLink} readOnly className="h-9 text-sm" />
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(affiliate.affiliateLink)}>
                <Copy className="h-4 w-4 mr-2"/> Copy Link
            </Button>
            <Button size="sm" asChild>
                <a href={affiliate.affiliateLink} target="_blank"><ExternalLink className="h-4 w-4 mr-2"/> Visit</a>
            </Button>
        </div>
      </div>

       <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clients">Clients ({affiliate.clients.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="my-features">My Features</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="pt-6">
            <div className="grid gap-6">
                 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={DollarSign} title="Total Sales" value={affiliate.totalSales} footer="All-time client sales" isCurrency />
                    <StatCard icon={CreditCard} title="Credit Balance" value={affiliate.creditBalance} footer="Credits for platform usage" />
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Bonus Tier</CardTitle>
                                 <Gift className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <CardDescription>Bonus for referring 10+ clients.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-3xl font-bold">${bonusAmount.toLocaleString()}</p>
                        </CardContent>
                        <CardContent>
                           <Button variant="outline" disabled>View Progress</Button>
                        </CardContent>
                     </Card>
                     <Card className="bg-gradient-to-br from-primary to-orange-500 text-white">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>My Wallet</CardTitle>
                                <Wallet className="h-5 w-5" />
                            </div>
                            <CardDescription className="text-white/80">
                              {bonusAmount > 0 ? `Includes $${bonusAmount} bonus` : 'Available for withdrawal'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">${displayBalance.toLocaleString()}</p>
                        </CardContent>
                        <CardContent>
                            <WithdrawDialog commissionBalance={affiliate.balance} bonusBalance={bonusAmount} onWithdraw={handleWithdraw} />
                        </CardContent>
                     </Card>
                </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <StatCard icon={Users} title="Active Clients" value={activeClients} footer={`${affiliate.clients.length - activeClients} expired`} />
                    <StatCard icon={UserCheck} title="Total Referrals" value={affiliate.clients.length} footer="All-time client sign-ups" />
                </div>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Sales Transactions</CardTitle>
                            <CardDescription>Your last 5 sales commissions.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('transactions')}>
                            View All <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentTransactions.length > 0 ? recentTransactions.map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", t.type === 'credit' ? 'bg-green-100' : 'bg-red-100')}>
                                            {t.type === 'credit' ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{t.description}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className={cn("text-sm font-semibold", t.type === 'credit' ? 'text-green-600' : 'text-red-600')}>
                                        {t.type === 'credit' ? '+' : '-'} ${t.amount.toFixed(2)}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-sm text-center text-muted-foreground py-4">No recent sales transactions.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
         <TabsContent value="clients" className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {affiliate.clients.map(client => (
                    <ClientCard key={client.id} client={client} />
                ))}
            </div>
        </TabsContent>
         <TabsContent value="transactions" className="pt-6">
            <Tabs defaultValue="sales">
                <TabsList>
                    <TabsTrigger value="sales">Sales Transactions</TabsTrigger>
                    <TabsTrigger value="payouts">Payout Transactions</TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="pt-4">
                    <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">Sales transaction history will be shown here.</p>
                    </div>
                </TabsContent>
                <TabsContent value="payouts" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payout History</CardTitle>
                            <CardDescription>Your history of withdrawals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                {paginatedPayouts.length > 0 ? paginatedPayouts.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                                <TrendingDown className="h-4 w-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{t.description}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-red-600">- ${t.amount.toFixed(2)}</p>
                                    </div>
                                )) : (
                                    <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                                        <p className="text-muted-foreground">No payout transactions found.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        {totalPayoutPages > 1 && (
                            <CardContent className="pt-4 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Page {payoutsPage + 1} of {totalPayoutPages}</span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPayoutsPage(p => p - 1)} disabled={payoutsPage === 0}>Previous</Button>
                                    <Button variant="outline" size="sm" onClick={() => setPayoutsPage(p => p + 1)} disabled={payoutsPage >= totalPayoutPages - 1}>Next</Button>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </TabsContent>
        <TabsContent value="invitations" className="pt-6">
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Invitation management will be available here.</p>
            </div>
        </TabsContent>
        <TabsContent value="my-features" className="pt-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> My Features</CardTitle>
                    <CardDescription>Unique codes and features for your affiliate account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold mb-2">Staff ID Code</h3>
                        <p className="text-xs text-muted-foreground mb-2">Provide this code to your staff when they are selling credits on your behalf.</p>
                        <div className="flex items-center gap-2">
                            <Input readOnly value={affiliate.staffId || 'No code generated'} className="font-mono" />
                            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(affiliate.staffId || '')} disabled={!affiliate.staffId}>
                                <Copy className="h-4 w-4 mr-2"/> Copy ID
                            </Button>
                             <Button size="sm" onClick={generateNewStaffId}>
                                Generate New Code
                            </Button>
                        </div>
                    </div>
                     <Separator />
                     <div className="space-y-3 pt-4">
                        <h3 className="text-sm font-semibold mb-2">Affiliate Phone Number</h3>
                        <p className="text-xs text-muted-foreground mb-2">This WhatsApp number will be used for top-up notifications and affiliate queries.</p>
                        <div className="flex items-center gap-2">
                            <Input
                                value={affiliate.phone || ''}
                                onChange={(e) => {
                                    if (!config || !affiliate) return;
                                    const newAffiliateData = { ...affiliate, phone: e.target.value };
                                    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false });
                                }}
                                onBlur={() => toast({ title: "Phone Number Saved" })}
                                icon={Phone}
                                placeholder="Enter your WhatsApp number..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Account Verification</CardTitle>
                    <CardDescription>Complete these steps to secure your account and enable withdrawals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <VerificationItem title="Security Questions" status={affiliate.securityQuestion} actionText="Set Questions" onAction={() => alert("Navigate to security questions page")} />
                    <VerificationItem title="Identity Verification" status={affiliate.idUploaded} actionText="Upload ID" onAction={() => alert("Open ID upload dialog")} />
                </CardContent>
            </Card>
        </TabsContent>
       </Tabs>
    </div>
  );
}



