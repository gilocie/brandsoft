

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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrandsoft, type Plan, type PlanCustomization } from '@/hooks/use-brandsoft';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PurchaseDialog, type PlanDetails } from './purchase-dialog';
import { useRouter } from 'next/navigation';
import { PlanSettingsDialog } from '@/components/plan-settings-dialog';


const planLevels: Record<string, number> = {
  'Free Trial': 0,
  'Standard': 1,
  'Pro': 2,
  'Enterprise': 3,
};

const PlanCard = ({ plan, isCurrent = false, cta, className, onBuyClick, onCustomizeClick }: { plan: Plan, isCurrent?: boolean, cta: string, className?: string, onBuyClick: () => void, onCustomizeClick?: () => void }) => {
    
    const customization = plan.customization || {};

    const cardStyle: React.CSSProperties = {
        backgroundColor: customization.bgColor || customization.cardBgColor,
        color: customization.textColor,
        borderColor: customization.borderColor,
    };
    
    const titleStyle: React.CSSProperties = { color: customization.titleColor };
    const priceStyle: React.CSSProperties = { color: customization.priceColor };

    return (
        <Card 
          className={cn("flex flex-col h-full relative overflow-hidden", isCurrent && "ring-2 ring-primary shadow-md", className)}
          style={cardStyle}
        >
            {customization.badgeText && (
                 <div className="absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-lg text-white" style={{ backgroundColor: customization.badgeColor || 'hsl(var(--primary))' }}>
                    {customization.badgeText}
                </div>
            )}
            <div className="relative z-10 flex flex-col flex-grow p-4">
                 <CardHeader className="p-0 pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle style={titleStyle}>{customization.customTitle || plan.name}</CardTitle>
                        {onCustomizeClick && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCustomizeClick}><Settings className="h-4 w-4" /></Button>}
                    </div>
                    {customization.customDescription && <CardDescription className="pt-1">{customization.customDescription}</CardDescription>}
                    <div className="text-4xl sm:text-3xl font-bold pt-2" style={priceStyle}>
                        {plan.price}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 p-0 pt-4">
                    {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground" style={{ color: customization.textColor ? `rgba(${parseInt(customization.textColor.slice(1,3),16)},${parseInt(customization.textColor.slice(3,5),16)},${parseInt(customization.textColor.slice(5,7),16)},0.7)` : undefined }}>{feature}</span>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="p-0 pt-4">
                     <Button 
                        className="w-full" 
                        variant={isCurrent ? "secondary" : "default"}
                        onClick={onBuyClick}
                        disabled={cta === 'Current Plan'}
                     >
                        {customization.ctaText || cta}
                    </Button>
                </CardFooter>
            </div>
        </Card>
    );
}

const periods = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '1 Year' },
    { value: 'once', label: 'Once OFF' },
];

export function ManagePlanDialog({ isExpiringSoon, isExpired }: { isExpiringSoon?: boolean, isExpired?: boolean }) {
    const { config, downgradeToTrial, saveConfig } = useBrandsoft();
    const router = useRouter();
    const currencyCode = config?.profile.defaultCurrency || 'K';
    const [selectedPeriod, setSelectedPeriod] = useState('1');
    const [purchasePlan, setPurchasePlan] = useState<PlanDetails | null>(null);
    const [isManagePlanOpen, setIsManagePlanOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const currentPlanPurchase = useMemo(() => {
        if (!config?.purchases || config.purchases.length === 0) return null;
        const active = config.purchases.find(p => p.status === 'active');
        if (active) return active;
        const expired = config.purchases.filter(p => p.status === 'inactive' && p.expiresAt).sort((a,b) => new Date(b.expiresAt!).getTime() - new Date(a.expiresAt!).getTime());
        return expired[0] || null;
    }, [config?.purchases]);

    const calculatePrice = (basePrice: number, period: string, discount?: PlanCustomization['discountValue'], discountType?: PlanCustomization['discountType']) => {
        const months = Number(period);
        let total = basePrice;

        if(!isNaN(months)) {
            total = basePrice * months;
        } else if (period === 'once') {
             total = basePrice * 36; // 3 years for 'Once OFF'
        }
        
        let discountedTotal = total;
        if(discount && discountType) {
            if(discountType === 'percentage') {
                discountedTotal = total - (total * (discount / 100));
            } else {
                discountedTotal = total - discount;
            }
        }
        
        return {
            original: `${currencyCode}${total.toLocaleString()}`,
            discounted: `${currencyCode}${discountedTotal.toLocaleString()}`
        };
    };

    const selectedPeriodLabel = periods.find(p => p.value === selectedPeriod)?.label;
    
    const handleBuyClick = (plan: Plan) => {
        const { discounted } = calculatePrice(plan.price, selectedPeriod, plan.customization?.discountValue, plan.customization?.discountType);
        setPurchasePlan({ name: plan.name, price: discounted, period: selectedPeriodLabel || '1 Month' });
    };

    const getPlanCTA = (targetPlan: Plan) => {
        const currentPlanName = currentPlanPurchase?.planName || 'Free Trial';
        if (currentPlanName === targetPlan.name) {
            return currentPlanPurchase?.status === 'active' ? "Current Plan" : "Renew Expired Plan";
        }
        if (!currentPlanPurchase) return "Get Started"; // On Free Trial

        const currentLevel = planLevels[currentPlanName] ?? 0;
        const targetLevel = planLevels[targetPlan.name] ?? 0;

        if(targetLevel < currentLevel) {
            return `Downgrade to ${targetPlan.name}`;
        }
        return `Upgrade to ${targetPlan.name}`;
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
    
     const handleSaveCustomization = (planName: string, customization: PlanCustomization) => {
        if (!config) return;
        const updatedPlans = config.plans.map(p =>
            p.name === planName ? { ...p, customization } : p
        );
        saveConfig({ ...config, plans: updatedPlans }, {redirect: false});
        setEditingPlan(null);
    };

    const hasCustomFreeTrial = useMemo(() => config?.plans?.some(p => p.name === 'Free Trial'), [config?.plans]);

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
                        
                        {!hasCustomFreeTrial && (
                           <PlanCard 
                                plan={{ name: "Free Trial", price: 0, features: ["Up to 10 invoices", "Up to 10 customers", "Basic templates"], customization: {} }}
                                isCurrent={!currentPlanPurchase}
                                cta={currentPlanPurchase ? "Downgrade to Trial" : "Current Plan"}
                                onBuyClick={currentPlanPurchase ? handleDowngrade : () => {}}
                            />
                        )}

                        {config?.plans?.map(plan => {
                             const { original, discounted } = calculatePrice(plan.price, selectedPeriod, plan.customization?.discountValue, plan.customization?.discountType);
                             const displayPrice = plan.customization?.discountValue ? (
                                <>
                                    <span className="line-through text-muted-foreground/80 text-xl mr-2">{original}</span>
                                    <span>{discounted}</span>
                                </>
                             ) : discounted;
                             
                             return (
                                <PlanCard
                                    key={plan.name}
                                    plan={{...plan, price: displayPrice as any}}
                                    isCurrent={currentPlanPurchase?.planName === plan.name}
                                    cta={getPlanCTA(plan)}
                                    onBuyClick={() => handleBuyClick(plan)}
                                    onCustomizeClick={() => setEditingPlan(plan)}
                                />
                             )
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        
        <PlanSettingsDialog
            isOpen={!!editingPlan}
            onClose={() => setEditingPlan(null)}
            plan={editingPlan}
            onSave={handleSaveCustomization}
        />
        
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
