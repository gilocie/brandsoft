
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle, Circle, Loader2, UploadCloud, FileCheck } from 'lucide-react';
import { PlanDetails } from './manage-plan-dialog';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PurchaseDialogProps {
  plan: PlanDetails;
  isOpen: boolean;
  onClose: () => void;
}

const paymentMethods = [
    {
        id: 'bank',
        name: 'National Bank',
        details: [
            { label: "Account Number", value: "1006067057" },
            { label: "Name", value: "Gift Ilocie" },
            { label: "Branch", value: "Victoria Avenue" },
        ]
    },
    {
        id: 'airtel',
        name: 'Airtel Money',
        details: [
            { label: "Number", value: "+265 991 972 336" },
            { label: "Name", value: "Gift Ilocie" },
        ]
    },
    {
        id: 'tnm',
        name: 'TNM Mpamba',
        details: [
            { label: "Number", value: "+265 888 333 673" },
            { label: "Name", value: "Tamandani Tibula" },
        ]
    }
];

export function PurchaseDialog({ plan, isOpen, onClose }: PurchaseDialogProps) {
    const { addPurchaseOrder } = useBrandsoft();
    const { toast } = useToast();
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [purchaseState, setPurchaseState] = useState<'idle' | 'processing' | 'success'>('idle');
    const [orderId, setOrderId] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');


    const handleConfirmPurchase = () => {
        if (!selectedPayment) {
            toast({ variant: 'destructive', title: 'Payment Method Required', description: 'Please select a payment method.' });
            return;
        }
        if (selectedPayment === 'airtel' && !receiptFile) {
            toast({ variant: 'destructive', title: 'Receipt Required', description: 'Please upload your transaction receipt for Airtel Money.' });
            return;
        }
        if (!whatsappNumber) {
            toast({ variant: 'destructive', title: 'WhatsApp Number Required', description: 'Please enter your WhatsApp number.' });
            return;
        }


        setPurchaseState('processing');

        setTimeout(() => { // Simulate processing
            const newOrderId = `BSO-${Date.now()}`;
            setOrderId(newOrderId);
            addPurchaseOrder({
                orderId: newOrderId,
                planName: plan.name,
                planPrice: plan.price,
                planPeriod: plan.period,
                paymentMethod: selectedPayment,
                status: 'pending',
                date: new Date().toISOString(),
                receipt: receiptFile ? 'uploaded' : 'none',
            });

            // Trigger admin notification
            const message = `New BrandSoft Order!%0A%0AOrder ID: ${newOrderId}%0APlan: ${plan.name} (${plan.period})%0APrice: ${plan.price}%0APayment Method: ${selectedPayment}%0AUser WhatsApp: ${whatsappNumber}%0A%0AView Status: ${window.location.origin}/verify-purchase?orderId=${newOrderId}%0A(Add @8090 to the Order ID in the URL to activate)`;
            window.open(`https://wa.me/265991972336?text=${message}`, '_blank');
            
            setPurchaseState('success');
        }, 1500);
    };
    
    const isConfirmDisabled = purchaseState !== 'idle' || !selectedPayment || !whatsappNumber || (selectedPayment === 'airtel' && !receiptFile);

    const handleClose = () => {
        if (purchaseState !== 'processing') {
            setPurchaseState('idle');
            setReceiptFile(null);
            setSelectedPayment(null);
            setWhatsappNumber('');
            onClose();
        }
    };
    
    const StepIndicator = ({ step, label, isComplete }: { step: number, label: string, isComplete: boolean }) => (
        <div className="flex items-center gap-2">
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold", isComplete ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")}>
                {isComplete ? <Check className="h-4 w-4" /> : step}
            </div>
            <span className={cn("text-sm", isComplete && "text-muted-foreground line-through")}>{label}</span>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                 <DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle>Complete Your Purchase</DialogTitle>
                    </div>
                    <div className="w-full max-w-[200px]">
                        <Label htmlFor="whatsapp-number" className="sr-only">WhatsApp Number</Label>
                        <Input
                            id="whatsapp-number"
                            placeholder="Your WhatsApp Number"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                        />
                    </div>
                </DialogHeader>

                {purchaseState === 'success' ? (
                     <div className="py-10 text-center space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <h2 className="text-2xl font-bold">Purchase Successful!</h2>
                        <p className="text-muted-foreground">Your order <code className="bg-muted px-2 py-1 rounded-md">{orderId}</code> is pending approval. You will be notified once your plan is activated.</p>
                        <Button onClick={handleClose}>Close</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        {/* Left Side: Summary & Status */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Plan:</span> <strong>{plan.name}</strong></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Period:</span> <strong>{plan.period}</strong></div>
                                    <div className="flex justify-between font-bold text-lg"><span className="text-muted-foreground">Total:</span> <span>{plan.price}</span></div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <StepIndicator step={1} label="Enter WhatsApp Number" isComplete={!!whatsappNumber} />
                                <StepIndicator step={2} label="Select Payment Method" isComplete={!!selectedPayment} />
                                <StepIndicator step={3} label="Confirm Purchase" isComplete={purchaseState === 'success'} />
                            </div>
                        </div>

                        {/* Right Side: Payment Details */}
                        <div className="space-y-4">
                            <h3 className="font-semibold">Payment Method</h3>
                             <Accordion type="single" collapsible value={selectedPayment || ""} onValueChange={setSelectedPayment}>
                                {paymentMethods.map(method => (
                                    <AccordionItem value={method.id} key={method.id}>
                                        <AccordionTrigger className={cn("hover:no-underline p-3 rounded-md", selectedPayment === method.id && "bg-primary/10 text-primary hover:bg-primary/20")}>
                                            {method.name}
                                        </AccordionTrigger>
                                        <AccordionContent className="p-3 space-y-2 text-sm border-t">
                                             {method.details.map(detail => (
                                                <div key={detail.label} className="flex justify-between">
                                                    <span className="text-muted-foreground">{detail.label}:</span>
                                                    <span className="font-mono">{detail.value}</span>
                                                </div>
                                            ))}
                                            {method.id === 'airtel' && (
                                                <div className="pt-4">
                                                    <label htmlFor="receipt-upload" className={cn("w-full cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 text-sm hover:bg-muted", receiptFile && "border-green-500 bg-green-50 text-green-700")}>
                                                        {receiptFile ? <FileCheck className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                                                        {receiptFile ? receiptFile.name : "Upload Transaction Receipt"}
                                                    </label>
                                                    <Input id="receipt-upload" type="file" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                             <Button className="w-full" disabled={isConfirmDisabled} onClick={handleConfirmPurchase}>
                                {purchaseState === 'processing' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Confirm Purchase
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
