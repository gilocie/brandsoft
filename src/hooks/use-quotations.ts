
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
    const nextNumber = (Number(startNumber) || 100) + (config.quotations?.length || 0);
    const generatedId = `${prefix}${nextNumber}`.replace(/\s+/g, '');
    const newQuotation: Quotation = { ...quotation, quotationId: generatedId };
    const newConfig = { ...config, quotations: [...(config.quotations || []), newQuotation] };
    saveConfig(newConfig, { redirect: false, revalidate: false });
    return newQuotation;
  };

  const updateQuotation = (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => {
      if (config) {
          const newQuotations = (config.quotations || []).map(q => 
              q.quotationId === quotationId ? { ...q, ...data } : q
          );
          saveConfig({ ...config, quotations: newQuotations }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteQuotation = (quotationId: string) => {
      if (config) {
          const newQuotations = (config.quotations || []).filter(q => q.quotationId !== quotationId);
          saveConfig({ ...config, quotations: newQuotations }, { redirect: false, revalidate: false });
      }
  };

  return {
    addQuotation,
    updateQuotation,
    deleteQuotation,
  };
}
