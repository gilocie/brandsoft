
'use client';

import type { BrandsoftConfig, Company, Customer, Invoice, Quotation } from '@/types/brandsoft';
import { useCompanies } from './use-companies';

export function useSetup(
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean }) => void
) {
  const { getInitialCompanies } = useCompanies(null, () => {});

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
  
  const initialCustomers: Customer[] = [
      { id: 'COMP-DEMO-0', name: 'John Banda', email: 'john.banda@creativeprints.mw', companyName: 'Creative Prints'},
      { id: 'COMP-DEMO-1', name: 'Jane Chirwa', email: 'jane.chirwa@bytesolutions.mw', companyName: 'Byte Solutions'},
      { id: 'COMP-DEMO-2', name: 'Mike Phiri', email: 'mike.phiri@maketesupplies.mw', companyName: 'Makete Supplies'},
      { id: 'COMP-DEMO-3', name: 'Grace Moyo', email: 'grace.moyo@buildright.mw', companyName: 'BuildRight Hardware'},
  ];


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
        id: userCompanyId, // Use the same ID for consistency
        name: data.businessName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        companyName: data.businessName,
    };

    const initialCompaniesList = getInitialCompanies();
    const finalCompanies = [
        ...initialCompaniesList.map((c, i) => ({...c, id: `COMP-DEMO-${i}`})),
        userAsCompany
    ];
    
    const finalCustomers = [...initialCustomers, userAsCustomer];
    
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
        invoicePrefix: 'INV-',
        invoiceStartNumber: 101,
        quotationPrefix: 'QUO-',
        quotationStartNumber: 101,
      },
      modules: {
        invoice: data.invoice,
        certificate: data.certificate,
        idCard: data.idCard,
        quotation: data.quotation,
        marketing: data.marketing,
      },
      companies: finalCompanies,
      customers: finalCustomers,
      products: [],
      invoices: initialInvoices,
      quotations: initialQuotations,
      quotationRequests: [],
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
