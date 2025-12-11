
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { hexToHsl } from '@/lib/utils';
import { Page } from '@/stores/canvas-store';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const PURCHASES_KEY = 'brandsoft_purchases';
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
    status: 'pending' | 'active';
    date: string;
    receipt?: string | 'none';
    whatsappNumber?: string;
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
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect: boolean }) => void;
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
  addPurchaseOrder: (order: Purchase) => void;
  getPurchaseOrder: (orderId: string) => Purchase | null;
  activatePurchaseOrder: (orderId: string) => void;
}

const BrandsoftContext = createContext<BrandsoftContextType | undefined>(undefined);

const initialCustomers: Customer[] = [
    { id: 'CUST-1625243511000', name: 'Liam Johnson', email: 'liam@example.com', address: '123 Main St, Anytown, USA', customerType: 'personal' },
    { id: 'CUST-1625243512000', name: 'Olivia Smith', email: 'olivia@example.com', companyName: 'Smith Designs', address: '456 Oak Ave, Anytown, USA', customerType: 'company' },
    { id: 'CUST-1625243513000', name: 'Noah Williams', email: 'noah@example.com', address: '789 Pine Ln, Anytown, USA', customerType: 'personal' },
    { id: 'CUST-1625243514000', name: 'Emma Brown', email: 'emma@example.com', companyName: 'Brown & Co.', address: '321 Elm Rd, Anytown, USA', customerType: 'company' },
    { id: 'CUST-1625243515000', name: 'James Jones', email: 'james@example.com', address: '654 Maple Dr, Anytown, USA', customerType: 'personal' },
    { id: 'CUST-1625243516000', name: 'Sophia Garcia', email: 'sophia@example.com', address: '987 Birch Ct, Anytown, USA', customerType: 'personal' },
];


const initialInvoices: Invoice[] = [
  {
    invoiceId: 'INV001',
    customer: 'Liam Johnson',
    customerId: 'CUST-1625243511000',
    date: '2023-06-23',
    dueDate: '2023-07-23',
    amount: 250.0,
    status: 'Paid',
    subtotal: 250,
    discount: 0,
    tax: 0,
    shipping: 0,
    lineItems: [{ description: 'Web Design Consultation', quantity: 2, price: 125 }],
    currency: 'USD',
  },
  {
    invoiceId: 'INV002',
    customer: 'Olivia Smith',
    customerId: 'CUST-1625243512000',
    date: '2023-07-15',
    dueDate: '2023-08-15',
    amount: 150.0,
    status: 'Pending',
    subtotal: 150,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Logo Design', quantity: 1, price: 150 }],
     currency: 'USD',
  },
  {
    invoiceId: 'INV003',
    customer: 'Noah Williams',
    customerId: 'CUST-1625243513000',
    date: '2023-08-01',
    dueDate: '2023-09-01',
    amount: 350.0,
    status: 'Paid',
    subtotal: 350,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Social Media Campaign', quantity: 1, price: 350 }],
     currency: 'USD',
  },
  {
    invoiceId: 'INV004',
    customer: 'Emma Brown',
    customerId: 'CUST-1625243514000',
    date: '2023-09-10',
    dueDate: '2023-10-10',
    amount: 450.0,
    status: 'Overdue',
    subtotal: 450,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'SEO Audit', quantity: 1, price: 450 }],
     currency: 'USD',
  },
  {
    invoiceId: 'INV005',
    customer: 'James Jones',
    customerId: 'CUST-1625243515000',
    date: '2023-10-20',
    dueDate: '2023-11-20',
    amount: 550.0,
    status: 'Pending',
    subtotal: 550,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Complete Branding Package', quantity: 1, price: 550 }],
     currency: 'USD',
  },
   {
    invoiceId: 'INV006',
    customer: 'Sophia Garcia',
    customerId: 'CUST-1625243516000',
    date: '2023-10-22',
    dueDate: '2023-11-22',
    amount: 300.0,
    status: 'Canceled',
    subtotal: 300,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Business Card Design', quantity: 200, price: 1.5 }],
     currency: 'USD',
  },
];

