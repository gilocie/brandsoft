
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const bsCreditsSchema = z.object({
    staffId: z.string().min(1, 'Please select your Staff ID'),
});

export type BsCreditsFormData = z.infer<typeof bsCreditsSchema>;

interface BsCreditsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: BsCreditsFormData) => void;
    currentData?: { staffId: string };
    staffId?: string;
}

export const BsCreditsDialog = ({ isOpen, onClose, onSave, currentData, staffId }: BsCreditsDialogProps) => {
    const form = useForm<BsCreditsFormData>({
        resolver: zodResolver(bsCreditsSchema),
        defaultValues: currentData || { staffId: '' },
    });
    
    useEffect(() => {
        form.reset(currentData || { staffId: '' });
    }, [currentData, form]);

    const onSubmit = (data: BsCreditsFormData) => {
        onSave(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Up BS Credits Withdrawal</DialogTitle>
                    <DialogDescription>Select your Staff ID to associate with credit withdrawals.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="staffId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Staff ID</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Staff ID" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {staffId ? (
                                                <SelectItem value={staffId}>{staffId}</SelectItem>
                                            ) : (
                                                <SelectItem value="none" disabled>No Staff ID generated</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
