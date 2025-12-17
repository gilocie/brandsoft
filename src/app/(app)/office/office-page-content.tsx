

'use client';

import { useBrandsoft, type Transaction, type Affiliate, type Purchase } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, DollarSign, ExternalLink, ShieldCheck, ShieldOff, UserCheck, Users, Edit, CreditCard, Gift, KeyRound, Phone, TrendingUp, TrendingDown, MoreHorizontal, ArrowRight, Wallet, Banknote, Smartphone, CheckCircle, Pencil, Eye, EyeOff, Send, Bell, RefreshCw } from 'lucide-react';
import { ClientCard } from '@/components/affiliate/client-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { StatCard } from '@/components/office/stat-card';
import { VerificationItem } from '@/components/office/verification-item';
import { WithdrawDialog } from '@/components/office/withdraw-dialog';
import { BuyCreditsDialog } from '@/components/office/buy-credits-dialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SimpleImageUploadButton } from '@/components/simple-image-upload-button';
import { MethodCard } from '@/components/office/method-card';
import { SetPinDialog } from '@/components/office/dialogs/set-pin-dialog';
import { SecurityQuestionsDialog, type SecurityQuestionFormData } from '@/components/office/dialogs/security-questions-dialog';
import { WithdrawalMethodDialog, type WithdrawalMethodFormData, type EditableWithdrawalMethod } from '@/components/office/dialogs/withdrawal-method-dialog';
import { BankWithdrawalDialog, type BankWithdrawalFormData } from '@/components/office/dialogs/bank-withdrawal-dialog';
import { BsCreditsDialog, type BsCreditsFormData } from '@/components/office/dialogs/bs-credits-dialog';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';


const affiliateSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    phone: z.string().min(1, "Phone number is required"),
    profilePic: z.string().optional(),
});

type AffiliateFormData = z.infer<typeof affiliateSchema>;

const CREDIT_TO_MWK = 1000;
const ITEMS_PER_PAGE = 10;

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'accent' | 'primary' } = {
  pending: 'accent',
  processing: 'primary',
  completed: 'success',
  active: 'success',
};


