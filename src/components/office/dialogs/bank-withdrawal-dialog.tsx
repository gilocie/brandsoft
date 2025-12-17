
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { BankDetails } from '@/types/brandsoft';

const bankWithdrawalSchema = z.object({
    bankName: z.string().min(2, 'Bank name is required'),
    accountNumber: z.string().min(5, 'Account number is required'),
    accountType: z.enum(['Saving', 'Current', 'Fixed']),
    isClientPaymentMethod: z.boolean().default(false),
});

export type BankWithdrawalFormData = z.infer<typeof bankWithdrawalSchema>;

interface BankWithdrawalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: BankWithdrawalFormData) => void;
    currentData?: BankDetails;
}

export const BankWithdrawalDialog = ({
    isOpen,
    onClose,
    onSave,
    currentData
}: BankWithdrawalDialogProps) => {
    const form = useForm<BankWithdrawalFormData>({
        resolver: zodResolver(bankWithdrawalSchema),
        defaultValues: currentData || { bankName: '', accountNumber: '', accountType: 'Saving', isClientPaymentMethod: false }
    });

    useEffect(() => {
        form.reset(currentData || { bankName: '', accountNumber: '', accountType: 'Saving', isClientPaymentMethod: false });
    }, [currentData, form]);

    const onSubmit = (data: BankWithdrawalFormData) => {
        onSave(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Up Bank Transfer</DialogTitle>
                    <DialogDescription>Enter your bank account details below.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="bankName" render={({ field }) => (
                            <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="accountNumber" render={({ field }) => (
                            <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="accountType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Saving">Saving</SelectItem>
                                        <SelectItem value="Current">Current</SelectItem>
                                        <SelectItem value="Fixed">Fixed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField
                            control={form.control}
                            name="isClientPaymentMethod"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Enable for Client Payments</FormLabel>
                                        <p className="text-xs text-muted-foreground">Allow clients to see these details for top-ups.</p>
                                    </div>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Save Details</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
