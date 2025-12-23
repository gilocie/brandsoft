
'use client';

import type { BrandsoftConfig, Purchase, AdminSettings, Company } from '@/types/brandsoft';
import { useCallback } from 'react';

const isTestPlanPeriod = (period: string, config: BrandsoftConfig | null) => period in (config?.admin?.demoDurations || {});


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
    
    let companyToUpdate = config.companies.find(c => c.id === orderData.customerId);
    if (companyToUpdate) {
        const newPurchases = [...(companyToUpdate.purchases || []), newOrder];
        const newCompanies = config.companies.map(c => c.id === orderData.customerId ? {...c, purchases: newPurchases} : c);
        saveConfig({ ...config, companies: newCompanies }, { redirect: false, revalidate: true });
    } else {
        console.error("Could not find company to add purchase order to.");
    }
    
    return newOrder;
  };

  const getPurchaseOrder = (orderId: string): Purchase | null => {
    if (!config || !config.companies) return null;
    for (const company of config.companies) {
        const purchase = (company.purchases || []).find(p => p.orderId === orderId);
        if (purchase) return purchase;
    }
    return null;
  };

  const activatePurchaseOrder = (orderId: string): void => {
    if (!config || !config.admin) return;

    let companyIdWithOrder: string | null = null;
    const company = config.companies.find(c => {
        const hasOrder = (c.purchases || []).some(p => p.orderId === orderId);
        if (hasOrder) companyIdWithOrder = c.id;
        return hasOrder;
    });

    if (!company || !companyIdWithOrder) return;
    
    let newAdminSettings: AdminSettings = { ...(config.admin as AdminSettings) };
    let newAffiliateData: BrandsoftConfig['affiliate'] | undefined = config.affiliate ? { ...config.affiliate } : undefined;

    const companyIndex = config.companies.findIndex(c => c.id === companyIdWithOrder);
    const updatedCompany = JSON.parse(JSON.stringify(config.companies[companyIndex]));

    let allPurchases = updatedCompany.purchases || [];
    const purchaseToActivate = allPurchases.find((p: Purchase) => p.orderId === orderId);

    if (!purchaseToActivate) return;
    
    if (purchaseToActivate.planName === 'Wallet Top-up' || purchaseToActivate.planName.startsWith('Credit Purchase')) {
        updatedCompany.purchases = allPurchases.map((p: Purchase) => 
            p.orderId === orderId ? { ...p, status: 'active' as const, date: new Date().toISOString() } : p
        );
    } else {
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
        const currentActivePlan = allPurchases.find((p: Purchase) => p.status === 'active' && p.expiresAt);
        if (currentActivePlan) {
            const expiryTime = new Date(currentActivePlan.expiresAt).getTime();
            if (expiryTime > now) {
                remainingMsFromOldPlan = expiryTime - now;
            }
        }

        let period = purchaseToActivate.planPeriod;
        let periodReserve = purchaseToActivate.periodReserve || 0;
        let totalInitialDays = 0;

        if (purchaseToActivate.planName.toLowerCase().includes('key')) {
            totalInitialDays = (config.admin.keyFreeDays || 30) + (config.admin.keyPeriodReserveDays || 30);
            period = `${totalInitialDays} days`;
        }
        
        const isTest = isTestPlanPeriod(period, config);

        const planDurations: Record<string, {days: number, isTest: boolean, unit: 'days' | 'minutes'}> = {
            '1 Month': { days: 30, isTest: false, unit: 'days' },
            '3 Months': { days: 90, isTest: false, unit: 'days' },
            '6 Months': { days: 180, isTest: false, unit: 'days' },
            '1 Year': { days: 365, isTest: false, unit: 'days' },
            'Once OFF': { days: 365 * 3, isTest: false, unit: 'days' },
        };
        let durationInfo = planDurations[period];
        if (!durationInfo && period.includes('days')) {
            durationInfo = { days: parseInt(period, 10) || 0, isTest: false, unit: 'days' };
        } else if (!durationInfo) {
            durationInfo = { days: 0, isTest: false, unit: 'days' };
        }
        
        let activationDuration = durationInfo.days;
        let totalDurationMs = activationDuration * (durationInfo.unit === 'minutes' ? 60 * 1000 : 24 * 60 * 60 * 1000);
        
        if (purchaseToActivate.paymentMethod !== 'wallet' && !isTest && !purchaseToActivate.planName.toLowerCase().includes('key') && activationDuration > 30) {
            periodReserve += (activationDuration - 30);
            activationDuration = 30;
            totalDurationMs = activationDuration * 24 * 60 * 60 * 1000;
        }
        
        const expiresAt = new Date(now + totalDurationMs + remainingMsFromOldPlan).toISOString();
        const remainingValue = isTest ? Math.ceil(remainingMsFromOldPlan / (1000 * 60)) + activationDuration : Math.ceil(remainingMsFromOldPlan / (1000 * 60 * 60 * 24)) + activationDuration;

        updatedCompany.purchases = allPurchases.map((p: Purchase) => {
            if (p.orderId === orderId) {
                return { ...p, status: 'active' as const, date: new Date().toISOString(), remainingTime: { value: remainingValue, unit: durationInfo.unit }, expiresAt, periodReserve };
            }
            if (p.status === 'active') {
                return { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: 'days' as 'days' } };
            }
            return p;
        });

        const newlyActivatedPurchase = updatedCompany.purchases.find((p: Purchase) => p.orderId === orderId);
        if (newlyActivatedPurchase && !newlyActivatedPurchase.planName.toLowerCase().includes('key')) {
            const price = parseFloat(newlyActivatedPurchase.planPrice.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(price)) {
                newAdminSettings.revenueFromPlans = (newAdminSettings.revenueFromPlans || 0) + price;
            }
            const activePlanPurchases = updatedCompany.purchases.filter((p: Purchase) => p.status === 'active' && !p.planName.toLowerCase().includes('key'));
            const planCounts = activePlanPurchases.reduce((acc: Record<string, number>, p: Purchase) => {
                acc[p.planName] = (acc[p.planName] || 0) + 1;
                return acc;
            }, {});
            const trending = Object.keys(planCounts).sort((a,b) => planCounts[b] - planCounts[a]);
            newAdminSettings.trendingPlan = trending[0] || 'None';
        }
    }
    
    const newCompanies = [...config.companies];
    newCompanies[companyIndex] = updatedCompany;
    
    saveConfig({ ...config, companies: newCompanies, admin: newAdminSettings, affiliate: newAffiliateData }, { revalidate: true });
  };
  
  const declinePurchaseOrder = (orderId: string, reason: string) => {
      if (!config || !config.companies) return;

      const newCompanies = config.companies.map(c => {
          const purchaseIndex = (c.purchases || []).findIndex(p => p.orderId === orderId);
          if (purchaseIndex > -1) {
              const newPurchases = [...(c.purchases || [])];
              newPurchases[purchaseIndex] = {
                  ...newPurchases[purchaseIndex],
                  status: 'declined' as const,
                  declineReason: reason,
                  isAcknowledged: false,
              };
              return { ...c, purchases: newPurchases };
          }
          return c;
      });
      saveConfig({ ...config, companies: newCompanies }, { redirect: false, revalidate: true });
  };
  
  const acknowledgeDeclinedPurchase = (orderId: string) => {
      if (!config || !config.companies) return;
      const newCompanies = config.companies.map(c => {
          const purchaseIndex = (c.purchases || []).findIndex(p => p.orderId === orderId && p.status === 'declined');
          if (purchaseIndex > -1) {
              const newPurchases = [...(c.purchases || [])];
              newPurchases[purchaseIndex].isAcknowledged = true;
              return { ...c, purchases: newPurchases };
          }
          return c;
      });
      saveConfig({ ...config, companies: newCompanies }, { redirect: false, revalidate: true });
  };
  
  const updatePurchaseStatus = useCallback(() => {
    if (!config) return;
  
    let changed = false;
    let newConfig = JSON.parse(JSON.stringify(config));
    const { demoClientId, demoDurations, demoStartedAt } = config.admin || {};
  
    let updatedCompanies = newConfig.companies.map((company: Company) => {
      if (!company.purchases) company.purchases = [];
  
      let newPurchases: Purchase[] = [];
      let hasRenewed = false; // Track renewal per company
  
      for (let p of [...company.purchases]) {
        const now = Date.now();
        let expiryTime: number;
        let timeUnit: 'days' | 'minutes' | 'seconds' = 'days';
  
        const isDemoClient = company.id === demoClientId;
        const hasDemoSettings = demoDurations && demoDurations[p.planName];
  
        if (isDemoClient && hasDemoSettings && demoStartedAt) {
          const demoSettings = demoDurations[p.planName];
          const demoStartTime = new Date(demoStartedAt).getTime();
          let durationMs = 0;
          timeUnit = demoSettings.unit as 'days' | 'minutes' | 'seconds';
  
          if (demoSettings.unit === 'seconds') durationMs = demoSettings.value * 1000;
          else if (demoSettings.unit === 'minutes') durationMs = demoSettings.value * 60 * 1000;
          else durationMs = demoSettings.value * 24 * 60 * 60 * 1000;
          
          expiryTime = demoStartTime + durationMs;
  
          if (expiryTime <= now) {
            if (p.status !== 'inactive' || p.remainingTime.value !== 0) {
              changed = true;
              p = { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: timeUnit } };
            }
          } else {
            const remainingMs = expiryTime - now;
            let remainingValue: number;
            if (timeUnit === 'seconds') remainingValue = Math.ceil(remainingMs / 1000);
            else if (timeUnit === 'minutes') remainingValue = Math.ceil(remainingMs / (1000 * 60));
            else remainingValue = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  
            if (p.remainingTime?.value !== remainingValue || p.remainingTime?.unit !== timeUnit || p.status !== 'active') {
              changed = true;
              p = { ...p, status: 'active' as const, remainingTime: { value: remainingValue, unit: timeUnit } };
            }
          }
        } else if (p.status === 'active' && p.expiresAt) {
          expiryTime = new Date(p.expiresAt).getTime();
          
          if (expiryTime <= now) {
            // Auto-renewal logic
            if (!hasRenewed && config.profile.autoRenew) {
              const planDetails = config.plans?.find(plan => plan.name === p.planName);
              const price = planDetails?.price || 0;
              if (price > 0 && (company.walletBalance || 0) >= price) {
                hasRenewed = true;
                changed = true;
                company.walletBalance = (company.walletBalance || 0) - price;
                
                const newExpiry = new Date(expiryTime + 30 * 24 * 60 * 60 * 1000).toISOString();
                const newPurchase: Purchase = {
                    orderId: `AUTO-RN-${Date.now()}`, planName: p.planName, planPrice: p.planPrice,
                    planPeriod: p.planPeriod, paymentMethod: 'wallet', status: 'active',
                    date: new Date().toISOString(), isAutoRenew: true, expiresAt: newExpiry,
                    remainingTime: { value: 30, unit: 'days' }
                };
                newPurchases.push(newPurchase);
                p = { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: 'days' } };
              }
            }

            if (p.status !== 'inactive') {
              changed = true;
              p = { ...p, status: 'inactive' as const, remainingTime: { value: 0, unit: 'days' } };
            }
          } else {
            const remainingMs = expiryTime - now;
            const remainingValue = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
            if (p.remainingTime?.value !== remainingValue) {
              changed = true;
              p = { ...p, remainingTime: { value: remainingValue, unit: 'days' as const } };
            }
          }
        }
        newPurchases.push(p);
      }
      company.purchases = newPurchases;
      return company;
    });
  
    if (changed) {
      saveConfig({ ...newConfig, companies: updatedCompanies }, { redirect: false, revalidate: false });
    }
  }, [config, saveConfig]);

  const downgradeToTrial = () => {
    if (!config) return;
    const myCompanyId = config.profile.id;
    const newCompanies = config.companies.map(c => {
        if (c.id === myCompanyId) {
            return { ...c, purchases: [] };
        }
        return c;
    });
    saveConfig({ ...config, companies: newCompanies }, { redirect: false, revalidate: true });
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
