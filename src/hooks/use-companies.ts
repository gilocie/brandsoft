
'use client';

import type { BrandsoftConfig, Company } from '@/types/brandsoft';
import { saveImageToDB } from '@/hooks/use-brand-image';

// Helper to check if a value is a valid image data URL (uploaded by user)
const isDataUrl = (value: string | undefined): boolean => {
  if (!value) return false;
  return value.startsWith('data:image/');
};

export function useCompanies(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {

  const addCompany = async (companyData: Partial<Omit<Company, 'id'>>): Promise<Company> => {
      const companyId = `COMP-${Date.now()}`;
      
      let logoValue = companyData.logo;
      if (companyData.logo && isDataUrl(companyData.logo)) {
        try {
          await saveImageToDB(`company-logo-${companyId}`, companyData.logo);
          logoValue = 'indexed-db';
        } catch (error) { console.error('Failed to save logo to IndexedDB:', error); }
      }
      
      let coverValue = companyData.coverImage;
      if (companyData.coverImage && isDataUrl(companyData.coverImage)) {
        try {
          await saveImageToDB(`company-cover-${companyId}`, companyData.coverImage);
          coverValue = 'indexed-db';
        } catch (error) { console.error('Failed to save cover to IndexedDB:', error); }
      }
      
      const newCompany: Company = { 
        id: companyId,
        name: companyData.name || '',
        companyName: companyData.companyName || '',
        email: companyData.email || '',
        ...companyData,
        logo: logoValue,
        coverImage: coverValue,
      };
      
      if (config) {
          const newConfig = { ...config, companies: [...(config.companies || []), newCompany] };
          saveConfig(newConfig, { redirect: false, revalidate: false });
      }
      return newCompany;
  };
  
  const updateCompany = async (companyId: string, data: Partial<Omit<Company, 'id'>>) => {
      if (!config) return;
      
      let logoValue = data.logo;
      if (data.logo && isDataUrl(data.logo)) {
        try {
          await saveImageToDB(`company-logo-${companyId}`, data.logo);
          logoValue = 'indexed-db';
        } catch (error) { console.error('Failed to save logo to IndexedDB:', error); }
      }
      
      let coverValue = data.coverImage;
      if (data.coverImage && isDataUrl(data.coverImage)) {
        try {
          await saveImageToDB(`company-cover-${companyId}`, data.coverImage);
          coverValue = 'indexed-db';
        } catch (error) { console.error('Failed to save cover to IndexedDB:', error); }
      }
      
      const updatedData = {
        ...data,
        ...(logoValue !== undefined && { logo: logoValue }),
        ...(coverValue !== undefined && { coverImage: coverValue }),
      };
      
      const newCompanies = (config.companies || []).map(c => 
          c.id === companyId ? { ...c, ...updatedData, version: (c.version || 0) + 1 } : c
      );
      saveConfig({ ...config, companies: newCompanies }, { redirect: false, revalidate: true });
  };
  
  const deleteCompany = (companyId: string) => {
      if (config) {
          const newCompanies = (config.companies || []).filter(c => c.id !== companyId);
          saveConfig({ ...config, companies: newCompanies }, { redirect: false, revalidate: false });
      }
  };

  const getInitialCompanies = (): Omit<Company, 'id'>[] => {
    return [
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
          coverImage: 'https://picsum.photos/seed/bizcov1/1200/300',
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
          coverImage: 'https://picsum.photos/seed/bizcov2/1200/300',
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
          coverImage: 'https://picsum.photos/seed/bizcov3/1200/300',
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
          coverImage: 'https://picsum.photos/seed/bizcov4/1200/300',
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
          coverImage: 'https://picsum.photos/seed/bizcov5/1200/300',
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
          coverImage: 'https://picsum.photos/seed/bizcov6/1200/300',
          website: 'https://naturesbest.mw',
      }
    ];
  };

  return {
    addCompany,
    updateCompany,
    deleteCompany,
    getInitialCompanies,
  };
}
