

'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type AffiliateClient, type Company, type Affiliate } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Ban, Briefcase, User, Wallet, CirclePlus, Clock } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/office/stat-card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter as ShadcnDialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const CREDIT_TO_MWK = 1000;

const createTopUpSchema = (maxCredits: number) => z.object({
    amount: z.coerce
        .number()
        .min(30, "Minimum top-up is 30 credits.")
        .max(maxCredits, `You only have ${maxCredits} credits available.`),
});

type TopUpFormData = z.infer<ReturnType<typeof createTopUpSchema>>;

const TopUpDialog = ({ client, affiliate, onTopUp }: { client: AffiliateClient, affiliate: any, onTopUp: (amount: number) => void }) => {
    const affiliateCredits = affiliate?.creditBalance || 0;
    
    const topUpSchema = createTopUpSchema(affiliateCredits);
    
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
                <DialogTitle>Top Up {client.name}'s Wallet</DialogTitle>
                <DialogDescription>
                    Transfer BS Credits from your account to your client's wallet.
                    Your current credit balance is <strong className="text-primary">BS {affiliateCredits.toLocaleString()}</strong>.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>BS Credits to Transfer</FormLabel>
                                <FormControl>
                                    <Input type="number" min="30" step="1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                        <p className="text-sm text-muted-foreground">Client will receive</p>
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


export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { config, saveConfig } = useBrandsoft();
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const { client, affiliate } = useMemo(() => {
    if (!config || !config.affiliate) return { client: undefined, affiliate: undefined };
    
    const foundClient = config.affiliate.clients.find(c => c.id === params.id);
    return { client: foundClient, affiliate: config.affiliate };
  }, [config, params.id]);

  const handleSuspend = () => {
    if (!client) return;
    // Placeholder for suspension logic
    console.log(`Suspending client: ${client.name}`);
    toast({
      title: "Client Suspended",
      description: `${client.name} has been suspended.`,
    });
    setIsSuspendOpen(false);
  };

  const handleTopUp = (amount: number) => {
    if (!client || !config || !affiliate) return;
    
    const costInMWK = amount * CREDIT_TO_MWK;
    
    // 1. Update Affiliate
    const newAffiliateData = {
        ...affiliate,
        creditBalance: (affiliate.creditBalance || 0) - amount,
        transactions: [
            {
                id: `TRN-DEBIT-${Date.now()}`,
                date: new Date().toISOString(),
                description: `Credit sale to ${client.name}`,
                amount: amount,
                type: 'debit' as const,
            },
            ...(affiliate.transactions || [])
        ],
    };
    
    // 2. Update Client in Affiliate's list
    const updatedAffiliateClients = affiliate.clients.map(c => 
        c.id === client.id ? { ...c, walletBalance: (c.walletBalance || 0) + costInMWK } : c
    );
    newAffiliateData.clients = updatedAffiliateClients;

    // 3. Save config
    saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });

    toast({
      title: "Top-up Successful!",
      description: `You have successfully sent K${costInMWK.toLocaleString()} to ${client.name}.`,
    });
    
    setIsTopUpOpen(false);
  };

  if (!client || !affiliate) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-xl font-semibold">Client not found</h2>
        <p className="text-muted-foreground">The requested client could not be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/office"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Office</Link>
        </Button>
      </div>
    );
  }
  
  const isExpired = client.status === 'expired' || client.remainingDays === 0;


  return (
    <div className="container mx-auto space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/office?tab=clients"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Office</Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-28 w-28 border">
            <AvatarImage src={client.avatar} alt={client.name} />
            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1 text-center md:text-left">
            <CardTitle className="text-3xl font-headline">{client.name}</CardTitle>
            <CardDescription className="text-base text-muted-foreground flex items-center justify-center md:justify-start gap-4">
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Plan: {client.plan}
                {!isExpired && client.remainingDays !== undefined && (
                  <span className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 ml-2" /> {client.remainingDays} days left</span>
                )}
                {isExpired && (
                  <span className="flex items-center gap-2 text-destructive"><Clock className="h-4 w-4 ml-2" /> Expired</span>
                )}
              </span>
            </CardDescription>
             <div className="pt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
             </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Client Wallet" value={client.walletBalance || 0} isCurrency icon={Wallet} footer="Funds available to the client">
             <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                        <CirclePlus className="mr-2 h-4 w-4" /> Top Up Wallet
                    </Button>
                </DialogTrigger>
                <TopUpDialog client={client} affiliate={affiliate} onTopUp={handleTopUp} />
            </Dialog>
        </StatCard>
        <Card className="flex flex-col">
            <CardHeader className="flex-grow">
                <CardTitle>Client Actions</CardTitle>
                <CardDescription>Manage this client's account.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" className="w-full" onClick={() => setIsSuspendOpen(true)}>
                    <Ban className="mr-2 h-4 w-4" /> Suspend Client
                </Button>
            </CardContent>
        </Card>
      </div>

       <AlertDialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Suspend {client.name}?</AlertDialogTitle>
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
    </div>
  );
}

    
