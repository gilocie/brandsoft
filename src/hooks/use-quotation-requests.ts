

'use client';

import type { BrandsoftConfig, QuotationRequest, Customer } from '@/types/brandsoft';

const initialQuotationRequests: Omit<QuotationRequest, 'id' | 'date' | 'status' | 'requesterId' | 'requesterName' | 'requesterLogo' | 'dueDate'>[] = [
    {
        title: 'Office Stationery Supply for Q4',
        isPublic: true,
        items: [
            { productName: 'A4 Reams (box)', quantity: 20 },
            { productName: 'Blue Ballpoint Pens (box of 100)', quantity: 5 },
        ],
    },
    {
        title: 'Website Redesign Project',
        isPublic: false,
        companyIds: ['COMP-DEMO-1', 'COMP-DEMO-0'],
        items: [{ productName: 'Corporate Website', description: 'New 5-page responsive website with a blog and CMS integration.', quantity: 1 }],
    },
];

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
  
  const initializeDemoQuotationRequests = (currentConfig: BrandsoftConfig): BrandsoftConfig | null => {
    // This function is now handled by the main useSetup hook to ensure consistent IDs.
    // It can be kept here for potential future use or removed.
    // For now, it will do nothing to avoid conflicts.
    return null;
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
    initializeDemoQuotationRequests,
    updateQuotationRequest,
    deleteQuotationRequest,
  };
}
