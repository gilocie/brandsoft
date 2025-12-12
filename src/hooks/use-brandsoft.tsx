

'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hexToHsl } from '@/lib/utils';
import { useCustomers } from './use-customers';
import { useProducts } from './use-products';
import { useInvoices } from './use-invoices';
import { useQuotations } from './use-quotations';
import { usePurchases } from './use-purchases';
import { useCurrencies } from './use-currencies';
import type { BrandsoftConfig, Customer, Product, Invoice, Quotation, Purchase } from '@/types/brandsoft';

export * from '@/types/brandsoft';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const VALID_SERIAL = 'BRANDSOFT-2024';

interface BrandsoftContextType {
  isActivated: boolean | null;
  isConfigured: boolean | null;
  config: BrandsoftConfig | null;
  revalidate: () => void;
  activate: (serial: string) => boolean;
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void;
  logout: () => void;
  // Customer methods
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (customerId: string, data: Partial<Omit<Customer, 'id'>>) => void;
  deleteCustomer: (customerId: string) => void;
  // Product methods
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (productId: string, data: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (productId: string) => void;
  // Invoice methods
  addInvoice: (invoice: Omit<Invoice, 'invoiceId'>, numbering?: { prefix?: string; startNumber?: number; }) => Invoice;
  updateInvoice: (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => void;
  deleteInvoice: (invoiceId: string) => void;
  // Quotation methods
  addQuotation: (quotation: Omit<Quotation, 'quotationId'>, numbering?: { prefix?: string; startNumber?: number; }) => Quotation;
  updateQuotation: (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => void;
  deleteQuotation: (quotationId: string) => void;
  // Purchase methods
  addPurchaseOrder: (order: Omit<Purchase, 'remainingTime'>) => Purchase;
  getPurchaseOrder: (orderId: string) => Purchase | null;
  activatePurchaseOrder: (orderId: string) => void;
  declinePurchaseOrder: (orderId: string, reason: string) => void;
  acknowledgeDeclinedPurchase: (orderId: string) => void;
  updatePurchaseStatus: () => void;
  downgradeToTrial: () => void;
  // Currency methods
  addCurrency: (currency: string) => void;
}

const BrandsoftContext = createContext<BrandsoftContextType | undefined>(undefined);

export function BrandsoftProvider({ children }: { children: ReactNode }) {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [config, setConfig] = useState<BrandsoftConfig | null>(null);
  const router = useRouter();

  const revalidate = useCallback(() => {
    try {
      const storedConfig = localStorage.getItem(CONFIG_KEY);
      if (storedConfig) {
        setConfig(JSON.parse(storedConfig));
      }
    } catch (error) {
      console.error("Error revalidating config from localStorage", error);
    }
  }, []);


  useEffect(() => {
    try {
      const license = localStorage.getItem(LICENSE_KEY);
      const storedConfig = localStorage.getItem(CONFIG_KEY);
      setIsActivated(!!license);
      setIsConfigured(!!storedConfig);
      if (storedConfig) {
        setConfig(JSON.parse(storedConfig));
      }
    } catch (error) {
      console.error("Error accessing localStorage", error);
      setIsActivated(false);
      setIsConfigured(false);
    }
  }, []);

  useEffect(() => {
    if (config?.brand.primaryColor) {
      const primaryHsl = hexToHsl(config.brand.primaryColor);
      if (primaryHsl) {
        document.documentElement.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
      }
    }
    if (config?.brand.secondaryColor) {
      const accentHsl = hexToHsl(config.brand.secondaryColor);
       if (accentHsl) {
        document.documentElement.style.setProperty('--accent', `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`);
      }
    }
    if (config?.brand.buttonPrimaryBg) {
      document.documentElement.style.setProperty('--btn-primary-bg', config.brand.buttonPrimaryBg);
    }
    if (config?.brand.buttonPrimaryText) {
      document.documentElement.style.setProperty('--btn-primary-text', config.brand.buttonPrimaryText);
    }
    if (config?.brand.buttonPrimaryBgHover) {
      document.documentElement.style.setProperty('--btn-primary-bg-hover', config.brand.buttonPrimaryBgHover);
    }
    if (config?.brand.buttonPrimaryTextHover) {
      document.documentElement.style.setProperty('--btn-primary-text-hover', config.brand.buttonPrimaryTextHover);
    }
  }, [config]);

  const activate = (serial: string) => {
    if (serial === VALID_SERIAL) {
      localStorage.setItem(LICENSE_KEY, 'true');
      setIsActivated(true);
      router.push('/setup');
      return true;
    }
    return false;
  };
  
  const logout = () => {
    localStorage.removeItem(LICENSE_KEY);
    localStorage.removeItem(CONFIG_KEY);
    setIsActivated(false);
    setIsConfigured(false);
    router.push('/activation');
  };

  const saveConfig = (newConfig: BrandsoftConfig, options: { redirect?: boolean; revalidate?: boolean } = {}) => {
    const { redirect = true, revalidate: shouldRevalidate = false } = options;
    
    setConfig(newConfig);
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    setIsConfigured(true);

    if (shouldRevalidate) {
      // Dispatch a storage event to notify other tabs
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: CONFIG_KEY,
          newValue: JSON.stringify(newConfig),
          storageArea: localStorage,
        })
      );
    }

    if (redirect) {
      router.push('/dashboard');
    }
  };

  const customerMethods = useCustomers(config, saveConfig);
  const productMethods = useProducts(config, saveConfig);
  const invoiceMethods = useInvoices(config, saveConfig);
  const quotationMethods = useQuotations(config, saveConfig);
  const purchaseMethods = usePurchases(config, saveConfig);
  const currencyMethods = useCurrencies(config, saveConfig);

  const value: BrandsoftContextType = {
    isActivated,
    isConfigured,
    config,
    revalidate,
    activate,
    saveConfig,
    logout,
    ...customerMethods,
    ...productMethods,
    ...invoiceMethods,
    ...quotationMethods,
    ...purchaseMethods,
    ...currencyMethods,
  };

  return <BrandsoftContext.Provider value={value}>{children}</BrandsoftContext.Provider>;
}

export function useBrandsoft() {
  const context = useContext(BrandsoftContext);
  if (context === undefined) {
    throw new Error('useBrandsoft must be used within a BrandsoftProvider');
  }
  return context;
}
