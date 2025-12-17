

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBrandsoft } from '@/hooks/use-brandsoft';

const CREDIT_PURCHASE_PRICE = 900; // K900 per credit

const buyCreditsSchema = z.object({
  credits: z.coerce.number().int().min(1, "Must purchase at least 1 credit."),
  pin: z.string().length(4, "PIN must be 4 digits.").optional(),
});

type BuyCreditsFormData = z.infer<typeof buyCreditsSchema>;

export const BuyCreditsDialog = ({ walletBalance, adminAvailableCredits }: { walletBalance: number, adminAvailableCredits: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();

  const form = useForm<BuyCreditsFormData>({
    resolver: zodResolver(buyCreditsSchema),
    defaultValues: { credits: 1 },
  });

  const creditsToBuy = form.watch('credits');
  const cost = creditsToBuy * CREDIT_PURCHASE_PRICE;

  const handleNextStep = async () => {
      const isValid = await form.trigger(['credits']);
      if (isValid) {
          if (!config?.affiliate?.isPinSet) {
              toast({
                  variant: 'destructive',
                  title: "PIN Not Set",
                  description: "Please set up your withdrawal PIN in the 'My Features' tab before purchasing credits.",
              });
              return;
          }
          if (cost > walletBalance) {
              toast({
                variant: 'destructive',
                title: "Insufficient Funds",
                description: `You need K${cost.toLocaleString()} but only have K${walletBalance.toLocaleString()} available.`,
              });
              return;
          }
           if (creditsToBuy > adminAvailableCredits) {
              toast({
                variant: 'destructive',
                title: "Apology",
                description: "We have a low Credit Reserve. Please Try Again Later.",
              });
              return;
          }
          setStep(2);
      }
  }

  const onSubmit = (data: BuyCreditsFormData) => {
    if (!config || !config.affiliate || !config.admin) return;

    if (!data.pin || data.pin !== config.affiliate.pin) {
        toast({ variant: 'destructive', title: "Incorrect PIN" });
        if(data.pin) form.setError('pin', { type: 'manual', message: 'The entered PIN is incorrect.' });
        return;
    }
    
    const costInMWK = data.credits * CREDIT_PURCHASE_PRICE;

    const newTransaction = {
      id: `TRN-CREDIT-${Date.now()}`,
      date: new Date().toISOString(),
      description: `Purchased ${data.credits} credits`,
      amount: costInMWK,
      type: 'debit' as 'debit',
    };

    const newAffiliateData = {
      ...config.affiliate,
      myWallet: (config.affiliate.myWallet || 0) - costInMWK,
      creditBalance: (config.affiliate.creditBalance || 0) + data.credits,
      transactions: [newTransaction, ...(config.affiliate.transactions || [])],
    };

    const newAdminSettings = {
        ...config.admin,
        availableCredits: (config.admin.availableCredits || 0) - data.credits,
        soldCredits: (config.admin.soldCredits || 0) + data.credits,
    };

    saveConfig({ ...config, affiliate: newAffiliateData, admin: newAdminSettings }, { redirect: false, revalidate: true });
    
    toast({
      title: 'Purchase Successful!',
      description: `You purchased ${data.credits} credits for K${cost.toLocaleString()}.`,
    });
    
    setIsOpen(false);
    form.reset();
    setStep(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) { form.reset(); setStep(1); } }}>
      <DialogTrigger asChild>
        <Button>Buy Credits</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy Platform Credits</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Purchase credits using your available wallet balance. 1 Credit = K1,000 value.' : 'Confirm your purchase with your PIN.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {step === 1 && (
                <>
                    <div className="text-sm">
                        <div className="flex justify-between">
                            <span>Available Wallet Balance:</span>
                            <span className="font-bold">K{walletBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-primary">
                            <span>Your Purchase Price:</span>
                            <span className="font-bold">K{CREDIT_PURCHASE_PRICE}/Credit</span>
                        </div>
                    </div>
                    
                    <FormField
                    control={form.control}
                    name="credits"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Credits to Buy</FormLabel>
                        <FormControl>
                            <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold">K{cost.toLocaleString()}</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={handleNextStep}>Continue</Button>
                    </DialogFooter>
                </>
            )}

            {step === 2 && (
                <>
                    <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold">K{cost.toLocaleString()}</p>
                    </div>

                    <FormField
                    control={form.control}
                    name="pin"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Enter your 4-digit PIN to confirm</FormLabel>
                        <FormControl>
                            <Input type="password" maxLength={4} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button type="submit">Confirm Purchase</Button>
                    </DialogFooter>
                </>
            )}

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

    