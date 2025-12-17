
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Wallet, CreditCard } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

const generateKeySchema = z.object({
  keySuffix: z.string().min(4, "Key suffix must be at least 4 characters."),
});

type GenerateKeyFormData = z.infer<typeof generateKeySchema>;

const KEY_PRICE = 5000; // Hardcoded for now

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
  const { toast } = useToast();

  const form = useForm<GenerateKeyFormData>({
    resolver: zodResolver(generateKeySchema),
    defaultValues: { keySuffix: '' },
  });

  const handleGenerate = (data: GenerateKeyFormData) => {
    const fullKey = `${staffId}-${data.keySuffix.toUpperCase()}`;
    setGeneratedKey(fullKey);
    setStep(2);
  };
  
  const handlePayment = (method: 'wallet' | 'credits' | 'manual') => {
      // Placeholder for actual payment logic
      toast({
          title: "Payment Processing",
          description: `Processing payment for key ${generatedKey} via ${method}.`,
      });
      // In a real app, you'd deduct from balance, etc.
      onClose();
      form.reset();
      setStep(1);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        form.reset();
        setStep(1);
    }, 200);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Generate New Activation Key' : 'Confirm Purchase'}</DialogTitle>
           <DialogDescription>
            {step === 1 
              ? 'Create a new activation key for a customer. One key costs K5,000.' 
              : `Confirm purchase for key: ${generatedKey}`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4 pt-4">
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                <span className="font-mono text-sm text-muted-foreground">{staffId}-</span>
                <FormField
                  control={form.control}
                  name="keySuffix"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="UNIQUEID" {...field} className="font-mono uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="text-center font-bold text-lg">
                Cost: K{KEY_PRICE.toLocaleString()}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit"><KeyRound className="mr-2 h-4 w-4" />Generate & Proceed</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === 2 && (
          <div className="pt-4 space-y-4">
              <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                <p className="text-sm text-muted-foreground">You are purchasing a new key for</p>
                <p className="text-2xl font-bold">K{KEY_PRICE.toLocaleString()}</p>
              </div>
            <h3 className="text-sm font-semibold text-center">Choose Payment Method</h3>
            <div className="grid grid-cols-1 gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="justify-start h-auto py-3"><Wallet className="mr-3 h-5 w-5 text-primary" /><div><p>Pay with Wallet</p><p className="text-xs text-muted-foreground text-left">Balance: K{walletBalance.toLocaleString()}</p></div></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Pay with Wallet</AlertDialogTitle><AlertDialogDescription>Confirm debiting K{KEY_PRICE.toLocaleString()} from your wallet?</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handlePayment('wallet')}>Confirm</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="justify-start h-auto py-3"><CreditCard className="mr-3 h-5 w-5 text-primary" /><div><p>Pay with BS Credits</p><p className="text-xs text-muted-foreground text-left">Balance: BS {creditBalance.toLocaleString()}</p></div></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                   <AlertDialogHeader><AlertDialogTitle>Pay with BS Credits</AlertDialogTitle><AlertDialogDescription>Confirm debiting required credits for K{KEY_PRICE.toLocaleString()}?</AlertDialogDescription></AlertDialogHeader>
                   <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handlePayment('credits')}>Confirm</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="secondary" onClick={() => handlePayment('manual')}>Manual / Customer Payment</Button>
            </div>
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
             </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
