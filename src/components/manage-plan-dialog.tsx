
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PlanCard = ({ title, price, features, isCurrent = false, cta }: { title: string, price: string, features: string[], isCurrent?: boolean, cta: string }) => (
    <Card className={cn("flex flex-col", isCurrent && "ring-2 ring-primary")}>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="text-4xl font-bold">{price}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
            {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
            ))}
        </CardContent>
        <div className="p-6 pt-0">
             <Button className="w-full" disabled={isCurrent}>{isCurrent ? 'Current Plan' : cta}</Button>
        </div>
    </Card>
);

export function ManagePlanDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-4">
                    Manage
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-headline">Manage Your Plan</DialogTitle>
                    <DialogDescription>
                        Choose the plan that best fits your business needs.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
                    <PlanCard 
                        title="Free Trial" 
                        price="$0"
                        features={["Up to 10 invoices", "Up to 10 customers", "Basic templates"]}
                        isCurrent={true}
                        cta="Select Plan"
                    />
                     <PlanCard 
                        title="Standard" 
                        price="$29"
                        features={["Unlimited invoices", "Unlimited customers", "Premium templates", "Email support"]}
                        cta="Upgrade"
                    />
                     <PlanCard 
                        title="Pro" 
                        price="$79"
                        features={["All Standard features", "API access", "Priority support", "Advanced analytics"]}
                        cta="Upgrade"
                    />
                     <PlanCard 
                        title="Enterprise" 
                        price="Custom"
                        features={["All Pro features", "Dedicated support", "Custom integrations", "On-premise option"]}
                        cta="Contact Us"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
