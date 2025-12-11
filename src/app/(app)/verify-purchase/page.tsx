

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
import { KeyRound, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  orderId: z.string().min(1, "Order ID is required."),
});

type FormData = z.infer<typeof formSchema>;
const ADMIN_PIN_SUFFIX = '@8090';


function VerifyPurchaseContent() {
    const { getPurchaseOrder, activatePurchaseOrder, declinePurchaseOrder, acknowledgeDeclinedPurchase } = useBrandsoft();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [order, setOrder] = useState<Purchase | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActivated, setIsActivated] = useState(false);
    const [isDeclined, setIsDeclined] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            orderId: '',
        },
    });
    
    const orderIdFromUrl = searchParams.get('orderId');
    const viewOnlyMode = searchParams.get('view') === 'true';

    const handleSubmit = async (orderIdWithPin: string) => {
        setIsLoading(true);
        setError(null);
        setOrder(null);
        setIsActivated(false);
        setIsDeclined(false);
        
        let cleanOrderId = orderIdWithPin;
        if (orderIdWithPin.endsWith(ADMIN_PIN_SUFFIX)) {
            setIsAdminMode(true);
            cleanOrderId = orderIdWithPin.replace(ADMIN_PIN_SUFFIX, '');
        } else {
            setIsAdminMode(false);
        }

        await new Promise(resolve => setTimeout(resolve, 500)); 

        const foundOrder = getPurchaseOrder(cleanOrderId);

        if (foundOrder) {
            setOrder(foundOrder);
            if (foundOrder.status === 'active') {
                setIsActivated(true);
            }
            if (foundOrder.status === 'declined') {
                setIsDeclined(true);
                if (viewOnlyMode && !foundOrder.isAcknowledged) {
                  acknowledgeDeclinedPurchase(foundOrder.orderId);
                }
            }
        } else {
            setError("No purchase order found with this ID.");
        }
        setIsLoading(false);
    };


    // Automatically search if orderId is in URL
    useEffect(() => {
        if (orderIdFromUrl) {
            // No need to show form, just load data
            handleSubmit(orderIdFromUrl);
        } else {
            setIsLoading(false);
        }
    }, [orderIdFromUrl]);


    const handleActivation = () => {
        if (order) {
            activatePurchaseOrder(order.orderId);
            toast({ title: "Activation Successful", description: `Order ${order.orderId} has been activated.` });
            setIsActivated(true);
        }
    };
    
    const handleDecline = () => {
        if (order && declineReason) {
            declinePurchaseOrder(order.orderId, declineReason);
            toast({ title: "Order Declined", description: `Order ${order.orderId} has been declined.` });
            setIsDeclined(true);
        } else if (!declineReason) {
            toast({ variant: 'destructive', title: "Reason Required", description: "Please provide a reason for declining." });
        }
    };
    
    const onFormSubmit = (data: FormData) => {
        router.push(`/verify-purchase?orderId=${data.orderId}`);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-muted-foreground">Verifying order...</p>
                </div>
            );
        }

        if (order) {
             const status = isActivated ? 'active' : isDeclined ? 'declined' : order.status;
             const finalIsAdminMode = isAdminMode && !viewOnlyMode;
             
             return (
                <Card className="mt-6 border-none shadow-none">
                    <div className="flex flex-col md:flex-row gap-6">
                        {order.receipt && order.receipt !== 'none' && (
                            <div className="md:w-1/2 flex-shrink-0">
                                <h3 className="text-sm font-medium mb-2">Transaction Receipt</h3>
                                <div className="border rounded-md p-2 bg-muted/50 h-64 overflow-hidden">
                                    <Image src={order.receipt} alt="Transaction Receipt" width={400} height={400} className="rounded-md w-full h-full object-cover" />
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
                                        status === 'active' && "text-green-500",
                                        status === 'pending' && "text-amber-500",
                                        status === 'declined' && "text-destructive",
                                    )}>
                                        {status}
                                    </span>
                                </p>
                                {status === 'declined' && order.declineReason && (
                                     <Alert variant="destructive">
                                        <AlertTitle>Reason for Decline</AlertTitle>
                                        <AlertDescription>
                                            {order.declineReason}
                                             <p className="mt-2 text-xs">
                                                If you believe this is a mistake, please contact us on +265 991 972 336.
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                             {finalIsAdminMode && status === 'pending' && (
                                <CardFooter className="p-0 pt-6 flex gap-2">
                                     <AlertDialog>
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
                             {(status !== 'pending' && !finalIsAdminMode) && (
                                <CardFooter className="p-0 pt-6">
                                     <Alert variant={status === 'active' ? 'default' : 'destructive'} className={cn("w-full", status === 'active' && "bg-green-50 text-green-800 border-green-200")}>
                                        <CheckCircle className={cn("h-4 w-4", status === 'active' && "text-green-600")} />
                                        <AlertTitle>{status === 'active' ? 'Order Activated' : 'Order Declined'}</AlertTitle>
                                        <AlertDescription>
                                            {status === 'active' ? 'This order is already active.' : 'This order has been declined.'}
                                        </AlertDescription>
                                    </Alert>
                                </CardFooter>
                             )}
                        </div>
                    </div>
                </Card>
            );
        }
        
        if (error) {
             return (
                <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
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
              <Button variant="link" asChild className="mx-auto">
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
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
