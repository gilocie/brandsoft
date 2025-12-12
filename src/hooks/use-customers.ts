
'use client';

import type { BrandsoftConfig, Customer } from '@/types/brandsoft';

export function useCustomers(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {
  const addCustomer = (customer: Omit<Customer, 'id'>): Customer => {
      const newCustomer = { ...customer, id: `CUST-${Date.now()}` };
      if (config) {
          const newConfig = { ...config, customers: [...config.customers, newCustomer] };
          saveConfig(newConfig, { redirect: false, revalidate: false });
      }
      return newCustomer;
  };
  
  const updateCustomer = (customerId: string, data: Partial<Omit<Customer, 'id'>>) => {
      if (config) {
          const newCustomers = config.customers.map(c => 
              c.id === customerId ? { ...c, ...data } : c
          );
          saveConfig({ ...config, customers: newCustomers }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteCustomer = (customerId: string) => {
      if (config) {
          const newCustomers = config.customers.filter(c => c.id !== customerId);
          saveConfig({ ...config, customers: newCustomers }, { redirect: false, revalidate: false });
      }
  };

  return {
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
