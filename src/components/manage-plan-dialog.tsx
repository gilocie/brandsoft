
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
import { Check, Star, Settings, Users, HardDrive, ShieldCheck, Contact, Package, Gem, Crown, Award, Gift, Rocket, Loader2, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrandsoft, type Plan, type PlanCustomization, type PlanPeriod, type Company } from '@/hooks/use-brandsoft';
import { usePlanImage } from '@/hooks/use-plan-image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PurchaseDialog, type PlanDetails } from './purchase-dialog';
import { useRouter } from 'next/navigation';
import { PlanSettingsDialog } from '@/components/plan-settings-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.58 15.35 3.4 16.85L2.05 22L7.3 20.62C8.75 21.39 10.37 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 3.67C16.56 3.67 20.28 7.39 20.28 11.91C20.28 16.43 16.56 20.15 12.04 20.15C10.53 20.15 9.09 19.74 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.07 16.3C3.93 14.96 3.4 13.38 3.4 11.91C3.4 7.39 7.12 3.67 12.04 3.67M9.13 7.5C8.93 7.5 8.76 7.55 8.61 7.82C8.47 8.1 8.03 8.77 8.03 9.92C8.03 11.06 8.63 12.14 8.76 12.31C8.88 12.49 10.3 14.86 12.58 15.79C14.44 16.56 14.84 16.43 15.18 16.39C15.77 16.33 16.56 15.72 16.78 15.1C17 14.48 17 13.97 16.89 13.86C16.78 13.75 16.61 13.69 16.34 13.55C16.07 13.42 14.92 12.83 14.68 12.73C14.44 12.64 14.27 12.58 14.1 12.85C13.93 13.12 13.43 13.7 13.29 13.86C13.15 14.03 13.01 14.06 12.74 13.92C12.47 13.78 11.75 13.54 10.87 12.76C10.15 12.13 9.68 11.35 9.54 11.12C9.4 10.89 9.52 10.75 9.63 10.64C9.73 10.53 9.87 10.35 10.01 10.2C10.15 10.05 10.2 9.96 10.32 9.79C10.43 9.61 10.37 9.45 10.32 9.33C10.27 9.21 9.83 8.06 9.66 7.61C9.49 7.16 9.32 7.5 9.13 7.5Z" />
  </svg>
);

