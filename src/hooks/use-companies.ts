
'use client';

import type { BrandsoftConfig, Company } from '@/types/brandsoft';

export function useCompanies(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {

  const addCompany = (company: Omit<Company, 'id'>): Company => {
      const newCompany = { ...company, id: `COMP-${Date.now()}` };
      if (config) {
          const newConfig = { ...config, companies: [...(config.companies || []), newCompany] };
          saveConfig(newConfig, { redirect: false, revalidate: false });
      }
      return newCompany;
  };
  
  const updateCompany = (companyId: string, data: Partial<Omit<Company, 'id'>>) => {
      if (config) {
          const newCompanies = (config.companies || []).map(c => 
              c.id === companyId ? { ...c, ...data } : c
          );
          saveConfig({ ...config, companies: newCompanies }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteCompany = (companyId: string) => {
      if (config) {
          const newCompanies = (config.companies || []).filter(c => c.id !== companyId);
          saveConfig({ ...config, companies: newCompanies }, { redirect: false, revalidate: false });
      }
  };

  return {
    addCompany,
    updateCompany,
    deleteCompany,
  };
}
