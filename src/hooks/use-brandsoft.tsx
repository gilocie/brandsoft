

'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hexToHsl } from '@/lib/utils';
import { useCompanies } from './use-companies';
import { useProducts } from './use-products';
import { useInvoices } from './use-invoices';
import { useQuotations } from './use-quotations';
import { useQuotationRequests } from './use-quotation-requests';
import { usePurchases } from './use-purchases';
import { useCurrencies } from './use-currencies';
import type { BrandsoftConfig, Company, Product, Invoice, Quotation, QuotationRequest, Purchase, Customer, Review, Affiliate, Transaction, AdminSettings, Plan } from '@/types/brandsoft';

export * from '@/types/brandsoft';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const VALID_SERIAL = 'BRANDSOFT-2024';

const initialAffiliateData: Affiliate = {
    fullName: 'Your Affiliate Name',
    username: 'affiliate_user',
    phone: '0999000111',
    profilePic: 'https://picsum.photos/seed/affiliate/200',
    affiliateLink: 'https://brandsoft.com/join?ref=affiliate_user',
    securityQuestion: true,
    idUploaded: false,
    isPinSet: false,
    myWallet: 0,
    unclaimedCommission: 0,
    totalSales: 0,
    creditBalance: 0,
    bonus: 0,
    staffId: 'BS-AFF-12345678',
    clients: [], // EMPTY THIS ARRAY to remove demo data
    transactions: [], // You might want to empty this too
    withdrawalMethods: {
        airtel: undefined,
        tnm: undefined,
        bank: undefined,
        bsCredits: undefined,
    },
    securityQuestionData: undefined,
};

interface BrandsoftContextType {
  isActivated: boolean | null;
  isConfigured: boolean | null;
  config: BrandsoftConfig | null;
  revalidate: () => void;
  activate: (serial: string) => boolean;
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void;
  logout: () => void;
  // Company methods
  addCompany: (company: Omit<Company, 'id'>) => Company;
  updateCompany: (companyId: string, data: Partial<Omit<Company, 'id'>>) => void;
  deleteCompany: (companyId: string) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
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
  addQuotationRequest: (request: Omit<QuotationRequest, 'id'>) => QuotationRequest;
  updateQuotationRequest: (requestId: string, data: Partial<Omit<QuotationRequest, 'id'>>) => void;
  deleteQuotationRequest: (requestId: string) => void;
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
  // Review methods
  addReview: (review: Omit<Review, 'id'>) => void;
}

const BrandsoftContext = createContext<BrandsoftContextType | undefined>(undefined);

