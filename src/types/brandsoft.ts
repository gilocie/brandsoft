
'use client';

import { Page } from '@/stores/canvas-store';

// ... (All other types remain exactly the same until BrandsoftConfig) ...

export type AffiliateClient = {
  id: string;
  name: string;
  avatar: string;
  plan: string;
  status: 'active' | 'expired';
  joinDate?: string;
  remainingDays?: number;
  walletBalance?: number;
  lastTopUpAmount?: number;
  lastTopUpDate?: string;
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

export type GeneratedKey = {
    key: string;
    status: 'unused' | 'used';
    generatedDate: string;
    usedBy?: string; 
    remainingDays?: number;
};

export type Affiliate = {
  fullName: string;
  username: string;
  phone: string;
  profilePic: string;
  affiliateLink: string;
  securityQuestion: boolean; 
  securityQuestionData?: {
    question: string;
    answer: string; 
  };
  idUploaded: boolean; 
  isPinSet: boolean;
  pin?: string;
  myWallet: number; 
  unclaimedCommission: number; 
  totalSales: number; 
  creditBalance: number;
  bonus: number;
  bonusChallengeStartDate?: string;
  bonusChallengeClients?: number;
  isBonusTierActive?: boolean;
  staffId: string;
  clients: AffiliateClient[];
  transactions: Transaction[];
  withdrawalMethods: {
    airtel?: WithdrawalMethodDetails;
    tnm?: WithdrawalMethodDetails;
    bank?: BankDetails;
    bsCredits?: BsCreditsDetails;
  };
  generatedKeys: GeneratedKey[];
};

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
    customerId?: string; 
    periodReserve?: number; 
    affiliateId?: string; 
}

export type Company = {
  id: string;
  name: string; 
  email: string;
  phone?: string;
  address?: string;
  companyName: string;
  companyAddress?: string;
  vatNumber?: string;
  associatedProductIds?: string[];
  customerType?: 'personal' | 'company'; 
  industry?: string;
  town?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  website?: string;
  referredBy?: string;
  walletBalance?: number;
  version?: number;
  purchases?: Purchase[];
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

export type BrandsoftTemplate = {
  id: string;
  name: string;
  description?: string;
  category: 'invoice' | 'quotation' | 'certificate' | 'id-card' | 'marketing';
  pages: Page[];
  previewImage?: string; 
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

export type PlanCustomization = {
  isRecommended?: boolean;
  discountType?: 'flat' | 'percentage';
  discountValue?: number;
  discountMonths?: number;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  customTitle?: string;
  customDescription?: string;
  ctaText?: string;
  badgeText?: string;
  badgeColor?: string;
  headerBgImage?: string;
  headerBgImageOpacity?: number;
  icon?: string;
  backgroundType?: 'solid' | 'gradient';
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  hidePrice?: boolean;
  contactEmail?: string;
  contactWhatsapp?: string;
};

export type Plan = {
  name: string;
  price: number;
  features: string[];
  customization?: PlanCustomization;
};

export type PlanPeriod = {
    value: string;
    label: string;
};

export type AdminSettings = {
  fullName?: string;
  username?: string;
  maxCredits: number;
  buyPrice: number;
  sellPrice: number;
  exchangeValue: number;
  availableCredits: number;
  soldCredits: number;
  creditsBoughtBack: number;
  isReserveLocked: boolean;
  keyPrice: number;
  keyFreeDays: number;
  keyPeriodReserveDays: number;
  keyUsageLimit: number;
  keysSold: number;
  trendingPlan: string;
  revenueFromKeys: number;
  revenueFromPlans: number;
  planPeriods: PlanPeriod[];
  commissionRate?: number;
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
    senderId?: string; 
    requestId?: string; 
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
    id?: string;
  };
  modules: {
    invoice: boolean;
    certificate: boolean;
    idCard: boolean;
    quotation: boolean;
    marketing: boolean;
  };
  affiliate: Affiliate;
  admin: AdminSettings;
  companies: Company[];
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  quotations: Quotation[];
  incomingRequests?: QuotationRequest[];
  outgoingRequests?: QuotationRequest[];
  requestResponses?: Quotation[];
  templates: BrandsoftTemplate[];
  plans?: Plan[];
  currencies: string[];
  reviews?: Review[];
};
