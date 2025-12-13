
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hexToHsl } from '@/lib/utils';
import { useCustomers } from './use-customers';
import { useProducts } from './use-products';
import { useInvoices } from './use-invoices';
import { useQuotations } from './use-quotations';
import { useQuotationRequests } from './use-quotation-requests';
import { usePurchases } from './use-purchases';
import { useCurrencies } from './use-currencies';
import type { BrandsoftConfig, Customer, Product, Invoice, Quotation, QuotationRequest } from '@/types/brandsoft';

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
  // Quotation Request methods
  addQuotationRequest: (request: QuotationRequest) => QuotationRequest;
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

const initialQuotationRequests: QuotationRequest[] = [
    {
        id: 'QR-DEMO-1',
        title: 'Office Stationery Supply for Q4',
        requesterId: 'CUST-DEMO-ME',
        requesterName: 'My Business Inc.',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        isPublic: true,
        items: [
            { productName: 'A4 Reams (box)', quantity: 20 },
            { productName: 'Blue Ballpoint Pens (box of 100)', quantity: 5 },
        ],
        status: 'open',
    },
    {
        id: 'QR-DEMO-2',
        title: 'Website Redesign Project',
        requesterId: 'CUST-DEMO-ME',
        requesterName: 'My Business Inc.',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        isPublic: false,
        companyIds: ['CUST-1625243512000', 'CUST-1625243514000'],
        items: [{ productName: 'Corporate Website', description: 'New 5-page responsive website with a blog and CMS integration.', quantity: 1 }],
        status: 'open',
    },
];

const initialIncomingQuotationRequests: Quotation[] = [
    {
        quotationId: 'IN-REQ-001',
        customer: 'My Business Inc.', // This will be replaced by the user's business name
        customerId: 'CUST-DEMO-ME', // This will be replaced by the user's business ID
        senderId: 'CUST-1625243512000', // From Olivia Smith / Smith Designs
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        validUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 850.00,
        status: 'Sent',
        subtotal: 850,
        lineItems: [{ description: 'New Office Signage', quantity: 1, price: 850 }],
        currency: 'USD',
        isRequest: true,
        notes: 'Request for new exterior and interior office signage.'
    },
    {
        quotationId: 'IN-REQ-002',
        customer: 'My Business Inc.',
        customerId: 'CUST-DEMO-ME',
        senderId: 'CUST-1625243514000', // From Emma Brown / Brown & Co.
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        validUntil: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 2500.00,
        status: 'Sent',
        subtotal: 2500,
        lineItems: [
            { description: 'Social Media Marketing Campaign - Q1', quantity: 1, price: 1500 },
            { description: 'Content Creation (10 posts)', quantity: 1, price: 1000 }
        ],
        currency: 'USD',
        isRequest: true,
    }
];

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
        const parsedConfig = JSON.parse(storedConfig);
        
        let shouldUpdateStorage = false;
        
        // Inject outgoing demo data if it doesn't exist
        if (!parsedConfig.quotationRequests?.some((r: QuotationRequest) => r.id.startsWith('QR-DEMO'))) {
            const meId = parsedConfig.customers.find((c: Customer) => c.name === parsedConfig.brand.businessName)?.id || 'CUST-DEMO-ME';
            const demoRequests = initialQuotationRequests.map(r => ({...r, requesterId: meId, requesterName: parsedConfig.brand.businessName}));
            parsedConfig.quotationRequests = [...(parsedConfig.quotationRequests || []), ...demoRequests];
            shouldUpdateStorage = true;
        }

        // Inject incoming demo data if it doesn't exist
        if (!parsedConfig.quotations?.some((q: Quotation) => q.quotationId.startsWith('IN-REQ'))) {
            const me = parsedConfig.customers.find((c: Customer) => c.name === parsedConfig.brand.businessName);
            if (me) {
                 const demoIncoming = initialIncomingQuotationRequests.map(q => ({
                    ...q, 
                    customerId: me.id,
                    customer: me.name
                }));
                parsedConfig.quotations = [...(parsedConfig.quotations || []), ...demoIncoming];
                shouldUpdateStorage = true;
            }
        }
        
        if (shouldUpdateStorage) {
             localStorage.setItem(CONFIG_KEY, JSON.stringify(parsedConfig));
        }

        setConfig(parsedConfig);
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
  const quotationRequestMethods = useQuotationRequests(config, saveConfig);
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
    ...quotationRequestMethods,
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
