

'use client';

import type { BrandsoftConfig, QuotationRequest } from '@/types/brandsoft';

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

    const newOutgoingRequests = [...(config.outgoingRequests || []), newRequest];
    const newConfig = { ...config, outgoingRequests: newOutgoingRequests };
    
    saveConfig(newConfig, { redirect: false, revalidate: true });
    return newRequest;
  };
  

  const updateQuotationRequest = (requestId: string, data: Partial<Omit<QuotationRequest, 'id'>>) => {
      if (config) {
          const newOutgoing = (config.outgoingRequests || []).map(r => 
              r.id === requestId ? { ...r, ...data } : r
          );
           const newIncoming = (config.incomingRequests || []).map(r => 
              r.id === requestId ? { ...r, ...data } : r
          );
          saveConfig({ ...config, outgoingRequests: newOutgoing, incomingRequests: newIncoming }, { redirect: false, revalidate: true });
      }
  };

  const deleteQuotationRequest = (requestId: string) => {
      if (config) {
          const newOutgoing = (config.outgoingRequests || []).filter(r => r.id !== requestId);
           const newIncoming = (config.incomingRequests || []).filter(r => r.id !== requestId);
          saveConfig({ ...config, outgoingRequests: newOutgoing, incomingRequests: newIncoming }, { redirect: false, revalidate: true });
      }
  };

  return {
    addQuotationRequest,
    updateQuotationRequest,
    deleteQuotationRequest,
  };
}
