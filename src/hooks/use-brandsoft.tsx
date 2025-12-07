

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
};


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
    defaultInvoiceTemplate?: string | null;
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
};

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
  addInvoice: (invoice: Omit<Invoice, 'invoiceId'>) => Invoice;
  updateInvoice: (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => void;
  deleteInvoice: (invoiceId: string) => void;
  addQuotation: (quotation: Omit<Quotation, 'quotationId'>) => Quotation;
  updateQuotation: (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => void;
  deleteQuotation: (quotationId: string) => void;
  addCurrency: (currency: string) => void;
}

const BrandsoftContext = createContext<BrandsoftContextType | undefined>(undefined);

const initialCustomers: Customer[] = [
    { id: 'CUST-1625243511000', name: 'Liam Johnson', email: 'liam@example.com', address: '123 Main St, Anytown, USA' },
    { id: 'CUST-1625243512000', name: 'Olivia Smith', email: 'olivia@example.com', companyName: 'Smith Designs', companyAddress: '456 Oak Ave, Anytown, USA' },
    { id: 'CUST-1625243513000', name: 'Noah Williams', email: 'noah@example.com', address: '789 Pine Ln, Anytown, USA' },
    { id: 'CUST-1625243514000', name: 'Emma Brown', email: 'emma@example.com', companyName: 'Brown & Co.', companyAddress: '321 Elm Rd, Anytown, USA' },
    { id: 'CUST-1625243515000', name: 'James Jones', email: 'james@example.com', address: '654 Maple Dr, Anytown, USA' },
    { id: 'CUST-1625243516000', name: 'Sophia Garcia', email: 'sophia@example.com', address: '987 Birch Ct, Anytown, USA' },
];


const initialInvoices: Invoice[] = [
  {
    invoiceId: 'INV001',
    customer: 'Liam Johnson',
    date: '2023-06-23',
    dueDate: '2023-07-23',
    amount: 250.0,
    status: 'Paid',
    subtotal: 250,
    discount: 0,
    tax: 0,
    shipping: 0,
    lineItems: [{ description: 'Web Design Consultation', quantity: 2, price: 125 }],
  },
  {
    invoiceId: 'INV002',
    customer: 'Olivia Smith',
    date: '2023-07-15',
    dueDate: '2023-08-15',
    amount: 150.0,
    status: 'Pending',
    subtotal: 150,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Logo Design', quantity: 1, price: 150 }],
  },
  {
    invoiceId: 'INV003',
    customer: 'Noah Williams',
    date: '2023-08-01',
    dueDate: '2023-09-01',
    amount: 350.0,
    status: 'Paid',
    subtotal: 350,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Social Media Campaign', quantity: 1, price: 350 }],
  },
  {
    invoiceId: 'INV004',
    customer: 'Emma Brown',
    date: '2023-09-10',
    dueDate: '2023-10-10',
    amount: 450.0,
    status: 'Overdue',
    subtotal: 450,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'SEO Audit', quantity: 1, price: 450 }],
  },
  {
    invoiceId: 'INV005',
    customer: 'James Jones',
    date: '2023-10-20',
    dueDate: '2023-11-20',
    amount: 550.0,
    status: 'Pending',
    subtotal: 550,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Complete Branding Package', quantity: 1, price: 550 }],
  },
   {
    invoiceId: 'INV006',
    customer: 'Sophia Garcia',
    date: '2023-10-22',
    dueDate: '2023-11-22',
    amount: 300.0,
    status: 'Canceled',
    subtotal: 300,
    discount: 0,
    tax: 0,
    shipping: 0,
     lineItems: [{ description: 'Business Card Design', quantity: 200, price: 1.5 }],
  },
];

