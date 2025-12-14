

'use client';

import type { BrandsoftConfig, QuotationRequest, Customer } from '@/types/brandsoft';

export function useQuotationRequests(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {
  const addQuotationRequest = (request: Omit<QuotationRequest, 'id'>): QuotationRequest => {
    if (!config) throw new Error("Config not loaded");
    
    const newRequest: QuotationRequest = {
      ...request,
      id: `QR-${Date.now()}`,
      status: 'open',
    };

    const newQuotationRequests = [...(config.quotationRequests || []), newRequest];
    const newConfig = { ...config, quotationRequests: newQuotationRequests };
    
    saveConfig(newConfig, { redirect: false, revalidate: true });
    return newRequest;
  };
  

  const updateQuotationRequest = (requestId: string, data: Partial<Omit<QuotationRequest, 'id'>>) => {
      if (config) {
          const newRequests = (config.quotationRequests || []).map(r => 
              r.id === requestId ? { ...r, ...data } : r
          );
          saveConfig({ ...config, quotationRequests: newRequests }, { redirect: false, revalidate: true });
      }
  };

  const deleteQuotationRequest = (requestId: string) => {
      if (config) {
          const newRequests = (config.quotationRequests || []).filter(r => r.id !== requestId);
          saveConfig({ ...config, quotationRequests: newRequests }, { redirect: false, revalidate: true });
      }
  };

  return {
    addQuotationRequest,
    updateQuotationRequest,
    deleteQuotationRequest,
  };
}
