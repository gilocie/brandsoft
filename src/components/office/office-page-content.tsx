'use client';

import { useBrandsoft, type Transaction, type Affiliate, type Purchase, type Company } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, DollarSign, ExternalLink, ShieldCheck, ShieldOff, UserCheck, Users, Edit, CreditCard, Gift, KeyRound, Phone, TrendingUp, TrendingDown, MoreHorizontal, ArrowRight, Wallet, Banknote, Smartphone, CheckCircle, Pencil, Eye, EyeOff, Send, Bell, RefreshCw, PlusCircle, User, Loader2, BarChart, ArrowLeftRight } from 'lucide-react';
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
import { GenerateKeyDialog } from '@/components/office/dialogs/generate-key-dialog';
import { PurchaseDialog, type PlanDetails } from '@/components/purchase-dialog';
import { SellCreditsDialog } from '@/components/office/dialogs/sell-credits-dialog';
import { BonusProgressDialog } from '@/components/office/bonus-progress-dialog';
import { useRouter } from 'next/navigation';
import { useBrandImage, getImageFromDB } from '@/hooks/use-brand-image';
import { Skeleton } from '@/components/ui/skeleton';


const affiliateSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    phone: z.string().optional(),
});

type AffiliateFormData = z.infer<typeof affiliateSchema>;

const CREDIT_TO_MWK = 1000;
const ITEMS_PER_PAGE = 10;

// Wrapper component to load client avatar from IndexedDB
const ClientCardWithImage = ({ client, baseUrl }: { client: any, baseUrl?: string }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      setIsLoading(true);
      // Try to get the company logo from IndexedDB
      const dbImage = await getImageFromDB(`company-logo-${client.id}`);
      
      if (isMounted) {
        if (dbImage) {
          setAvatarUrl(dbImage);
        } else if (client.avatar && client.avatar !== 'indexed-db') {
          setAvatarUrl(client.avatar);
        } else {
          setAvatarUrl(null);
        }
        setIsLoading(false);
      }
    };
    
    fetchImage();
    return () => { isMounted = false; };
  }, [client.id, client.avatar]);

  return (
    <ClientCard 
      key={client.id} 
      client={{ ...client, avatar: avatarUrl }} 
      baseUrl={baseUrl}
      isLoadingImage={isLoading}
    />
  );
};


