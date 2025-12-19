

'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBrandsoft, type Purchase } from '@/hooks/use-brandsoft';
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle, XCircle, Loader2, Download, Eye, Info, Wallet, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle as ShadcnDialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { getReceiptFromDB } from '@/hooks/use-receipt-upload';


const formSchema = z.object({
  orderId: z.string().min(1, "Order ID is required."),
});

type FormData = z.infer<typeof formSchema>;
const ADMIN_PIN_SUFFIX = '@8090';

const topUpActivationSchema = z.object({
    creditsToSell: z.coerce.number().min(1, 'Must sell at least 1 credit.'),
    pin: z.string().optional(),
});
type TopUpActivationFormData = z.infer<typeof topUpActivationSchema>;


const TopUpActivationDialog = ({
    order,
    isOpen,
    onClose,
    onConfirm,
    affiliateCreditBalance,
    affiliatePin,
    isPinSet,
}: {
    order: Purchase,
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (credits: number) => void,
    affiliateCreditBalance: number,
    affiliatePin?: string;
    isPinSet?: boolean;
}) => {
    const { config } = useBrandsoft();
    const { toast } = useToast();
    const exchangeValue = config?.admin?.exchangeValue || 1000;
    const suggestedCredits = parseFloat(order.planPrice.replace(/[^0-9.-]+/g,"")) / exchangeValue;
    const [step, setStep] = useState(1);

    const form = useForm<TopUpActivationFormData>({
        resolver: zodResolver(topUpActivationSchema),
        defaultValues: { creditsToSell: suggestedCredits, pin: '' }
    });

    const creditsToSell = form.watch('creditsToSell');
    const hasEnoughCredits = affiliateCreditBalance >= creditsToSell;
    const remainingBalance = affiliateCreditBalance - creditsToSell;

    const handleNextStep = async () => {
        const isValid = await form.trigger(['creditsToSell']);
        if (isValid) {
            if (!isPinSet) {
                 toast({
                    variant: 'destructive',
                    title: "PIN Not Set",
                    description: "Please set your withdrawal PIN in 'My Features' before selling credits.",
                });
                return;
            }
            setStep(2);
        }
    }
    
    const handleConfirmSubmit = (data: TopUpActivationFormData) => {
        if (!data.pin || data.pin !== affiliatePin) {
            form.setError('pin', { message: 'The entered PIN is incorrect.' });
            return;
        }
        onConfirm(data.creditsToSell);
    };
    
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                form.reset({ creditsToSell: suggestedCredits, pin: ''});
                setStep(1);
            }, 200);
        }
    }, [isOpen, form, suggestedCredits]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <ShadcnDialogTitle>
                         {step === 1 ? 'Confirm Credit Sale' : 'Enter PIN to Confirm'}
                    </ShadcnDialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {step === 1
                            ? 'Confirm the amount of BS Credits being sold for this top-up.'
                            : 'Enter your 4-digit PIN to authorize this transaction.'}
                    </p>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <Form {...form}>
                        <form id="topup-activation-form" onSubmit={form.handleSubmit(handleConfirmSubmit)}>
                           {step === 1 && (
                                <div className="space-y-4">
                                     <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                                        <p className="text-sm text-muted-foreground">Client Paid</p>
                                        <p className="text-2xl font-bold">{order.planPrice}</p>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="creditsToSell"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>BS Credits to Sell</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    {!hasEnoughCredits
                                                        ? <span className="text-destructive">Your current credit balance is BS {affiliateCreditBalance.toLocaleString()}. Please add more before continuing.</span>
                                                        : `Your balance will be BS ${remainingBalance.toLocaleString()} after this sale.`
                                                    }
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                                        <Button type="button" disabled={!hasEnoughCredits} onClick={handleNextStep}>Proceed to PIN</Button>
                                    </DialogFooter>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                     <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                                        <p className="text-sm text-muted-foreground">Selling <strong className="text-primary">{creditsToSell.toLocaleString()} BS Credits</strong> for</p>
                                        <p className="text-2xl font-bold">{order.planPrice}</p>
                                    </div>
                                     <FormField
                                        control={form.control}
                                        name="pin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>4-Digit PIN</FormLabel>
                                                <FormControl>
                                                    <Input type="password" maxLength={4} className="text-center font-bold tracking-[1rem]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                                        <Button type="submit">Confirm &amp; Activate</Button>
                                    </DialogFooter>
                                </div>
                            )}
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
};


