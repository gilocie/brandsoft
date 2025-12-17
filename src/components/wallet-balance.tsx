
'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBrandsoft } from "@/hooks/use-brandsoft";
import { Button } from "./ui/button";
import { Wallet } from "lucide-react";
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


export function WalletBalance() {
  const { config } = useBrandsoft();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<PlanDetails | null>(null);

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


  const handleTopUpSubmit = (data: TopUpFormData) => {
    setPurchaseDetails({
      name: 'Wallet Top-up' as any,
      price: `${currency}${data.amount.toLocaleString()}`,
      period: 'One-time',
    });
    setIsTopUpOpen(false); // Close amount dialog
  };
  
   const handleDialogClose = () => {
    form.reset();
    setIsTopUpOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm font-medium">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span>{currency}{balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <Dialog open={isTopUpOpen} onOpenChange={(open) => { if(!open) { handleDialogClose(); } else { setIsTopUpOpen(true); } }}>
            <DialogTrigger asChild>
                 <Button size="sm">Top up</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Top Up Your Wallet</DialogTitle>
                    <DialogDescription>
                        Enter the amount you wish to add to your wallet.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleTopUpSubmit)} className="space-y-6 pt-4">
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
                            <Button type="submit">Proceed to Payment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        {purchaseDetails && (
            <PurchaseDialog
                plan={purchaseDetails}
                isOpen={!!purchaseDetails}
                onClose={() => setPurchaseDetails(null)}
                onSuccess={() => setPurchaseDetails(null)}
                isTopUp={true}
            />
        )}
    </div>
  );
}

