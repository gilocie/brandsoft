

'use client';

import type { BrandsoftConfig, Company, Customer, Invoice, Quotation, QuotationRequest, Affiliate, Transaction } from '@/types/brandsoft';

const initialCompanies: Omit<Company, 'id'>[] = [
    { 
        name: 'John Banda', 
        email: 'john.banda@creativeprints.mw', 
        phone: '0999888777', 
        companyName: 'Creative Prints',
        description: 'High-quality digital and offset printing services for businesses and individuals.',
        industry: 'Printing Services',
        town: 'Blantyre',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz1/200',
        website: 'https://creativeprints.mw',
    },
    { 
        name: 'Jane Chirwa', 
        email: 'jane.chirwa@bytesolutions.mw', 
        phone: '0888777666', 
        companyName: 'Byte Solutions',
        description: 'Custom software development, IT consulting, and network security solutions.',
        industry: 'IT & Software',
        town: 'Lilongwe',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz2/200',
        website: 'https://bytesolutions.mw',
    },
    { 
        name: 'Mike Phiri', 
        email: 'mike.phiri@maketesupplies.mw', 
        phone: '0991234567', 
        companyName: 'Makete Supplies',
        description: 'Leading supplier of office stationery, school supplies, and computer consumables.',
        industry: 'Office Supplies',
        town: 'Mzuzu',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz3/200',
        website: 'https://maketesupplies.mw',
    },
    { 
        name: 'Grace Moyo', 
        email: 'grace.moyo@buildright.mw', 
        phone: '0884567890', 
        companyName: 'BuildRight Hardware',
        description: 'Your one-stop shop for building materials, tools, and quality hardware.',
        industry: 'Hardware & Construction',
        town: 'Zomba',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz4/200',
        website: 'https://buildright.mw',
    },
    {
        name: 'Thoko Kamwendo',
        email: 'info@urbanoasis.mw',
        phone: '0995550101',
        companyName: 'Urban Oasis Cafe',
        description: 'A modern cafe serving artisanal coffee, fresh pastries, and light lunches.',
        industry: 'Hospitality',
        town: 'Blantyre',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz5/200',
        website: 'https://urbanoasis.mw',
    },
    {
        name: 'David Ngwira',
        email: 'sales@naturesbest.mw',
        phone: '0881112233',
        companyName: 'Nature\'s Best Farms',
        description: 'Suppliers of fresh, organic vegetables and fruits to businesses and restaurants.',
        industry: 'Agriculture',
        town: 'Lilongwe',
        customerType: 'company',
        logo: 'https://picsum.photos/seed/biz6/200',
        website: 'https://naturesbest.mw',
    }
];

