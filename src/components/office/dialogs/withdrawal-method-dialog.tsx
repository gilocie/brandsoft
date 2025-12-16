
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const withdrawalMethodSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(9, 'Phone number is required'),
});

export type WithdrawalMethodFormData = z.infer<typeof withdrawalMethodSchema>;
export type EditableWithdrawalMethod = 'airtel' | 'tnm';

interface WithdrawalMethodDialogProps {
    method: EditableWithdrawalMethod;
    isOpen: boolean;
    onClose: () => void;
    onSave: (method: EditableWithdrawalMethod, data: WithdrawalMethodFormData) => void;
    currentData?: { name: string; phone: string };
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
        defaultValues: currentData || { name: '', phone: '' }
    });

    useEffect(() => {
        form.reset(currentData || { name: '', phone: '' });
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
