
'use client';

import type { BrandsoftConfig, Company } from '@/types/brandsoft';

const initialCompanies: Company[] = [
    { 
        id: 'CUST-1625243511000', 
        name: 'John Banda', 
        email: 'john.banda@creativeprints.mw', 
        phone: '0999888777', 
        companyName: 'Creative Prints',
        description: 'High-quality digital and offset printing services.',
        industry: 'Printing Services',
        town: 'Blantyre',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz1/200',
        website: 'https://creativeprints.mw',
    },
    { 
        id: 'CUST-1625243512000', 
        name: 'Jane Chirwa', 
        email: 'jane.chirwa@bytesolutions.mw', 
        phone: '0888777666', 
        companyName: 'Byte Solutions',
        description: 'Custom software development and IT consulting.',
        industry: 'IT & Software',
        town: 'Lilongwe',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz2/200',
        website: 'https://bytesolutions.mw',
    },
    { 
        id: 'CUST-1625243513000', 
        name: 'Mike Phiri', 
        email: 'mike.phiri@maketsupplies.mw', 
        phone: '0991234567', 
        companyName: 'Makete Supplies',
        description: 'Leading supplier of office and school stationery.',
        industry: 'Office Supplies',
        town: 'Mzuzu',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz3/200',
        website: 'https://maketesupplies.mw',
    },
    { 
        id: 'CUST-1625243514000', 
        name: 'Grace Moyo', 
        email: 'grace.moyo@buildright.mw', 
        phone: '0884567890', 
        companyName: 'BuildRight Hardware',
        description: 'Your one-stop shop for building materials and hardware.',
        industry: 'Hardware & Construction',
        town: 'Zomba',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz4/200',
        website: 'https://buildright.mw',
    },
];

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
