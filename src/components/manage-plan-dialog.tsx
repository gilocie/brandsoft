
'use client';

import { useState, useMemo } from 'react';
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
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const PlanCard = ({ title, price, features, isCurrent = false, cta, className }: { title: string, price: string, features: string[], isCurrent?: boolean, cta: string, className?: string }) => (
    <Card className={cn("flex flex-col h-full", isCurrent && "ring-2 ring-primary shadow-md", className)}>
        <CardHeader className="p-4 pb-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="text-4xl sm:text-3xl font-bold pt-2">
                {price}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 p-4 pt-0">
            {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
            ))}
        </CardContent>
        <div className="p-4 pt-0">
             <Button 
                className="w-full" 
                variant={isCurrent ? "secondary" : "default"}
                disabled={isCurrent}
             >
                {cta}
            </Button>
        </div>
    </Card>
);

const periods = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '1 Year' },
    { value: 'once', label: 'Once OFF' },
];

const planBasePrices = {
    standard: 5000,
    pro: 15000,
};

export function ManagePlanDialog() {
    const { config } = useBrandsoft();
    const currencyCode = config?.profile.defaultCurrency || 'K';
    const [selectedPeriod, setSelectedPeriod] = useState('1');

    const calculatePrice = (plan: 'standard' | 'pro', period: string) => {
        const basePrice = planBasePrices[plan];
        const months = Number(period);
        if(!isNaN(months)) {
            const total = basePrice * months;
            const suffix = months > 1 ? `/ ${months} months` : '/month';
            return `${currencyCode}${total.toLocaleString()}${suffix}`;
        }
        if (period === 'once') {
             const total = basePrice * 36; // 3 years for 'Once OFF'
             return `${currencyCode}${total.toLocaleString()}`;
        }
        return `${currencyCode}${basePrice.toLocaleString()}/month`;
    };

    const standardPrice = useMemo(() => calculatePrice('standard', selectedPeriod), [selectedPeriod, currencyCode]);
    const proPrice = useMemo(() => calculatePrice('pro', selectedPeriod), [selectedPeriod, currencyCode]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-4">
                    Manage
                </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-7xl w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
                <DialogHeader className="flex-shrink-0 mb-2">
                    <DialogTitle className="text-3xl font-headline">Manage Your Plan</DialogTitle>
                    <DialogDescription>
                        Choose the plan that best fits your business needs.
                    </DialogDescription>
                </DialogHeader>
                 
                <div className="flex justify-center my-4">
                    <div className="w-full max-w-xs">
                        <Label htmlFor="period-select">Select Billing Period</Label>
                         <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger id="period-select" className="mt-1">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map(p => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <PlanCard 
                            title="Free Trial" 
                            price={`${currencyCode}0`}
                            features={["Up to 10 invoices", "Up to 10 customers", "Basic templates"]}
                            isCurrent={true}
                            cta="Current Plan"
                        />

                        <PlanCard 
                            title="Standard" 
                            price={standardPrice}
                            features={["Unlimited invoices", "Unlimited customers", "Premium templates", "Email support"]}
                            cta="Buy Key"
                        />

                         <PlanCard 
                            title="Pro" 
                            price={proPrice}
                            features={["All Standard features", "API access", "Priority support", "Advanced analytics"]}
                            cta="Buy Key"
                        />

                         <PlanCard 
                            title="Enterprise" 
                            price="Custom"
                            features={["All Pro features", "Dedicated support", "Custom integrations", "On-premise option"]}
                            cta="Contact Us"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
