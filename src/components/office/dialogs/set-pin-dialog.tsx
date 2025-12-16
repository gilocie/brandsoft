
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Eye, EyeOff } from 'lucide-react';

const pinSchema = z.object({
  oldPin: z.string().optional(),
  pin: z.string().length(4, "PIN must be 4 digits.").regex(/^\d{4}$/, "PIN must be 4 digits."),
  confirmPin: z.string().length(4, "PIN must be 4 digits.").regex(/^\d{4}$/, "PIN must be 4 digits."),
}).refine(data => data.pin === data.confirmPin, {
    message: "PINs do not match.",
    path: ["confirmPin"],
});
type PinFormData = z.infer<typeof pinSchema>;

// Schema for Step 1: Just the answer
const verifyAnswerSchema = z.object({
  answer: z.string().min(1, "An answer is required."),
});

type VerifyAnswerFormData = z.infer<typeof verifyAnswerSchema>;

// Schema for Step 2: Just the PINs
const setNewPinSchema = z.object({
  newPin: z.string().length(4, "New PIN must be 4 digits.").regex(/^\d{4}$/, "New PIN must be 4 digits."),
  confirmNewPin: z.string().length(4, "New PIN must be 4 digits.").regex(/^\d{4}$/, "New PIN must be 4 digits."),
}).refine(data => data.newPin === data.confirmNewPin, {
    message: "New PINs do not match.",
    path: ["confirmNewPin"],
});

type SetNewPinFormData = z.infer<typeof setNewPinSchema>;

interface SetPinDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pin: string) => void;
    isPinSet: boolean;
}

export const SetPinDialog = ({ isOpen, onClose, onSave, isPinSet }: SetPinDialogProps) => {
    const { toast } = useToast();
    const [showPin, setShowPin] = useState(false);
    const [showOldPin, setShowOldPin] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const { config } = useBrandsoft();

    // Form for normal PIN change
    const form = useForm<PinFormData>({
        resolver: zodResolver(pinSchema),
        defaultValues: { oldPin: '', pin: '', confirmPin: '' },
    });
    
    // Form for Step 1: Verify Answer
    const answerForm = useForm<VerifyAnswerFormData>({
        resolver: zodResolver(verifyAnswerSchema),
        defaultValues: { answer: '' },
    });

    // Form for Step 2: Set New PIN
    const newPinForm = useForm<SetNewPinFormData>({
        resolver: zodResolver(setNewPinSchema),
        defaultValues: { newPin: '', confirmNewPin: '' },
    });

    useEffect(() => {
        if (!isOpen) {
            // Reset all states when dialog closes
            setIsResetting(false);
            setResetStep(1);
            setShowPin(false);
            setShowOldPin(false);
            form.reset();
            answerForm.reset(); // Reset separate form 1
            newPinForm.reset(); // Reset separate form 2
        }
    }, [isOpen, form, answerForm, newPinForm]);

    const onSubmit = (data: PinFormData) => {
        if (isPinSet && data.oldPin !== config?.affiliate?.pin) {
            toast({ variant: 'destructive', title: "Incorrect Old PIN" });
            return;
        }
        onSave(data.pin);
        onClose();
    };

    // Updated to use VerifyAnswerFormData
    const handleVerifyAnswer = (data: VerifyAnswerFormData) => {
        if (!config?.affiliate?.securityQuestionData?.answer) {
            toast({ 
                variant: 'destructive', 
                title: "Error", 
                description: "No security question set up." 
            });
            return;
        }

        const userAnswer = data.answer.trim().toLowerCase();
        const storedAnswer = config.affiliate.securityQuestionData.answer.trim().toLowerCase();
        
        if (userAnswer !== storedAnswer) {
            toast({ 
                variant: 'destructive', 
                title: "Incorrect Answer",
                description: "Please try again." 
            });
            return;
        }
        
        toast({ 
            title: "Answer Verified!",
            description: "Now set your new PIN." 
        });
        setResetStep(2);
    };

    // Updated to use SetNewPinFormData
    const handleResetSubmit = (data: SetNewPinFormData) => {
        onSave(data.newPin);
        toast({ 
            title: "PIN Reset Successfully!",
            description: "Your new PIN has been saved." 
        });
        setIsResetting(false);
        setResetStep(1);
        onClose();
    };
    
    if (isResetting) {
      return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setIsResetting(false); setResetStep(1); onClose(); } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset PIN</DialogTitle>
                    <DialogDescription>
                        {resetStep === 1 ? 'Answer your security question to reset your PIN.' : 'Set your new PIN.'}
                    </DialogDescription>
                </DialogHeader>
                
                {/* STEP 1: Uses answerForm */}
                {resetStep === 1 && (
                    <Form {...answerForm}>
                        <form onSubmit={answerForm.handleSubmit(handleVerifyAnswer)} className="space-y-4">
                            <div className="space-y-2">
                               <p className="text-sm font-medium">{config?.affiliate?.securityQuestionData?.question || 'No security question set'}</p>
                                <FormField control={answerForm.control} name="answer" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Answer</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your answer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2">
                                <Button type="button" variant="outline" onClick={() => {
                                    setIsResetting(false);
                                    setResetStep(1);
                                }}>Back to Login</Button>
                                <Button type="submit">Verify Answer</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
                
                {/* STEP 2: Uses newPinForm */}
                {resetStep === 2 && (
                    <Form {...newPinForm}>
                        <form onSubmit={newPinForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                            <FormField control={newPinForm.control} name="newPin" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New 4-Digit PIN</FormLabel>
                                    <FormControl>
                                        <Input type="password" maxLength={4} placeholder="Enter new PIN" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={newPinForm.control} name="confirmNewPin" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New PIN</FormLabel>
                                    <FormControl>
                                        <Input type="password" maxLength={4} placeholder="Confirm new PIN" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <DialogFooter>
                                <Button type="submit">Reset PIN</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
      )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isPinSet ? 'Change' : 'Set'} Withdrawal PIN</DialogTitle>
                    <DialogDescription>
                        This 4-digit PIN will be required for all withdrawals and credit transfers. Keep it secure.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {isPinSet && (
                           <FormField
                                control={form.control}
                                name="oldPin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Old PIN</FormLabel>
                                         <div className="relative">
                                            <FormControl>
                                                <Input type={showOldPin ? 'text' : 'password'} maxLength={4} {...field} />
                                            </FormControl>
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowOldPin(!showOldPin)}>
                                                {showOldPin ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                            </Button>
                                        </div>
                                        <FormMessage />
                                         <div className="text-right">
                                            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsResetting(true)}>Forgot PIN?</Button>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="pin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New 4-Digit PIN</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input type={showPin ? 'text' : 'password'} maxLength={4} {...field} />
                                        </FormControl>
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPin(!showPin)}>
                                            {showPin ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New PIN</FormLabel>
                                    <FormControl>
                                        <Input type="password" maxLength={4} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Save PIN</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
