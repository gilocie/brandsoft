
'use client';

import { useState, useEffect, useMemo } from 'react';
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

const formSchema = z.object({
  orderId: z.string().min(1, "Order ID is required."),
});

type FormData = z.infer<typeof formSchema>;
const ADMIN_PIN = '8090';

export default function VerifyPurchasePage() {
    const { getPurchaseOrder, activatePurchaseOrder } = useBrandsoft();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [order, setOrder] = useState<Purchase | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isActivated, setIsActivated] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            orderId: searchParams.get('orderId') || '',
        },
    });

    const handleSubmit = async (orderId: string) => {
        setIsLoading(true);
        setError(null);
        setOrder(null);
        setIsActivated(false);

        await new Promise(resolve => setTimeout(resolve, 500)); 

        const foundOrder = getPurchaseOrder(orderId);

        if (foundOrder) {
            setOrder(foundOrder);
            if (foundOrder.status === 'active') {
                setIsActivated(true);
            }
        } else {
            setError("No purchase order found with this ID.");
        }
        setIsLoading(false);
    };

    // Automatically search if orderId is in URL
    useEffect(() => {
        const orderIdFromUrl = searchParams.get('orderId');
        const pinFromUrl = searchParams.get('pin');

        if (pinFromUrl === ADMIN_PIN) {
            setIsAdminMode(true);
        }

        if (orderIdFromUrl) {
            form.setValue('orderId', orderIdFromUrl);
            handleSubmit(orderIdFromUrl);
        }
    }, [searchParams]);


    const handleActivation = () => {
        if (order) {
            activatePurchaseOrder(order.orderId);
            toast({ title: "Activation Successful", description: `Order ${order.orderId} has been activated.` });
            setIsActivated(true);
        }
    };
    
    const onFormSubmit = (data: FormData) => {
        router.push(`/verify-purchase?orderId=${data.orderId}${isAdminMode ? `&pin=${ADMIN_PIN}`: ''}`);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
            <Card className="w-full max-w-lg">
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
                    {!order && (
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
                    )}

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {isLoading && !order && (
                        <div className="flex justify-center items-center h-24">
                           <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}


                    {order && (
                        <Card className="mt-6 border-none shadow-none">
                            <CardHeader className="p-0">
                                <CardTitle>Order Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 pt-4 space-y-2 text-sm">
                                <p className="flex justify-between"><strong>Order ID:</strong> <span>{order.orderId}</span></p>
                                <p className="flex justify-between"><strong>Plan:</strong> <span>{order.planName} ({order.planPeriod})</span></p>
                                <p className="flex justify-between"><strong>Price:</strong> <span>{order.planPrice}</span></p>
                                <p className="flex justify-between"><strong>Payment:</strong> <span className="capitalize">{order.paymentMethod}</span></p>
                                <p className="flex justify-between"><strong>Date:</strong> <span>{new Date(order.date).toLocaleString()}</span></p>
                                <p className="flex justify-between items-center"><strong>Status:</strong> <span className={cn("font-bold capitalize", isActivated ? "text-green-500" : "text-amber-500")}>{isActivated ? 'Active' : order.status}</span></p>
                            </CardContent>
                            {isAdminMode && (
                                <CardFooter className="p-0 pt-6">
                                    {isActivated ? (
                                        <Alert variant="default" className="w-full bg-green-50 text-green-800 border-green-200">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <AlertTitle>Already Activated</AlertTitle>
                                            <AlertDescription>This order has already been activated.</AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Button className="w-full" onClick={handleActivation}>
                                            Activate Plan
                                        </Button>
                                    )}
                                </CardFooter>
                            )}
                        </Card>
                    )}
                </CardContent>
                <CardFooter>
                  <Button variant="link" asChild className="mx-auto">
                    <Link href="/dashboard">Return to Dashboard</Link>
                  </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
