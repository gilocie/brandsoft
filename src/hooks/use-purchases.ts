
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
    if (!config || !config.purchases) return;
  
    const purchaseToActivate = config.purchases.find(p => p.orderId === orderId);
    if (!purchaseToActivate) return;
  
    const period = purchaseToActivate.planPeriod;
    const now = Date.now();
    const isTestPlan = isTestPlanPeriod(period);
  
    const newPlanDuration = isTestPlan ? TEST_PERIOD_MINUTES[period] : {
      '1 Month': 30,
      '3 Months': 90,
      '6 Months': 180,
      '1 Year': 365,
      'Once OFF': 365*3
    }[period] ?? 0;
  
    const unit: 'minutes' | 'days' = isTestPlan ? 'minutes' : 'days';
    const multiplier = isTestPlan ? 60 * 1000 : 24 * 60 * 60 * 1000;
  
    const expiresAt = new Date(now + newPlanDuration * multiplier).toISOString();
  
    const updatedPurchases = config.purchases.map(p => {
      if (p.orderId === orderId) {
        return {
          ...p,
          status: 'active' as const,
          date: new Date().toISOString(),
          remainingTime: { value: newPlanDuration, unit },
          expiresAt,
        };
      }
      if (p.status === 'active') {
        return { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: 'days' as const } };
      }
      return p;
    });
  
    saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: true });
  };
  
  const declinePurchaseOrder = (orderId: string, reason: string) => {
    if (!config || !config.purchases) return;
    const updatedPurchases = config.purchases.map(p =>
      p.orderId === orderId
        ? {
            ...p,
            status: 'declined' as 'declined',
            declineReason: reason,
            isAcknowledged: false,
          }
        : p
    );
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

    const updatedPurchases = config.purchases.map(p => {
      if (p.status === 'active' && p.expiresAt) {
        const expiryTime = new Date(p.expiresAt).getTime();
        const remainingMs = expiryTime - now;
        const isTest = isTestPlanPeriod(p.planPeriod);

        if (remainingMs <= 0) {
          changed = true;
          return { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: 'minutes' as const } };
        }

        const remaining = isTest
            ? Math.ceil(remainingMs / (1000 * 60))
            : Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
        const unit: 'minutes' | 'days' = isTest ? 'minutes' : 'days';

        if (p.remainingTime?.value !== remaining || p.remainingTime?.unit !== unit) {
          changed = true;
          return { ...p, remainingTime: { value: remaining, unit } };
        }
      }
      return p;
    });

    if (changed) {
      saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: false });
    }
  };

  return {
    addPurchaseOrder,
    getPurchaseOrder,
    activatePurchaseOrder,
    declinePurchaseOrder,
    acknowledgeDeclinedPurchase,
    updatePurchaseStatus,
  };
}
