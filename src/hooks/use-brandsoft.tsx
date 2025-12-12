

'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { hexToHsl } from '@/lib/utils';
import { Page } from '@/stores/canvas-store';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const VALID_SERIAL = 'BRANDSOFT-2024';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
  companyAddress?: string;
  vatNumber?: string;
  associatedProductIds?: string[];
  customerType?: 'personal' | 'company';
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: 'product' | 'service';
};

export type LineItem = {
    productId?: string;
    description: string;
    quantity: number;
    price: number;
};

export interface DesignSettings {
    logo?: string;
    backgroundColor?: string;
    textColor?: string;
    headerImage?: string;
    headerImageOpacity?: number;
    footerImage?: string;
    footerImageOpacity?: number;
    backgroundImage?: string;
    backgroundImageOpacity?: number;
    watermarkText?: string;
    watermarkColor?: string;
    watermarkOpacity?: number;
    watermarkFontSize?: number;
    watermarkAngle?: number;
    headerColor?: string;
    footerColor?: string;
    footerContent?: string;
    // Visibility toggles
    showLogo?: boolean;
    showBusinessAddress?: boolean;
    showInvoiceTitle?: boolean;
    showBillingAddress?: boolean;
    showDates?: boolean;
    showPaymentDetails?: boolean;
    showNotes?: boolean;
    showBrandsoftFooter?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
    paymentDetails?: string;
}

export type Invoice = {
    invoiceId: string;
    customer: string;
    customerId?: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'Paid' | 'Pending' | 'Overdue' | 'Canceled' | 'Draft';
    subtotal?: number;
    discount?: number;
    discountType?: 'percentage' | 'flat';
    discountValue?: number;
    tax?: number;
    taxName?: string;
    taxType?: 'percentage' | 'flat';
    taxValue?: number;
    shipping?: number;
    notes?: string;
    lineItems?: LineItem[];
    partialPayment?: number;
    partialPaymentType?: 'percentage' | 'flat';
    partialPaymentValue?: number;
    design?: DesignSettings;
    currency?: string;
};

export type Quotation = {
    quotationId: string;
    customer: string;
    customerId?: string;
    date: string;
    validUntil: string;
    amount: number;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
    subtotal?: number;
    discount?: number;
    discountType?: 'percentage' | 'flat';
    discountValue?: number;
    tax?: number;
    taxName?: string;
    taxType?: 'percentage' | 'flat';
    taxValue?: number;
    shipping?: number;
    notes?: string;
    lineItems?: LineItem[];
    partialPayment?: number;
    partialPaymentType?: 'percentage' | 'flat';
    partialPaymentValue?: number;
    design?: DesignSettings;
    currency?: string;
};

export type Purchase = {
    orderId: string;
    planName: string;
    planPrice: string;
    planPeriod: string;
    paymentMethod: string;
    status: 'pending' | 'active' | 'declined' | 'inactive';
    date: string;
    receipt?: string | 'none';
    whatsappNumber?: string;
    declineReason?: string;
    isAcknowledged?: boolean;
    expiresAt?: string;
}


export type BrandsoftTemplate = {
  id: string;
  name: string;
  description?: string;
  category: 'invoice' | 'quotation' | 'certificate' | 'id-card' | 'marketing';
  pages: Page[];
  previewImage?: string; // data URL
  createdAt?: string;
};


export type BrandsoftConfig = {
  brand: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    font: string;
    businessName: string;
    brandsoftFooter: boolean;
    headerImage?: string;
    footerImage?: string;
    backgroundImage?: string;
    watermarkImage?: string;
    footerContent?: string;
    showCustomerAddress: boolean;
    backgroundColor?: string;
    textColor?: string;
    // Default visibility
    showLogo?: boolean;
    showBusinessAddress?: boolean;
    showInvoiceTitle?: boolean;
    showBillingAddress?: boolean;
    showDates?: boolean;
    showPaymentDetails?: boolean;
    showNotes?: boolean;
    showBrandsoftFooter?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
    // Button styles
    buttonPrimaryBg?: string;
    buttonPrimaryBgHover?: string;
    buttonPrimaryText?: string;
    buttonPrimaryTextHover?: string;
  };
  profile: {
    address: string;
    phone: string;
    email: string;
    website: string;
    taxNumber: string;
    defaultCurrency: string;
    paymentDetails?: string;
    invoicePrefix?: string;
    invoiceStartNumber?: number;
    quotationPrefix?: string;
    quotationStartNumber?: number;
    defaultInvoiceTemplate?: DesignSettings | string;
    defaultQuotationTemplate?: DesignSettings | string;
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
  invoices: Invoice[];
  quotations: Quotation[];
  templates: BrandsoftTemplate[];
  currencies: string[];
  purchases?: Purchase[];
};

