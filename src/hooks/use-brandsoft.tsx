

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
import type { BrandsoftConfig, Company, Product, Invoice, Quotation, QuotationRequest, Purchase, Customer, Review, Affiliate, Transaction, AdminSettings, Plan, GeneratedKey } from '@/types/brandsoft';

export * from '@/types/brandsoft';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const VALID_SERIAL = 'BS-GSS-DEMO0000-000000';

const initialAffiliateData: Affiliate = {
    fullName: 'Sant',
    username: 'Sant',
    phone: '265994985371',
    password: 'password',
    profilePic: 'https://picsum.photos/seed/affiliate/200',
    affiliateLink: 'https://brandsoft.com/join?ref=sant',
    securityQuestion: false,
    idUploaded: false,
    isPinSet: false,
    myWallet: 2500,
    unclaimedCommission: 17500,
    totalSales: 17500,
    creditBalance: 50.00,
    bonus: 2500,
    staffId: 'BS-AFF-12345678',
    clients: [],
    transactions: [],
    generatedKeys: [],
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
  affiliateLogin: (username: string, password: string) => boolean;
  isAffiliateLoggedIn: boolean | null;
  affiliateLogout: () => void;
  role: 'client' | 'staff' | 'admin';
  setRole: (role: 'client' | 'staff' | 'admin') => void;
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
  addPurchaseOrder: (purchase: Omit<Purchase, 'remainingTime'>) => Purchase;
  getPurchaseOrder: (orderId: string) => Purchase | null;
  activatePurchaseOrder: (orderId: string) => void;
  declinePurchaseOrder: (orderId: string, reason: string) => void;
  acknowledgeDeclinedPurchase: (orderId: string) => void;
  updatePurchaseStatus: () => void;
  downgradeToTrial: () => void;
  addCreditPurchaseToAffiliate: (credits: number, orderId: string) => void;
  // Currency methods
  addCurrency: (currency: string) => void;
  // Review methods
  addReview: (review: Omit<Review, 'id'>) => void;
  // Key activation
  useActivationKey: (key: string, companyId: string) => boolean;
  // Affiliate registration
  registerAffiliate: (data: any) => string | null;
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
    
    const addCreditPurchaseToAffiliate = (credits: number, orderId: string) => {
      if (!config || !config.affiliate || !config.admin) return;
  
      const order = purchaseMethods.getPurchaseOrder(orderId);
      if (!order || !order.customerId) return;
  
      const costInMWK = parseFloat(order.planPrice.replace(/[^0-9.-]+/g,""));
      
      let newConfig = { ...config };
      
      const newAffiliateData: Affiliate = {
        ...initialAffiliateData,
        ...newConfig.affiliate,
      };
      
      newAffiliateData.creditBalance = (newAffiliateData.creditBalance || 0) - credits;
  
      const companyIndex = newConfig.companies.findIndex(c => c.id === order.customerId);
      if (companyIndex > -1) {
          const company = newConfig.companies[companyIndex];
          newConfig.companies[companyIndex] = {
              ...company,
              walletBalance: (company.walletBalance || 0) + costInMWK,
          };
      } else {
          console.error(`Company not found: ${order.customerId}`);
          return; 
      }
      
      if (newAffiliateData.clients) {
          const affiliateClientIndex = newAffiliateData.clients.findIndex(c => c.id === order.customerId);
          if (affiliateClientIndex > -1) {
              const client = newAffiliateData.clients[affiliateClientIndex];
              newAffiliateData.clients[affiliateClientIndex] = {
                  ...client,
                  walletBalance: (client.walletBalance || 0) + costInMWK, 
              };
          }
      }
      
      purchaseMethods.activatePurchaseOrder(orderId);
      
      const updatedConfigWithActivatedPurchase = get().config;

      const newAdminSettings: AdminSettings = {
          ...((updatedConfigWithActivatedPurchase || newConfig).admin as AdminSettings),
          soldCredits: ((updatedConfigWithActivatedPurchase || newConfig).admin?.soldCredits || 0) + credits,
      };
      
      newConfig.admin = newAdminSettings;
      newConfig.affiliate = newAffiliateData;
  
      saveConfig(newConfig, { revalidate: true });
    };
    
    const useActivationKey = (key: string, companyId: string): boolean => {
        if (!config || !config.affiliate?.generatedKeys) return false;

        const keyIndex = (config.affiliate.generatedKeys || []).findIndex(k => k.key === key && k.status === 'unused');
        
        if (keyIndex === -1) {
            return false;
        }
        
        const newConfig = JSON.parse(JSON.stringify(config));
        if (!newConfig.affiliate) return false;

        const keyData = newConfig.affiliate.generatedKeys[keyIndex];

        const freeDays = newConfig.admin?.keyFreeDays || 30;
        const paidDays = newConfig.admin?.keyPeriodReserveDays || 30;
        const totalDays = freeDays + paidDays;
        
        keyData.status = 'used';
        keyData.usedBy = companyId;
        keyData.remainingDays = totalDays; 

        newConfig.affiliate.generatedKeys[keyIndex] = keyData;

        saveConfig(newConfig, { revalidate: true });
        return true;
    };
    
    const registerAffiliate = (data: Omit<Affiliate, 'id'>): string | null => {
        if (config?.affiliate) {
            // In this demo, we only allow one affiliate.
            return null; 
        }
        
        const staffId = `BS-AFF-${Date.now().toString(36).toUpperCase()}`;
        const affiliateLink = `https://brandsoft.com/join?ref=${data.username}`;

        const newAffiliate: Affiliate = {
            ...initialAffiliateData,
            fullName: data.fullName,
            username: data.username,
            phone: data.phone,
            password: data.password, // In a real app, this should be hashed
            staffId: staffId,
            affiliateLink: affiliateLink,
        };

        const newConfig: BrandsoftConfig = {
            ...config!,
            affiliate: newAffiliate,
        };
        
        saveConfig(newConfig, { redirect: false });
        return staffId;
    };
    
    const get = () => ({ config });

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
        addCreditPurchaseToAffiliate,
        useActivationKey,
        registerAffiliate,
        get
    };
}


