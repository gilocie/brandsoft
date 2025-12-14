

'use client';

import type { BrandsoftConfig, Quotation } from '@/types/brandsoft';

interface NumberingOptions {
  prefix?: string;
  startNumber?: number;
}

export function useQuotations(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {
  const addQuotation = (quotation: Omit<Quotation, 'quotationId'>, numbering?: NumberingOptions): Quotation => {
    if (!config) throw new Error("Config not loaded");
    const startNumber = numbering?.startNumber ?? config.profile.quotationStartNumber;
    const prefix = numbering?.prefix ?? config.profile.quotationPrefix;
    
    // Determine the next number based on the correct collection
    const quotationCount = quotation.isRequest 
        ? (config.requestResponses?.length || 0)
        : (config.quotations?.filter(q => !q.isRequest).length || 0);

    const nextNumber = (Number(startNumber) || 100) + quotationCount;
    const generatedId = `${prefix}${nextNumber}`.replace(/\s+/g, '');
    
    const newQuotation: Quotation = { ...quotation, quotationId: generatedId };

    let newConfig = { ...config };
    if (quotation.isRequest) {
        newConfig = { ...newConfig, requestResponses: [...(newConfig.requestResponses || []), newQuotation] };
    } else {
        newConfig = { ...newConfig, quotations: [...(newConfig.quotations || []), newQuotation] };
    }

    saveConfig(newConfig, { redirect: false, revalidate: false });
    return newQuotation;
  };

  const updateQuotation = (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => {
      if (config) {
          const newQuotations = (config.quotations || []).map(q => 
              q.quotationId === quotationId ? { ...q, ...data } : q
          );
           const newResponses = (config.requestResponses || []).map(q => 
              q.quotationId === quotationId ? { ...q, ...data } : q
          );
          saveConfig({ ...config, quotations: newQuotations, requestResponses: newResponses }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteQuotation = (quotationId: string) => {
      if (config) {
          const newQuotations = (config.quotations || []).filter(q => q.quotationId !== quotationId);
           const newResponses = (config.requestResponses || []).filter(q => q.quotationId !== quotationId);
          saveConfig({ ...config, quotations: newQuotations, requestResponses: newResponses }, { redirect: false, revalidate: false });
      }
  };

  return {
    addQuotation,
    updateQuotation,
    deleteQuotation,
  };
}
