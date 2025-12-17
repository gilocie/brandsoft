
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Wallet, CreditCard, Gift, Calendar, User } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { PurchaseDialog, type PlanDetails } from '@/components/purchase-dialog';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const KEY_PRICE = 5000;

const pinSchema = z.object({
  pin: z.string().length(4, "Your PIN must be 4 digits."),
});
type PinFormData = z.infer<typeof pinSchema>;


interface GenerateKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  walletBalance: number;
  creditBalance: number;
}

export const GenerateKeyDialog = ({ isOpen, onClose, staffId, walletBalance, creditBalance }: GenerateKeyDialogProps) => {
  const [step, setStep] = useState(1);
  const [generatedKey, setGeneratedKey] = useState('');
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();
  const [purchaseDetails, setPurchaseDetails] = useState<PlanDetails | null>(null);
  const [pinConfirmation, setPinConfirmation] = useState<{method: 'wallet' | 'credits'} | null>(null);

  const exchangeValue = config?.admin?.exchangeValue || 1000;
  const creditCost = KEY_PRICE / exchangeValue;

  const pinForm = useForm<PinFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: '' },
  });

  useEffect(() => {
    if (isOpen && step === 1) {
      const uniqueSuffix = Date.now().toString(36).slice(-6).toUpperCase();
      const fullKey = `${staffId}-${uniqueSuffix}`;
      setGeneratedKey(fullKey);
    }
  }, [isOpen, step, staffId]);

  const handleProceedToPayment = () => {
    if (generatedKey) {
        setStep(2);
    }
  };
  
  const handlePayment = (pin: string) => {
      if (!pinConfirmation) return;

      if (!config?.affiliate?.isPinSet) {
          toast({ variant: 'destructive', title: "PIN Not Set", description: "Please set your withdrawal PIN in 'My Features' first." });
          return;
      }
      if (pin !== config.affiliate.pin) {
          toast({ variant: 'destructive', title: "Incorrect PIN" });
          pinForm.setError('pin', { message: "The PIN is incorrect." });
          return;
      }
      
      const method = pinConfirmation.method;

      if (method === 'wallet') {
          // Logic for wallet payment is here, but we just show a toast for now
          // This would typically involve an API call
          const newTransaction = {
            id: `TRN-KEY-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Key Purchase: ${generatedKey}`,
            amount: KEY_PRICE,
            type: 'debit' as 'debit',
          };
          saveConfig({
            ...config,
            affiliate: {
              ...config.affiliate,
              myWallet: (config.affiliate.myWallet || 0) - KEY_PRICE,
              transactions: [newTransaction, ...(config.affiliate.transactions || [])],
            }
          });
      } else if (method === 'credits') {
         // Logic for credit payment
          const newTransaction = {
            id: `TRN-KEY-CREDIT-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Key Purchase with Credits: ${generatedKey}`,
            amount: creditCost,
            type: 'debit' as 'debit',
          };
           saveConfig({
            ...config,
            affiliate: {
              ...config.affiliate,
              creditBalance: (config.affiliate.creditBalance || 0) - creditCost,
              transactions: [newTransaction, ...(config.affiliate.transactions || [])],
            }
          });
      }

      toast({
          title: "Payment Successful!",
          description: `Key ${generatedKey} has been purchased via ${method}.`,
      });
      handleClose();
  };

  const handleManualPayment = () => {
      setPurchaseDetails({
        name: `Activation Key (${generatedKey})` as any,
        price: `K${KEY_PRICE.toLocaleString()}`,
        period: 'One-time Key Purchase',
    });
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setStep(1);
        setGeneratedKey('');
        setPurchaseDetails(null);
        setPinConfirmation(null);
        pinForm.reset();
    }, 200);
  }

  return (
    <>
      <Dialog open={isOpen && !purchaseDetails && !pinConfirmation} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{step === 1 ? 'Generate New Activation Key' : 'Confirm Purchase'}</DialogTitle>
             <DialogDescription>
              {step === 1 
                ? 'Create a new activation key for a customer. Each key includes startup bonuses.' 
                : `Confirm purchase for the generated key below.`}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted text-center h-full">
                      <p className="text-sm text-muted-foreground">Generated Activation Key</p>
                      <p className="font-mono text-2xl font-bold tracking-wider my-4 break-all">{generatedKey}</p>
                      <p className="text-xs text-muted-foreground">This key is unique and ready to be shared.</p>
                  </div>
                  <div className="space-y-3 rounded-lg border p-4">
                      <h3 className="text-sm font-semibold">Key Benefits for Your New Client:</h3>
                      <div className="flex items-start gap-3 text-sm">
                          <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0"/>
                          <div>
                              <p className="font-medium">30 Free Premium Days</p>
                              <p className="text-xs text-muted-foreground">The client starts with a 30-day free trial on any premium plan upon activation.</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                          <Gift className="h-5 w-5 text-primary mt-0.5 shrink-0"/>
                          <div>
                              <p className="font-medium">K30,000 Starter Wallet</p>
                              <p className="text-xs text-muted-foreground">A K30,000 balance is credited to their account to automatically renew their plan after the free trial.</p>
                          </div>
                      </div>
                  </div>
                </div>
              
                <div className="text-center font-bold text-lg pt-4 border-t">
                  Cost: K{KEY_PRICE.toLocaleString()}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button type="button" onClick={handleProceedToPayment}><KeyRound className="mr-2 h-4 w-4" />Create Key & Proceed</Button>
                </DialogFooter>
            </div>
          )}

          {step === 2 && (
            <div className="pt-4 space-y-4">
                <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                  <p className="text-sm text-muted-foreground">You are purchasing a new key for</p>
                  <p className="text-4xl font-bold">K{KEY_PRICE.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground pt-2">Generated Key: <span className="font-mono">{generatedKey}</span></p>
                </div>
              <h3 className="text-sm font-semibold text-center">Choose Payment Method</h3>
               <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => {
                      if (walletBalance < KEY_PRICE) {
                          toast({ variant: 'destructive', title: 'Insufficient Wallet Balance' });
                      } else {
                          setPinConfirmation({ method: 'wallet' });
                      }
                  }} className="flex-col h-auto py-3 bg-primary hover:bg-primary/90 text-white">
                      <Wallet className="mb-2 h-5 w-5" />
                      <div><p>Pay with Wallet</p><p className="text-xs opacity-80">K{walletBalance.toLocaleString()}</p></div>
                  </Button>
                   <Button onClick={() => {
                      if (creditBalance < creditCost) {
                           toast({ variant: 'destructive', title: 'Insufficient Credits' });
                      } else {
                          setPinConfirmation({ method: 'credits' });
                      }
                  }} className="flex-col h-auto py-3 bg-accent hover:bg-accent/90 text-white">
                      <CreditCard className="mb-2 h-5 w-5" />
                      <div><p>BS Credits</p><p className="text-xs opacity-80">BS {creditBalance.toLocaleString()}</p></div>
                  </Button>
                  <Button className="flex-col h-auto py-3 bg-green-600 hover:bg-green-700 text-white" onClick={handleManualPayment}>
                    <User className="mb-2 h-5 w-5" />
                    <div><p>Manual</p><p className="text-xs opacity-80">Customer pays</p></div>
                </Button>
              </div>
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
               </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* PIN Confirmation Dialog */}
      <Dialog open={!!pinConfirmation} onOpenChange={() => setPinConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm with PIN</DialogTitle>
            <DialogDescription>
                {pinConfirmation?.method === 'wallet' 
                    ? `Enter your PIN to confirm payment of K${KEY_PRICE.toLocaleString()} from your wallet.`
                    : `Enter your PIN to confirm payment of BS ${creditCost.toLocaleString()} from your credit balance.`
                }
            </DialogDescription>
          </DialogHeader>
          <Form {...pinForm}>
            <form onSubmit={pinForm.handleSubmit((data) => handlePayment(data.pin))} className="space-y-4">
                 <FormField
                    control={pinForm.control}
                    name="pin"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>4-Digit PIN</FormLabel>
                            <FormControl>
                                <Input type="password" maxLength={4} {...field} className="text-center font-bold tracking-[1rem]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setPinConfirmation(null)}>Cancel</Button>
                    <Button type="submit">Confirm Payment</Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {purchaseDetails && (
        <PurchaseDialog
          plan={purchaseDetails}
          isOpen={!!purchaseDetails}
          onClose={handleClose}
          onSuccess={handleClose}
          isTopUp
        />
      )}
    </>
  );
};
