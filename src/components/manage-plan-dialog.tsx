
'use client';

import React, { useState, useMemo } from 'react';
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
import { Check, Star, Settings, Users, HardDrive, ShieldCheck, Contact, Package, Gem, Crown, Award, Gift, Rocket, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrandsoft, type Plan, type PlanCustomization } from '@/hooks/use-brandsoft';
import { usePlanImage } from '@/hooks/use-plan-image';
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

const iconMap: { [key: string]: React.ElementType } = {
    Package, Users, HardDrive, Contact, Star, Gem, Crown, Award, Gift, Rocket, ShieldCheck,
};

const PlanIcon = ({ iconName, bgColor, iconColor }: { iconName?: string; bgColor?: string; iconColor?: string }) => {
    const Icon = iconName ? iconMap[iconName] : Package;
    return (
        <div 
            className="h-12 w-12 rounded-xl flex items-center justify-center" 
            style={{ backgroundColor: bgColor || 'rgba(99, 102, 241, 0.15)' }}
        >
            <Icon style={{ color: iconColor || 'rgb(99, 102, 241)' }} className="h-6 w-6" />
        </div>
    )
};


const PlanCard = ({ plan, isCurrent = false, cta, className, onBuyClick, onCustomizeClick }: { plan: Plan, isCurrent?: boolean, cta: string, className?: string, onBuyClick: () => void, onCustomizeClick?: () => void }) => {
    
    const { customization } = plan;
    const isPopular = customization?.isRecommended;
    
    const { image: headerImage, isLoading: isImageLoading } = usePlanImage(plan.name, 'header');

    const cardBgColor = customization?.bgColor || (isPopular ? 'rgb(88, 80, 236)' : 'rgb(30, 30, 35)');
    const cardTextColor = customization?.textColor || 'rgb(255, 255, 255)';
    const borderColor = customization?.borderColor || (isPopular ? 'rgb(88, 80, 236)' : 'rgb(45, 45, 50)');
    const badgeColor = customization?.badgeColor || 'rgb(255, 107, 53)';
    const badgeText = customization?.badgeText || 'Popular';
    
    const backgroundStyle = customization?.backgroundType === 'gradient'
        ? { background: `linear-gradient(to bottom right, ${customization.backgroundGradientStart || '#3a3a3a'}, ${customization.backgroundGradientEnd || '#1a1a1a'})` }
        : { backgroundColor: cardBgColor };

    const displayHeaderImage = headerImage || customization?.headerBgImage;


    return (
        <Card 
          className={cn(
              "flex flex-col h-full relative overflow-hidden transition-all duration-300 border-2",
              className
          )}
          style={{
            ...backgroundStyle,
            borderColor: borderColor,
            color: cardTextColor
          }}
        >
            {isPopular && (
                 <div 
                    className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full text-white z-10"
                    style={{ backgroundColor: badgeColor }}
                 >
                    {badgeText}
                </div>
            )}
            <CardHeader className="p-5 pb-4 relative">
                 {displayHeaderImage && (
                    <>
                        {isImageLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                            </div>
                        ) : (
                            <>
                                <img src={displayHeaderImage} alt="Header background" className="absolute inset-0 w-full h-full object-cover" />
                                <div 
                                    className="absolute inset-0 bg-black"
                                    style={{ opacity: 1 - (customization?.headerBgImageOpacity ?? 1) }}
                                />
                            </>
                        )}
                    </>
                )}
                <div className="relative">
                    <div className="flex items-start gap-3 mb-4">
                        <PlanIcon 
                            iconName={customization?.icon}
                            bgColor={isPopular ? 'rgba(255, 255, 255, 0.15)' : undefined}
                            iconColor={isPopular ? 'rgb(255, 255, 255)' : undefined}
                        />
                        <div className="flex-1">
                            <CardTitle className="text-lg font-bold mb-1" style={{ color: cardTextColor }}>
                                {customization?.customTitle || plan.name}
                            </CardTitle>
                            <CardDescription 
                                className="text-xs leading-relaxed"
                                style={{ color: isPopular ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }}
                            >
                                {customization?.customDescription || plan.features[0]}
                            </CardDescription>
                        </div>
                    </div>
                    
                    {customization?.hidePrice ? (
                        <div className="h-[50px] flex items-center">
                            <span className="text-2xl font-bold" style={{ color: cardTextColor }}>Contact us</span>
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold tracking-tight" style={{ color: cardTextColor }}>
                            {plan.price}
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4 px-5 pb-5">
                 <Button 
                    className={cn("w-full text-sm font-semibold h-10 rounded-lg transition-all")}
                    style={{
                        backgroundColor: isPopular ? 'rgb(255, 107, 53)' : 'rgba(255, 255, 255, 0.1)',
                        color: isPopular ? 'white' : cardTextColor,
                        border: isPopular ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onClick={onBuyClick}
                    disabled={cta === 'Current Plan'}
                 >
                    {customization?.hidePrice ? 'Contact Us' : (customization?.ctaText || cta)}
                </Button>
                
                <div className="space-y-2.5 pt-1">
                    {plan.features.slice(1).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2.5">
                            <div 
                                className="mt-0.5 rounded-full p-0.5 flex-shrink-0"
                                style={{ backgroundColor: isPopular ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' }}
                            >
                                <Check className="h-3 w-3" style={{ color: cardTextColor }} />
                            </div>
                            <span 
                                className="text-xs leading-relaxed flex-1"
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

    const calculatePrice = (basePrice: number, period: string, discount?: PlanCustomization['discountValue'], discountType?: PlanCustomization['discountType'], discountMonths?: number) => {
        const months = Number(period);
        let total = basePrice;
        let isDiscounted = false;

        if(!isNaN(months)) {
            total = basePrice * months;
            if (discount && discountMonths && months >= discountMonths) {
                isDiscounted = true;
            }
        } else if (period === 'once') {
             total = basePrice * 36;
        }
        
        let discountedTotal = total;
        if(isDiscounted && discount && discountType) {
            if(discountType === 'percentage') {
                discountedTotal = total - (total * (discount / 100));
            } else {
                discountedTotal = total - discount;
            }
        }
        
        return {
            original: `${currencyCode}${total.toLocaleString()}`,
            discounted: `${currencyCode}${discountedTotal.toLocaleString()}`,
            isDiscounted,
        };
    };

    const selectedPeriodLabel = periods.find(p => p.value === selectedPeriod)?.label;
    
    const handleBuyClick = (plan: Plan) => {
        const { discounted } = calculatePrice(plan.price, selectedPeriod, plan.customization?.discountValue, plan.customization?.discountType, plan.customization?.discountMonths);
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
        
        const cleanCustomization: PlanCustomization = {
            ...customization,
            headerBgImage: customization.headerBgImage ? 'indexed-db' : '',
        };
        
        const updatedPlans = config.plans.map(p =>
            p.name === planName ? { ...p, customization: cleanCustomization } : p
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
            
            <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6 bg-gradient-to-br from-slate-950 to-slate-900 border-slate-800">
                <DialogHeader className="flex-shrink-0 mb-4 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-2xl font-headline text-white">Manage Your Plan</DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm">
                            Choose the plan that best fits your business needs.
                        </DialogDescription>
                    </div>
                    <div className="w-full max-w-[180px]">
                        <Label htmlFor="period-select" className="text-xs font-medium sr-only">Select Billing Period</Label>
                         <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger id="period-select" className="h-9">
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
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch max-w-5xl mx-auto">
                        
                        {!hasCustomFreeTrial && (
                           <PlanCard 
                                plan={{ 
                                    name: "Free Trial", 
                                    price: 0, 
                                    features: [
                                        "30 Invoices",
                                        "30 Quotations", 
                                        "50 Products"
                                    ], 
                                    customization: {} 
                                }}
                                isCurrent={!currentPlanPurchase}
                                cta={currentPlanPurchase ? "Downgrade to Trial" : "Current Plan"}
                                onBuyClick={currentPlanPurchase ? handleDowngrade : () => {}}
                            />
                        )}

                        {config?.plans?.map(plan => {
                            const { discounted, original, isDiscounted } = calculatePrice(plan.price, selectedPeriod, plan.customization?.discountValue, plan.customization?.discountType, plan.customization?.discountMonths);
                            
                            const displayPrice = isDiscounted ? (
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-base line-through opacity-60 self-start mt-1">{original}</span>
                                    <span className="text-3xl font-bold">{discounted}</span>
                                </div>
                            ) : discounted;
                            
                            return (
                                <PlanCard
                                    key={plan.name}
                                    plan={{...plan, price: displayPrice as any}}
                                    isCurrent={currentPlanPurchase?.planName === plan.name}
                                    cta={getPlanCTA(plan)}
                                    onBuyClick={() => handleBuyClick(plan)}
                                    onCustomizeClick={() => setEditingPlan(plan)}
                                    className={plan.customization?.isRecommended ? "md:scale-105 shadow-2xl shadow-indigo-500/20" : ""}
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
