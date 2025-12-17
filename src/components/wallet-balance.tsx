
'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBrandsoft } from "@/hooks/use-brandsoft";
import { Button, type ButtonProps } from "./ui/button";
import { Wallet, Building2, Check, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { PurchaseDialog, type PlanDetails } from './purchase-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./ui/form";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const topUpSchema = z.object({
  amount: z.coerce.number().min(30000, "Minimum top-up is K30,000."),
});

type TopUpFormData = z.infer<typeof topUpSchema>;

const AmountInput = ({ value, onChange, className }: { value: number, onChange: (value: number) => void, className?: string }) => {
    const [displayValue, setDisplayValue] = useState<string>('');

    useEffect(() => {
        setDisplayValue(value > 0 ? value.toLocaleString() : '');
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (/^\d*$/.test(rawValue)) { // Allow only digits
            const numValue = Number(rawValue);
            setDisplayValue(numValue > 0 ? numValue.toLocaleString() : '');
            onChange(numValue);
        }
    };
    
    return (
        <div className="relative text-center">
            <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-5xl font-bold text-muted-foreground pointer-events-none" style={{ left: `calc(50% - ${((displayValue.length + 2) / 2) * 1.5}rem)` }}>K</span>
            <input
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                className={cn(
                    "w-full bg-transparent border-none text-5xl font-bold text-center focus:outline-none focus:ring-0",
                    className
                )}
                placeholder="0"
            />
        </div>
    );
};


export function WalletBalance({className, variant}: {className?: string, variant?: ButtonProps["variant"]}) {
  const { config } = useBrandsoft();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<PlanDetails | null>(null);
  const [step, setStep] = useState(1);

  const form = useForm<TopUpFormData>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 30000 },
  });
  
  const watchedAmount = form.watch('amount');

  if (!config) {
    return null;
  }

  const balance = config.profile.walletBalance || 0;
  const currency = config.profile.defaultCurrency || '';
  const exchangeValue = config.admin?.exchangeValue || 1000;
  const equivalentCredits = watchedAmount / exchangeValue;


  const handleNextStep = async () => {
    const isValid = await form.trigger('amount');
    if(isValid) {
      setStep(2);
    }
  };

  const handleConfirmAndPay = () => {
    const data = form.getValues();
    setPurchaseDetails({
      name: 'Wallet Top-up' as any,
      price: `${currency}${data.amount.toLocaleString()}`,
      period: 'One-time',
    });
    // We keep the top-up dialog open but hide it by advancing the step
    setStep(3); 
  };
  
   const handleDialogClose = () => {
    form.reset();
    setStep(1);
    setIsTopUpOpen(false);
  };
  
  const handlePurchaseSuccess = () => {
    setPurchaseDetails(null);
    handleDialogClose();
  };

  const affiliate = config.affiliate;
  const whoReceivesPayment = affiliate || {
      fullName: 'Brandsoft',
      profilePic: '', // You can add a Brandsoft logo URL here
  };


  return (
    <Dialog open={isTopUpOpen} onOpenChange={(open) => { if(!open) { handleDialogClose(); } else { setIsTopUpOpen(true); } }}>
        <DialogTrigger asChild>
             <Button size="sm" variant={variant} className={className}>Top up</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{step === 1 ? 'Top Up Your Wallet' : 'Confirm Purchase'}</DialogTitle>
                <DialogDescription>
                   {step === 1 
                     ? `Minimum top up is K30,000. Current exchange rate: K${exchangeValue.toLocaleString()} = BS 1.`
                     : 'Review your purchase details below.'
                   }
                </DialogDescription>
            </DialogHeader>

            {step === 1 && (
                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-6 pt-4">
                       <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem className="text-center">
                              <FormControl>
                                <AmountInput value={field.value} onChange={field.onChange} />
                              </FormControl>
                               <FormDescription>
                                You will receive: <span className="font-bold text-primary">BS {equivalentCredits.toFixed(2)}</span>
                               </FormDescription>
                              <FormMessage />
                               <div className="flex flex-col gap-1 pt-2 border-t mt-4 bg-muted/30 p-3 rounded-md">
                                <div className="flex justify-between items-center pt-2">
                                  <span className="font-bold">Current Balance:</span>
                                  <span className="text-xl font-bold text-primary">
                                    {currency}{balance.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                            <Button type="submit">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </DialogFooter>
                    </form>
                </Form>
            )}
            
            {step === 2 && (
                <div className="space-y-6 pt-4">
                    <div className="p-4 bg-muted rounded-lg text-center space-y-2">
                        <p className="text-sm text-muted-foreground">You are paying</p>
                        <p className="text-4xl font-bold">K{watchedAmount.toLocaleString()}</p>
                         <p className="text-sm text-muted-foreground">and will receive <strong className="text-primary">BS {equivalentCredits.toFixed(2)}</strong></p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={whoReceivesPayment.profilePic} />
                                <AvatarFallback><Building2/></AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-semibold">{whoReceivesPayment.fullName}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button type="button" onClick={handleConfirmAndPay}>Confirm & Pay</Button>
                    </DialogFooter>
                </div>
            )}
        </DialogContent>
        {step === 3 && purchaseDetails && (
            <PurchaseDialog
                plan={purchaseDetails}
                isOpen={!!purchaseDetails}
                onClose={() => { setPurchaseDetails(null); handleDialogClose(); }}
                onSuccess={handlePurchaseSuccess}
                isTopUp={true}
            />
        )}
    </Dialog>
  );
}
