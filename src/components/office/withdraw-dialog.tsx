
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Banknote } from 'lucide-react';

const TRANSACTION_FEE_MWK = 3000;

const withdrawSchema = z.object({
  amount: z.coerce.number()
      .positive("Amount must be greater than 0")
      .min(30000, "Minimum withdrawal is K30,000")
      .max(1000000, "Maximum withdrawal at once is K1,000,000"),
  method: z.string().min(1, "Please select a payment method"),
  details: z.string().min(1, "Please provide payment details"),
  pin: z.string().length(4, "PIN must be 4 digits"),
  includeBonus: z.boolean().default(false),
});
type WithdrawFormData = z.infer<typeof withdrawSchema>;

export const WithdrawDialog = ({ commissionBalance, bonusBalance, onWithdraw, isVerified }: { commissionBalance: number, bonusBalance: number, onWithdraw: (amount: number, source: 'commission' | 'bonus' | 'combined') => void, isVerified: boolean }) => {
    const [step, setStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm<WithdrawFormData>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: { amount: 30000, method: '', details: '', pin: '', includeBonus: false },
    });
    
    const { toast } = useToast();
    const includeBonus = form.watch('includeBonus');

    const availableBalance = includeBonus ? commissionBalance + bonusBalance : commissionBalance;
    const withdrawableAmount = availableBalance - TRANSACTION_FEE_MWK;

    const handleNext = async () => {
        let isValid = false;
        if (step === 1) isValid = await form.trigger(["amount", "includeBonus"]);
        if (step === 2) isValid = await form.trigger(["method", "details"]);
        if (isValid) setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    const onSubmit = (data: WithdrawFormData) => {
        const totalToWithdraw = data.amount + TRANSACTION_FEE_MWK;
        
        if (totalToWithdraw > availableBalance) {
            toast({ variant: 'destructive', title: "Insufficient Funds", description: "The amount plus the transaction fee exceeds your available balance." });
            return;
        }
        if (data.pin !== "1234") { // Demo PIN
            toast({ variant: 'destructive', title: "Incorrect PIN" });
            return;
        }
        
        onWithdraw(data.amount, data.includeBonus ? 'combined' : 'commission');
        
        toast({ title: 'Withdrawal Successful!', description: `K${data.amount.toLocaleString()} has been processed.` });
        setIsOpen(false);
        form.reset();
        setStep(1);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary">
                    <Banknote className="h-4 w-4 mr-2" />
                    Withdraw Balance
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>Follow the steps to withdraw from your wallet.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {step === 1 && (
                             <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="includeBonus"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Include Bonus Balance?</FormLabel>
                                                <FormDescription>Your bonus balance is K{bonusBalance.toLocaleString()}.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={bonusBalance <= 0} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount to Withdraw (MWK)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                prefix="K"
                                                className="text-lg font-bold"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>Min: K30,000, Max: K1,000,000</FormDescription>
                                        <FormMessage />
                                        <div className="text-xs text-muted-foreground flex justify-between items-end pt-1">
                                           <div className="text-lg font-bold text-primary">
                                                <span>Available: K{withdrawableAmount > 0 ? withdrawableAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
                                           </div>
                                            <span className="text-right">Fee: K{TRANSACTION_FEE_MWK.toLocaleString()}</span>
                                        </div>
                                    </FormItem>
                                )}/>
                            </div>
                        )}
                         {step === 2 && (
                            <div className="space-y-4">
                                 <FormField control={form.control} name="method" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Withdrawal Method</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="airtel">Airtel Money</SelectItem>
                                                <SelectItem value="tnm">TNM Mpamba</SelectItem>
                                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="details" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Details (e.g., Phone or Account #)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        )}
                        {step === 3 && (
                            <FormField control={form.control} name="pin" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm with PIN</FormLabel>
                                    <FormControl><Input type="password" {...field} maxLength={4} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        )}
                        <DialogFooter>
                            {step > 1 && <Button type="button" variant="outline" onClick={handleBack}>Back</Button>}
                            {step < 3 && <Button type="button" onClick={handleNext}>Next</Button>}
                            {step === 3 && <Button type="submit">Confirm Withdrawal</Button>}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
