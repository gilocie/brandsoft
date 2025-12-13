
'use client';

import type { BrandsoftConfig, QuotationRequest } from '@/types/brandsoft';

export function useQuotationRequests(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {
  const addQuotationRequest = (request: QuotationRequest): QuotationRequest => {
    if (!config) throw new Error("Config not loaded");
    
    const newQuotationRequests = [...(config.quotationRequests || []), request];
    const newConfig = { ...config, quotationRequests: newQuotationRequests };
    
    saveConfig(newConfig, { redirect: false, revalidate: false });
    return request;
  };

  return {
    addQuotationRequest,
  };
}
