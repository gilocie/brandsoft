
import { Page } from '@/stores/canvas-store';

export type Company = {
  id: string;
  name: string; // Contact person's name
  email: string;
  phone?: string;
  address?: string;
  companyName: string;
  companyAddress?: string;
  vatNumber?: string;
  associatedProductIds?: string[];
  customerType?: 'personal' | 'company'; // Can be used to differentiate B2B from B2C
  industry?: string;
  town?: string;
  description?: string;
  logo?: string;
  website?: string;
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
    remainingTime: {
        value: number;
        unit: 'minutes' | 'days';
    };
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

export type QuotationRequestItem = {
  productName: string;
  description?: string;
  quantity: number;
};

export type QuotationRequest = {
  id: string;
  title: string;
  description?: string;
  requesterId: string;
  requesterName: string;
  date: string;
  isPublic: boolean;
  companyIds?: string[];
  items: QuotationRequestItem[];
  status: 'open' | 'closed';
};

export type BrandsoftConfig = {
  brand: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    font: string;
    businessName: string;
    description: string;
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
    town: string;
    industry: string;
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
  companies: Company[];
  products: Product[];
  invoices: Invoice[];
  quotations: Quotation[];
  quotationRequests?: QuotationRequest[];
  templates: BrandsoftTemplate[];
  currencies: string[];
  purchases?: Purchase[];
};

export type Invoice = {
    invoiceId: string;
    customer: string;
    customerId?: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'Draft' | 'Pending' | 'Paid' | 'Overdue' | 'Canceled';
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
    lineItems: LineItem[];
    partialPayment?: number;
    partialPaymentType?: 'percentage' | 'flat';
    partialPaymentValue?: number;
    currency?: string;
    design?: DesignSettings;
    origin?: 'quotation' | 'manual';
};

export type Quotation = {
    quotationId: string;
    customer: string;
    customerId: string;
    senderId?: string; // ID of the company who sent the request
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
    lineItems: LineItem[];
    partialPayment?: number;
    partialPaymentType?: 'percentage' | 'flat';
    partialPaymentValue?: number;
    currency?: string;
    design?: DesignSettings;
    isRequest?: boolean;
};
