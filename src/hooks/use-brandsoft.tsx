

"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { hexToHsl } from '@/lib/utils';

const LICENSE_KEY = 'brandsoft_license';
const CONFIG_KEY = 'brandsoft_config';
const VALID_SERIAL = 'BRANDSOFT-2024';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  associatedProductIds?: string[];
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: 'product' | 'service';
};

export type Invoice = {
    invoiceId: string;
    customer: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'Paid' | 'Pending' | 'Overdue' | 'Canceled' | 'Draft';
    subtotal?: number;
    discount?: number;
    tax?: number;
    shipping?: number;
    notes?: string;
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
  invoices: Invoice[];
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
  addInvoice: (invoice: Omit<Invoice, 'invoiceId'>) => void;
  updateInvoice: (invoiceId: string, data: Partial<Omit<Invoice, 'invoiceId'>>) => void;
  deleteInvoice: (invoiceId: string) => void;
  addCurrency: (currency: string, setAsDefault?: boolean) => void;
}

const BrandsoftContext = createContext<BrandsoftContextType | undefined>(undefined);

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
  },
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
        if (!parsedConfig.currencies) {
            parsedConfig.currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
        }
        if (!parsedConfig.invoices) {
            parsedConfig.invoices = initialInvoices;
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
        const nonRedirectPaths = ['/dashboard', '/settings', '/products', '/invoices'];
        const isCustomerPage = window.location.pathname.startsWith('/customers');
        const isProductsPage = window.location.pathname.startsWith('/products');
        const isInvoicePage = window.location.pathname.startsWith('/invoices');

        
        const shouldRedirect = !nonRedirectPaths.includes(window.location.pathname) && !isCustomerPage && !isProductsPage && !isInvoicePage;
        
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

  const addInvoice = (invoiceData: Omit<Invoice, 'invoiceId'>) => {
    if (!config) throw new Error("Config not loaded");
    
    const lastId = config.invoices.reduce((max, inv) => {
        const idNum = parseInt(inv.invoiceId.replace('INV', ''), 10);
        return idNum > max ? idNum : max;
    }, 0);

    const newInvoice: Invoice = {
      ...invoiceData,
      invoiceId: `INV${String(lastId + 1).padStart(3, '0')}`,
    };
    
    const newConfig: BrandsoftConfig = {
      ...config,
      invoices: [...config.invoices, newInvoice],
    };
    saveConfig(newConfig, { redirect: false });
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

  const addCurrency = (currency: string, setAsDefault = false) => {
    if (!config) throw new Error("Config not loaded");
    
    const newCurrencies = config.currencies.includes(currency) 
      ? config.currencies 
      : [...config.currencies, currency];

    const newConfig: BrandsoftConfig = {
        ...config,
        currencies: newCurrencies,
        profile: {
            ...config.profile,
            defaultCurrency: setAsDefault ? currency : config.profile.defaultCurrency
        }
    };
    saveConfig(newConfig, { redirect: false });
  };

  const value = { isActivated, isConfigured, config, activate, saveConfig, logout, addCustomer, updateCustomer, deleteCustomer, addProduct, updateProduct, deleteProduct, addInvoice, updateInvoice, deleteInvoice, addCurrency };

  return <BrandsoftContext.Provider value={value}>{children}</BrandsoftContext.Provider>;
}

export function useBrandsoft() {
  const context = useContext(BrandsoftContext);
  if (context === undefined) {
    throw new Error('useBrandsoft must be used within a BrandsoftProvider');
  }
  return context;
}