const initialQuotations: Quotation[] = [
    {
        quotationId: 'QUO-001',
        customer: 'Liam Johnson',
        customerId: 'CUST-1625243511000',
        date: '2023-11-01',
        validUntil: '2023-11-30',
        amount: 500.0,
        status: 'Sent',
        subtotal: 500,
        lineItems: [{ description: 'Website Redesign', quantity: 1, price: 500 }],
        currency: 'USD',
    },
    {
        quotationId: 'QUO-002',
        customer: 'Olivia Smith',
        customerId: 'CUST-1625243512000',
        date: '2023-11-05',
        validUntil: '2023-12-05',
        amount: 1200.0,
        status: 'Accepted',
        subtotal: 1200,
        lineItems: [{ description: 'E-commerce Platform Development', quantity: 1, price: 1200 }],
        currency: 'USD',
    },
    {
        quotationId: 'QUO-003',
        customer: 'Emma Brown',
        customerId: 'CUST-1625243514000',
        date: '2023-11-10',
        validUntil: '2023-12-10',
        amount: 300.0,
        status: 'Declined',
        subtotal: 300,
        lineItems: [{ description: 'Quarterly Social Media Management', quantity: 1, price: 300 }],
        currency: 'USD',
    },
    {
        quotationId: 'QUO-004',
        customer: 'Noah Williams',
        customerId: 'CUST-1625243513000',
        date: '2023-11-12',
        validUntil: '2023-12-12',
        amount: 800.0,
        status: 'Draft',
        subtotal: 800,
        lineItems: [{ description: 'Mobile App UI/UX Design', quantity: 1, price: 800 }],
        currency: 'USD',
    }
];