export function BrandsoftProvider({ children }: { children: ReactNode }) {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [config, setConfig] = useState<BrandsoftConfig | null>(null);
  const [role, setRole] = useState<'client' | 'staff' | 'admin'>('client');
  const [isAffiliateLoggedIn, setIsAffiliateLoggedIn] = useState<boolean | null>(null);
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
  
  const stripImageData = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => stripImageData(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const newObj: { [key: string]: any } = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          if (typeof value === 'string' && value.startsWith('data:image/') && key !== 'profilePic') {
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

    setConfig(newConfig);
    
    const strippedConfig = stripImageData(newConfig);
    
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(strippedConfig));
    } catch (error) {
        console.error("Failed to save configuration to localStorage:", error);
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
      
      const storedAffiliateLogin = sessionStorage.getItem('isAffiliateLoggedIn') === 'true';
      setIsAffiliateLoggedIn(storedAffiliateLogin);
      
      if (storedConfig) {
        let parsedConfig = JSON.parse(storedConfig);
        
        let needsSave = false;

        // Clean up global purchases if found
        if ((parsedConfig as any).purchases) {
            delete (parsedConfig as any).purchases;
            needsSave = true;
        }

        // Migration for wallet balance
        if (parsedConfig.affiliate?.clients && parsedConfig.companies) {
            parsedConfig.affiliate.clients.forEach((client: any) => {
                if (client.walletBalance && client.walletBalance > 0) {
                    const companyIndex = parsedConfig.companies.findIndex((c: Company) => c.id === client.id);
                    
                    if (companyIndex > -1) {
                        const currentCompanyBalance = parsedConfig.companies[companyIndex].walletBalance || 0;
                        
                        if (currentCompanyBalance === 0) {
                            parsedConfig.companies[companyIndex] = {
                                ...parsedConfig.companies[companyIndex],
                                walletBalance: client.walletBalance,
                            };
                            needsSave = true;
                        }
                    }
                }
            });
        }

        // Migration logic for affiliate data
        if (parsedConfig.affiliate) {
            const fieldsToCheck: (keyof Affiliate)[] = ['totalSales', 'creditBalance', 'bonus', 'staffId', 'phone', 'transactions', 'isPinSet', 'unclaimedCommission', 'myWallet', 'generatedKeys'];
            fieldsToCheck.forEach(field => {
                if (typeof parsedConfig.affiliate[field] === 'undefined') {
                    if (field === 'myWallet' && typeof (parsedConfig.affiliate as any).balance !== 'undefined') {
                        parsedConfig.affiliate.myWallet = (parsedConfig.affiliate as any).balance;
                        delete (parsedConfig.affiliate as any).balance;
                    } else {
                         (parsedConfig.affiliate as any)[field] = initialAffiliateData[field as keyof Affiliate];
                    }
                    needsSave = true;
                }
            });
            if (typeof (parsedConfig.affiliate as any).balance !== 'undefined') {
                delete (parsedConfig.affiliate as any).balance;
                needsSave = true;
            }
        }
        
        if (parsedConfig.affiliateSettings) {
            const adminSettings: AdminSettings = {
                ...(parsedConfig.affiliateSettings as Omit<AdminSettings, 'fullName' | 'username' | 'soldCredits' | 'creditsBoughtBack' | 'revenueFromKeys' | 'revenueFromPlans' | 'keysSold' | 'trendingPlan'>),
                soldCredits: (parsedConfig.affiliateSettings.maxCredits || 0) - (parsedConfig.affiliateSettings.availableCredits || 0),
                creditsBoughtBack: 0,
                revenueFromKeys: 0,
                revenueFromPlans: 0,
                keysSold: 0,
                trendingPlan: 'None',
            };
            parsedConfig.admin = adminSettings;
            delete parsedConfig.affiliateSettings;
            needsSave = true;
        }
        
        if (parsedConfig.companies) {
          parsedConfig.companies.forEach((c: Company) => {
            if (c.walletBalance === undefined) {
              c.walletBalance = 0;
              needsSave = true;
            }
          });
        }
        
        if (parsedConfig.profile && !(parsedConfig.profile as any).id) {
           const userCompany = (parsedConfig.companies || []).find((c:Company) => c.companyName === parsedConfig.brand.businessName);
           if (userCompany) {
              (parsedConfig.profile as any).id = userCompany.id;
              needsSave = true;
           }
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
    if (serial.toUpperCase() === VALID_SERIAL) {
      localStorage.setItem(LICENSE_KEY, 'true');
      setIsActivated(true);
      router.push('/setup');
      return true;
    }
    return false;
  };
  
  const affiliateLogin = (username: string, password: string): boolean => {
      if (!config?.affiliate) return false;
      
      const isUsernameMatch = config.affiliate.username.toLowerCase() === username.toLowerCase();
      // If no password is set on the account, allow the default password. Otherwise, check the stored one.
      const isPasswordMatch = !config.affiliate.password 
        ? password === 'password'
        : config.affiliate.password === password;

      if (isUsernameMatch && isPasswordMatch) {
          sessionStorage.setItem('isAffiliateLoggedIn', 'true');
          setIsAffiliateLoggedIn(true);
          setRole('staff');
          router.push('/office');
          return true;
      }
      return false;
  };

  const affiliateLogout = () => {
      sessionStorage.removeItem('isAffiliateLoggedIn');
      setIsAffiliateLoggedIn(false);
      setRole('client');
      router.push('/staff/login');
  };
  
  const logout = () => {
    localStorage.removeItem(LICENSE_KEY);
    localStorage.removeItem(CONFIG_KEY);
    setIsActivated(false);
    setIsConfigured(false);
    affiliateLogout(); // Also log out affiliate
    router.push('/activation');
  };
  
  const get = () => ({ config });

  const value: BrandsoftContextType = {
    isActivated,
    isConfigured,
    config,
    revalidate,
    activate,
    saveConfig,
    logout,
    role,
    setRole,
    affiliateLogin,
    affiliateLogout,
    isAffiliateLoggedIn,
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
