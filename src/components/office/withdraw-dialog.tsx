
'use client';

import { useState, useEffect } from 'react';
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
import { Banknote, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const METHOD_FEES: Record<string, number> = {
    airtel: 3000,
    tnm: 3000,
    bank: 5000,
    bsCredits: 0,
};

const withdrawSchema = z.object({
  amount: z.coerce.number()
      .positive("Amount must be greater than 0")
      .min(30000, "Minimum withdrawal is K30,000")
      .max(1000000, "Maximum withdrawal at once is K1,000,000"),
  method: z.string().min(1, "Please select a payment method"),
  details: z.string().optional(),
  pin: z.string().length(4, "PIN must be 4 digits"),
  includeBonus: z.boolean().default(false),
});
type WithdrawFormData = z.infer<typeof withdrawSchema>;

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


export const WithdrawDialog = ({ commissionBalance, bonusBalance, onWithdraw, isVerified }: { commissionBalance: number, bonusBalance: number, onWithdraw: (amount: number, source: 'commission' | 'combined' | 'bonus') => void, isVerified: boolean }) => {
    const [step, setStep] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const { config } = useBrandsoft();
    
    const form = useForm<WithdrawFormData>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: { amount: 30000, method: '', details: '', pin: '', includeBonus: false },
    });
    
    const { toast } = useToast();
    const includeBonus = form.watch('includeBonus');
    const selectedMethod = form.watch('method');

    const safeCommission = Number(commissionBalance) || 0;
    const safeBonus = Number(bonusBalance) || 0;

    const grossBalance = includeBonus ? safeCommission + safeBonus : safeCommission;
    const withdrawableAmount = grossBalance;

    const availableMethods = Object.entries(config?.affiliate?.withdrawalMethods || {})
      .filter(([, details]) => !!details)
      .map(([key, details]) => {
          if (key === 'airtel' && details) return { value: 'airtel', label: 'Airtel Money', details: `${details.name} - ${details.phone}` };
          if (key === 'tnm' && details) return { value: 'tnm', label: 'TNM Mpamba', details: `${details.name} - ${details.phone}` };
          if (key === 'bank' && details) return { value: 'bank', label: 'Bank Transfer', details: `${details.bankName} - ${details.accountNumber}` };
          if (key === 'bsCredits' && details) return { value: 'bsCredits', label: 'BS Credits', details: `Staff ID: ${details.staffId}` };
          return null;
      }).filter(Boolean) as { value: string; label: string; details: string; }[];
      
    const handleMethodChange = (value: string) => {
        const selected = availableMethods.find(m => m.value === value);
        if (selected) {
            form.setValue('method', value);
            form.setValue('details', selected.details);
            form.trigger('details');
        }
    };


    const handleNext = async () => {
        let isValid = false;
        if (step === 1) isValid = await form.trigger(["amount", "includeBonus"]);
        if (step === 2) {
             if (availableMethods.length === 0) {
                toast({ variant: 'destructive', title: "No Payment Methods", description: "Please set up a withdrawal method in 'My Features' first." });
                return;
            }
            isValid = await form.trigger(["method"]);
        }
        if (isValid) setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    const onSubmit = (data: WithdrawFormData) => {
        const fee = METHOD_FEES[data.method] ?? 0;
        const totalToWithdraw = data.amount + fee;
        
        const balanceToCheck = data.includeBonus ? commissionBalance + bonusBalance : commissionBalance;

        if (totalToWithdraw > balanceToCheck) {
            toast({ variant: 'destructive', title: "Insufficient Funds", description: "The amount plus the transaction fee exceeds your available balance." });
            return;
        }

        if (!config?.affiliate?.isPinSet) {
             toast({ variant: 'destructive', title: "PIN Not Set", description: "Please set a withdrawal PIN in My Features > Security." });
             return;
        }

        if (data.pin !== config?.affiliate?.pin) { 
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
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { form.reset(); setStep(1); } setIsOpen(open); }}>
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
                                                <FormDescription>
                                                    Available Bonus: <span className="font-bold text-green-600">+K{safeBonus.toLocaleString()}</span>
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={safeBonus <= 0} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem className="text-center">
                                        <FormControl>
                                            <AmountInput
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormDescription>Min: K30,000, Max: K1,000,000</FormDescription>
                                        <FormMessage />
                                         <div className="flex flex-col gap-1 pt-2 border-t mt-4 bg-muted/30 p-3 rounded-md">
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="font-bold">Max Withdrawable:</span>
                                                <span className="text-xl font-bold text-primary">
                                                    K{withdrawableAmount > 0 ? withdrawableAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0.00'}
                                                </span>
                                            </div>
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
                                        <Select onValueChange={handleMethodChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {availableMethods.map(method => (
                                                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                {selectedMethod && (
                                     <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Service Fee</AlertTitle>
                                        <AlertDescription>
                                            A fee of <strong>K{METHOD_FEES[selectedMethod]?.toLocaleString() || 0}</strong> will be applied for this transaction.
                                        </AlertDescription>
                                    </Alert>
                                )}
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
                        <DialogFooter className="sm:justify-between">
                            <div>
                                {step > 1 && <Button type="button" variant="outline" onClick={handleBack}>Back</Button>}
                            </div>
                            <div>
                                {step < 3 && <Button type="button" onClick={handleNext}>Next</Button>}
                                {step === 3 && <Button type="submit">Confirm Withdrawal</Button>}
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
