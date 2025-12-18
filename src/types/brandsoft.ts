

import { Page } from '@/stores/canvas-store';

export type AffiliateClient = {
  id: string;
  name: string;
  avatar: string;
  plan: string;
  status: 'active' | 'expired';
  joinDate?: string;
  remainingDays?: number;
  walletBalance?: number;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
};

export type WithdrawalMethodDetails = {
    name: string;
    phone: string;
    isClientPaymentMethod?: boolean;
};

export type BankDetails = {
    bankName: string;
    accountNumber: string;
    accountType: 'Saving' | 'Current' | 'Fixed';
    isClientPaymentMethod?: boolean;
};

export type BsCreditsDetails = {
    staffId: string;
};


export type Affiliate = {
  fullName: string;
  username: string;
  phone?: string;
  profilePic: string;
  affiliateLink: string;
  securityQuestion: boolean; // true if set, false if not
  securityQuestionData?: {
    question: string;
    answer: string; // This would be hashed in a real app
  };
  idUploaded: boolean; // true if both front and back are uploaded
  isPinSet?: boolean;
  pin?: string;
  myWallet: number; // This is the main withdrawable wallet balance
  unclaimedCommission: number; // Commissions from sales, not yet moved to balance
  totalSales: number; // Lifetime total sales volume
  creditBalance: number;
  bonus: number;
  staffId?: string;
  clients: AffiliateClient[];
  transactions?: Transaction[];
  withdrawalMethods?: {
    airtel?: WithdrawalMethodDetails;
    tnm?: WithdrawalMethodDetails;
    bank?: BankDetails;
    bsCredits?: BsCreditsDetails;
  };
};

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
  coverImage?: string;
  website?: string;
  referredBy?: string;
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  companyAddress?: string;
  vatNumber?: string;
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
    status: 'pending' | 'active' | 'declined' | 'inactive' | 'processing';
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
    customerId?: string; // Link purchase to a company
    periodReserve?: number; // Days held in reserve
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
  requesterLogo?: string;
  date: string;
  dueDate: string;
  isPublic: boolean;
  companyIds?: string[];
  items: QuotationRequestItem[];
  status: 'open' | 'closed';
  industries?: string[];
};

export type Review = {
  id: string;
  businessId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
};

export type Plan = {
  name: string;
  price: number;
  features: string[];
};

export type AdminSettings = {
  maxCredits: number;
  buyPrice: number;
  sellPrice: number;
  exchangeValue: number;
  availableCredits: number;
  soldCredits: number;
  isReserveLocked?: boolean;
  keyPrice?: number;
  keyFreeDays?: number;
  keyUsageLimit?: number;
  keysSold?: number;
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
    walletBalance?: number;
    autoRenew?: boolean;
  };
  modules: {
    invoice: boolean;
    certificate: boolean;
    idCard: boolean;
    quotation: boolean;
    marketing: boolean;
  };
  affiliate?: Affiliate;
  admin?: AdminSettings;
  companies: Company[];
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  quotations: Quotation[];
  // New structure for quotation requests
  incomingRequests?: QuotationRequest[];
  outgoingRequests?: QuotationRequest[];
  requestResponses?: Quotation[];
  templates: BrandsoftTemplate[];
  plans?: Plan[];
  currencies: string[];
  purchases?: Purchase[];
  reviews?: Review[];
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
    requestId?: string; // ID of the QuotationRequest this is a response to
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