export function OfficePageContent() {
  const { config, saveConfig } = useBrandsoft();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payoutsPage, setPayoutsPage] = useState(0);
  const { toast } = useToast();
  const [purchaseDetails, setPurchaseDetails] = useState<PlanDetails | null>(null);
  const [isSellCreditsOpen, setIsSellCreditsOpen] = useState(false);
  const router = useRouter();
  
  // Staff's personal profile pic from IndexedDB
  const { image: affiliateImage, isLoading: isAffiliateImageLoading, setImage: setAffiliateImage } = useBrandImage('affiliateProfilePic');
  
  // Sidebar logo from IndexedDB - this is the FALLBACK for staff avatar
  const { image: sidebarLogo, isLoading: isSidebarLogoLoading } = useBrandImage('logo');

  const affiliate = config?.affiliate;

  const form = useForm<AffiliateFormData>({
      resolver: zodResolver(affiliateSchema),
      defaultValues: {
          fullName: affiliate?.fullName || '',
          username: affiliate?.username || '',
          phone: affiliate?.phone || '',
      }
  });

  const myCompany = useMemo(() => {
    if (!config || !config.profile?.id) return null;
    return config.companies?.find(c => c.id === config.profile?.id);
  }, [config]);

  // Determine the best profile image to show
  // Priority: Staff's personal pic → Sidebar logo → affiliate.profilePic string → null
  const profilePicUrl = useMemo(() => {
    // 1. Staff's personal profile pic takes highest priority
    if (affiliateImage) return affiliateImage;
    // 2. Sidebar logo (company logo from settings) as fallback
    if (sidebarLogo) return sidebarLogo;
    // 3. Legacy fallback from affiliate config string
    if (affiliate?.profilePic) return affiliate.profilePic;
    return null;
  }, [affiliateImage, sidebarLogo, affiliate?.profilePic]);

  const isProfilePicLoading = isAffiliateImageLoading || isSidebarLogoLoading;

  // Sync logic to get REAL plan details from company purchases
  const syncedClients = useMemo(() => {
    if (!affiliate?.clients || !config?.companies) return [];

    return affiliate.clients.map(client => {
        const realCompany = config.companies.find(c => c.id === client.id);
        
        if (realCompany) {
            // Find active purchase - this is the source of truth
            const activePurchase = realCompany.purchases?.find(p => p.status === 'active');
            const pendingPurchase = realCompany.purchases?.find(p => p.status === 'pending');
            
            // Always derive plan info from company purchases, never use cached client data
            let planName = 'Free Trial';
            let remainingDays = 0;

            if (activePurchase) {
                planName = activePurchase.planName;
                remainingDays = activePurchase.remainingTime?.value ?? 0;
            } else if (pendingPurchase) {
                planName = `${pendingPurchase.planName} (Pending)`;
                remainingDays = 0;
            }

            // Determine status from purchases, not cached client status
            const isActive = activePurchase || planName === 'Free Trial';
            const status = isActive ? 'active' : 'expired';

            return {
                ...client,
                name: realCompany.companyName,
                avatar: realCompany.logo || client.avatar,
                walletBalance: realCompany.walletBalance ?? 0,
                plan: planName,
                remainingDays: remainingDays,
                status: status,
            };
        }
        
        // If company not found in system, mark as expired with no plan
        return {
            ...client,
            plan: 'Unknown',
            remainingDays: 0,
            status: 'expired' as const,
        };
    });
  }, [affiliate?.clients, config?.companies]);

  useEffect(() => {
    if (affiliate) {
        form.reset({
            fullName: affiliate.fullName,
            username: affiliate.username,
            phone: affiliate.phone,
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

  const recentTransactions = useMemo(() => {
    if (!affiliate?.transactions) return [];
    return affiliate.transactions
      .filter(t => t.type === 'credit')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [affiliate?.transactions]);
  

  if (!config || !affiliate) {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }
  
  const bonusAmount = affiliate.bonus || 0;
  const unclaimedCommission = affiliate.unclaimedCommission || 0;
  const mwkBalance = affiliate.myWallet || 0;
  const activeClients = syncedClients.filter(c => c.status === 'active').length;
  
  const totalCreditsSold = affiliate.transactions
    ?.filter(t => t.description.toLowerCase().startsWith('credit sale to'))
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const creditSalesProfit = totalCreditsSold * ((config.admin?.sellPrice || 900) - (config.admin?.buyPrice || 850));

    return (
    <div className="space-y-8">
      {/* Staff Profile Header */}
      <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            {isProfilePicLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <>
                <AvatarImage src={profilePicUrl || undefined} alt={affiliate.fullName} />
                <AvatarFallback className="text-2xl">{affiliate.fullName.charAt(0)}</AvatarFallback>
              </>
            )}
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
                        <DialogTitle>Edit Staff Profile</DialogTitle>
                        <DialogDescription>Update your staff profile information and avatar.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            {/* Avatar Upload Section */}
                            <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/30">
                                <Avatar className="h-24 w-24 border-2 border-primary/20">
                                    {isAffiliateImageLoading ? (
                                        <Skeleton className="h-full w-full rounded-full" />
                                    ) : (
                                        <>
                                            <AvatarImage src={affiliateImage || sidebarLogo || affiliate.profilePic || undefined} />
                                            <AvatarFallback className="text-3xl">{form.getValues('fullName')?.charAt(0)}</AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                                <div className="text-center space-y-2">
                                    <SimpleImageUploadButton
                                        value={affiliateImage || ''}
                                        onChange={setAffiliateImage}
                                        buttonText="Upload Staff Photo"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This is your personal staff photo. If not set, your company logo will be used.
                                    </p>
                                    {affiliateImage && (
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setAffiliateImage('')}
                                        >
                                            Remove Photo
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>
                            
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

       <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clients">Clients ({syncedClients.length})</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
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
                            />
                        </div>
                    </StatCard>
                    <BonusProgressDialog affiliate={affiliate} />
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
                 <div className="grid md:grid-cols-3 gap-6">
                    <StatCard icon={Users} title="Active Clients" value={activeClients} footer={`${syncedClients.length - activeClients} expired`} />
                    <StatCard 
                        icon={BarChart} 
                        title="Credit Sales Profit" 
                        value={creditSalesProfit} 
                        isCurrency
                        footer="Profit from selling credits"
                    />
                    <StatCard icon={UserCheck} title="Total Referrals" value={syncedClients.length} footer="All-time client sign-ups" />
                </div>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Sales Transactions</CardTitle>
                            <CardDescription>Your last 5 sales commissions.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" asChild>
                           <Link href="/office/wallet">View All <ArrowRight className="h-4 w-4 ml-2" /></Link>
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
                        <ClientCardWithImage key={client.id} client={client} />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
                        <p>No clients yet.</p>
                        <p className="text-sm">Register a company with your Staff ID to see them here.</p>
                    </div>
                )}
            </div>
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
       </Tabs>
        {purchaseDetails && (
            <PurchaseDialog
                plan={purchaseDetails}
                isOpen={!!purchaseDetails}
                onClose={() => setPurchaseDetails(null)}
                onSuccess={() => { setPurchaseDetails(null); }}
                isTopUp
            />
        )}
    </div>
  );
}