function VerifyPurchaseContent() {
    const { config, getPurchaseOrder, activatePurchaseOrder, declinePurchaseOrder, acknowledgeDeclinedPurchase, addCreditPurchaseToAffiliate } = useBrandsoft();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const orderIdFromUrl = searchParams.get('orderId');

    const [order, setOrder] = useState<Purchase | null>(null);
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!!orderIdFromUrl);
    const [declineReason, setDeclineReason] = useState('');
    const [progress, setProgress] = useState(0);
    const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
    const [isTopUpActivationOpen, setIsTopUpActivationOpen] = useState(false);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { orderId: orderIdFromUrl || '' },
    });
    
     const handleSearch = useCallback(async (orderIdToSearch: string, silent = false) => {
        if (!orderIdToSearch) {
            setIsLoading(false);
            setOrder(null);
            return;
        }

        if (!silent) {
            setIsLoading(true);
            setProgress(0);
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev >= 90 ? 90 : prev + 10));
            }, 150);
            await new Promise(resolve => setTimeout(resolve, 1500));
            clearInterval(progressInterval);
        }

        const foundOrder = getPurchaseOrder(orderIdToSearch);
        setOrder(foundOrder);

        if (foundOrder?.receipt === 'indexed-db') {
            const image = await getReceiptFromDB(foundOrder.orderId);
            setReceiptImage(image);
        } else {
            setReceiptImage(null);
        }
        
        if (!silent) {
            setProgress(100);
            setIsLoading(false);
        }
    }, [getPurchaseOrder]);


    useEffect(() => {
        if (orderIdFromUrl) {
            form.setValue('orderId', orderIdFromUrl);
            handleSearch(orderIdFromUrl);
        } else {
             setOrder(null);
             setIsLoading(false);
        }
    }, [orderIdFromUrl, form, handleSearch]);

     useEffect(() => {
        if (order?.status === 'declined' && !order.isAcknowledged) return;
        if (order?.status === 'active') return;

        const forceRefresh = () => {
             if (orderIdFromUrl) {
                handleSearch(orderIdFromUrl, true);
             }
        };

        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'brandsoft-config' || e.key === null) {
            forceRefresh();
          }
        };

        const handleCustomUpdate = () => {
          forceRefresh();
        };

        const handleVisibilityChange = () => {
          if (!document.hidden) {
            forceRefresh();
          }
        };

        const handleFocus = () => {
          forceRefresh();
        };

        const pollInterval = setInterval(forceRefresh, 2000);

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('brandsoft-update', handleCustomUpdate);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
          clearInterval(pollInterval);
          window.removeEventListener('storage', handleStorageChange);
          window.removeEventListener('brandsoft-update', handleCustomUpdate);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', handleFocus);
        };
      }, [orderIdFromUrl, handleSearch, order]);


    const handleDownloadReceipt = () => {
        if (!receiptImage) return;
        const link = document.createElement('a');
        link.href = receiptImage;
        link.download = `receipt-${order?.orderId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleActivation = () => {
        if (order) {
            if (order.planName.startsWith('Credit Purchase') || order.planName === 'Wallet Top-up') {
                setIsTopUpActivationOpen(true);
            } else {
                activatePurchaseOrder(order.orderId);
                toast({ title: "Activation Successful", description: `Order ${order.orderId} has been activated.` });
                setOrder({ ...order, status: 'active' }); 
            }
        }
    };

    const handleConfirmTopUpActivation = (creditsToSell: number) => {
        if (!order || !config?.affiliate) return;
        
        addCreditPurchaseToAffiliate(creditsToSell, order.orderId);
        
        toast({
            title: "Top-Up Activated!",
            description: `${creditsToSell} credits sold and order ${order.orderId} is complete.`,
        });

        setIsTopUpActivationOpen(false);
        setOrder({ ...order, status: 'active' }); 
    };
    
    const handleDecline = () => {
        if (order && declineReason) {
            declinePurchaseOrder(order.orderId, declineReason);
            toast({ title: "Order Declined", description: `Order ${order.orderId} has been declined.` });
            setOrder({ ...order, status: 'declined', declineReason: declineReason });
            setDeclineDialogOpen(false);
        } else if (!declineReason) {
            toast({ variant: 'destructive', title: "Reason Required", description: "Please provide a reason for declining." });
        }
    };
    
    const onFormSubmit = (data: FormData) => {
        router.push(`/office/verify-purchase?orderId=${data.orderId}`);
    };
    
    const handleAcknowledgeAndRedirect = () => {
      if (order) {
        acknowledgeDeclinedPurchase(order.orderId);
        setTimeout(() => {
            router.push('/office/orders');
        }, 100);
      }
    };
    
    const affiliateCreditBalance = config?.affiliate?.creditBalance || 0;
    const affiliatePin = config?.affiliate?.pin;
    const isPinSet = config?.affiliate?.isPinSet;

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="mt-4 space-y-4">
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                        <Info className="h-4 w-4 text-blue-600 animate-pulse" />
                        <AlertTitle>Verifying Purchase</AlertTitle>
                        <AlertDescription>
                            Please wait while we look up order details for <strong>{orderIdFromUrl?.replace(ADMIN_PIN_SUFFIX, '')}</strong>...
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-1">
                        <Progress value={progress} className="w-full h-2" />
                        <p className="text-xs text-muted-foreground text-center">Searching database...</p>
                    </div>
                </div>
            );
        }

        if (!isLoading && orderIdFromUrl && !order) {
            return (
                <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Not Found</AlertTitle>
                    <AlertDescription>
                        No purchase order found with ID: <strong>{orderIdFromUrl?.replace(ADMIN_PIN_SUFFIX, '')}</strong>. Please check the ID and try again.
                    </AlertDescription>
                </Alert>
            );
        }

        if (order) {
            const isTopUp = order.planName.startsWith('Credit Purchase') || order.planName === 'Wallet Top-up';
            const isActionable = order.status === 'pending' || order.status === 'processing';

             return (
                <div className="mt-6 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {receiptImage ? (
                            <div className="md:w-1/2 flex-shrink-0">
                                <h3 className="text-sm font-medium mb-2">Transaction Receipt</h3>
                                <div className="relative group">
                                    <div className="border rounded-md p-2 bg-muted/50 h-64 overflow-hidden">
                                        <Image src={receiptImage} alt="Transaction Receipt" width={400} height={400} className="rounded-md w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="secondary" size="icon"><Eye className="h-5 w-5" /></Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                    <ShadcnDialogTitle>Transaction Receipt</ShadcnDialogTitle>
                                                </DialogHeader>
                                                 <img src={receiptImage} alt="Transaction Receipt" className="rounded-md w-full h-auto" />
                                            </DialogContent>
                                        </Dialog>
                                        <Button variant="secondary" size="icon" onClick={handleDownloadReceipt}><Download className="h-5 w-5" /></Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="md:w-1/2 flex-shrink-0 flex items-center justify-center h-64 border-2 border-dashed rounded-md bg-muted/30">
                                <p className="text-sm text-muted-foreground">No receipt was uploaded.</p>
                             </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <CardHeader className="p-0">
                                <CardTitle>Order Details</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow p-0 pt-4 space-y-2 text-sm">
                                <p className="flex justify-between"><strong>Order ID:</strong> <span>{order.orderId}</span></p>
                                <p className="flex justify-between"><strong>Plan:</strong> <span>{order.planName} ({order.planPeriod})</span></p>
                                <p className="flex justify-between"><strong>Price:</strong> <span>{order.planPrice}</span></p>
                                <p className="flex justify-between"><strong>Payment:</strong> <span className="capitalize">{order.paymentMethod}</span></p>
                                <p className="flex justify-between"><strong>Date:</strong> <span>{new Date(order.date).toLocaleString()}</span></p>
                                <p className="flex justify-between items-center"><strong>Status:</strong> 
                                    <span className={cn(
                                        "font-bold capitalize", 
                                        order.status === 'active' && "text-green-500",
                                        order.status === 'pending' && "text-amber-500",
                                        order.status === 'processing' && "text-blue-500",
                                        order.status === 'declined' && "text-destructive",
                                        order.status === 'inactive' && "text-gray-500",
                                    )}>
                                        {order.status}
                                    </span>
                                </p>
                            </CardContent>
                             {isActionable && (
                                <CardFooter className="p-0 pt-6 flex gap-2">
                                     <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full">Decline</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Decline Order {order.orderId}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Please provide a short reason for declining this order. This will be shown to the customer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <Textarea 
                                                placeholder="e.g., Incorrect amount, receipt unclear..."
                                                value={declineReason}
                                                onChange={(e) => setDeclineReason(e.target.value)}
                                            />
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDecline} disabled={!declineReason}>
                                                    Confirm Decline
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button className="w-full" onClick={handleActivation}>
                                        {isTopUp ? 'Activate Top Up' : 'Activate Plan'}
                                    </Button>
                                </CardFooter>
                            )}
                        </div>
                    </div>
                     {order.status === 'declined' && order.declineReason && (
                         <Alert variant="destructive" className="mt-4 bg-white text-destructive">
                            <div className="flex justify-between items-start">
                                <div>
                                    <AlertTitle className="flex items-center gap-2"><XCircle className="h-4 w-4" />Order Declined</AlertTitle>
                                    <AlertDescription>
                                        <p>{order.declineReason}</p>
                                        <p className="mt-2 text-xs">
                                            If you believe this is a mistake, please contact us.
                                        </p>
                                    </AlertDescription>
                                </div>
                            </div>
                        </Alert>
                    )}
                </div>
            );
        }
        
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onFormSubmit)} className="flex items-end gap-2">
                    <FormField
                        control={form.control}
                        name="orderId"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormLabel>Order ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="BSO-..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                </form>
            </Form>
        );
    }


    return (
        <>
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-6 w-6 text-primary" />
                        {order ? 'Purchase Status' : 'Verify Purchase Order'}
                    </CardTitle>
                    <CardDescription>
                         {order
                            ? 'Here are the details for the purchase order.'
                            : 'Enter the Order ID to view status or activate a purchase.'
                         }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
                {order && (
                    <CardFooter>
                        <Button asChild variant="outline">
                            <Link href={'/office/orders'}><Wallet className="mr-2 h-4 w-4" /> Return to Orders</Link>
                        </Button>
                    </CardFooter>
                )}
            </Card>
             {order && (
                <TopUpActivationDialog
                    order={order}
                    isOpen={isTopUpActivationOpen}
                    onClose={() => setIsTopUpActivationOpen(false)}
                    onConfirm={handleConfirmTopUpActivation}
                    affiliateCreditBalance={affiliateCreditBalance}
                    affiliatePin={affiliatePin}
                    isPinSet={isPinSet}
                />
            )}
        </>
    );
}


export default function OfficeVerifyPurchasePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
           <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                <VerifyPurchaseContent />
           </Suspense>
        </div>
    )
}