export function useSetup(
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean }) => void
) {

  const initialInvoices: Invoice[] = [
    {
      invoiceId: 'INV001',
      customer: 'Creative Prints',
      customerId: 'COMP-DEMO-0',
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
      customer: 'Byte Solutions',
      customerId: 'COMP-DEMO-1',
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
  ];

  const initialQuotations: Quotation[] = [
      {
          quotationId: 'QUO-001',
          customer: 'BuildRight Hardware',
          customerId: 'COMP-DEMO-3',
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
          customer: 'Makete Supplies',
          customerId: 'COMP-DEMO-2',
          date: '2023-11-05',
          validUntil: '2023-12-05',
          amount: 1200.0,
          status: 'Accepted',
          subtotal: 1200,
          lineItems: [{ description: 'E-commerce Platform Development', quantity: 1, price: 1200 }],
          currency: 'USD',
      },
  ];

  const initialQuotationRequests: Omit<QuotationRequest, 'id' | 'date' | 'status' | 'requesterId' | 'requesterName' | 'requesterLogo' | 'dueDate'>[] = [
    {
        title: 'Office Stationery Supply for Q4',
        description: 'Looking for a reliable supplier for bulk office stationery for the upcoming quarter. Please provide a quote for the listed items.',
        isPublic: true,
        items: [
            { productName: 'A4 Reams (box)', quantity: 20 },
            { productName: 'Blue Ballpoint Pens (box of 100)', quantity: 5 },
        ],
    },
    {
        title: 'Website Redesign Project',
        description: 'We are looking to revamp our corporate website. Seeking quotes from experienced web design agencies. See item description for details.',
        isPublic: false,
        companyIds: ['COMP-DEMO-1', 'COMP-DEMO-0'],
        items: [{ productName: 'Corporate Website', description: 'New 5-page responsive website with a blog and CMS integration.', quantity: 1 }],
    },
];
  
  const initialCustomers: Customer[] = [
      { id: 'COMP-DEMO-0', name: 'John Banda', email: 'john.banda@creativeprints.mw', companyName: 'Creative Prints'},
      { id: 'COMP-DEMO-1', name: 'Jane Chirwa', email: 'jane.chirwa@bytesolutions.mw', companyName: 'Byte Solutions'},
      { id: 'COMP-DEMO-2', name: 'Mike Phiri', email: 'mike.phiri@maketesupplies.mw', companyName: 'Makete Supplies'},
      { id: 'COMP-DEMO-3', name: 'Grace Moyo', email: 'grace.moyo@buildright.mw', companyName: 'BuildRight Hardware'},
  ];

  const USD_TO_MWK_RATE = 1700;

  const initialAffiliateData: Affiliate = {
    fullName: 'Your Affiliate Name',
    username: 'affiliate_user',
    phone: '',
    profilePic: 'https://picsum.photos/seed/affiliate/200',
    affiliateLink: 'https://brandsoft.com/join?ref=affiliate_user',
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
    transactions: [
        { id: 'TRN-1', date: '2024-07-20', description: 'Withdrawal', amount: 500 * USD_TO_MWK_RATE, type: 'debit' },
        { id: 'TRN-2', date: '2024-07-18', description: 'Commission: Client B', amount: 75.50 * USD_TO_MWK_RATE, type: 'credit' },
        { id: 'TRN-3', date: '2024-07-15', description: 'Commission: Client A', amount: 50.00 * USD_TO_MWK_RATE, type: 'credit' },
    ],
    withdrawalMethods: {
        airtel: undefined,
        tnm: undefined,
        bank: undefined,
        bsCredits: undefined,
    },
    securityQuestionData: undefined,
  };


  async function finalizeSetup(data: any) {
    const userCompanyId = `COMP-ME-${Date.now()}`;
    const userAsCompany: Company = {
        id: userCompanyId,
        name: data.businessName,
        companyName: data.businessName,
        customerType: 'company',
        email: data.email,
        phone: data.phone,
        address: data.address,
        industry: data.industry,
        town: data.town,
        description: data.description,
        logo: data.logo,
        website: data.website,
    };

    const userAsCustomer: Customer = {
        id: 'CUST-DEMO-ME',
        name: data.businessName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        companyName: data.businessName,
    };

    const finalCompanies = [
        ...initialCompanies.map((c, i) => ({...c, id: `COMP-DEMO-${i}`})),
        userAsCompany
    ];
    
    const finalCustomers = [...initialCustomers, userAsCustomer];

    const finalOutgoingQuotationRequests: QuotationRequest[] = initialQuotationRequests.map((req, i) => ({
      ...req,
      id: `QR-${Date.now() + i}`,
      requesterId: userAsCustomer.id,
      requesterName: data.businessName,
      requesterLogo: data.logo,
      date: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open' as const,
    }))
    
    const config: BrandsoftConfig = {
      brand: {
        businessName: data.businessName,
        description: data.description || '',
        logo: data.logo || '',
        primaryColor: data.primaryColor || '#9400D3',
        secondaryColor: data.secondaryColor || '#D87093',
        font: data.font || 'Poppins',
        brandsoftFooter: data.brandsoftFooter,
        showCustomerAddress: true,
        buttonPrimaryBg: data.primaryColor || '#9400D3',
        buttonPrimaryBgHover: data.secondaryColor || '#D87093',
        buttonPrimaryText: '#FFFFFF',
        buttonPrimaryTextHover: '#FFFFFF',
      },
      profile: {
        address: data.address,
        town: data.town || '',
        industry: data.industry || '',
        phone: data.phone,
        email: data.email,
        website: data.website || '',
        taxNumber: data.taxNumber || '',
        defaultCurrency: 'USD',
        paymentDetails: '',
        invoicePrefix: 'INV-',
        invoiceStartNumber: 101,
        quotationPrefix: 'QUO-',
        quotationStartNumber: 101,
        walletBalance: 0,
      },
      modules: {
        invoice: data.invoice,
        certificate: data.certificate,
        idCard: data.idCard,
        quotation: data.quotation,
        marketing: data.marketing,
      },
      affiliate: initialAffiliateData,
      companies: finalCompanies,
      customers: finalCustomers,
      products: [],
      invoices: initialInvoices,
      quotations: initialQuotations,
      outgoingRequests: finalOutgoingQuotationRequests,
      incomingRequests: [],
      requestResponses: [],
      templates: [],
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
      purchases: [],
      reviews: [],
    };
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate saving
    saveConfig(config);
  }

  return { finalizeSetup };
}
