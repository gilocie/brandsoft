

'use client';

import { useBrandsoft, type Transaction, type Affiliate } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, DollarSign, ExternalLink, ShieldCheck, ShieldOff, UserCheck, Users, Edit, CreditCard, Gift, KeyRound, Phone, TrendingUp, TrendingDown, MoreHorizontal, ArrowRight, Wallet, Banknote, Smartphone, CheckCircle, Pencil } from 'lucide-react';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { StatCard } from '@/components/office/stat-card';
import { VerificationItem } from '@/components/office/verification-item';
import { WithdrawDialog } from '@/components/office/withdraw-dialog';
import { BuyCreditsDialog } from '@/components/office/buy-credits-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';


const affiliateSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    phone: z.string().min(1, "Phone number is required"),
    profilePic: z.string().optional(),
});

type AffiliateFormData = z.infer<typeof affiliateSchema>;

const withdrawalMethodSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(9, 'Phone number is required'),
});

type WithdrawalMethodFormData = z.infer<typeof withdrawalMethodSchema>;

type EditableWithdrawalMethod = 'airtel' | 'tnm';

const bankWithdrawalSchema = z.object({
    bankName: z.string().min(2, 'Bank name is required'),
    accountNumber: z.string().min(5, 'Account number is required'),
    accountType: z.enum(['Saving', 'Current', 'Fixed']),
});

type BankWithdrawalFormData = z.infer<typeof bankWithdrawalSchema>;

const bsCreditsSchema = z.object({
    staffId: z.string().min(1, 'Please select your Staff ID'),
});
type BsCreditsFormData = z.infer<typeof bsCreditsSchema>;

const pinSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits.").regex(/^\d{4}$/, "PIN must be 4 digits."),
});
type PinFormData = z.infer<typeof pinSchema>;

const USD_TO_MWK = 1700;
const CREDIT_TO_MWK = 1000;
const ITEMS_PER_PAGE = 10;