export function OfficePageContent() {
  const { config, saveConfig } = useBrandsoft();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payoutsPage, setPayoutsPage] = useState(0);
  const { toast } = useToast();

  const [editingMethod, setEditingMethod] = useState<EditableWithdrawalMethod | null>(null);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isBsCreditsDialogOpen, setIsBsCreditsDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isSecurityQuestionsOpen, setIsSecurityQuestionsOpen] = useState(false);

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

  const pendingTopUps = useMemo(() => {
    if (!config?.purchases) return [];
    return config.purchases.filter(p => p.planName === 'Wallet Top-up');
  }, [config?.purchases]);

  const pendingTopUpOrders = useMemo(() => pendingTopUps.filter(p => p.status === 'pending'), [pendingTopUps]);
  const processingTopUpOrders = useMemo(() => pendingTopUps.filter(p => p.status === 'processing'), [pendingTopUps]);
  const completedTopUpOrders = useMemo(() => pendingTopUps.filter(p => p.status === 'active'), [pendingTopUps]);


  // NEW: Create a synchronized list of clients
  // This merges the Affiliate Client entry with the latest real Company Data
  const syncedClients = useMemo(() => {
    if (!affiliate?.clients || !config?.companies) return [];

    return affiliate.clients.map(client => {
        // Find the actual company record
        const realCompany = config.companies.find(c => c.id === client.id);
        
        if (realCompany) {
            // Return the client data, but override name/avatar with real company data
            return {
                ...client,
                name: realCompany.companyName,
                avatar: realCompany.logo || client.avatar,
                // You could also sync email/phone here if needed
            };
        }
        return client;
    });
  }, [affiliate?.clients, config?.companies]);

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
  
  const bonusAmount = affiliate.bonus || 0;
  const unclaimedCommission = affiliate.unclaimedCommission || 0;
  const mwkBalance = affiliate.myWallet || 0;
  const activeClients = syncedClients.filter(c => c.status === 'active').length;
  const totalSales = affiliate.totalSales || 0;

  const handleWithdraw = (amount: number, source: 'commission' | 'combined' | 'bonus') => {
    if (!config || !affiliate) return;
    
    const TRANSACTION_FEE = 3000;

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
    
    const amountToWithdraw = amount;

    if (source === 'combined') {
        let remainingAmount = amountToWithdraw + TRANSACTION_FEE;
        
        const bonusDeduction = Math.min(newAffiliateData.bonus || 0, remainingAmount);
        newAffiliateData.bonus = (newAffiliateData.bonus || 0) - bonusDeduction;
        remainingAmount -= bonusDeduction;
        
        if (remainingAmount > 0) {
            newAffiliateData.myWallet = (newAffiliateData.myWallet || 0) - remainingAmount;
        }

    } else { // 'commission'
        newAffiliateData.myWallet = (newAffiliateData.myWallet || 0) - (amountToWithdraw + TRANSACTION_FEE);
    }
    
    newAffiliateData.transactions = [newTransaction, feeTransaction, ...(affiliate.transactions || [])];
    
    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
  }

  const handleSaveWithdrawalMethod = (method: EditableWithdrawalMethod, data: WithdrawalMethodFormData) => {
    if (!config || !affiliate) return;

    const newAffiliateData = { ...affiliate };
    if (!newAffiliateData.withdrawalMethods) {
        newAffiliateData.withdrawalMethods = {};
    }
    newAffiliateData.withdrawalMethods[method] = data;

    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
    toast({ title: `${method.toUpperCase()} Details Saved!`});
    setEditingMethod(null);
  };

  const handleSaveBankDetails = (data: BankWithdrawalFormData) => {
    if (!config || !affiliate) return;
    const newAffiliateData = { ...affiliate };
    if (!newAffiliateData.withdrawalMethods) {
        newAffiliateData.withdrawalMethods = {};
    }
    newAffiliateData.withdrawalMethods.bank = data;
    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
    toast({ title: "Bank Details Saved!" });
    setIsBankDialogOpen(false);
  };

  const handleSaveBsCredits = (data: BsCreditsFormData) => {
    if (!config || !affiliate) return;
    const newAffiliateData = { ...affiliate };
    if (!newAffiliateData.withdrawalMethods) {
        newAffiliateData.withdrawalMethods = {};
    }
    newAffiliateData.withdrawalMethods.bsCredits = data;
    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
    toast({ title: "BS Credits Details Saved!" });
    setIsBsCreditsDialogOpen(false);
  };

  const handleSavePin = (pin: string) => {
    if (!config || !affiliate) return;
    const newAffiliateData = { ...affiliate, isPinSet: true, pin: pin };
    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
    toast({ title: 'PIN has been set successfully!' });
    setIsPinDialogOpen(false);
  };
  
  const handleSaveSecurityQuestions = (data: SecurityQuestionFormData) => {
      if (!config || !affiliate) return;
      
      const questionToSave = data.question === 'custom' ? data.customQuestion : data.question;

      if (!questionToSave) {
          toast({ variant: 'destructive', title: 'Error', description: 'Question cannot be empty.' });
          return;
      }

      const newAffiliateData = {
          ...affiliate,
          securityQuestion: true, // Mark as set
          securityQuestionData: {
              question: questionToSave,
              answer: data.answer,
          },
      };
      saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
      toast({ title: 'Security Question Saved!' });
      setIsSecurityQuestionsOpen(false);
  };
  
  const handleStatusChange = (orderId: string, newStatus: 'pending' | 'processing' | 'active') => {
        if (!config?.purchases) return;

        const updatedPurchases = config.purchases.map(p => 
            p.orderId === orderId ? { ...p, status: newStatus as 'pending' | 'active' | 'processing' } : p
        );
        
        saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: true });
        
        toast({
            title: "Status Updated",
            description: `Top-up order status set to ${newStatus}.`,
        });
    };

  const TopUpNotificationCard = () => {
    const pendingOrders = pendingTopUps.filter(p => p.status === 'pending');
    if (pendingOrders.length === 0) return null;
    
    const isSingleOrder = pendingOrders.length === 1;
    const orderId = isSingleOrder ? pendingOrders[0].orderId : '';

    return (
        <StatCard
            icon={Bell}
            title="Pending Top-ups"
            value={pendingOrders.length}
            footer={isSingleOrder ? `Order ID: ${orderId}` : `${pendingOrders.length} orders need verification.`}
            className="border-primary"
        >
            <Button size="sm" className="w-full mt-2" onClick={() => setActiveTab('transactions')}>
                {isSingleOrder ? 'View Order' : 'View All'}
            </Button>
        </StatCard>
    );
  };

  const renderTopUpTable = (orders: Purchase[], emptyMessage: string) => (
       <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length > 0 ? orders.map(req => (
                    <TableRow key={req.orderId}>
                        <TableCell>{new Date(req.date).toLocaleDateString()}</TableCell>
                        <TableCell>{req.orderId}</TableCell>
                        <TableCell>{req.planPrice}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariantMap[req.status] || 'default'} className="capitalize">
                                {req.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req.orderId, 'processing')} disabled={req.status === 'processing' || req.status === 'active'}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Mark as Processing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req.orderId, 'active')} disabled={req.status === 'active'}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">{emptyMessage}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
  );


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 col-span-1 md:col-span-2">
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
        <TopUpNotificationCard />
      </div>

       <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clients">Clients ({syncedClients.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="my-features">My Features</TabsTrigger>
            <TabsTrigger value="keys">Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="pt-6">
            <div className="grid gap-6">
                 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        icon={DollarSign} 
                        title="Unclaimed Commission" 
                        value={unclaimedCommission} 
                        isCurrency 
                        footer="Ready to push to your wallet"
                    >
                        <Button 
                            size="sm" 
                            className="w-full mt-2" 
                            disabled={unclaimedCommission <= 0}
                            onClick={handlePushToWallet}
                        >
                           <Send className="h-4 w-4 mr-2" /> Push to Wallet
                        </Button>
                    </StatCard>
                     <StatCard 
                        icon={CreditCard} 
                        title="Credit Balance" 
                        value={affiliate.creditBalance || 0}
                        valuePrefix={`BS `}
                        footer={`Value: K${((affiliate.creditBalance || 0) * CREDIT_TO_MWK).toLocaleString()}`}
                    >
                        <BuyCreditsDialog 
                            walletBalance={affiliate.myWallet || 0}
                            adminAvailableCredits={config?.admin?.availableCredits || 0}
                         />
                    </StatCard>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Bonus Tier</CardTitle>
                                 <Gift className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <CardDescription>Bonus for referring 10+ clients.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-3xl font-bold">K{bonusAmount.toLocaleString()}</p>
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
                               {bonusAmount > 0 ? `Includes K${bonusAmount.toLocaleString()} bonus` : 'Available for withdrawal'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">K{mwkBalance.toLocaleString()}</p>
                        </CardContent>
                        <CardContent>
                            <WithdrawDialog 
                                commissionBalance={affiliate.myWallet || 0} 
                                bonusBalance={bonusAmount} 
                                onWithdraw={handleWithdraw} 
                                isVerified={true}
                            />
                        </CardContent>
                     </Card>
                </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <StatCard icon={Users} title="Active Clients" value={activeClients} footer={`${syncedClients.length - activeClients} expired`} />
                    <StatCard icon={UserCheck} title="Total Referrals" value={syncedClients.length} footer="All-time client sign-ups" />
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
                                        {t.type === 'credit' ? '+' : '-'} K{(t.amount).toLocaleString()}
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
                {syncedClients.length > 0 ? (
                    syncedClients.map(client => (
                        <ClientCard key={client.id} client={client} />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
                        <p>No clients yet.</p>
                        <p className="text-sm">Register a company with your Staff ID to see them here.</p>
                    </div>
                )}
            </div>
        </TabsContent>
         <TabsContent value="transactions" className="pt-6">
            <Tabs defaultValue="top-ups">
                <TabsList>
                    <TabsTrigger value="top-ups">Top-ups</TabsTrigger>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>
                <TabsContent value="top-ups" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Top-up Requests</CardTitle>
                            <CardDescription>Manage your client's wallet top-up orders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="pending">
                                <TabsList>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="processing">Processing</TabsTrigger>
                                    <TabsTrigger value="completed">Completed</TabsTrigger>
                                </TabsList>
                                <TabsContent value="pending" className="pt-4">
                                    {renderTopUpTable(pendingTopUpOrders, "No pending top-ups.")}
                                </TabsContent>
                                <TabsContent value="processing" className="pt-4">
                                     {renderTopUpTable(processingTopUpOrders, "No top-ups being processed.")}
                                </TabsContent>
                                <TabsContent value="completed" className="pt-4">
                                     {renderTopUpTable(completedTopUpOrders, "No completed top-ups.")}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
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
                                        <p className="text-sm font-semibold text-red-600">- K{(t.amount).toLocaleString()}</p>
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
            <Card>
                <CardHeader>
                    <CardTitle>Your Invitation Link</CardTitle>
                    <CardDescription>Share this link to invite new clients to BrandSoft. You'll earn commissions on their purchases.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center gap-2">
                        <Input value={affiliate.affiliateLink} readOnly className="h-9 text-sm" />
                        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(affiliate.affiliateLink)}>
                            <Copy className="h-4 w-4 mr-2"/> Copy Link
                        </Button>
                        <Button size="sm" asChild>
                            <a href={affiliate.affiliateLink} target="_blank"><ExternalLink className="h-4 w-4 mr-2"/> Visit</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
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
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your withdrawal and security preferences.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="withdraw" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="withdraw">Withdraw Options</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="verification">Verification</TabsTrigger>
                        </TabsList>
                        <TabsContent value="withdraw" className="p-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MethodCard method="airtel" name="Airtel Money" description="Fee: K3,000" icon={Smartphone} isSetup={!!affiliate.withdrawalMethods?.airtel} onAction={() => setEditingMethod('airtel')} />
                                <MethodCard method="tnm" name="TNM Mpamba" description="Fee: K3,000" icon={Smartphone} isSetup={!!affiliate.withdrawalMethods?.tnm} onAction={() => setEditingMethod('tnm')} />
                                <MethodCard name="Bank Transfer" description="Fee: K5,000" icon={Banknote} isSetup={!!affiliate.withdrawalMethods?.bank} onAction={() => setIsBankDialogOpen(true)} />
                                <MethodCard method="bsCredits" name="BS Credits" description="No fees" icon={Wallet} isSetup={!!affiliate.withdrawalMethods?.bsCredits} onAction={() => setIsBsCreditsDialogOpen(true)} />
                            </div>
                        </TabsContent>
                         <TabsContent value="security" className="p-6 space-y-4">
                           <VerificationItem
                                title="Withdrawal PIN"
                                status={affiliate.isPinSet || false}
                                actionText={affiliate.isPinSet ? 'Change PIN' : 'Set PIN'}
                                onAction={() => setIsPinDialogOpen(true)}
                            />
                            <VerificationItem
                                title="Security Questions"
                                status={!!affiliate.securityQuestionData}
                                actionText={!!affiliate.securityQuestionData ? 'Verified' : 'Set Questions'}
                                onAction={() => setIsSecurityQuestionsOpen(true)}
                                actionDisabled={!!affiliate.securityQuestionData}
                            />
                        </TabsContent>
                        <TabsContent value="verification" className="p-6">
                             <VerificationItem title="Identity Verification" status={affiliate.idUploaded} actionText="Upload ID" onAction={() => alert("Open ID upload dialog")} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="keys" className="pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Activation Keys</CardTitle>
                    <CardDescription>Manage your generated activation keys.</CardDescription>
                </CardHeader>
                <CardContent className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">Activation key management coming soon.</p>
                </CardContent>
            </Card>
        </TabsContent>
       </Tabs>
        <WithdrawalMethodDialog
            method={editingMethod!}
            isOpen={!!editingMethod}
            onClose={() => setEditingMethod(null)}
            onSave={handleSaveWithdrawalMethod}
            currentData={editingMethod ? affiliate.withdrawalMethods?.[editingMethod] : undefined}
        />
        <BankWithdrawalDialog
            isOpen={isBankDialogOpen}
            onClose={() => setIsBankDialogOpen(false)}
            onSave={handleSaveBankDetails}
            currentData={affiliate.withdrawalMethods?.bank}
        />
         <BsCreditsDialog
            isOpen={isBsCreditsDialogOpen}
            onClose={() => setIsBsCreditsDialogOpen(false)}
            onSave={handleSaveBsCredits}
            currentData={affiliate.withdrawalMethods?.bsCredits}
            staffId={affiliate.staffId}
        />
         <SetPinDialog
            isOpen={isPinDialogOpen}
            onClose={() => setIsPinDialogOpen(false)}
            onSave={handleSavePin}
            isPinSet={affiliate.isPinSet || false}
        />
        <SecurityQuestionsDialog
            isOpen={isSecurityQuestionsOpen}
            onClose={() => setIsSecurityQuestionsOpen(false)}
            onSave={handleSaveSecurityQuestions}
            currentData={affiliate.securityQuestionData}
        />
    </div>
  );
}
