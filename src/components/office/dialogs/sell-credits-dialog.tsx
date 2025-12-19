
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormDescription, FormMessage, FormLabel } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AmountInput } from '../amount-input';
import { Input } from '@/components/ui/input';

const createSellCreditsSchema = (max: number) => z.object({
  amount: z.coerce.number().min(1, "Minimum amount is 1 credit.").max(max, "Amount exceeds your balance."),
  pin: z.string().optional(),
});

type SellCreditsFormData = z.infer<ReturnType<typeof createSellCreditsSchema>>;

export const SellCreditsDialog = ({
    creditBalance,
    isOpen,
    onOpenChange,
    buyPrice,
    onSellConfirm,
    affiliatePin,
    isPinSet,
}: {
    creditBalance: number,
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    buyPrice: number,
    onSellConfirm: (amount: number) => void;
    affiliatePin?: string;
    isPinSet?: boolean;
}) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('sell-back');
    const [step, setStep] = useState(1);

    const sellCreditsSchema = createSellCreditsSchema(creditBalance);
    const form = useForm<SellCreditsFormData>({
        resolver: zodResolver(sellCreditsSchema),
        defaultValues: { amount: 1 },
    });

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                form.reset({ amount: 1, pin: '' });
                setStep(1);
            }, 200);
        }
    }, [isOpen, form]);

    const watchedAmount = form.watch('amount');
    const cashValue = (watchedAmount || 0) * buyPrice;

    const handleProceedToPin = async () => {
        const isValid = await form.trigger(['amount']);
        if (isValid) {
            if (!isPinSet) {
                toast({
                    variant: 'destructive',
                    title: 'PIN Not Set',
                    description: 'Please set your withdrawal PIN in "My Features > Security" before selling credits.',
                });
                return;
            }
            setStep(2);
        }
    };

    const handleSellRequest = (data: SellCreditsFormData) => {
        if (data.pin !== affiliatePin) {
            form.setError('pin', { message: 'Incorrect PIN.' });
            toast({ variant: 'destructive', title: 'Invalid PIN' });
            return;
        }
        onSellConfirm(data.amount);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                 <Button variant="outline" size="sm" className="w-full">Sell</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader className="flex-row justify-between items-center">
                    <div>
                        <DialogTitle>Sell or Transfer Credits</DialogTitle>
                        <DialogDescription>
                            {step === 1 ? 'Sell your BS Credits back to Brandsoft.' : 'Confirm the sale with your PIN.'}
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
                               {step === 1 && (
                                   <>
                                     <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem className="text-center">
                                                <FormControl>
                                                    <AmountInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        prefix="BS "
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
                                    <Button type="button" className="w-full" onClick={handleProceedToPin}>Proceed to Sell</Button>
                                   </>
                               )}

                               {step === 2 && (
                                   <div className="space-y-4">
                                     <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                                        <p className="text-sm text-muted-foreground">You are selling BS {watchedAmount.toLocaleString()} for</p>
                                        <p className="text-2xl font-bold">K{cashValue.toLocaleString()}</p>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="pin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Enter your 4-digit PIN</FormLabel>
                                                <FormControl>
                                                    <Input type="password" maxLength={4} className="text-center font-bold tracking-[1rem]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                         <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>Back</Button>
                                         <Button type="submit" className="w-full">Confirm Sale</Button>
                                    </div>
                                   </div>
                               )}
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