const initialQuotations: Quotation[] = [
    {
        quotationId: 'QUO-001',
        customer: 'Liam Johnson',
        date: '2023-11-01',
        validUntil: '2023-11-30',
        amount: 500.0,
        status: 'Sent',
        subtotal: 500,
        lineItems: [{ description: 'Website Redesign', quantity: 1, price: 500 }],
    },
    {
        quotationId: 'QUO-002',
        customer: 'Olivia Smith',
        date: '2023-11-05',
        validUntil: '2023-12-05',
        amount: 1200.0,
        status: 'Accepted',
        subtotal: 1200,
        lineItems: [{ description: 'E-commerce Platform Development', quantity: 1, price: 1200 }],
    },
    {
        quotationId: 'QUO-003',
        customer: 'Emma Brown',
        date: '2023-11-10',
        validUntil: '2023-12-10',
        amount: 300.0,
        status: 'Declined',
        subtotal: 300,
        lineItems: [{ description: 'Quarterly Social Media Management', quantity: 1, price: 300 }],
    },
    {
        quotationId: 'QUO-004',
        customer: 'Noah Williams',
        date: '2023-11-12',
        validUntil: '2023-12-12',
        amount: 800.0,
        status: 'Draft',
        subtotal: 800,
        lineItems: [{ description: 'Mobile App UI/UX Design', quantity: 1, price: 800 }],
    }
];


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
  }, [config]);

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
        const nonRedirectPaths = ['/dashboard', '/settings', '/products', '/invoices', '/quotations', '/templates'];
        const isCustomerPage = window.location.pathname.startsWith('/customers');
        const isProductsPage = window.location.pathname.startsWith('/products');
        const isInvoicePage = window.location.pathname.startsWith('/invoices');
        const isQuotationPage = window.location.pathname.startsWith('/quotations');

        
        const shouldRedirect = !nonRedirectPaths.includes(window.location.pathname) && !isCustomerPage && !isProductsPage && !isInvoicePage && !isQuotationPage;
        
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

  const addInvoice = (invoiceData: Omit<Invoice, 'invoiceId'>): Invoice => {
    if (!config) throw new Error("Config not loaded");
    
    let nextIdNumber = config.profile.invoiceStartNumber || 1;
    const existingIds = new Set(config.invoices.map(inv => inv.invoiceId));
    const prefix = config.profile.invoicePrefix || 'INV-';

    let newInvoiceId = `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
    while(existingIds.has(newInvoiceId)) {
        nextIdNumber++;
        newInvoiceId = `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
    }

    const newInvoice: Invoice = {
      ...invoiceData,
      invoiceId: newInvoiceId,
    };
    
    const newConfig: BrandsoftConfig = {
      ...config,
      invoices: [...config.invoices, newInvoice],
      profile: {
        ...config.profile,
        invoiceStartNumber: nextIdNumber + 1,
      }
    };
    saveConfig(newConfig, { redirect: false });
    return newInvoice;
  };

  const updateInvoice = (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => {
    if (!config) throw new Error("Config not loaded");
    const updatedInvoices = config.invoices.map(inv =>
      inv.invoiceId === invoiceId ? { ...inv, ...data, invoiceId } : inv
    );
     const newConfig: BrandsoftConfig = {
      ...config,
      invoices: updatedInvoices,
    };
    saveConfig(newConfig, { redirect: false });
  };

  const deleteInvoice = (invoiceId: string) => {
    if (!config) throw new Error("Config not loaded");
    const updatedInvoices = config.invoices.filter(inv => inv.invoiceId !== invoiceId);
    const newConfig: BrandsoftConfig = {
      ...config,
      invoices: updatedInvoices,
    };
    saveConfig(newConfig, { redirect: false });
  };
  
    const addQuotation = (quotationData: Omit<Quotation, 'quotationId'>): Quotation => {
        if (!config) throw new Error("Config not loaded");
        
        let nextIdNumber = config.profile.quotationStartNumber || 1;
        const existingIds = new Set(config.quotations.map(q => q.quotationId));
        const prefix = config.profile.quotationPrefix || 'QUO-';

        let newQuotationId = `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
        while(existingIds.has(newQuotationId)) {
            nextIdNumber++;
            newQuotationId = `${prefix}${String(nextIdNumber).padStart(3, '0')}`;
        }

        const newQuotation: Quotation = {
        ...quotationData,
        quotationId: newQuotationId,
        };
        
        const newConfig: BrandsoftConfig = {
        ...config,
        quotations: [...config.quotations, newQuotation],
        profile: {
            ...config.profile,
            quotationStartNumber: nextIdNumber + 1,
        }
        };
        saveConfig(newConfig, { redirect: false });
        return newQuotation;
    };

    const updateQuotation = (quotationId: string, data: Partial<Omit<Quotation, 'quotationId'>>) => {
        if (!config) throw new Error("Config not loaded");
        const updatedQuotations = config.quotations.map(q =>
        q.quotationId === quotationId ? { ...q, ...data, quotationId } : q
        );
        const newConfig: BrandsoftConfig = {
        ...config,
        quotations: updatedQuotations,
        };
        saveConfig(newConfig, { redirect: false });
    };

    const deleteQuotation = (quotationId: string) => {
        if (!config) throw new Error("Config not loaded");
        const updatedQuotations = config.quotations.filter(q => q.quotationId !== quotationId);
        const newConfig: BrandsoftConfig = {
        ...config,
        quotations: updatedQuotations,
        };
        saveConfig(newConfig, { redirect: false });
    };


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


  const value = { isActivated, isConfigured, config, activate, saveConfig, logout, addCustomer, updateCustomer, deleteCustomer, addProduct, updateProduct, deleteProduct, addInvoice, updateInvoice, deleteInvoice, addQuotation, updateQuotation, deleteQuotation, addCurrency };

  return <BrandsoftContext.Provider value={value}>{children}</BrandsoftContext.Provider>;
}

export function useBrandsoft() {
  const context = useContext(BrandsoftContext);
  if (context === undefined) {
    throw new Error('useBrandsoft must be used within a BrandsoftProvider');
  }
  return context;
}