const ContactDialog = ({
  isOpen,
  onClose,
  planName,
  contact,
}: {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  contact: { email?: string; whatsapp?: string };
}) => {
  if (!isOpen) return null;
  const hasWhatsapp = !!contact.whatsapp;
  const hasEmail = !!contact.email;

  const handleWhatsappClick = () => {
    window.open(`https://wa.me/${contact.whatsapp?.replace('+', '')}?text=I'm interested in the ${planName} plan.`, '_blank');
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${contact.email}?subject=Inquiry about ${planName} plan`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Choose your preferred method to get in touch about the {planName} plan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {hasWhatsapp && (
            <Button className="w-full h-14 justify-start gap-3 text-lg" onClick={handleWhatsappClick}>
              <WhatsAppIcon className="h-7 w-7" />
              Contact via WhatsApp
            </Button>
          )}
          {hasEmail && (
            <Button variant="secondary" className="w-full h-14 justify-start gap-3 text-lg" onClick={handleEmailClick}>
              <Mail className="h-6 w-6" />
              Send an Email
            </Button>
          )}
          {!hasWhatsapp && !hasEmail && (
            <p className="text-center text-sm text-muted-foreground">
              No contact methods have been configured for this plan.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


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
            className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" 
            style={{ backgroundColor: bgColor || 'rgba(99, 102, 241, 0.15)' }}
        >
            <Icon style={{ color: iconColor || 'rgb(99, 102, 241)' }} className="h-6 w-6" />
        </div>
    )
};

const PlanCard = ({ 
    plan, 
    isCurrent = false, 
    cta, 
    className, 
    onBuyClick, 
    onCustomizeClick 
}: { 
    plan: Plan, 
    isCurrent?: boolean, 
    cta: string, 
    className?: string, 
    onBuyClick: () => void, 
    onCustomizeClick?: () => void 
}) => {
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
              "relative overflow-hidden transition-all duration-300 border-2 rounded-2xl",
              className
          )}
          style={{
            ...backgroundStyle,
            borderColor: borderColor,
            color: cardTextColor
          }}
        >
            {isPopular && badgeText && (
                <div 
                    className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full text-white z-10 shadow-lg"
                    style={{ backgroundColor: badgeColor }}
                >
                    {badgeText}
                </div>
            )}

            <CardHeader className="p-6 pb-4 relative">
                {displayHeaderImage && (
                    <div className="absolute inset-0 overflow-hidden">
                        {isImageLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                            </div>
                        ) : (
                            <>
                                <img 
                                    src={displayHeaderImage} 
                                    alt="Header background" 
                                    className="absolute inset-0 w-full h-full object-cover" 
                                />
                                <div 
                                    className="absolute inset-0 bg-black"
                                    style={{ opacity: 1 - (customization?.headerBgImageOpacity ?? 1) }}
                                />
                            </>
                        )}
                    </div>
                )}

                <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-5">
                        <PlanIcon 
                            iconName={customization?.icon}
                            bgColor={isPopular ? 'rgba(255, 255, 255, 0.15)' : undefined}
                            iconColor={isPopular ? 'rgb(255, 255, 255)' : undefined}
                        />
                        <div className="flex-1 min-w-0">
                            <CardTitle 
                                className="text-xl font-bold mb-1.5 truncate" 
                                style={{ color: cardTextColor }}
                            >
                                {customization?.customTitle || plan.name}
                            </CardTitle>
                            <CardDescription 
                                className="text-sm leading-relaxed line-clamp-2"
                                style={{ color: isPopular ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }}
                            >
                                {customization?.customDescription || plan.features[0]}
                            </CardDescription>
                        </div>
                    </div>
                    
                    {customization?.hidePrice ? (
                        <div className="h-14 flex items-center">
                            <span className="text-2xl font-bold" style={{ color: cardTextColor }}>
                                Contact us
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            {typeof plan.price === 'object' ? (
                                plan.price
                            ) : (
                                <>
                                    <span 
                                        className="text-4xl font-bold tracking-tight" 
                                        style={{ color: cardTextColor }}
                                    >
                                        {plan.price}
                                    </span>
                                    <span 
                                        className="text-base font-medium"
                                        style={{ color: isPopular ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)' }}
                                    >
                                        /month
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-5">
                <Button 
                    className={cn(
                        "w-full text-sm font-semibold h-11 rounded-xl transition-all",
                        cta === 'Current Plan' && "opacity-60 cursor-not-allowed"
                    )}
                    style={{
                        backgroundColor: isPopular ? badgeColor : 'rgba(255, 255, 255, 0.1)',
                        color: isPopular ? 'white' : cardTextColor,
                        border: isPopular ? 'none' : '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    onClick={onBuyClick}
                    disabled={cta === 'Current Plan'}
                >
                    {customization?.hidePrice ? 'Contact Us' : (customization?.ctaText || cta)}
                </Button>
                
                <div className="space-y-3">
                    {plan.features.slice(1).map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div 
                                className="mt-0.5 rounded-full p-1 flex-shrink-0"
                                style={{ 
                                    backgroundColor: isPopular 
                                        ? 'rgba(255, 255, 255, 0.2)' 
                                        : 'rgba(255, 255, 255, 0.1)' 
                                }}
                            >
                                <Check 
                                    className="h-3 w-3" 
                                    style={{ color: cardTextColor }} 
                                />
                            </div>
                            <span 
                                className="text-sm leading-relaxed"
                                style={{ 
                                    color: isPopular 
                                        ? 'rgba(255, 255, 255, 0.9)' 
                                        : 'rgba(255, 255, 255, 0.7)' 
                                }}
                            >
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>

                {isCurrent && cta === 'Current Plan' && (
                    <div 
                        className="text-center text-xs font-medium py-2 rounded-lg"
                        style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: cardTextColor 
                        }}
                    >
                        ✓ Your current plan
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ManagePlanDialog({ isExpiringSoon, isExpired }: { isExpiringSoon?: boolean, isExpired?: boolean }) {
    const { config, downgradeToTrial, saveConfig } = useBrandsoft();
    const router = useRouter();
    const currencyCode = config?.profile.defaultCurrency || 'K';
    const planPeriods = config?.admin?.planPeriods || [];
    const [selectedPeriod, setSelectedPeriod] = useState(planPeriods[0]?.value || '1');
    const [purchasePlan, setPurchasePlan] = useState<PlanDetails | null>(null);
    const [isManagePlanOpen, setIsManagePlanOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [contactInfo, setContactInfo] = useState<{ planName: string, email?: string, whatsapp?: string } | null>(null);

    // FIX: Use useMemo to get wallet balance directly from config
    const { walletBalance } = useMemo(() => {
        if (!config?.profile?.id || !config?.companies) {
            return { walletBalance: 0 };
        }
        
        const company = config.companies.find(c => c.id === (config.profile as any).id);
        return {
            walletBalance: company?.walletBalance || 0
        };
    }, [config?.profile?.id, config?.companies]);

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

    const selectedPeriodLabel = planPeriods.find(p => p.value === selectedPeriod)?.label;
    
    const handleBuyClick = (plan: Plan) => {
        if (plan.customization?.hidePrice) {
            setContactInfo({
                planName: plan.name,
                email: plan.customization.contactEmail,
                whatsapp: plan.customization.contactWhatsapp,
            });
            return;
        }

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
        
        const updatedPlans = (config.plans || []).map(p =>
            p.name === planName ? { ...p, customization: cleanCustomization } : p
        );
        saveConfig({ ...config, plans: updatedPlans }, {redirect: false});
        setEditingPlan(null);
    };

    const hasCustomFreeTrial = useMemo(() => config?.plans?.some(p => p.name === 'Free Trial'), [config?.plans]);

    const totalPlans = (hasCustomFreeTrial ? 0 : 1) + (config?.plans?.length || 0);

    return (
        <>
        <Dialog open={isManagePlanOpen} onOpenChange={setIsManagePlanOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-4">
                    Manage
                </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-7xl w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0 gap-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800 overflow-hidden">
                <div className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b border-slate-800/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-white">
                                Manage Your Plan
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-sm mt-1">
                                Choose the plan that best fits your business needs.
                            </DialogDescription>
                        </div>
                        <div className="w-full sm:w-auto sm:min-w-[180px]">
                            <Label htmlFor="period-select" className="sr-only">
                                Select Billing Period
                            </Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger 
                                    id="period-select" 
                                    className="h-10 bg-slate-800/50 border-slate-700 text-white"
                                >
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {planPeriods.map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-4 sm:p-6 pt-4">
                        <div 
                            className={cn(
                                "grid gap-6 mx-auto",
                                totalPlans === 1 && "max-w-md grid-cols-1",
                                totalPlans === 2 && "max-w-3xl grid-cols-1 md:grid-cols-2",
                                totalPlans >= 3 && "max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                                totalPlans >= 4 && "max-w-7xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                            )}
                        >
                            {!hasCustomFreeTrial && (
                                <PlanCard 
                                    plan={{ 
                                        name: "Free Trial", 
                                        price: 0, 
                                        features: [
                                            "Get started for free",
                                            "30 Invoices per month",
                                            "30 Quotations per month", 
                                            "50 Products catalog",
                                            "Basic reporting",
                                            "Email support"
                                        ], 
                                        customization: {
                                            icon: 'Gift',
                                            customDescription: 'Perfect for trying out our platform'
                                        } 
                                    }}
                                    isCurrent={!currentPlanPurchase}
                                    cta={currentPlanPurchase ? "Downgrade to Trial" : "Current Plan"}
                                    onBuyClick={currentPlanPurchase ? handleDowngrade : () => {}}
                                />
                            )}
                            {config?.plans?.map(plan => {
                                const { discounted, original, isDiscounted } = calculatePrice(
                                    plan.price, 
                                    selectedPeriod, 
                                    plan.customization?.discountValue, 
                                    plan.customization?.discountType, 
                                    plan.customization?.discountMonths
                                );
                                
                                const displayPrice = isDiscounted ? (
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <span className="text-lg line-through opacity-50">
                                            {original}
                                        </span>
                                        <span className="text-4xl font-bold tracking-tight">
                                            {discounted}
                                        </span>
                                    </div>
                                ) : (
                                     <span className="text-4xl font-bold tracking-tight">
                                        {discounted}
                                    </span>
                                );
                                
                                return (
                                    <PlanCard
                                        key={plan.name}
                                        plan={{...plan, price: displayPrice as any}}
                                        isCurrent={currentPlanPurchase?.planName === plan.name}
                                        cta={getPlanCTA(plan)}
                                        onBuyClick={() => handleBuyClick(plan)}
                                        onCustomizeClick={() => setEditingPlan(plan)}
                                        className={cn(
                                            plan.customization?.isRecommended && [
                                                "ring-2 ring-indigo-500/50",
                                                "shadow-2xl shadow-indigo-500/20",
                                                "lg:scale-105 lg:z-10"
                                            ]
                                        )}
                                    />
                                )
                            })}
                        </div>
                        <div className="h-4" />
                    </div>
                </ScrollArea>
                <div className="flex-shrink-0 p-4 sm:p-6 pt-4 border-t border-slate-800/50 bg-slate-900/50">
                    <p className="text-center text-sm text-slate-500">
                        Available Balance: <strong className='text-slate-300'>{currencyCode}{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </p>
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
        
        {contactInfo && (
            <ContactDialog
                isOpen={!!contactInfo}
                onClose={() => setContactInfo(null)}
                planName={contactInfo.planName}
                contact={{ email: contactInfo.email, whatsapp: contactInfo.whatsapp }}
            />
        )}
        </>
    );
}
