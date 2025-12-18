
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, UploadCloud, FileCheck, Building2, Smartphone, Banknote, Wallet } from 'lucide-react';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


export type PlanDetails = {
    name: string; // Changed from Plan type to string to be more flexible
    price: string;
    period: string;
    affiliateId?: string;
}

interface PurchaseDialogProps {
  plan: PlanDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isTopUp?: boolean;
}

const defaultPaymentMethods = [
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

const iconMap: Record<string, React.ElementType> = {
    airtel: Smartphone,
    tnm: Smartphone,
    bank: Banknote,
    default: Building2,
};

export function PurchaseDialog({ plan, isOpen, onClose, onSuccess, isTopUp = false }: PurchaseDialogProps) {
    const { config, addPurchaseOrder, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
    const [purchaseState, setPurchaseState] = useState<'idle' | 'processing' | 'success'>('idle');
    const [orderId, setOrderId] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [saveWhatsapp, setSaveWhatsapp] = useState(false);

    const clientReferredBy = useMemo(() => {
        const myCompany = config?.companies.find(c => c.companyName === config?.brand.businessName);
        return myCompany?.referredBy || null;
    }, [config]);

    const { methods: paymentMethods, number: affiliateWhatsappNumber } = useMemo(() => {
        const brandsoftNumber = '265991972336';
        if (!clientReferredBy || clientReferredBy === 'BRANDSOFT-ADMIN') {
            return { methods: defaultPaymentMethods, number: brandsoftNumber };
        }

        // Simplification for demo. In a real app, you'd find the affiliate by staffId.
        const affiliate = config?.affiliate;
        if (!affiliate || !affiliate.withdrawalMethods) {
            return { methods: defaultPaymentMethods, number: brandsoftNumber };
        }
        
        const affiliateMethods = [];
        
        if (affiliate.withdrawalMethods.airtel?.isClientPaymentMethod) {
            affiliateMethods.push({
                id: 'airtel', name: 'Airtel Money',
                details: [{ label: 'Name', value: affiliate.withdrawalMethods.airtel.name }, { label: 'Number', value: affiliate.withdrawalMethods.airtel.phone }]
            });
        }
        if (affiliate.withdrawalMethods.tnm?.isClientPaymentMethod) {
             affiliateMethods.push({
                id: 'tnm', name: 'TNM Mpamba',
                details: [{ label: 'Name', value: affiliate.withdrawalMethods.tnm.name }, { label: 'Number', value: affiliate.withdrawalMethods.tnm.phone }]
            });
        }
        if (affiliate.withdrawalMethods.bank?.isClientPaymentMethod) {
             affiliateMethods.push({
                id: 'bank', name: 'Bank Transfer',
                details: [
                    { label: 'Bank', value: affiliate.withdrawalMethods.bank.bankName }, 
                    { label: 'Acc Name', value: config?.affiliate?.fullName || '' }, 
                    { label: 'Acc #', value: affiliate.withdrawalMethods.bank.accountNumber }
                ]
            });
        }

        const finalMethods = affiliateMethods.length > 0 ? affiliateMethods : defaultPaymentMethods;
        const finalNumber = affiliate.phone ? affiliate.phone.replace(/\+/g, '') : brandsoftNumber;

        return { methods: finalMethods, number: finalNumber };
    }, [clientReferredBy, config]);

    useEffect(() => {
        if (isOpen && config?.profile.phone) {
            setWhatsappNumber(config.profile.phone);
        }
    }, [isOpen, config]);


    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setReceiptFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptDataUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setReceiptDataUrl(null);
        }
    };
    
    const balance = config?.profile.walletBalance || 0;
    const priceAmount = parseFloat(plan.price.replace(/[^0-9.-]+/g,""));
    const canAffordWithWallet = balance >= priceAmount;

    const handleConfirmPurchase = () => {
        if (!selectedPayment) {
            toast({ variant: 'destructive', title: 'Payment Method Required', description: 'Please select a payment method.' });
            return;
        }

        if (selectedPayment !== 'wallet' && !receiptFile) {
            toast({ variant: 'destructive', title: 'Receipt Required', description: 'Please upload your transaction receipt for manual payments.' });
            return;
        }

        if (!whatsappNumber) {
            toast({ variant: 'destructive', title: 'WhatsApp Number Required', description: 'Please enter your WhatsApp number.' });
            return;
        }
        
        if (selectedPayment === 'wallet' && !canAffordWithWallet) {
            toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is not enough for this purchase.' });
            return;
        }

        setPurchaseState('processing');

        setTimeout(() => { // Simulate processing
            const newOrderId = `BSO-${Date.now()}`;
            setOrderId(newOrderId);
            
            const myCompany = config?.companies.find(c => c.companyName === config?.brand.businessName);
            
            const newOrder = {
                orderId: newOrderId,
                planName: plan.name,
                planPrice: plan.price,
                planPeriod: plan.period,
                paymentMethod: selectedPayment,
                status: selectedPayment === 'wallet' ? 'active' as const : 'pending' as const,
                date: new Date().toISOString(),
                receipt: receiptDataUrl || 'none',
                whatsappNumber: whatsappNumber,
                customerId: myCompany?.id,
                affiliateId: plan.affiliateId,
            };
            
            if (selectedPayment === 'wallet') {
                const newBalance = balance - priceAmount;
                saveConfig({ ...config!, profile: { ...config!.profile, walletBalance: newBalance }, purchases: [...(config!.purchases || []), newOrder]}, {redirect: false});
            } else {
                addPurchaseOrder(newOrder);
                 const message = `*Please Activate My New Order!*
%0A%0AOrder ID: ${newOrderId}
%0APlan: ${plan.name} (${plan.period})
%0APrice: ${plan.price}
%0APayment Method: ${selectedPayment}
%0AUser WhatsApp: ${whatsappNumber}
%0A%0AView Status: ${window.location.origin}/verify-purchase?orderId=${newOrderId}
%0A%0AMy regards`;
                window.open(`https://wa.me/${affiliateWhatsappNumber}?text=${message}`, '_blank');
            }


            if (saveWhatsapp && config && config.profile.phone !== whatsappNumber) {
                saveConfig({
                    ...config,
                    profile: { ...config.profile, phone: whatsappNumber }
                }, { redirect: false, revalidate: false });
            }
            
            setPurchaseState('success');
        }, 1500);
    };
    
    const isConfirmDisabled = purchaseState !== 'idle' || !selectedPayment || !whatsappNumber || (selectedPayment !== 'wallet' && !receiptFile) || (selectedPayment === 'wallet' && !canAffordWithWallet);

    const handleDialogClose = () => {
        if (purchaseState !== 'processing') {
            if (purchaseState === 'success') {
                onSuccess();
            } else {
                onClose();
            }
            setPurchaseState('idle');
            setReceiptFile(null);
            setSelectedPayment(null);
            setWhatsappNumber('');
            setSaveWhatsapp(false);
        }
    };
    
    const StepIndicator = ({ step, label, isComplete }: { step: number, label: string, isComplete: boolean }) => (
        <div className="flex items-center gap-2">
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold", isComplete ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")}>
                {isComplete ? <FileCheck className="h-4 w-4" /> : step}
            </div>
            <span className={cn("text-sm", isComplete && "text-muted-foreground line-through")}>{label}</span>
        </div>
    );
    
    const orderSummaryTitle = plan.name.startsWith('Activation Key') ? 'Activation Key Purchase' : plan.name;


    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
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
                        <p className="text-muted-foreground">Your order <code className="bg-muted px-2 py-1 rounded-md">{orderId}</code> is {selectedPayment === 'wallet' ? 'complete' : 'pending approval'}. You will be notified once your plan is activated.</p>
                        <Button onClick={handleDialogClose}>Close</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Item:</span> <strong>{orderSummaryTitle}</strong></div>
                                    {!isTopUp && <div className="flex justify-between"><span className="text-muted-foreground">Period:</span> <strong>{plan.period}</strong></div>}
                                    <div className="flex justify-between font-bold text-lg"><span className="text-muted-foreground">Total:</span> <span>{plan.price}</span></div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <StepIndicator step={1} label="Enter WhatsApp Number" isComplete={!!whatsappNumber} />
                                <StepIndicator step={2} label="Select Payment Method" isComplete={!!selectedPayment} />
                                <StepIndicator step={3} label={selectedPayment === 'wallet' ? "Confirm" : "Upload Receipt"} isComplete={selectedPayment === 'wallet' ? true : !!receiptFile} />
                                <StepIndicator step={4} label="Confirm Purchase" isComplete={purchaseState === 'success'} />
                            </div>

                             {!plan.name.startsWith('Activation Key') && (
                                <div className="flex items-center space-x-2 pt-4">
                                    <Checkbox id="save-whatsapp" checked={saveWhatsapp} onCheckedChange={(checked) => setSaveWhatsapp(checked as boolean)} />
                                    <label htmlFor="save-whatsapp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Save my number for future purchases
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Payment Method</h3>
                             <Accordion type="single" collapsible value={selectedPayment || ""} onValueChange={setSelectedPayment}>
                                {!isTopUp && (
                                    <AccordionItem value="wallet">
                                        <AccordionTrigger
                                            className={cn(
                                                "hover:no-underline p-3 rounded-md",
                                                selectedPayment === 'wallet' && "bg-primary/10 text-primary hover:bg-primary/20",
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Wallet className="h-5 w-5"/>
                                                <span>Pay with Wallet</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-3 space-y-2 text-sm border-t">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Available Balance:</span>
                                                <span className="font-bold">K{balance.toLocaleString()}</span>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                {paymentMethods.map(method => {
                                    const Icon = iconMap[method.id] || iconMap.default;
                                    return (
                                        <AccordionItem value={method.id} key={method.id}>
                                            <AccordionTrigger className={cn("hover:no-underline p-3 rounded-md", selectedPayment === method.id && "bg-primary/10 text-primary hover:bg-primary/20")}>
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-5 w-5"/>
                                                    <span>{method.name}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-3 space-y-2 text-sm border-t">
                                                {method.details.map(detail => (
                                                    <div key={detail.label} className="flex justify-between">
                                                        <span className="text-muted-foreground">{detail.label}:</span>
                                                        <span className="font-mono">{detail.value}</span>
                                                    </div>
                                                ))}
                                                <div className="pt-4">
                                                    <label htmlFor={`receipt-upload-${method.id}`} className={cn("w-full cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 text-sm hover:bg-muted", receiptFile && selectedPayment === method.id && "border-green-500 bg-green-50 text-green-700")}>
                                                        {receiptFile && selectedPayment === method.id ? <FileCheck className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                                                        {receiptFile && selectedPayment === method.id ? receiptFile.name : "Upload Transaction Receipt"}
                                                    </label>
                                                    <Input id={`receipt-upload-${method.id}`} type="file" className="hidden" onChange={handleReceiptUpload} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
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
