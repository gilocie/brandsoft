
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
import { Check, Star, Settings, Users, HardDrive, ShieldCheck, Contact } from 'lucide-react';
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

const PlanIcon = ({ bgColor, iconColor }: { bgColor?: string; iconColor?: string }) => (
    <div 
        className="h-14 w-14 rounded-2xl flex items-center justify-center" 
        style={{ backgroundColor: bgColor || 'rgba(99, 102, 241, 0.15)' }}
    >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke={iconColor || 'rgb(99, 102, 241)'} strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 7L12 12L22 7" stroke={iconColor || 'rgb(99, 102, 241)'} strokeWidth="2" strokeLinejoin="round"/>
            <path d="M12 12V22" stroke={iconColor || 'rgb(99, 102, 241)'} strokeWidth="2" strokeLinejoin="round"/>
        </svg>
    </div>
);


const PlanCard = ({ plan, isCurrent = false, cta, className, onBuyClick, onCustomizeClick }: { plan: Plan, isCurrent?: boolean, cta: string, className?: string, onBuyClick: () => void, onCustomizeClick?: () => void }) => {
    
    const { customization } = plan;
    const isPopular = customization?.isRecommended;

    const cardBgColor = customization?.bgColor || (isPopular ? 'rgb(88, 80, 236)' : 'rgb(30, 30, 35)');
    const cardTextColor = customization?.textColor || 'rgb(255, 255, 255)';
    const borderColor = customization?.borderColor || (isPopular ? 'rgb(88, 80, 236)' : 'rgb(45, 45, 50)');
    const badgeColor = customization?.badgeColor || 'rgb(255, 107, 53)';
    const badgeText = customization?.badgeText || 'Most popular';

    return (
        <Card 
          className={cn(
              "flex flex-col h-full relative overflow-hidden transition-all duration-300 border-2",
              className
          )}
          style={{
            backgroundColor: cardBgColor,
            borderColor: borderColor,
            color: cardTextColor
          }}
        >
            {isPopular && (
                 <div 
                    className="absolute top-6 right-6 text-xs font-bold px-3 py-1.5 rounded-full text-white z-10"
                    style={{ backgroundColor: badgeColor }}
                 >
                    {badgeText}
                </div>
            )}
            <CardHeader className="p-8 pb-6">
                <div className="flex items-start gap-4 mb-6">
                    <PlanIcon 
                        bgColor={isPopular ? 'rgba(255, 255, 255, 0.15)' : undefined}
                        iconColor={isPopular ? 'rgb(255, 255, 255)' : undefined}
                    />
                    <div className="flex-1">
                        <CardTitle className="text-2xl font-bold mb-2" style={{ color: cardTextColor }}>
                            {customization?.customTitle || plan.name}
                        </CardTitle>
                        <CardDescription 
                            className="text-sm leading-relaxed"
                            style={{ color: isPopular ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                            {customization?.customDescription || plan.features[0]}
                        </CardDescription>
                    </div>
                </div>
                
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold tracking-tight" style={{ color: cardTextColor }}>
                        {typeof plan.price === 'number' ? `K${plan.price.toLocaleString()}` : plan.price}
                    </span>
                    <span 
                        className="text-base font-medium"
                        style={{ color: isPopular ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)' }}
                    >
                        /month
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-6 px-8 pb-8">
                 <Button 
                    className={cn("w-full text-base font-semibold h-12 rounded-lg transition-all")}
                    style={{
                        backgroundColor: isPopular ? 'rgb(255, 107, 53)' : 'rgba(255, 255, 255, 0.1)',
                        color: isPopular ? 'white' : cardTextColor,
                        border: isPopular ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onClick={onBuyClick}
                    disabled={cta === 'Current Plan'}
                 >
                    {customization?.ctaText || cta}
                </Button>
                
                <div className="space-y-4 pt-2">
                    {plan.features.slice(1).map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div 
                                className="mt-0.5 rounded-full p-0.5"
                                style={{ backgroundColor: isPopular ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' }}
                            >
                                <Check className="h-3.5 w-3.5" style={{ color: cardTextColor }} />
                            </div>
                            <span 
                                className="text-sm leading-relaxed flex-1"
                                style={{ color: isPopular ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)' }}
                            >
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
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
             total = basePrice * 36;
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
        if (!currentPlanPurchase) return "Choose this plan";

        const currentLevel = planLevels[currentPlanName] ?? 0;
        const targetLevel = planLevels[targetPlan.name] ?? 0;

        if(targetLevel < currentLevel) {
            return `Downgrade to ${targetPlan.name}`;
        }
        return `Upgrade to ${targetPlan.name}`;
    };
    
    const handlePurchaseSuccess = () => {
      setPurchasePlan(null);
      setIsManagePlanOpen(false);
      router.push('/dashboard');
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
            
            <DialogContent className="max-w-7xl w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6 bg-gradient-to-br from-slate-950 to-slate-900 border-slate-800">
                <DialogHeader className="flex-shrink-0 mb-4 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-3xl font-headline text-white">Manage Your Plan</DialogTitle>
                        <DialogDescription className="text-slate-400">
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

                <div className="flex-1 overflow-y-auto min-h-0 py-2 -mx-4 px-4">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        
                        {!hasCustomFreeTrial && (
                           <PlanCard 
                                plan={{ 
                                    name: "Free Trial", 
                                    price: 0, 
                                    features: [
                                        "Perfect for getting started",
                                        "Up to 10 invoices", 
                                        "Up to 10 customers", 
                                        "Basic templates"
                                    ], 
                                    customization: {} 
                                }}
                                isCurrent={!currentPlanPurchase}
                                cta={currentPlanPurchase ? "Downgrade to Trial" : "Current Plan"}
                                onBuyClick={currentPlanPurchase ? handleDowngrade : () => {}}
                            />
                        )}

                        {config?.plans?.map(plan => {
                            const { discounted } = calculatePrice(plan.price, selectedPeriod, plan.customization?.discountValue, plan.customization?.discountType);
                            const displayPrice = plan.customization?.discountValue ? (
                                <>
                                    <span className="line-through opacity-60 text-2xl mr-2">{calculatePrice(plan.price, selectedPeriod).original}</span>
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
                                    className={plan.customization?.isRecommended ? "lg:scale-105 shadow-2xl shadow-indigo-500/20" : ""}
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
