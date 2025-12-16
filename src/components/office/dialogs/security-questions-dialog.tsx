
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const securityQuestionSchema = z.object({
  question: z.string().min(1, "Please select a question."),
  customQuestion: z.string().optional(),
  answer: z.string().min(1, "An answer is required."),
}).refine(data => data.question !== 'custom' || (data.customQuestion && data.customQuestion.length > 0), {
    message: "Please enter your custom question.",
    path: ["customQuestion"],
});

export type SecurityQuestionFormData = z.infer<typeof securityQuestionSchema>;

const securityQuestions = [
    "What was the name of your primary school?",
    "What was your place of birth?",
    "What's the first name of your mother?",
    "What's the first name of your father?",
    "Who was the name of your family firstborn?",
    "Food you love most?",
    "What animal do you love most?",
    "What is your favourite color?",
    "What is your father's birthday?",
    "What's the name of your spouse?",
    "custom",
];

interface SecurityQuestionsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SecurityQuestionFormData) => void;
    currentData?: { question: string; answer: string; };
}

export const SecurityQuestionsDialog = ({ isOpen, onClose, onSave, currentData }: SecurityQuestionsDialogProps) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const [formData, setFormData] = useState<SecurityQuestionFormData | null>(null);

    const form = useForm<SecurityQuestionFormData>({
        resolver: zodResolver(securityQuestionSchema),
        defaultValues: {
            question: currentData?.question || '',
            customQuestion: currentData && !securityQuestions.includes(currentData.question) ? currentData.question : '',
            answer: currentData?.answer || '',
        },
    });

    const watchedQuestion = form.watch('question');

    const onSubmit = (data: SecurityQuestionFormData) => {
        setFormData(data);
        setIsConfirming(true);
    };

    const handleConfirmSave = () => {
        if (formData) {
            onSave(formData);
        }
        setIsConfirming(false);
        setFormData(null);
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !isConfirming && onClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Security Question</DialogTitle>
                        <DialogDescription>This will be used to recover your account or reset your PIN.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="question"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Question</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select a question" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {securityQuestions.map(q => (
                                                    <SelectItem key={q} value={q}>{q === 'custom' ? 'Custom question...' : q}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {watchedQuestion === 'custom' && (
                                <FormField
                                    control={form.control}
                                    name="customQuestion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Your Custom Question</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., What is my favorite book?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="answer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Answer</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter your secret answer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                <Button type="submit">Save Question</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This security question cannot be changed later. Make sure it's memorable to you but difficult for others to guess.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSave}>Yes, save it</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
