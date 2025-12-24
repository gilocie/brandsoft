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
      responseCount: 0,
      isFavourite: false,
      isSorted: false,
    };

    // Add to MY outgoing requests
    const newOutgoingRequests = [...(config.outgoingRequests || []), newRequest];
    
    // Also add to incoming so other users can see it
    // In a real app with a backend, this would be handled server-side
    const newIncomingRequests = [...(config.incomingRequests || []), newRequest];
    
    saveConfig({
      ...config,
      outgoingRequests: newOutgoingRequests,
      incomingRequests: newIncomingRequests,
    }, { redirect: false, revalidate: true });
    
    return newRequest;
  };

  const updateQuotationRequest = (requestId: string, data: Partial<Omit<QuotationRequest, 'id'>>) => {
    if (!config) return;
    
    // Update in outgoing requests
    const newOutgoing = (config.outgoingRequests || []).map(r => 
      r.id === requestId ? { ...r, ...data } : r
    );
    
    // Update in incoming requests
    const newIncoming = (config.incomingRequests || []).map(r => 
      r.id === requestId ? { ...r, ...data } : r
    );
    
    saveConfig({ 
      ...config, 
      outgoingRequests: newOutgoing, 
      incomingRequests: newIncoming 
    }, { redirect: false, revalidate: true });
  };

  const deleteQuotationRequest = (requestId: string) => {
    if (!config) return;
    
    const newOutgoing = (config.outgoingRequests || []).filter(r => r.id !== requestId);
    const newIncoming = (config.incomingRequests || []).filter(r => r.id !== requestId);
    
    saveConfig({ 
      ...config, 
      outgoingRequests: newOutgoing, 
      incomingRequests: newIncoming 
    }, { redirect: false, revalidate: true });
  };

  return {
    addQuotationRequest,
    updateQuotationRequest,
    deleteQuotationRequest,
  };
}