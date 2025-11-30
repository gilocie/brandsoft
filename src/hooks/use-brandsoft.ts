
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandsoftConfig, Customer, Product } from './use-brandsoft.tsx';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const VALID_SERIAL = 'BRANDSOFT-2024';

interface BrandsoftContextType {
  isActivated: boolean | null;
  isConfigured: boolean | null;
  config: BrandsoftConfig | null;
  activate: (serial: string) => boolean;
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean }) => void;
  logout: () => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (customerId: string, data: Partial<Omit<Customer, 'id'>>) => void;
  deleteCustomer: (customerId: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (productId: string, data: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (productId: string) => void;
  addCurrency: (currency: string) => void;
}

const BrandsoftContext = createContext<BrandsoftContextType | undefined>(undefined);

export function BrandsoftProvider({ children }: { children: ReactNode }) {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [config, setConfig] = useState<BrandsoftConfig | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const license = localStorage.getItem(LICENSE_KEY);
      const configData = localStorage.getItem(CONFIG_KEY);

      setIsActivated(!!license);
      setIsConfigured(!!configData);
      if (configData) {
        setConfig(JSON.parse(configData));
      }
    } catch (error) {
      console.error("Error accessing localStorage", error);
      setIsActivated(false);
      setIsConfigured(false);
    }
  }, []);

  const activate = (serial: string) => {
    if (serial.trim() === VALID_SERIAL) {
      try {
        localStorage.setItem(LICENSE_KEY, JSON.stringify({ serial, activatedAt: new Date() }));
        setIsActivated(true);
        router.push('/setup');
        return true;
      } catch (error) {
        console.error("Error setting license in localStorage", error);
        return false;
      }
    }
    return false;
  };

  const saveConfig = (newConfig: BrandsoftConfig, options: { redirect?: boolean } = { redirect: true }) => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
      setIsConfigured(true);
      setConfig(newConfig);

      if (options.redirect) {
        const nonRedirectPaths = ['/dashboard', '/settings', '/products'];
        const isCustomerPage = window.location.pathname.startsWith('/customers');
        const isProductsPage = window.location.pathname.startsWith('/products');

        const shouldRedirect = !nonRedirectPaths.includes(window.location.pathname) && !isCustomerPage && !isProductsPage;
        
        if (shouldRedirect) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error("Error saving config to localStorage", error);
    }
  };
  
  const logout = () => {
    try {
      localStorage.removeItem(LICENSE_KEY);
      localStorage.removeItem(CONFIG_KEY);
      setIsActivated(false);
      setIsConfigured(false);
      setConfig(null);
      router.push('/activation');
    } catch (error) {
        console.error("Error clearing localStorage", error);
    }
  };

  const addCustomer = (customerData: Omit<Customer, 'id'>): Customer => {
    if (!config) throw new Error("Config not loaded");
    const newCustomer: Customer = {
      ...customerData,
      id: `CUST-${Date.now()}`
    };
    const newConfig: BrandsoftConfig = {
      ...config,
      customers: [...(config.customers || []), newCustomer],
    };
    saveConfig(newConfig, { redirect: false });
    return newCustomer;
  };
  
  const updateCustomer = (customerId: string, data: Partial<Omit<Customer, 'id'>>) => {
    if (!config) throw new Error("Config not loaded");
    const updatedCustomers = config.customers.map(c =>
      c.id === customerId ? { ...c, ...data } : c
    );
    const newConfig: BrandsoftConfig = {
      ...config,
      customers: updatedCustomers,
    };
    saveConfig(newConfig, { redirect: false });
  };

  const deleteCustomer = (customerId: string) => {
    if (!config) throw new Error("Config not loaded");
    const updatedCustomers = config.customers.filter(c => c.id !== customerId);
    const newConfig: BrandsoftConfig = {
        ...config,
        customers: updatedCustomers,
    };
    saveConfig(newConfig, { redirect: false });
  }

  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    if (!config) throw new Error("Config not loaded");
    const newProduct: Product = {
      ...productData,
      id: `PROD-${Date.now()}`
    };
    const newConfig: BrandsoftConfig = {
      ...config,
      products: [...(config.products || []), newProduct],
    };
    saveConfig(newConfig, { redirect: false });
    return newProduct;
  };

  const updateProduct = (productId: string, data: Partial<Omit<Product, 'id'>>) => {
    if (!config) throw new Error("Config not loaded");
    const updatedProducts = config.products.map(p =>
      p.id === productId ? { ...p, ...data } : p
    );
    const newConfig: BrandsoftConfig = {
      ...config,
      products: updatedProducts,
    };
    saveConfig(newConfig, { redirect: false });
  };
  
  const deleteProduct = (productId: string) => {
    if (!config) throw new Error("Config not loaded");
    const updatedProducts = config.products.filter(p => p.id !== productId);
    const newConfig: BrandsoftConfig = {
        ...config,
        products: updatedProducts,
    };
    saveConfig(newConfig, { redirect: false });
  }

   const addCurrency = (currency: string) => {
    if (!config) throw new Error("Config not loaded");
    if (!config.currencies.includes(currency)) {
        const newConfig: BrandsoftConfig = {
            ...config,
            currencies: [...config.currencies, currency]
        };
        saveConfig(newConfig, { redirect: false });
    }
  };


  const value = { isActivated, isConfigured, config, activate, saveConfig, logout, addCustomer, updateCustomer, deleteCustomer, addProduct, updateProduct, deleteProduct, addCurrency };

  return <BrandsoftContext.Provider value={value}>{children}</BrandsoftContext.Provider>;
}

export function useBrandsoft() {
  const context = useContext(BrandsoftContext);
  if (context === undefined) {
    throw new Error('useBrandsoft must be used within a BrandsoftProvider');
  }
  return context;
}

    