function useBrandsoftData(config: BrandsoftConfig | null, saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void) {
    const companyMethods = useCompanies(config, saveConfig);
    const productMethods = useProducts(config, saveConfig);
    const invoiceMethods = useInvoices(config, saveConfig);
    const quotationMethods = useQuotations(config, saveConfig);
    const quotationRequestMethods = useQuotationRequests(config, saveConfig);
    const purchaseMethods = usePurchases(config, saveConfig);
    const currencyMethods = useCurrencies(config, saveConfig);

    const addCustomer = (customer: Omit<Customer, 'id'>): Customer => {
      const newCustomer: Customer = { ...customer, id: `CUST-${Date.now()}` };
      if (config) {
          const customers = config.customers || [];
          const newConfig = { ...config, customers: [...customers, newCustomer] };
          saveConfig(newConfig, { redirect: false, revalidate: false });
      }
      return newCustomer;
    };

    const addReview = (review: Omit<Review, 'id'>) => {
      if (!config) return;
      const newReview = { ...review, id: `REV-${Date.now()}` };
      const newConfig = {
        ...config,
        reviews: [...(config.reviews || []), newReview],
      };
      saveConfig(newConfig, { redirect: false, revalidate: true });
    };

    return {
        ...companyMethods,
        addCustomer,
        ...productMethods,
        ...invoiceMethods,
        ...quotationMethods,
        ...quotationRequestMethods,
        ...purchaseMethods,
        ...currencyMethods,
        addReview,
    };
}


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
  
  // This function recursively removes base64 image data from the config
  const stripImageData = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => stripImageData(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const newObj: { [key: string]: any } = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          // Critically, we preserve the `profilePic` to ensure it is saved.
          if (typeof value === 'string' && value.startsWith('data:image/') && key !== 'profilePic') {
            // Keep the property with an empty string or a placeholder
            newObj[key] = ''; 
          } else {
            newObj[key] = stripImageData(value);
          }
        }
      }
      return newObj;
    }
    return obj;
  };

  const saveConfig = (newConfig: BrandsoftConfig, options: { redirect?: boolean; revalidate?: boolean } = {}) => {
    const { redirect = true, revalidate: shouldRevalidate = false } = options;
    
    // Migrate old quotationRequests to new structure
    if (newConfig.quotationRequests && !newConfig.outgoingRequests) {
        const myUserId = newConfig.customers.find(c => c.companyName === newConfig.brand.businessName)?.id || 'CUST-DEMO-ME';
        newConfig.outgoingRequests = newConfig.quotationRequests.filter(r => r.requesterId === myUserId);
        newConfig.incomingRequests = newConfig.quotationRequests.filter(r => r.requesterId !== myUserId);
        delete (newConfig as any).quotationRequests;
    }

    setConfig(newConfig);
    
    // Before saving to localStorage, strip out any large base64 image data
    const strippedConfig = stripImageData(newConfig);
    
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(strippedConfig));
    } catch (error) {
        console.error("Failed to save configuration to localStorage:", error);
        // Optionally, notify the user that their changes couldn't be saved.
        alert("Error: Could not save your changes. The browser storage might be full.");
    }
    
    setIsConfigured(true);

    if (shouldRevalidate) {
      window.dispatchEvent(new CustomEvent('brandsoft-update'));
    }

    if (redirect) {
      router.push('/dashboard');
    }
  };

  const dataMethods = useBrandsoftData(config, saveConfig);

  useEffect(() => {
    try {
      const license = localStorage.getItem(LICENSE_KEY);
      const storedConfig = localStorage.getItem(CONFIG_KEY);
      setIsActivated(!!license);
      setIsConfigured(!!storedConfig);
      if (storedConfig) {
        let parsedConfig = JSON.parse(storedConfig);
        
        let needsSave = false;

        // Migration logic for quotation requests
        if (parsedConfig.quotationRequests && !parsedConfig.outgoingRequests) {
          const myUserId = parsedConfig.customers.find((c: Customer) => c.companyName === parsedConfig.brand.businessName)?.id || 'CUST-DEMO-ME';
          parsedConfig.outgoingRequests = parsedConfig.quotationRequests.filter((r: QuotationRequest) => r.requesterId === myUserId);
          parsedConfig.incomingRequests = parsedConfig.quotationRequests.filter((r: QuotationRequest) => r.requesterId !== myUserId);
          parsedConfig.requestResponses = parsedConfig.quotations?.filter((q: Quotation) => q.isRequest) || [];
          delete parsedConfig.quotationRequests;
          needsSave = true;
        }

        // Migration logic for affiliate data
        if (!parsedConfig.affiliate) {
            parsedConfig.affiliate = initialAffiliateData;
            needsSave = true;
        } else {
             // Ensure all new fields exist
            const fieldsToCheck: (keyof Affiliate)[] = ['totalSales', 'creditBalance', 'bonus', 'staffId', 'phone', 'transactions', 'isPinSet', 'unclaimedCommission', 'myWallet'];
            fieldsToCheck.forEach(field => {
                if (typeof parsedConfig.affiliate[field] === 'undefined') {
                    if (field === 'myWallet' && typeof parsedConfig.affiliate.balance !== 'undefined') {
                        parsedConfig.affiliate.myWallet = parsedConfig.affiliate.balance;
                        delete parsedConfig.affiliate.balance;
                    } else {
                         parsedConfig.affiliate[field] = initialAffiliateData[field];
                    }
                    needsSave = true;
                }
            });
            if (typeof parsedConfig.affiliate.balance !== 'undefined') {
                delete parsedConfig.affiliate.balance;
                needsSave = true;
            }
        }
        
        if (parsedConfig.affiliateSettings) {
            parsedConfig.admin = {
                ...parsedConfig.affiliateSettings,
                soldCredits: parsedConfig.affiliateSettings.maxCredits - parsedConfig.affiliateSettings.availableCredits,
            };
            delete parsedConfig.affiliateSettings;
            needsSave = true;
        }


        setConfig(parsedConfig);

        if (needsSave) {
          localStorage.setItem(CONFIG_KEY, JSON.stringify(parsedConfig));
        }

      }
    } catch (error) {
      console.error("Error accessing localStorage", error);
      setIsActivated(false);
      setIsConfigured(false);
    }
  }, []);
  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONFIG_KEY) {
        revalidate();
      }
    };
    const handleCustomUpdate = () => {
      revalidate();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('brandsoft-update', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('brandsoft-update', handleCustomUpdate);
    };
  }, [revalidate]);

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

  const value: BrandsoftContextType = {
    isActivated,
    isConfigured,
    config,
    revalidate,
    activate,
    saveConfig,
    logout,
    ...dataMethods,
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