interface NumberingOptions {
  prefix?: string;
  startNumber?: number;
}

interface BrandsoftContextType {
  isActivated: boolean | null;
  isConfigured: boolean | null;
  config: BrandsoftConfig | null;
  activate: (serial: string) => boolean;
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void;
  logout: () => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (customerId: string, data: Partial<Omit<Customer, 'id'>>) => void;
  deleteCustomer: (customerId: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (productId: string, data: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (productId: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'invoiceId'>, numbering?: NumberingOptions) => Invoice;
  updateInvoice: (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => void;
  deleteInvoice: (invoiceId: string) => void;
  addQuotation: (quotation: Omit<Quotation, 'quotationId'>, numbering?: NumberingOptions) => Quotation;
  updateQuotation: (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => void;
  deleteQuotation: (quotationId: string) => void;
  addCurrency: (currency: string) => void;
  addPurchaseOrder: (order: Purchase) => Purchase;
  getPurchaseOrder: (orderId: string) => Purchase | null;
  activatePurchaseOrder: (orderId: string) => void;
  declinePurchaseOrder: (orderId: string, reason: string) => void;
  acknowledgeDeclinedPurchase: (orderId: string) => void;
  updatePurchaseStatus: () => void;
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
    const { redirect = true, revalidate = false } = options;
    
    // Update state first
    setConfig(newConfig);
    
    // Save to localStorage
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    setIsConfigured(true);

    if (revalidate) {
      // For same-tab updates
      window.dispatchEvent(new Event('brandsoft-update'));
      
      // For cross-tab updates (with proper structure)
      window.dispatchEvent(new StorageEvent('storage', {
        key: CONFIG_KEY,
        newValue: JSON.stringify(newConfig),
        url: window.location.href,
        storageArea: localStorage
      }));
    }

    if (redirect) {
      router.push('/dashboard');
    }
  };
  
  const addPurchaseOrder = (orderData: Purchase): Purchase => {
    if (!config) throw new Error("Configuration not loaded.");
    const allPurchases = [...(config.purchases || []), orderData];
    saveConfig({ ...config, purchases: allPurchases }, { redirect: false, revalidate: true });
    return orderData;
  };

  const getPurchaseOrder = (orderId: string): Purchase | null => {
    return config?.purchases?.find(p => p.orderId === orderId) || null;
  };

  const activatePurchaseOrder = (orderId: string) => {
    if (!config || !config.purchases) return;

    const purchase = config.purchases.find(p => p.orderId === orderId);
    if (!purchase) return;

    const periodMap: { [key: string]: number } = {
      '1 Month': 30, '3 Months': 90, '6 Months': 180, '1 Year': 365,
      'Once OFF': 365 * 3,
    };
    const durationDays = periodMap[purchase.planPeriod] || 30;
    const expiresAt = new Date(new Date().getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const updatedPurchases = config.purchases.map(p => {
      if (p.orderId === orderId) {
        return { ...p, status: 'active' as 'active', expiresAt };
      }
      // Deactivate any other active plan
      if (p.status === 'active') {
        return { ...p, status: 'inactive' as 'inactive' };
      }
      return p;
    });

    saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: true });
  };
  
  const declinePurchaseOrder = (orderId: string, reason: string) => {
    if (!config || !config.purchases) return;
    const updatedPurchases = config.purchases.map(p =>
      p.orderId === orderId
        ? {
            ...p,
            status: 'declined' as 'declined',
            declineReason: reason,
            isAcknowledged: false,
          }
        : p
    );
    saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: true });
  };
  
