
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const VALID_SERIAL = 'BRANDSOFT-2024';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
};

export type BrandsoftConfig = {
  brand: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    font: string;
    businessName: string;
  };
  profile: {
    address: string;
    phone: string;
    email: string;
    website: string;
    taxNumber: string;
    defaultCurrency: string;
  };
  modules: {
    invoice: boolean;
    certificate: boolean;
    idCard: boolean;
    quotation: boolean;
    marketing: boolean;
  };
  customers: Customer[];
  products: Product[];
  currencies: string[];
};

interface BrandsoftContextType {
  isActivated: boolean | null;
  isConfigured: boolean | null;
  config: BrandsoftConfig | null;
  activate: (serial: string) => boolean;
  saveConfig: (newConfig: BrandsoftConfig) => void;
  logout: () => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  addProduct: (product: Omit<Product, 'id'>) => Product;
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
        const parsedConfig = JSON.parse(configData);
        if (!parsedConfig.currencies) {
            parsedConfig.currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
        }
        setConfig(parsedConfig);
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

  const saveConfig = (newConfig: BrandsoftConfig) => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
      setIsConfigured(true);
      setConfig(newConfig);
      // Only redirect if they are not already on the dashboard.
      // This prevents redirects when just adding a customer/product.
      if (!window.location.pathname.startsWith('/dashboard') && !window.location.pathname.startsWith('/settings')) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error saving config to localStorage", error);
    }
  };
  
  const logout = () => {
    try {
      // For offline app, logout might not be a destructive action.
      // We can decide to clear config or not. For now, it does nothing.
      console.log("Logout function called, but it's a no-op for offline version.");
    } catch (error) {
        console.error("Error during logout", error);
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
    saveConfig(newConfig);
    return newCustomer;
  };

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
    saveConfig(newConfig);
    return newProduct;
  };

  const addCurrency = (currency: string) => {
    if (!config) throw new Error("Config not loaded");
    if (!config.currencies.includes(currency)) {
        const newConfig: BrandsoftConfig = {
            ...config,
            currencies: [...config.currencies, currency]
        };
        saveConfig(newConfig);
    }
  };

  const value = { isActivated, isConfigured, config, activate, saveConfig, logout, addCustomer, addProduct, addCurrency };

  return <BrandsoftContext.Provider value={value}>{children}</BrandsoftContext.Provider>;
}

export function useBrandsoft() {
  const context = useContext(BrandsoftContext);
  if (context === undefined) {
    throw new Error('useBrandsoft must be used within a BrandsoftProvider');
  }
  return context;
}
