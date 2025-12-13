
'use client';

import type { BrandsoftConfig, Company } from '@/types/brandsoft';

const initialCompanies: Company[] = [];

export function useCompanies(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {

   const getInitialCompanies = () => {
    if (!config) return [];
    
    // Check if the user's own business is already in the initial list to avoid duplicates
    const userBusinessName = config.brand.businessName;
    const userExists = initialCompanies.some(c => c.companyName === userBusinessName);
    
    if (userExists) {
      return initialCompanies;
    }

    // Create a profile for the software user if it doesn't exist in the demo data
    const userAsCompany: Company = {
      id: `COMP-${userBusinessName.replace(/\s+/g, '').toUpperCase()}`,
      name: userBusinessName,
      companyName: userBusinessName,
      email: config.profile.email,
      phone: config.profile.phone,
      address: config.profile.address,
      industry: config.profile.industry,
      town: config.profile.town,
      description: config.brand.description,
      logo: config.brand.logo,
      website: config.profile.website,
      customerType: 'company',
    };
    
    return [...initialCompanies, userAsCompany];
  };

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
    getInitialCompanies, // Make sure this is exported if used in setup
    addCompany,
    updateCompany,
    deleteCompany,
  };
}
