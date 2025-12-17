

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { WithdrawalMethodDetails } from '@/types/brandsoft';

const withdrawalMethodSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(9, 'Phone number is required'),
    isClientPaymentMethod: z.boolean().default(false),
});

export type WithdrawalMethodFormData = z.infer<typeof withdrawalMethodSchema>;
export type EditableWithdrawalMethod = 'airtel' | 'tnm';

interface WithdrawalMethodDialogProps {
    method: EditableWithdrawalMethod;
    isOpen: boolean;
    onClose: () => void;
    onSave: (method: EditableWithdrawalMethod, data: WithdrawalMethodFormData) => void;
    currentData?: WithdrawalMethodDetails;
}

export const WithdrawalMethodDialog = ({
    method,
    isOpen,
    onClose,
    onSave,
    currentData
}: WithdrawalMethodDialogProps) => {
    const form = useForm<WithdrawalMethodFormData>({
        resolver: zodResolver(withdrawalMethodSchema),
        defaultValues: currentData || { name: '', phone: '', isClientPaymentMethod: false }
    });

    useEffect(() => {
        form.reset(currentData || { name: '', phone: '', isClientPaymentMethod: false });
    }, [currentData, form]);

    const onSubmit = (data: WithdrawalMethodFormData) => {
        onSave(method, data);
    };
    
    const methodName = method === 'airtel' ? 'Airtel Money' : 'TNM Mpamba';

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Up {methodName}</DialogTitle>
                    <DialogDescription>Enter your {methodName} details below.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
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
    )
};
