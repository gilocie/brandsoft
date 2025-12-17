

'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type AffiliateClient, type Company, type Affiliate } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Ban, Briefcase, User, Wallet, CirclePlus, Clock, Trash2, UserCog, Search } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/office/stat-card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter as ShadcnDialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


const ADMIN_ACTIVATION_KEY = 'BRANDSOFT-ADMIN';
const CREDIT_TO_MWK = 1000;

const createTopUpSchema = (maxCredits: number) => z.object({
    amount: z.coerce
        .number()
        .min(1, "Minimum top-up is 1 credit.")
        .max(maxCredits, `Not enough credits in reserve. Max available: ${maxCredits.toLocaleString()}`),
});

type TopUpFormData = z.infer<ReturnType<typeof createTopUpSchema>>;

const AdminTopUpDialog = ({ client, onTopUp, adminAvailableCredits }: { client: Company, onTopUp: (amount: number) => void, adminAvailableCredits: number }) => {
    const topUpSchema = createTopUpSchema(adminAvailableCredits);
    
    const form = useForm<TopUpFormData>({
        resolver: zodResolver(topUpSchema),
        defaultValues: { amount: 30 },
    });

    const watchedAmount = form.watch('amount');
    const costInMWK = watchedAmount * CREDIT_TO_MWK;

    const onSubmit = (data: TopUpFormData) => {
        onTopUp(data.amount);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Top Up {client.companyName}'s Wallet</DialogTitle>
                <DialogDescription>
                    Sell credits directly to this client. Your current credit reserve is <strong>BS {adminAvailableCredits.toLocaleString()}</strong>.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>BS Credits to Sell</FormLabel>
                                <FormControl>
                                    <Input type="number" min="1" step="1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                        <p className="text-sm text-muted-foreground">Client will be charged</p>
                        <p className="text-2xl font-bold">K{costInMWK.toLocaleString()}</p>
                    </div>
                    <ShadcnDialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Confirm Top Up</Button>
                    </ShadcnDialogFooter>
                </form>
            </Form>
        </DialogContent>
    );
};