  const acknowledgeDeclinedPurchase = (orderId: string) => {
    if (!config || !config.purchases) return;
    const updatedPurchases = config.purchases.map(p => 
      (p.orderId === orderId && p.status === 'declined') ? { ...p, isAcknowledged: true } : p
    );
    saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false, revalidate: true });
  };
  
  const updatePurchaseStatus = () => {
    if (!config || !config.purchases) return;

    let configChanged = false;
    const now = new Date().getTime();
    
    // We get the fresh config directly from localStorage here
    const storedConfig = localStorage.getItem(CONFIG_KEY);
    const freshConfig = storedConfig ? JSON.parse(storedConfig) : config;

    const updatedPurchases = (freshConfig.purchases || []).map((p: Purchase) => {
      if (p.status === 'active' && p.expiresAt) {
        const expiryTime = new Date(p.expiresAt).getTime();
        if (now >= expiryTime) {
          configChanged = true;
          return { ...p, status: 'inactive' as 'inactive' };
        }
      }
      return p;
    });

    if (configChanged || JSON.stringify(config.purchases) !== JSON.stringify(updatedPurchases)) {
      saveConfig({ ...freshConfig, purchases: updatedPurchases }, { redirect: false, revalidate: false });
    } else {
        // If nothing changed but the hook's state is stale, update it
        if(JSON.stringify(config) !== JSON.stringify(freshConfig)) {
            setConfig(freshConfig);
        }
    }
  };

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

   const addProduct = (product: Omit<Product, 'id'>): Product => {
      const newProduct = { ...product, id: `PROD-${Date.now()}` };
      if (config) {
          const newConfig = { ...config, products: [...(config.products || []), newProduct] };
          saveConfig(newConfig, { redirect: false, revalidate: false });
      }
      return newProduct;
  };
  
  const updateProduct = (productId: string, data: Partial<Omit<Product, 'id'>>) => {
      if (config) {
          const newProducts = (config.products || []).map(p => 
              p.id === productId ? { ...p, ...data } : p
          );
          saveConfig({ ...config, products: newProducts }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteProduct = (productId: string) => {
      if (config) {
          const newProducts = (config.products || []).filter(p => p.id !== productId);
          saveConfig({ ...config, products: newProducts }, { redirect: false, revalidate: false });
      }
  };
  
  const addInvoice = (invoice: Omit<Invoice, 'invoiceId'>, numbering?: NumberingOptions): Invoice => {
    if (!config) throw new Error("Config not loaded");
    const startNumber = numbering?.startNumber ?? config.profile.invoiceStartNumber;
    const prefix = numbering?.prefix ?? config.profile.invoicePrefix;
    const nextNumber = (Number(startNumber) || 100) + (config.invoices?.length || 0);
    const generatedId = `${prefix}${nextNumber}`.replace(/\s+/g, '');
    const newInvoice: Invoice = { ...invoice, invoiceId: generatedId };
    const newConfig = { ...config, invoices: [...(config.invoices || []), newInvoice] };
    saveConfig(newConfig, { redirect: false, revalidate: false });
    return newInvoice;
  };

  const updateInvoice = (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => {
      if (config) {
          const newInvoices = (config.invoices || []).map(i => 
              i.invoiceId === invoiceId ? { ...i, ...data } : i
          );
          saveConfig({ ...config, invoices: newInvoices }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteInvoice = (invoiceId: string) => {
      if (config) {
          const newInvoices = (config.invoices || []).filter(i => i.invoiceId !== invoiceId);
          saveConfig({ ...config, invoices: newInvoices }, { redirect: false, revalidate: false });
      }
  };
  
   const addQuotation = (quotation: Omit<Quotation, 'quotationId'>, numbering?: NumberingOptions): Quotation => {
    if (!config) throw new Error("Config not loaded");
    const startNumber = numbering?.startNumber ?? config.profile.quotationStartNumber;
    const prefix = numbering?.prefix ?? config.profile.quotationPrefix;
    const nextNumber = (Number(startNumber) || 100) + (config.quotations?.length || 0);
    const generatedId = `${prefix}${nextNumber}`.replace(/\s+/g, '');
    const newQuotation: Quotation = { ...quotation, quotationId: generatedId };
    const newConfig = { ...config, quotations: [...(config.quotations || []), newQuotation] };
    saveConfig(newConfig, { redirect: false, revalidate: false });
    return newQuotation;
  };

  const updateQuotation = (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => {
      if (config) {
          const newQuotations = (config.quotations || []).map(q => 
              q.quotationId === quotationId ? { ...q, ...data } : q
          );
          saveConfig({ ...config, quotations: newQuotations }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteQuotation = (quotationId: string) => {
      if (config) {
          const newQuotations = (config.quotations || []).filter(q => q.quotationId !== quotationId);
          saveConfig({ ...config, quotations: newQuotations }, { redirect: false, revalidate: false });
      }
  };
  
  const addCurrency = (currency: string) => {
      if (config && !config.currencies.includes(currency)) {
          const newConfig = { ...config, currencies: [...config.currencies, currency] };
          saveConfig(newConfig, { redirect: false, revalidate: false });
      }
  };

  const value: BrandsoftContextType = {
    isActivated,
    isConfigured,
    config,
    activate,
    saveConfig,
    logout,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addProduct,
    updateProduct,
    deleteProduct,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    addCurrency,
    addPurchaseOrder,
    getPurchaseOrder,
    activatePurchaseOrder,
    declinePurchaseOrder,
    acknowledgeDeclinedPurchase,
    updatePurchaseStatus,
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
