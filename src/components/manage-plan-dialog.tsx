

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
import { useBrandsoft, type Purchase } from '@/hooks/use-brandsoft';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PurchaseDialog } from './purchase-dialog';
import { useRouter } from 'next/navigation';

type Plan = 'Free Trial' | 'Standard' | 'Pro' | 'Enterprise';
export type PlanDetails = {
    name: Plan;
    price: string;
    period: string;
}

const planLevels: Record<Plan, number> = {
  'Free Trial': 0,
  'Standard': 1,
  'Pro': 2,
  'Enterprise': 3,
};

const PlanCard = ({ title, price, features, isCurrent = false, cta, className, periodLabel, onBuyClick }: { title: Plan, price: string, features: string[], isCurrent?: boolean, cta: string, className?: string, periodLabel?: string, onBuyClick: () => void }) => (
    <Card className={cn("flex flex-col h-full", isCurrent && "ring-2 ring-primary shadow-md", className)}>
        <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center justify-between">
                <span>{title}</span>
                {periodLabel && <span className="text-xs font-normal text-muted-foreground">{periodLabel}</span>}
            </CardTitle>
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
                onClick={onBuyClick}
                disabled={cta === 'Current Plan'}
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

export function ManagePlanDialog({ isExpiringSoon, isExpired }: { isExpiringSoon?: boolean, isExpired?: boolean }) {
    const { config, downgradeToTrial } = useBrandsoft();
    const router = useRouter();
    const currencyCode = config?.profile.defaultCurrency || 'K';
    const [selectedPeriod, setSelectedPeriod] = useState('1');
    const [purchasePlan, setPurchasePlan] = useState<PlanDetails | null>(null);
    const [isManagePlanOpen, setIsManagePlanOpen] = useState(false);

    const currentPlan = useMemo(() => {
        if (!config?.purchases || config.purchases.length === 0) return null;
        const active = config.purchases.find(p => p.status === 'active');
        if (active) return active;
        const expired = config.purchases.filter(p => p.status === 'inactive' && p.expiresAt).sort((a,b) => new Date(b.expiresAt!).getTime() - new Date(a.expiresAt!).getTime());
        return expired[0] || null;
    }, [config?.purchases]);

    const calculatePrice = (plan: 'standard' | 'pro', period: string) => {
        const basePrice = planBasePrices[plan];
        const months = Number(period);
        if(!isNaN(months)) {
            const total = basePrice * months;
            return `${currencyCode}${total.toLocaleString()}`;
        }
        if (period === 'once') {
             const total = basePrice * 36; // 3 years for 'Once OFF'
             return `${currencyCode}${total.toLocaleString()}`;
        }
        return `${currencyCode}${basePrice.toLocaleString()}`;
    };

    const standardPrice = useMemo(() => calculatePrice('standard', selectedPeriod), [selectedPeriod, currencyCode]);
    const proPrice = useMemo(() => calculatePrice('pro', selectedPeriod), [selectedPeriod, currencyCode]);
    const selectedPeriodLabel = periods.find(p => p.value === selectedPeriod)?.label;
    
    const handleBuyClick = (planName: Plan, price: string, period: string) => {
        setPurchasePlan({ name: planName, price, period });
    };

    const getPlanCTA = (targetPlan: Plan) => {
        if (currentPlan?.planName === targetPlan) {
            return currentPlan.status === 'active' ? "Current Plan" : "Renew Expired Plan";
        }
        if (!currentPlan) return "Get Started"; // On Free Trial

        const currentLevel = planLevels[currentPlan.planName as Plan] ?? 0;
        const targetLevel = planLevels[targetPlan];

        if(targetLevel < currentLevel) {
            return `Downgrade to ${targetPlan}`;
        }
        return `Upgrade to ${targetPlan}`;
    };
    
    const handlePurchaseSuccess = () => {
      setPurchasePlan(null); // Close the purchase dialog
      setIsManagePlanOpen(false); // Close the manage plan dialog
      router.push('/dashboard'); // Navigate to dashboard
    };
    
    const handleDowngrade = () => {
        downgradeToTrial();
        setIsManagePlanOpen(false);
    };

    return (
        <>
        <Dialog open={isManagePlanOpen} onOpenChange={setIsManagePlanOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-4">
                    Manage
                </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-7xl w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
                <DialogHeader className="flex-shrink-0 mb-4 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-3xl font-headline">Manage Your Plan</DialogTitle>
                        <DialogDescription>
                            Choose the plan that best fits your business needs.
                        </DialogDescription>
                    </div>
                    <div className="w-full max-w-[200px]">
                        <Label htmlFor="period-select" className="text-xs font-medium sr-only">Select Billing Period</Label>
                         <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger id="period-select">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map(p => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 py-2">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <PlanCard 
                            title="Free Trial" 
                            price={`${currencyCode}0`}
                            features={["Up to 10 invoices", "Up to 10 customers", "Basic templates"]}
                            isCurrent={!currentPlan}
                            cta={currentPlan ? "Downgrade to Trial" : "Current Plan"}
                            onBuyClick={currentPlan ? handleDowngrade : () => {}}
                        />

                        <PlanCard 
                            title="Standard" 
                            price={standardPrice}
                            features={["Unlimited invoices", "Unlimited customers", "Premium templates", "Email support"]}
                            isCurrent={currentPlan?.planName === 'Standard'}
                            cta={getPlanCTA("Standard")}
                            periodLabel={selectedPeriodLabel}
                            onBuyClick={() => handleBuyClick("Standard", standardPrice, selectedPeriodLabel || '1 Month')}
                        />

                         <PlanCard 
                            title="Pro" 
                            price={proPrice}
                            features={["All Standard features", "API access", "Priority support", "Advanced analytics"]}
                            isCurrent={currentPlan?.planName === 'Pro'}
                            cta={getPlanCTA("Pro")}
                            periodLabel={selectedPeriodLabel}
                            onBuyClick={() => handleBuyClick("Pro", proPrice, selectedPeriodLabel || '1 Month')}
                        />

                         <PlanCard 
                            title="Enterprise" 
                            price="Custom"
                            features={["All Pro features", "Dedicated support", "Custom integrations", "On-premise option"]}
                             isCurrent={currentPlan?.planName === 'Enterprise'}
                            cta={getPlanCTA("Enterprise")}
                            onBuyClick={() => { window.open('https://wa.me/265991972336', '_blank') }}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        
        {purchasePlan && (
            <PurchaseDialog 
                plan={purchasePlan} 
                isOpen={!!purchasePlan} 
                onClose={() => setPurchasePlan(null)}
                onSuccess={handlePurchaseSuccess}
            />
        )}
        </>
    );
}
