
'use client';

import type { BrandsoftConfig, Purchase, AdminSettings } from '@/types/brandsoft';

const TEST_PERIOD_MINUTES: Record<string, number> = {
  '1 Month': 10,
  '3 Months': 15,
  '6 Months': 30,
  '1 Year': 45,
};
const isTestPlanPeriod = (period: string) => period in TEST_PERIOD_MINUTES;

type ActivationResult = {
    purchases: Purchase[];
    admin?: AdminSettings;
    affiliate?: BrandsoftConfig['affiliate'];
};

export function usePurchases(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void,
) {
  const addPurchaseOrder = (orderData: Omit<Purchase, 'remainingTime'>): Purchase => {
    if (!config) throw new Error("Configuration not loaded.");
    const newOrder: Purchase = {
        ...orderData,
        remainingTime: { value: 0, unit: 'days' }
    };
    const allPurchases = [...(config.purchases || []), newOrder];
    saveConfig({ ...config, purchases: allPurchases }, { redirect: false, revalidate: true });
    return newOrder;
  };

  const getPurchaseOrder = (orderId: string): Purchase | null => {
    return config?.purchases?.find(p => p.orderId === orderId) || null;
  };

  const activatePurchaseOrder = (allPurchases: Purchase[], orderId: string): ActivationResult => {
    if (!config || !config.admin) return { purchases: allPurchases };

    const purchaseToActivate = allPurchases.find(p => p.orderId === orderId);
    if (!purchaseToActivate) return { purchases: allPurchases };

    let newAdminSettings: AdminSettings = { ...(config.admin as AdminSettings) };
    let newAffiliateData: BrandsoftConfig['affiliate'] | undefined = config.affiliate ? { ...config.affiliate } : undefined;
    
    // Top-ups are simple activations without time logic.
    if (purchaseToActivate.planName === 'Wallet Top-up' || purchaseToActivate.planName.startsWith('Credit Purchase')) {
        const updatedPurchases = allPurchases.map(p => 
            p.orderId === orderId ? { ...p, status: 'active' as const, date: new Date().toISOString() } : p
        );
        return { purchases: updatedPurchases };
    }
    
    // Key Activation with Affiliate Commission
    if (purchaseToActivate.planName.toLowerCase().includes('key') && purchaseToActivate.affiliateId) {
        if(newAffiliateData && newAffiliateData.staffId === purchaseToActivate.affiliateId) {
            newAffiliateData = {
                ...newAffiliateData,
                unclaimedCommission: (newAffiliateData.unclaimedCommission || 0) + 10000,
                bonus: (newAffiliateData.bonus || 0) + 2000,
                transactions: [
                    { id: `TRN-COMM-${orderId}`, date: new Date().toISOString(), description: `Commission for Key Sale`, amount: 10000, type: 'credit' },
                    { id: `TRN-BONUS-${orderId}`, date: new Date().toISOString(), description: `Bonus for Key Sale`, amount: 2000, type: 'credit' },
                    ...(newAffiliateData.transactions || [])
                ],
            };
        }
    }


    const now = Date.now();
    let remainingMsFromOldPlan = 0;

    const currentActivePlan = allPurchases.find(p => p.status === 'active' && p.expiresAt);
    if (currentActivePlan) {
        const expiryTime = new Date(currentActivePlan.expiresAt).getTime();
        if (expiryTime > now) {
            remainingMsFromOldPlan = expiryTime - now;
        }
    }

    let period = purchaseToActivate.planPeriod;
    let periodReserve = purchaseToActivate.periodReserve || 0;
    let totalInitialDays = 0;

    // Logic for new key activation
    if (purchaseToActivate.planName.toLowerCase().includes('key')) {
        const freeDays = config.admin?.keyFreeDays || 30;
        const paidDays = config.admin?.keyPeriodReserveDays || 30;
        
        totalInitialDays = freeDays + paidDays;
        period = `${totalInitialDays} days`;
    }

    const isTestPlan = isTestPlanPeriod(period);

    const planDurations: Record<string, {days: number, isTest: boolean, unit: 'days' | 'minutes'}> = {
      '1 Month': { days: isTestPlan ? TEST_PERIOD_MINUTES['1 Month'] : 30, isTest: isTestPlan, unit: isTestPlan ? 'minutes' : 'days' },
      '3 Months': { days: isTestPlan ? TEST_PERIOD_MINUTES['3 Months'] : 90, isTest: isTestPlan, unit: isTestPlan ? 'minutes' : 'days' },
      '6 Months': { days: isTestPlan ? TEST_PERIOD_MINUTES['6 Months'] : 180, isTest: isTestPlan, unit: isTestPlan ? 'minutes' : 'days' },
      '1 Year': { days: isTestPlan ? TEST_PERIOD_MINUTES['1 Year'] : 365, isTest: isTestPlan, unit: isTestPlan ? 'minutes' : 'days' },
      'Once OFF': { days: 365 * 3, isTest: false, unit: 'days' },
    };
    
    let durationInfo = planDurations[period];

    if (!durationInfo && period.includes('days')) {
        const days = parseInt(period, 10) || 0;
        durationInfo = { days, isTest: false, unit: 'days' };
    } else if (!durationInfo) {
        durationInfo = { days: 0, isTest: false, unit: 'days' };
    }

    let activationDuration = durationInfo.days;
    let totalDurationMs = activationDuration * (durationInfo.unit === 'minutes' ? 60 * 1000 : 24 * 60 * 60 * 1000);
    
    // Manual payments use reserve. Wallet payments add directly.
    if (purchaseToActivate.paymentMethod !== 'wallet' && !isTestPlan && !purchaseToActivate.planName.toLowerCase().includes('key') && activationDuration > 30) {
        periodReserve += (activationDuration - 30);
        activationDuration = 30;
        totalDurationMs = activationDuration * 24 * 60 * 60 * 1000;
    }
    
    const expiresAt = new Date(now + totalDurationMs + remainingMsFromOldPlan).toISOString();

    const remainingValue = isTestPlan
        ? Math.ceil((totalDurationMs + remainingMsFromOldPlan) / (1000 * 60))
        : Math.ceil((totalDurationMs + remainingMsFromOldPlan) / (1000 * 60 * 60 * 24));

    let updatedPurchases = allPurchases.map(p => {
        if (p.orderId === orderId) {
            return {
                ...p,
                status: 'active' as const,
                date: new Date().toISOString(),
                remainingTime: { value: remainingValue, unit: durationInfo.unit },
                expiresAt,
                periodReserve,
            };
        }
        if (p.status === 'active') {
            return { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: 'days' as 'days' } };
        }
        return p;
    });

    const newlyActivatedPurchase = updatedPurchases.find(p => p.orderId === orderId);
    if (newlyActivatedPurchase && !newlyActivatedPurchase.planName.toLowerCase().includes('key')) {
        const price = parseFloat(newlyActivatedPurchase.planPrice.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(price)) {
            newAdminSettings.revenueFromPlans = (newAdminSettings.revenueFromPlans || 0) + price;
        }

        const activePlanPurchases = updatedPurchases.filter(p => p.status === 'active' && !p.planName.toLowerCase().includes('key'));
        const planCounts = activePlanPurchases.reduce((acc, p) => {
            acc[p.planName] = (acc[p.planName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const trending = Object.keys(planCounts).sort((a,b) => planCounts[b] - planCounts[a]);
        newAdminSettings.trendingPlan = trending[0] || 'None';
    }

    return { purchases: updatedPurchases, admin: newAdminSettings, affiliate: newAffiliateData };
};
  
  const declinePurchaseOrder = (orderId: string, reason: string) => {
    if (!config || !config.purchases) return;
    const updatedPurchases = config.purchases.map(p => {
      if (p.orderId === orderId) {
        return {
          ...p,
          status: 'declined' as const,
          declineReason: reason,
          isAcknowledged: false,
        };
      }
      if (p.status === 'active') {
        return { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: 'days' as 'days'} };
      }
      return p;
    });
    saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: true });
  };
  
  const acknowledgeDeclinedPurchase = (orderId: string) => {
    if (!config || !config.purchases) return;
    const updatedPurchases = config.purchases.map(p => 
      (p.orderId === orderId && p.status === 'declined') ? { ...p, isAcknowledged: true } : p
    );
    saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: true });
  };
  
  const updatePurchaseStatus = () => {
    if (!config?.purchases) return;

    let changed = false;
    let newConfig = { ...config };

    const updatedPurchases = newConfig.purchases.map(p => {
        if (p.status === 'active' && p.expiresAt) {
            const expiryTime = new Date(p.expiresAt).getTime();
            const now = Date.now();
            
            if (expiryTime <= now) {
                // Plan expired, check for reserve
                if (p.periodReserve && p.periodReserve > 0) {
                    changed = true;
                    const daysToActivate = Math.min(30, p.periodReserve);
                    const newReserve = p.periodReserve - daysToActivate;
                    const activationMs = daysToActivate * 24 * 60 * 60 * 1000;
                    
                     // Add commission to affiliate if applicable
                    if (newConfig.affiliate && p.customerId) {
                        const client = newConfig.companies.find(c => c.id === p.customerId);
                        if(client && client.referredBy === newConfig.affiliate.staffId) {
                            const commissionRate = newConfig.admin?.commissionRate || 0.10;
                            const price = parseFloat(p.planPrice.replace(/[^0-9.-]+/g, ""));
                            if (!isNaN(price)) {
                                const commissionAmount = price * commissionRate;
                                newConfig.affiliate.unclaimedCommission = (newConfig.affiliate.unclaimedCommission || 0) + commissionAmount;
                                newConfig.affiliate.transactions = [
                                    {
                                        id: `TRN-RENEW-${Date.now()}`,
                                        date: new Date().toISOString(),
                                        description: `Monthly renewal commission for ${client.companyName}`,
                                        amount: commissionAmount,
                                        type: 'credit'
                                    },
                                    ...(newConfig.affiliate.transactions || [])
                                ];
                            }
                        }
                    }

                    return {
                        ...p,
                        status: 'active' as const,
                        expiresAt: new Date(now + activationMs).toISOString(),
                        remainingTime: { value: daysToActivate, unit: 'days' as const },
                        periodReserve: newReserve,
                    };
                } else {
                    changed = true;
                    return { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: 'days' as const } };
                }
            } else {
                // Plan is still active, update remaining time
                const remainingMs = expiryTime - now;
                const isTest = isTestPlanPeriod(p.planPeriod);
                const unit = isTest ? 'minutes' : 'days';
                
                const remaining = isTest
                    ? Math.ceil(remainingMs / (1000 * 60))
                    : Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
                
                if (p.remainingTime?.value !== remaining || p.remainingTime?.unit !== unit) {
                    changed = true;
                    return { ...p, remainingTime: { value: remaining, unit } };
                }
            }
        }
        return p;
    });

    if (changed) {
        saveConfig({ ...newConfig, purchases: updatedPurchases }, { redirect: false, revalidate: false });
    }
};

  const downgradeToTrial = () => {
    if (!config) return;
    const updatedPurchases: Purchase[] = [];
    saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: true });
  };

  return {
    addPurchaseOrder,
    getPurchaseOrder,
    activatePurchaseOrder,
    declinePurchaseOrder,
    acknowledgeDeclinedPurchase,
    updatePurchaseStatus,
    downgradeToTrial,
  };
}
