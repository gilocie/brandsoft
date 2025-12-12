
'use client';

import type { BrandsoftConfig, Invoice } from '@/types/brandsoft';

interface NumberingOptions {
  prefix?: string;
  startNumber?: number;
}

export function useInvoices(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {
  const addInvoice = (invoice: Omit<Invoice, 'invoiceId'>, numbering?: NumberingOptions): Invoice => {
    if (!config) throw new Error("Config not loaded");
    const startNumber = numbering?.startNumber ?? config.profile.invoiceStartNumber;
    const prefix = numbering?.prefix ?? config.profile.invoicePrefix;
    const nextNumber = (Number(startNumber) || 100) + (config.invoices?.length || 0);
    const generatedId = `${prefix}${nextNumber}`.replace(/\s+/g, '');
    const newInvoice: Invoice = { ...invoice, invoiceId: generatedId };
    const newConfig = { ...config, invoices: [...(config.invoices || []), newInvoice] };
    saveConfig(newConfig, { redirect: false, revalidate: false });
    return newInvoice;
  };

  const updateInvoice = (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => {
      if (config) {
          const newInvoices = (config.invoices || []).map(i => 
              i.invoiceId === invoiceId ? { ...i, ...data } : i
          );
          saveConfig({ ...config, invoices: newInvoices }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteInvoice = (invoiceId: string) => {
      if (config) {
          const newInvoices = (config.invoices || []).filter(i => i.invoiceId !== invoiceId);
          saveConfig({ ...config, invoices: newInvoices }, { redirect: false, revalidate: false });
      }
  };

  return {
    addInvoice,
    updateInvoice,
    deleteInvoice,
  };
}
