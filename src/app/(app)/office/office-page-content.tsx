

'use client';

import { useBrandsoft, type Transaction } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, DollarSign, ExternalLink, ShieldCheck, ShieldOff, UserCheck, Users, Edit, CreditCard, Gift, KeyRound, Phone, TrendingUp, TrendingDown, MoreHorizontal, ArrowRight, Wallet } from 'lucide-react';
import { ClientCard } from '@/components/affiliate/client-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SimpleImageUploadButton } from '@/components/simple-image-upload-button';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const affiliateSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    phone: z.string().min(1, "Phone number is required"),
    profilePic: z.string().optional(),
});

type AffiliateFormData = z.infer<typeof affiliateSchema>;


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
  
  const bonusAmount = affiliate.bonus || 20;
  const displayBalance = affiliate.balance + (affiliate.clients.length >= 10 ? bonusAmount : 0);

  const activeClients = affiliate.clients.filter(c => c.status === 'active').length;

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
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Credit Balance</CardTitle>
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <CardDescription>Credits for platform usage.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{affiliate.creditBalance.toLocaleString()} Credits</p>
                        </CardContent>
                        <CardContent>
                            <Button>Request Credits</Button>
                        </CardContent>
                    </Card>
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
                            {affiliate.clients.length >= 10 ? (
                                <CardDescription className="text-white/80">Balance includes ${bonusAmount} bonus.</CardDescription>
                            ) : (
                                <CardDescription className="text-white/80">Available for withdrawal</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">${displayBalance.toLocaleString()}</p>
                        </CardContent>
                        <CardContent>
                           <Button 
                                variant="secondary"
                                disabled={!affiliate.securityQuestion || !affiliate.idUploaded || affiliate.balance <= 0}
                            >
                                Withdraw Balance
                            </Button>
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






