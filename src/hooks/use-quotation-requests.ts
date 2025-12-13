
'use client';

import type { BrandsoftConfig, QuotationRequest, Customer } from '@/types/brandsoft';

const initialQuotationRequests: Omit<QuotationRequest, 'id' | 'date' | 'status' | 'requesterId' | 'requesterName'>[] = [
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
        companyIds: ['CUST-1625243512000', 'CUST-1625243514000'],
        items: [{ productName: 'Corporate Website', description: 'New 5-page responsive website with a blog and CMS integration.', quantity: 1 }],
    },
];

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
  
  const initializeDemoQuotationRequests = (currentConfig: BrandsoftConfig): BrandsoftConfig | null => {
    if (!currentConfig || currentConfig.quotationRequests?.length > 0) {
      return null;
    }

    const meAsCustomer = currentConfig.customers.find((c: Customer) => c.name === currentConfig.brand.businessName);
    
    if (!meAsCustomer) {
      return null;
    }

    const demoRequests = initialQuotationRequests.map((r, i) => ({
      ...r,
      id: `QR-DEMO-${i+1}`,
      requesterId: meAsCustomer.id,
      requesterName: meAsCustomer.name,
      date: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open' as const,
    }));
    
    const newConfig = { ...currentConfig, quotationRequests: demoRequests };
    return newConfig;
  };

  return {
    addQuotationRequest,
    initializeDemoQuotationRequests,
  };
}
