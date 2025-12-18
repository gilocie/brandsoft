
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormDescription, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AmountInput } from '../amount-input';

const createSellCreditsSchema = (max: number) => z.object({
  amount: z.coerce.number().min(1, "Minimum amount is 1 credit.").max(max, "Amount exceeds your balance."),
});

type SellCreditsFormData = z.infer<ReturnType<typeof createSellCreditsSchema>>;

export const SellCreditsDialog = ({
    creditBalance,
    isOpen,
    onOpenChange,
    buyPrice
}: {
    creditBalance: number,
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    buyPrice: number,
}) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('sell-back');

    const sellCreditsSchema = createSellCreditsSchema(creditBalance);
    const form = useForm<SellCreditsFormData>({
        resolver: zodResolver(sellCreditsSchema),
        defaultValues: { amount: 1 },
    });

    const watchedAmount = form.watch('amount');
    const cashValue = (watchedAmount || 0) * buyPrice;

    const handleSellRequest = (data: SellCreditsFormData) => {
        toast({
            title: 'Withdrawal Request Submitted',
            description: `Your request to sell ${data.amount} credits for K${(data.amount * buyPrice).toLocaleString()} has been submitted for processing.`,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader className="flex-row justify-between items-center">
                    <div>
                        <DialogTitle>Sell or Transfer Credits</DialogTitle>
                        <DialogDescription>
                            Sell your BS Credits back to Brandsoft or transfer them to another affiliate.
                        </DialogDescription>
                    </div>
                     <ToggleGroup type="single" value={activeTab} onValueChange={(value) => {if(value) setActiveTab(value)}} className="border rounded-md h-9 p-0.5 bg-muted">
                        <ToggleGroupItem value="sell-back" className="h-full px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm rounded-sm">Sell</ToggleGroupItem>
                        <ToggleGroupItem value="transfer" className="h-full px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-sm">Transfer</ToggleGroupItem>
                     </ToggleGroup>
                </DialogHeader>
                <div className="py-4">
                     {activeTab === 'sell-back' && (
                       <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSellRequest)} className="space-y-4">
                               <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem className="text-center">
                                            <FormControl>
                                                <AmountInput
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                 Your balance: <span className="font-bold">BS {creditBalance.toLocaleString()}</span>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="p-4 bg-primary/10 rounded-lg text-center space-y-1 border border-primary/20">
                                    <p className="text-sm text-primary/80">You Will Receive</p>
                                    <p className="text-2xl font-bold text-primary">K{cashValue.toLocaleString()}</p>
                                </div>
                                <Button type="submit" className="w-full">Request Withdrawal</Button>
                            </form>
                        </Form>
                    )}
                    {activeTab === 'transfer' && (
                         <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                            <p className="text-sm text-muted-foreground text-center px-4">
                               This feature will allow you to transfer credits to another affiliate.
                               Coming soon.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
