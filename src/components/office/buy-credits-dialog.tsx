
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { ArrowRight, CreditCard, User, Wallet } from 'lucide-react';

const CREDIT_PURCHASE_PRICE = 900; // K900 per credit

const buyCreditsSchema = z.object({
  credits: z.coerce.number().int().min(1, "Must purchase at least 1 credit."),
  pin: z.string().length(4, "PIN must be 4 digits.").optional(),
});

type BuyCreditsFormData = z.infer<typeof buyCreditsSchema>;

export const BuyCreditsDialog = ({
    walletBalance,
    adminAvailableCredits,
    onManualPayment,
}: {
    walletBalance: number,
    adminAvailableCredits: number,
    onManualPayment: (details: { name: 'Credit Purchase', price: string, period: string }) => void,
}) => {
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
          if (creditsToBuy > adminAvailableCredits) {
              toast({
                variant: 'destructive',
                title: "Apology",
                description: `We only have BS ${adminAvailableCredits.toLocaleString()} in reserve. Please try a smaller amount.`,
              });
              return;
          }
          setStep(2);
      }
  }
  
  const handleWalletPayment = () => {
       if (cost > walletBalance) {
            toast({
              variant: 'destructive',
              title: "Insufficient Funds",
              description: `You need K${cost.toLocaleString()} but only have K${walletBalance.toLocaleString()} available.`,
            });
            return;
        }
        if (!config?.affiliate?.isPinSet) {
            toast({
                variant: 'destructive',
                title: "PIN Not Set",
                description: "Please set up your withdrawal PIN in 'My Features' before purchasing.",
            });
            return;
        }
        setStep(3);
  }
  
  const handleManualPaymentClick = () => {
    onManualPayment({
        name: `Credit Purchase (${creditsToBuy} BS)` as any,
        price: `K${cost.toLocaleString()}`,
        period: 'One-time Purchase'
    });
    handleDialogClose();
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
    
    handleDialogClose();
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    setTimeout(() => {
        form.reset();
        setStep(1);
    }, 200);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Buy Credits</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy Platform Credits</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Purchase credits to top up client wallets. 1 Credit = K1,000 value.'}
            {step === 2 && 'Choose your preferred payment method.'}
            {step === 3 && 'Confirm your purchase with your PIN.'}
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
                         <div className="flex justify-between">
                            <span>Admin Credit Reserve:</span>
                            <span className="font-bold">BS {adminAvailableCredits.toLocaleString()}</span>
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
                        <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button type="button" onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </DialogFooter>
                </>
            )}

            {step === 2 && (
                 <div className="pt-4 space-y-4">
                    <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                      <p className="text-sm text-muted-foreground">You are buying BS {creditsToBuy.toLocaleString()} for</p>
                      <p className="text-4xl font-bold">K{cost.toLocaleString()}</p>
                    </div>
                  <h3 className="text-sm font-semibold text-center">Choose Payment Method</h3>
                   <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleWalletPayment} className="flex-col h-auto py-3 bg-primary hover:bg-primary/90 text-white">
                            <Wallet className="mb-2 h-5 w-5" />
                            <div><p>Pay with Wallet</p><p className="text-xs opacity-80">K{walletBalance.toLocaleString()}</p></div>
                        </Button>
                        <Button className="flex-col h-auto py-3 bg-green-600 hover:bg-green-700 text-white" onClick={handleManualPaymentClick}>
                            <User className="mb-2 h-5 w-5" />
                            <div><p>Manual Payment</p><p className="text-xs opacity-80">Bank or Mobile</p></div>
                        </Button>
                    </div>
                   <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                   </DialogFooter>
                </div>
            )}
            
            {step === 3 && (
                <>
                    <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                        <p className="text-sm text-muted-foreground">Confirming purchase of BS {creditsToBuy.toLocaleString()} for</p>
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
                        <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
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