const AssignClientDialog = ({ client, onAssign, currentAffiliateName }: { client: Company | undefined, onAssign: (newAffiliateId: string) => void, currentAffiliateName?: string }) => {
    const { config } = useBrandsoft();
    const [selectedAffiliate, setSelectedAffiliate] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const allAffiliates = config?.affiliate ? [config.affiliate] : [];

    const filteredAffiliates = useMemo(() => {
        if (!searchTerm) return allAffiliates;
        return allAffiliates.filter(aff => 
            aff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            aff.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allAffiliates, searchTerm]);

    if (!client) return null;

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Assign {client.companyName} to a new affiliate</DialogTitle>
                <DialogDescription>
                    Currently assigned to: <strong>{currentAffiliateName || 'Brandsoft Admin'}</strong>. Select a new affiliate or take ownership.
                </DialogDescription>
            </DialogHeader>
             <div className="py-4 space-y-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search affiliates..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <RadioGroup value={selectedAffiliate} onValueChange={setSelectedAffiliate} className="space-y-2">
                    {currentAffiliateName && (
                        <div className="flex items-center space-x-2 rounded-md border p-3">
                            <RadioGroupItem value={ADMIN_ACTIVATION_KEY} id="brandsoft-admin" />
                            <Label htmlFor="brandsoft-admin" className="font-bold">Brandsoft (Admin)</Label>
                        </div>
                    )}
                    {filteredAffiliates.map(aff => (
                         <div key={aff.staffId} className="flex items-center space-x-2 rounded-md border p-3">
                            <RadioGroupItem value={aff.staffId!} id={aff.staffId!} />
                            <Label htmlFor={aff.staffId!} className="w-full">
                                {aff.fullName} (@{aff.username})
                            </Label>
                        </div>
                    ))}
                    {filteredAffiliates.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground p-4">
                            No affiliates found.
                        </div>
                    )}
                </RadioGroup>
            </div>
            <ShadcnDialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={() => onAssign(selectedAffiliate)} disabled={!selectedAffiliate}>Assign Client</Button>
                </DialogClose>
            </ShadcnDialogFooter>
        </DialogContent>
    )
}

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { config, saveConfig } = useBrandsoft();
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const { client, clientAffiliateInfo } = useMemo(() => {
    if (!config) return { client: undefined, clientAffiliateInfo: undefined };
    
    const company = config.companies.find(c => c.id === params.id);
    let affiliateInfo: Affiliate | undefined;
    
    if (company && company.referredBy && company.referredBy !== ADMIN_ACTIVATION_KEY) {
        if(config.affiliate?.staffId === company.referredBy) {
            affiliateInfo = config.affiliate;
        }
    }
    
    return { client: company, clientAffiliateInfo: affiliateInfo };
  }, [config, params.id]);
  
  const adminAvailableCredits = config?.admin?.availableCredits || 0;

  const handleSuspend = () => {
    if (!client) return;
    console.log(`Suspending client: ${client.companyName}`);
    toast({
      title: "Client Suspended",
      description: `${client.companyName} has been suspended.`,
    });
    setIsSuspendOpen(false);
  };
  
  const handleDelete = () => {
    if (!client || !config) return;
    
    const updatedClients = config.affiliate?.clients.filter(c => c.id !== client.id) || [];
    const updatedCompanies = config.companies.filter(c => c.id !== client.id);
    const updatedAffiliate = config.affiliate ? { ...config.affiliate, clients: updatedClients } : undefined;

    saveConfig({ 
        ...config, 
        companies: updatedCompanies,
        affiliate: updatedAffiliate,
    }, { redirect: false });
    
    toast({ title: 'Client Deleted', description: `${client.companyName} has been removed.` });
    setIsDeleteOpen(false);
    router.push('/admin');
  };

 const handleTopUp = (amount: number) => {
    if (!client || !config || !config.admin) return;

    const costInMWK = amount * CREDIT_TO_MWK;
    let newConfig = { ...config };
    
    // Deduct credits from admin reserve and increment sold credits
    const newAdminSettings = {
        ...config.admin,
        availableCredits: (config.admin.availableCredits || 0) - amount,
        soldCredits: (config.admin.soldCredits || 0) + amount,
    };
    newConfig.admin = newAdminSettings;

    // Check if client is managed by an affiliate
    const affiliate = config.affiliate?.clients.find(c => c.id === client.id) ? config.affiliate : undefined;

    if (affiliate) {
      // Update wallet balance for the client within the affiliate's list
      const updatedAffiliateClients = affiliate.clients.map(c =>
        c.id === client.id ? { ...c, walletBalance: (c.walletBalance || 0) + costInMWK } : c
      );
      newConfig.affiliate = { ...affiliate, clients: updatedAffiliateClients };
    } else {
       // This handles admin-managed clients.
       // The current data model does not have a separate wallet for admin clients.
       // This could be an area for future improvement. We'll log it for now.
       console.log(`Admin client ${client.companyName} topped up. Wallet functionality for admin clients needs review.`);
    }

    // Save all changes at once
    saveConfig(newConfig, { redirect: false, revalidate: true });
    
    toast({
        title: "Top-up Successful!",
        description: `You have successfully sold ${amount} credits to ${client.companyName}.`,
    });

    setIsTopUpOpen(false);
  };
  
  const handleAssignClient = (newAffiliateId: string) => {
    if (!config || !client) return;
    
    const newAffiliate = config.affiliate?.staffId === newAffiliateId ? config.affiliate : undefined;
    let oldAffiliate = clientAffiliateInfo;
    
    // 1. Update the Company's `referredBy` key
    const updatedCompanies = config.companies.map(c => 
        c.id === client.id ? { ...c, referredBy: newAffiliateId } : c
    );
    
    // 2. Prepare the new affiliate client record
    const newClientRecord: AffiliateClient = {
        id: client.id,
        name: client.companyName,
        avatar: client.logo || `https://picsum.photos/seed/${client.id}/100`,
        plan: 'Free Trial',
        status: 'active',
        joinDate: new Date().toISOString(),
        remainingDays: 30,
        walletBalance: 0,
    };
    
    // 3. Update affiliate lists
    let updatedAffiliateData = { ...config.affiliate };

    // Remove from old affiliate if they exist and are not the new one
    if (oldAffiliate && oldAffiliate.staffId !== newAffiliateId) {
        updatedAffiliateData.clients = updatedAffiliateData.clients?.filter(c => c.id !== client.id);
    }

    // Add to new affiliate if they exist and don't already have the client
    if (newAffiliate && !newAffiliate.clients.some(c => c.id === client.id)) {
        updatedAffiliateData.clients = [...newAffiliate.clients, newClientRecord];
    }
    
    saveConfig({
        ...config,
        companies: updatedCompanies,
        affiliate: updatedAffiliateData as any,
    }, { redirect: false });

    toast({
        title: "Client Re-assigned",
        description: `${client.companyName} has been assigned to ${newAffiliate ? newAffiliate.fullName : 'Brandsoft Admin'}.`
    });
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-xl font-semibold">Client not found</h2>
        <p className="text-muted-foreground">The requested client could not be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin</Link>
        </Button>
      </div>
    );
  }
  
  const affiliateClientInfo = clientAffiliateInfo?.clients.find(c => c.id === client.id);

  return (
    <div className="container mx-auto space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin</Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-28 w-28 border">
            <AvatarImage src={client.logo} alt={client.companyName} />
            <AvatarFallback>{client.companyName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1 text-center md:text-left">
            <CardTitle className="text-3xl font-headline">{client.companyName}</CardTitle>
            <CardDescription className="text-base text-muted-foreground flex items-center justify-center md:justify-start gap-4">
              <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Plan: {affiliateClientInfo?.plan || 'N/A'}</span>
              {affiliateClientInfo?.status === 'active' && affiliateClientInfo?.remainingDays !== undefined && (
                <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {affiliateClientInfo.remainingDays} days left</span>
              )}
            </CardDescription>
             <div className="pt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${affiliateClientInfo?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {affiliateClientInfo?.status ? (affiliateClientInfo.status.charAt(0).toUpperCase() + affiliateClientInfo.status.slice(1)) : 'Inactive'}
                </span>
             </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
         <Card className="flex flex-col">
            <CardHeader className="flex-grow">
                <CardTitle>Client Wallet</CardTitle>
                <CardDescription>Funds available to the client.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">K{(affiliateClientInfo?.walletBalance || 0).toLocaleString()}</p>
            </CardContent>
            <CardFooter>
                 <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                            <CirclePlus className="mr-2 h-4 w-4" /> Top Up Wallet
                        </Button>
                    </DialogTrigger>
                    <AdminTopUpDialog client={client} onTopUp={handleTopUp} adminAvailableCredits={adminAvailableCredits} />
                </Dialog>
            </CardFooter>
        </Card>
        <Card className="flex flex-col">
            <CardHeader className="flex-grow">
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Manage this client's account.</CardDescription>
            </CardHeader>
             <CardFooter className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setIsSuspendOpen(true)}>
                    <Ban className="mr-2 h-4 w-4" /> Suspend
                </Button>
                <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </CardFooter>
        </Card>
      </div>

       <Dialog>
            <Card>
                <CardHeader>
                    <CardTitle>Client Re-assignment</CardTitle>
                    <CardDescription>Transfer this client to another affiliate or take admin ownership.</CardDescription>
                </CardHeader>
                <CardContent>
                     <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <UserCog className="mr-2 h-4 w-4" /> Assign Client
                        </Button>
                    </DialogTrigger>
                </CardContent>
            </Card>
            <AssignClientDialog client={client} onAssign={handleAssignClient} currentAffiliateName={clientAffiliateInfo?.fullName} />
        </Dialog>


       <AlertDialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Suspend {client.companyName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will temporarily disable their account. Are you sure?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSuspend}>Suspend</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Delete {client.companyName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action is irreversible and will permanently remove this client. Are you sure?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Delete Permanently
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    