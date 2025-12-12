
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBrandsoft, type Purchase } from '@/hooks/use-brandsoft';
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle, XCircle, Loader2, Download, Eye, Info } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle as ShadcnDialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  orderId: z.string().min(1, "Order ID is required."),
});

type FormData = z.infer<typeof formSchema>;
const ADMIN_PIN_SUFFIX = '@8090';


function VerifyPurchaseContent() {
    const { config, getPurchaseOrder, activatePurchaseOrder, declinePurchaseOrder, acknowledgeDeclinedPurchase } = useBrandsoft();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const orderIdFromUrl = searchParams.get('orderId');

    const [order, setOrder] = useState<Purchase | null>(null);
    const [isLoading, setIsLoading] = useState(!!orderIdFromUrl);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [progress, setProgress] = useState(0);
    const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { orderId: '' },
    });
    
     useEffect(() => {
        if (!orderIdFromUrl) {
            setIsLoading(false);
            return;
        }

        const handleSearch = async (orderIdWithPin: string) => {
            setIsLoading(true);
            setProgress(0);
            setOrder(null);
            
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev >= 90 ? 90 : prev + 10));
            }, 150);

            let cleanOrderId = orderIdWithPin;
            let isUserViewing = true;

            if (orderIdWithPin.endsWith(ADMIN_PIN_SUFFIX)) {
                setIsAdminMode(true);
                isUserViewing = false;
                cleanOrderId = orderIdWithPin.replace(ADMIN_PIN_SUFFIX, '');
            } else {
                setIsAdminMode(false);
            }

            await new Promise(resolve => setTimeout(resolve, 1500)); 

            const foundOrder = getPurchaseOrder(cleanOrderId);
            
            setOrder(foundOrder);
            
            clearInterval(progressInterval);
            setProgress(100);
            setIsLoading(false);
        };

        handleSearch(orderIdFromUrl);
    }, [orderIdFromUrl, getPurchaseOrder, config]);


    const handleDownloadReceipt = () => {
        if (!order?.receipt || order.receipt === 'none') return;
        const link = document.createElement('a');
        link.href = order.receipt;
        link.download = `receipt-${order.orderId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleActivation = () => {
        if (order) {
            activatePurchaseOrder(order.orderId);
            toast({ title: "Activation Successful", description: `Order ${order.orderId} has been activated.` });
            setOrder({ ...order, status: 'active' }); 
        }
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
        setIsLoading(true); 
        router.push(`/verify-purchase?orderId=${data.orderId}`);
    };
    
    const handleAcknowledgeAndRedirect = () => {
      if (order) {
        acknowledgeDeclinedPurchase(order.orderId);
        router.push('/dashboard');
      }
    };

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
             return (
                <div className="mt-6 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {order.receipt && order.receipt !== 'none' && (
                            <div className="md:w-1/2 flex-shrink-0">
                                <h3 className="text-sm font-medium mb-2">Transaction Receipt</h3>
                                <div className="relative group">
                                    <div className="border rounded-md p-2 bg-muted/50 h-64 overflow-hidden">
                                        <Image src={order.receipt} alt="Transaction Receipt" width={400} height={400} className="rounded-md w-full h-full object-cover" />
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
                                                 <img src={order.receipt} alt="Transaction Receipt" className="rounded-md w-full h-auto" />
                                            </DialogContent>
                                        </Dialog>
                                        <Button variant="secondary" size="icon" onClick={handleDownloadReceipt}><Download className="h-5 w-5" /></Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex-1">
                            <CardHeader className="p-0">
                                <CardTitle>Order Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 pt-4 space-y-2 text-sm">
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
                                        order.status === 'declined' && "text-destructive",
                                        order.status === 'inactive' && "text-gray-500",
                                    )}>
                                        {order.status}
                                    </span>
                                </p>
                            </CardContent>
                             {isAdminMode && order.status === 'pending' && (
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
                                        Activate Plan
                                    </Button>
                                </CardFooter>
                            )}
                        </div>
                    </div>
                     {order.status === 'declined' && order.declineReason && (
                         <Alert variant="destructive" className="mt-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <AlertTitle className="flex items-center gap-2"><XCircle className="h-4 w-4" />Order Declined</AlertTitle>
                                    <AlertDescription>
                                        <p>{order.declineReason}</p>
                                        <p className="mt-2 text-xs">
                                            If you believe this is a mistake, please contact us on +265 991 972 336.
                                        </p>
                                    </AlertDescription>
                                </div>
                                {!isAdminMode && !order.isAcknowledged && (
                                    <Button
                                        variant="outline"
                                        className="border-current text-current hover:bg-destructive/10 hover:text-current"
                                        onClick={handleAcknowledgeAndRedirect}
                                    >
                                        Understood
                                    </Button>
                                )}
                            </div>
                        </Alert>
                    )}
                </div>
            );
        }
        
        if (!orderIdFromUrl) {
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

        return null;
    }


    return (
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
            <CardFooter>
            </CardFooter>
        </Card>
    );
}


export default function VerifyPurchasePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
           <Suspense fallback={<div>Loading...</div>}>
                <VerifyPurchaseContent />
           </Suspense>
        </div>
    )
}

    