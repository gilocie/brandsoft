'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

const manageReserveSchema = z.object({
  action: z.enum(['add', 'deduct']),
  amount: z.coerce.number().min(0.01, "Amount must be a positive number."),
  reason: z.string().min(5, "A reason is required for this action."),
});

export type ManageReserveFormData = z.infer<typeof manageReserveSchema>;

interface ManageReserveDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ManageReserveFormData) => void;
    distributionReserve: number;
    maxCredits: number;
}

export const ManageReserveDialog = ({
    isOpen,
    onOpenChange,
    onSubmit,
    distributionReserve,
    maxCredits
}: ManageReserveDialogProps) => {
    const form = useForm<ManageReserveFormData>({
      resolver: zodResolver(manageReserveSchema),
      defaultValues: { action: 'add', amount: 1, reason: '' },
    });

    const watchedAmount = form.watch('amount');
    const watchedAction = form.watch('action');

    useEffect(() => {
        form.reset({ action: 'add', amount: 1, reason: '' });
    }, [isOpen, form]);
    
    const finalReserve = watchedAction === 'add' 
        ? distributionReserve + (Number(watchedAmount) || 0)
        : distributionReserve - (Number(watchedAmount) || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Credits Reserve</DialogTitle>
                     <DialogDescription>
                        Manually adjust the total credits in your central reserve.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="action"
                            render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Action</FormLabel>
                                <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <div className="flex flex-col gap-2 rounded-lg border p-3">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="font-normal flex items-center gap-2">
                                                 <FormControl><RadioGroupItem value="add" /></FormControl>
                                                 Add to Reserve
                                            </FormLabel>
                                             <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Current</p>
                                                <p className="text-lg font-bold">{distributionReserve.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-3">
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="deduct" /></FormControl>
                                            <FormLabel className="font-normal">Deduct from Reserve</FormLabel>
                                        </FormItem>
                                    </div>
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                        <FormDescription>
                                            Total reserve will be <span className="font-bold">{finalReserve.toLocaleString()}</span> after this change.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl><Textarea placeholder="e.g., Initial stock, correction..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
