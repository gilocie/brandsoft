
'use client';

import type { BrandsoftConfig, Purchase } from '@/types/brandsoft';

const TEST_PERIOD_MINUTES: Record<string, number> = {
  '1 Month': 10,
  '3 Months': 15,
  '6 Months': 30,
  '1 Year': 45,
};
const isTestPlanPeriod = (period: string) => period in TEST_PERIOD_MINUTES;

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

  const activatePurchaseOrder = (orderId: string) => {
    if (!config || !config.admin) return;

    const purchaseToActivate = config.purchases.find(p => p.orderId === orderId);
    if (!purchaseToActivate) return;
    
    let newConfig = { ...config };
    let newAdminSettings = { ...newConfig.admin };

    // Top-ups are simple activations without time logic.
    if (purchaseToActivate.planName === 'Wallet Top-up' || purchaseToActivate.planName.startsWith('Credit Purchase')) {
        const updatedPurchases = newConfig.purchases.map(p => 
            p.orderId === orderId ? { ...p, status: 'active' as const, date: new Date().toISOString() } : p
        );
        saveConfig({ ...newConfig, purchases: updatedPurchases }, { redirect: false, revalidate: true });
        return;
    }
    
    // Key Activation with Affiliate Commission
    if (purchaseToActivate.planName.toLowerCase().includes('key') && purchaseToActivate.affiliateId) {
        if(newConfig.affiliate && newConfig.affiliate.staffId === purchaseToActivate.affiliateId) {
            newConfig.affiliate = {
                ...newConfig.affiliate,
                unclaimedCommission: (newConfig.affiliate.unclaimedCommission || 0) + 10000,
                bonus: (newConfig.affiliate.bonus || 0) + 2000,
                transactions: [
                    { id: `TRN-COMM-${orderId}`, date: new Date().toISOString(), description: `Commission for Key Sale`, amount: 10000, type: 'credit' },
                    { id: `TRN-BONUS-${orderId}`, date: new Date().toISOString(), description: `Bonus for Key Sale`, amount: 2000, type: 'credit' },
                    ...(newConfig.affiliate.transactions || [])
                ],
            };
        }
    }


    const now = Date.now();
    let remainingMsFromOldPlan = 0;

    const currentActivePlan = newConfig.purchases.find(p => p.status === 'active' && p.expiresAt);
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
        const freeDays = newConfig.admin?.keyFreeDays || 30;
        const paidDays = newConfig.admin?.keyPeriodReserveDays || 30;
        
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

    if (!isTestPlan && !purchaseToActivate.planName.toLowerCase().includes('key') && activationDuration > 30) {
        periodReserve += (activationDuration - 30);
        activationDuration = 30;
    }
    
    const multiplier = durationInfo.unit === 'minutes' ? 60 * 1000 : 24 * 60 * 60 * 1000;
    const activationMs = activationDuration * multiplier;
    const expiresAt = new Date(now + activationMs + remainingMsFromOldPlan).toISOString();

    const remainingValue = isTestPlan
        ? Math.ceil((activationMs + remainingMsFromOldPlan) / (1000 * 60))
        : Math.ceil((activationMs + remainingMsFromOldPlan) / (1000 * 60 * 60 * 24));

    let updatedPurchases = newConfig.purchases.map(p => {
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


    saveConfig({ ...newConfig, purchases: updatedPurchases, admin: newAdminSettings }, { redirect: false, revalidate: true });
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
    const now = Date.now();
    let newConfig = { ...config };

    const updatedPurchases = newConfig.purchases.map(p => {
        if (p.status === 'active' && p.expiresAt) {
            const expiryTime = new Date(p.expiresAt).getTime();
            
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
                            const commissionAmount = 10000;
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
