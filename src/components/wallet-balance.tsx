
'use client';

import { useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

const topUpSchema = z.object({
  amount: z.coerce.number().min(30000, "Minimum top-up is K30,000."),
});

type TopUpFormData = z.infer<typeof topUpSchema>;

export function WalletBalance() {
  const { config } = useBrandsoft();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<PlanDetails | null>(null);

  const form = useForm<TopUpFormData>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 30000 },
  });

  if (!config) {
    return null;
  }

  const balance = config.profile.walletBalance || 0;
  const currency = config.profile.defaultCurrency || '';

  const handleTopUpSubmit = (data: TopUpFormData) => {
    setPurchaseDetails({
      name: 'Wallet Top-up' as any,
      price: `${currency}${data.amount.toLocaleString()}`,
      period: 'One-time',
    });
    setIsTopUpOpen(false); // Close amount dialog
  };

  return (
    <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm font-medium">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span>{currency}{balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
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
                    <form onSubmit={form.handleSubmit(handleTopUpSubmit)} className="space-y-4 pt-4">
                       <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount (in {currency})</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 50000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsTopUpOpen(false)}>Cancel</Button>
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