export function BrandsoftProvider({ children }: { children: ReactNode }) {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [config, setConfig] = useState<BrandsoftConfig | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      const license = localStorage.getItem(LICENSE_KEY);
      const configData = localStorage.getItem(CONFIG_KEY);
      const purchasesData = localStorage.getItem(PURCHASES_KEY);

      setIsActivated(!!license);
      setIsConfigured(!!configData);
      
      if (purchasesData) {
        setPurchases(JSON.parse(purchasesData));
      }

      if (configData) {
        const parsedConfig = JSON.parse(configData);
        if (parsedConfig.brand.brandsoftFooter === undefined) {
          parsedConfig.brand.brandsoftFooter = true;
        }
        if (parsedConfig.brand.showCustomerAddress === undefined) {
            parsedConfig.brand.showCustomerAddress = true;
        }
        if (!parsedConfig.invoices) {
            parsedConfig.invoices = initialInvoices;
        }
         if (!parsedConfig.customers || parsedConfig.customers.length === 0) {
            parsedConfig.customers = initialCustomers;
        }
        if (!parsedConfig.templates) {
            parsedConfig.templates = [];
        }
        if (!parsedConfig.quotations || parsedConfig.quotations.length === 0) {
            parsedConfig.quotations = initialQuotations;
        }
        if (!parsedConfig.purchases) {
            parsedConfig.purchases = purchasesData ? JSON.parse(purchasesData) : [];
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
    localStorage.removeItem(PURCHASES_KEY);
    setIsActivated(false);
    setIsConfigured(false);
    setConfig(null);
    setPurchases([]);
    router.push('/activation');
  };

  const saveConfig = (newConfig: BrandsoftConfig, options = { redirect: true }) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    setConfig(newConfig);
    setIsConfigured(true);
    if(options.redirect) {
        router.push('/dashboard');
    }
  };

  const addPurchaseOrder = (order: Purchase) => {
    const allPurchases = [...purchases, order];
    setPurchases(allPurchases);
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(allPurchases));
    if (config) {
      saveConfig({ ...config, purchases: allPurchases }, { redirect: false });
    }
  };

  const getPurchaseOrder = (orderId: string): Purchase | null => {
    const storedPurchases = localStorage.getItem(PURCHASES_KEY);
    if (storedPurchases) {
        const allPurchases: Purchase[] = JSON.parse(storedPurchases);
        return allPurchases.find(p => p.orderId === orderId) || null;
    }
    return null;
  };

  const activatePurchaseOrder = (orderId: string) => {
      const updatedPurchases = purchases.map(p => p.orderId === orderId ? { ...p, status: 'active' } : p);
      setPurchases(updatedPurchases);
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(updatedPurchases));
      if (config) {
        saveConfig({ ...config, purchases: updatedPurchases }, { redirect: false });
      }
  };

  const addCustomer = (customer: Omit<Customer, 'id'>): Customer => {
      const newCustomer = { ...customer, id: `CUST-${Date.now()}` };
      if (config) {
          const newConfig = { ...config, customers: [...config.customers, newCustomer] };
          saveConfig(newConfig, { redirect: false });
      }
      return newCustomer;
  };
  
  const updateCustomer = (customerId: string, data: Partial<Omit<Customer, 'id'>>) => {
      if (config) {
          const newCustomers = config.customers.map(c => 
              c.id === customerId ? { ...c, ...data } : c
          );
          saveConfig({ ...config, customers: newCustomers }, { redirect: false });
      }
  };
  
  const deleteCustomer = (customerId: string) => {
      if (config) {
          const newCustomers = config.customers.filter(c => c.id !== customerId);
          saveConfig({ ...config, customers: newCustomers }, { redirect: false });
      }
  };

   const addProduct = (product: Omit<Product, 'id'>): Product => {
      const newProduct = { ...product, id: `PROD-${Date.now()}` };
      if (config) {
          const newConfig = { ...config, products: [...(config.products || []), newProduct] };
          saveConfig(newConfig, { redirect: false });
      }
      return newProduct;
  };
  
  const updateProduct = (productId: string, data: Partial<Omit<Product, 'id'>>) => {
      if (config) {
          const newProducts = (config.products || []).map(p => 
              p.id === productId ? { ...p, ...data } : p
          );
          saveConfig({ ...config, products: newProducts }, { redirect: false });
      }
  };
  
  const deleteProduct = (productId: string) => {
      if (config) {
          const newProducts = (config.products || []).filter(p => p.id !== productId);
          saveConfig({ ...config, products: newProducts }, { redirect: false });
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
    saveConfig(newConfig, { redirect: false });
    return newInvoice;
  };

  const updateInvoice = (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => {
      if (config) {
          const newInvoices = (config.invoices || []).map(i => 
              i.invoiceId === invoiceId ? { ...i, ...data } : i
          );
          saveConfig({ ...config, invoices: newInvoices }, { redirect: false });
      }
  };
  
  const deleteInvoice = (invoiceId: string) => {
      if (config) {
          const newInvoices = (config.invoices || []).filter(i => i.invoiceId !== invoiceId);
          saveConfig({ ...config, invoices: newInvoices }, { redirect: false });
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
    saveConfig(newConfig, { redirect: false });
    return newQuotation;
  };

  const updateQuotation = (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => {
      if (config) {
          const newQuotations = (config.quotations || []).map(q => 
              q.quotationId === quotationId ? { ...q, ...data } : q
          );
          saveConfig({ ...config, quotations: newQuotations }, { redirect: false });
      }
  };
  
  const deleteQuotation = (quotationId: string) => {
      if (config) {
          const newQuotations = (config.quotations || []).filter(q => q.quotationId !== quotationId);
          saveConfig({ ...config, quotations: newQuotations }, { redirect: false });
      }
  };
  
  const addCurrency = (currency: string) => {
      if (config && !config.currencies.includes(currency)) {
          const newConfig = { ...config, currencies: [...config.currencies, currency] };
          saveConfig(newConfig, { redirect: false });
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