const SetPinDialog = ({ isOpen, onClose, onSave, isPinSet }: { isOpen: boolean; onClose: () => void; onSave: () => void; isPinSet: boolean; }) => {
    const form = useForm<PinFormData>({
        resolver: zodResolver(pinSchema),
        defaultValues: { pin: '' },
    });

    const onSubmit = (data: PinFormData) => {
        // In a real app, you'd securely save this. Here we just simulate.
        console.log("PIN set:", data.pin);
        onSave();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isPinSet ? 'Change' : 'Set'} Withdrawal PIN</DialogTitle>
                    <DialogDescription>
                        This 4-digit PIN will be required for all withdrawals and credit transfers. Keep it secure.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="pin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New 4-Digit PIN</FormLabel>
                                    <FormControl>
                                        <Input type="password" maxLength={4} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Save PIN</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


const BsCreditsDialog = ({ isOpen, onClose, onSave, currentData, staffId }: { isOpen: boolean; onClose: () => void; onSave: (data: BsCreditsFormData) => void; currentData?: { staffId: string }; staffId?: string }) => {
    const form = useForm<BsCreditsFormData>({
        resolver: zodResolver(bsCreditsSchema),
        defaultValues: currentData || { staffId: '' },
    });
    
    useEffect(() => {
        form.reset(currentData || { staffId: '' });
    }, [currentData, form]);

    const onSubmit = (data: BsCreditsFormData) => {
        onSave(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Up BS Credits Withdrawal</DialogTitle>
                    <DialogDescription>Select your Staff ID to associate with credit withdrawals.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="staffId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Staff ID</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Staff ID" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {staffId ? (
                                                <SelectItem value={staffId}>{staffId}</SelectItem>
                                            ) : (
                                                <SelectItem value="none" disabled>No Staff ID generated</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const BankWithdrawalDialog = ({
    isOpen,
    onClose,
    onSave,
    currentData
}: {
    isOpen: boolean,
    onClose: () => void,
    onSave: (data: BankWithdrawalFormData) => void,
    currentData?: { bankName: string; accountNumber: string; accountType: 'Saving' | 'Current' | 'Fixed'; }
}) => {
    const form = useForm<BankWithdrawalFormData>({
        resolver: zodResolver(bankWithdrawalSchema),
        defaultValues: currentData || { bankName: '', accountNumber: '', accountType: 'Saving' }
    });

    useEffect(() => {
        form.reset(currentData || { bankName: '', accountNumber: '', accountType: 'Saving' });
    }, [currentData, form]);

    const onSubmit = (data: BankWithdrawalFormData) => {
        onSave(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Up Bank Transfer</DialogTitle>
                    <DialogDescription>Enter your bank account details below.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="bankName" render={({ field }) => (
                            <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="accountNumber" render={({ field }) => (
                            <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="accountType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Saving">Saving</SelectItem>
                                        <SelectItem value="Current">Current</SelectItem>
                                        <SelectItem value="Fixed">Fixed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Save Details</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const WithdrawalMethodDialog = ({
    method,
    isOpen,
    onClose,
    onSave,
    currentData
}: {
    method: EditableWithdrawalMethod,
    isOpen: boolean,
    onClose: () => void,
    onSave: (method: EditableWithdrawalMethod, data: WithdrawalMethodFormData) => void,
    currentData?: { name: string; phone: string }
}) => {
    const form = useForm<WithdrawalMethodFormData>({
        resolver: zodResolver(withdrawalMethodSchema),
        defaultValues: currentData || { name: '', phone: '' }
    });

    useEffect(() => {
        form.reset(currentData || { name: '', phone: '' });
    }, [currentData, form]);

    const onSubmit = (data: WithdrawalMethodFormData) => {
        onSave(method, data);
    };
    
    const methodName = method === 'airtel' ? 'Airtel Money' : 'TNM Mpamba';

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Up {methodName}</DialogTitle>
                    <DialogDescription>Enter your {methodName} details below.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Save Details</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
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
  const mwkBalance = displayBalance * USD_TO_MWK;
  const activeClients = affiliate.clients.filter(c => c.status === 'active').length;

  const handleWithdraw = (amount: number, source: 'commission' | 'bonus' | 'combined') => {
    if (!config || !affiliate) return;
    
    const TRANSACTION_FEE_USD = 3000 / USD_TO_MWK; // Convert fee to USD

    const newTransaction: Transaction = {
      id: `TRN-${Date.now()}`,
      date: new Date().toISOString(),
      description: `Withdrawal`,
      amount: amount / USD_TO_MWK, // Store as USD
      type: 'debit',
    };
    
     const feeTransaction: Transaction = {
      id: `TRN-FEE-${Date.now()}`,
      date: new Date().toISOString(),
      description: 'Transaction Fee',
      amount: TRANSACTION_FEE_USD,
      type: 'debit',
    };

    const newAffiliateData = { ...affiliate };
    
    const amountToWithdrawUSD = amount / USD_TO_MWK;

    if (source === 'combined') {
        let remainingAmountUSD = amountToWithdrawUSD + TRANSACTION_FEE_USD;
        
        const bonusDeduction = Math.min(newAffiliateData.bonus || 0, remainingAmountUSD);
        newAffiliateData.bonus = (newAffiliateData.bonus || 0) - bonusDeduction;
        remainingAmountUSD -= bonusDeduction;
        
        if (remainingAmountUSD > 0) {
            newAffiliateData.balance -= remainingAmountUSD;
        }

    } else { // 'commission'
        newAffiliateData.balance -= (amountToWithdrawUSD + TRANSACTION_FEE_USD);
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

  const handleSavePin = () => {
    if (!config || !affiliate) return;
    const newAffiliateData = { ...affiliate, isPinSet: true };
    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
    toast({ title: 'PIN has been set successfully!' });
    setIsPinDialogOpen(false);
  };
  
  const MethodCard = ({method, name, description, icon: Icon, onAction, isSetup}: {method?: EditableWithdrawalMethod | 'bsCredits', name: string, description: string, icon: React.ElementType, onAction: () => void, isSetup: boolean}) => {
      return (
          <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                          <CardTitle className="text-base">{name}</CardTitle>
                      </div>
                       {isSetup && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                  <CardDescription className="pt-2">{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-end gap-2">
                 <Button variant={isSetup ? 'secondary' : 'default'} size="sm" onClick={onAction}>
                    {isSetup ? <Pencil className="h-4 w-4 mr-2" /> : null}
                    {isSetup ? 'Edit' : 'Set Up'}
                </Button>
              </CardContent>
          </Card>
      );
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
                    <StatCard 
                        icon={DollarSign} 
                        title="Total Sales" 
                        value={affiliate.totalSales * USD_TO_MWK} 
                        isCurrency 
                        footer="All-time gross sales volume"
                    />
                     <StatCard 
                        icon={CreditCard} 
                        title="Credit Balance" 
                        value={affiliate.creditBalance * CREDIT_TO_MWK}
                        valuePrefix={`BS${affiliate.creditBalance.toLocaleString()} = `}
                        isCurrency
                        footer={`Value: K${(affiliate.creditBalance * CREDIT_TO_MWK).toLocaleString()}`}
                    >
                        <BuyCreditsDialog walletBalance={affiliate.balance * USD_TO_MWK} />
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
                             <p className="text-3xl font-bold">K{(bonusAmount * USD_TO_MWK).toLocaleString()}</p>
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
                               {bonusAmount > 0 ? `Includes K${(bonusAmount * USD_TO_MWK).toLocaleString()} bonus` : 'Available for withdrawal'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">K{mwkBalance.toLocaleString()}</p>
                        </CardContent>
                        <CardContent>
                            <WithdrawDialog 
                                commissionBalance={affiliate.balance * USD_TO_MWK} 
                                bonusBalance={bonusAmount * USD_TO_MWK} 
                                onWithdraw={handleWithdraw} 
                                isVerified={true}
                            />
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
                                        {t.type === 'credit' ? '+' : '-'} K{(t.amount * USD_TO_MWK).toLocaleString()}
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
                                        <p className="text-sm font-semibold text-red-600">- K{(t.amount * USD_TO_MWK).toLocaleString()}</p>
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
                            <VerificationItem title="Security Questions" status={affiliate.securityQuestion} actionText="Set Questions" onAction={() => alert("Navigate to security questions page")} />
                        </TabsContent>
                        <TabsContent value="verification" className="p-6">
                             <VerificationItem title="Identity Verification" status={affiliate.idUploaded} actionText="Upload ID" onAction={() => alert("Open ID upload dialog")} />
                        </TabsContent>
                    </Tabs>
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
    </div>
  );
}
