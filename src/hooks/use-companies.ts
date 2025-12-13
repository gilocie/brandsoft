
'use client';

import type { BrandsoftConfig, Company } from '@/types/brandsoft';

const initialCompanies: Omit<Company, 'id'>[] = [
    { 
        name: 'John Banda', 
        email: 'john.banda@creativeprints.mw', 
        phone: '0999888777', 
        companyName: 'Creative Prints',
        description: 'High-quality digital and offset printing services for businesses and individuals.',
        industry: 'Printing Services',
        town: 'Blantyre',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz1/200',
        website: 'https://creativeprints.mw',
    },
    { 
        name: 'Jane Chirwa', 
        email: 'jane.chirwa@bytesolutions.mw', 
        phone: '0888777666', 
        companyName: 'Byte Solutions',
        description: 'Custom software development, IT consulting, and network security solutions.',
        industry: 'IT & Software',
        town: 'Lilongwe',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz2/200',
        website: 'https://bytesolutions.mw',
    },
    { 
        name: 'Mike Phiri', 
        email: 'mike.phiri@maketesupplies.mw', 
        phone: '0991234567', 
        companyName: 'Makete Supplies',
        description: 'Leading supplier of office stationery, school supplies, and computer consumables.',
        industry: 'Office Supplies',
        town: 'Mzuzu',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz3/200',
        website: 'https://maketesupplies.mw',
    },
    { 
        name: 'Grace Moyo', 
        email: 'grace.moyo@buildright.mw', 
        phone: '0884567890', 
        companyName: 'BuildRight Hardware',
        description: 'Your one-stop shop for building materials, tools, and quality hardware.',
        industry: 'Hardware & Construction',
        town: 'Zomba',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz4/200',
        website: 'https://buildright.mw',
    },
    {
        name: 'Thoko Kamwendo',
        email: 'info@urbanoasis.mw',
        phone: '0995550101',
        companyName: 'Urban Oasis Cafe',
        description: 'A modern cafe serving artisanal coffee, fresh pastries, and light lunches.',
        industry: 'Hospitality',
        town: 'Blantyre',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz5/200',
        website: 'https://urbanoasis.mw',
    },
    {
        name: 'David Ngwira',
        email: 'sales@naturesbest.mw',
        phone: '0881112233',
        companyName: 'Nature\'s Best Farms',
        description: 'Suppliers of fresh, organic vegetables and fruits to businesses and restaurants.',
        industry: 'Agriculture',
        town: 'Lilongwe',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz6/200',
        website: 'https://naturesbest.mw',
    }
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
