

'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type Invoice, type Customer, type Quotation } from '@/hooks/use-brandsoft';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, PartyPopper, UploadCloud, BriefcaseBusiness, FileText, FileBarChart2, Award, CreditCard, Brush } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { hexToHsl, cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';


const TOTAL_STEPS = 4;

const step1Schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  font: z.string().optional(),
  brandsoftFooter: z.boolean().default(true),
});

const step2Schema = z.object({
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  taxNumber: z.string().optional(),
});

const step3Schema = z.object({
  invoice: z.boolean().default(true),
  certificate: z.boolean().default(false),
  idCard: z.boolean().default(false),
  quotation: z.boolean().default(true),
  marketing: z.boolean().default(false),
});

const formSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FormData = z.infer<typeof formSchema>;

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


export default function SetupPage() {
  const { saveConfig } = useBrandsoft();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      businessName: '',
      logo: '',
      primaryColor: '#9400D3',
      secondaryColor: '#D87093',
      font: 'Poppins',
      brandsoftFooter: true,
      address: '',
      phone: '',
      email: '',
      website: '',
      taxNumber: '',
      invoice: true,
      certificate: false,
      idCard: false,
      quotation: true,
      marketing: false,
    },
  });

  const watchedBusinessName = form.watch('businessName');
  const watchedLogo = form.watch('logo');
  const primaryColor = form.watch('primaryColor');
  const secondaryColor = form.watch('secondaryColor');
  const font = form.watch('font');

  useEffect(() => {
    if (primaryColor) {
      const primaryHsl = hexToHsl(primaryColor);
      if (primaryHsl) {
        document.documentElement.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
      }
    }
    if (secondaryColor) {
      const accentHsl = hexToHsl(secondaryColor);
       if (accentHsl) {
        document.documentElement.style.setProperty('--accent', `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`);
      }
    }
  }, [primaryColor, secondaryColor]);

  async function processSubmit(data: FormData) {
    const config: BrandsoftConfig = {
      brand: {
        businessName: data.businessName,
        logo: data.logo || '',
        primaryColor: data.primaryColor || '#9400D3',
        secondaryColor: data.secondaryColor || '#D87093',
        font: data.font || 'Poppins',
        brandsoftFooter: data.brandsoftFooter,
        showCustomerAddress: true,
      },
      profile: {
        address: data.address,
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
      customers: initialCustomers,
      products: [],
      invoices: initialInvoices,
      quotations: initialQuotations,
      templates: [],
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
    };
    setIsFinishing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate saving
    saveConfig(config);
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ['businessName'];
    if (step === 2) fieldsToValidate = ['address', 'phone', 'email', 'website'];
    
    const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;
    
    if (isValid) {
      if (step < TOTAL_STEPS) {
        setStep(s => s + 1);
      } else {
        form.handleSubmit(processSubmit)();
      }
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(s => s - 1);
  };
  
  const stepInfo = [
    { title: "Brand Identity", description: "Let's start with your brand basics." },
    { title: "Business Profile", description: "Tell us about your business." },
    { title: "Module Selection", description: "Choose the tools you need." },
    { title: "Finish Setup", description: "You're all set!" },
  ];

  const getFontClass = (fontName?: string) => {
    switch(fontName) {
      case 'Poppins': return 'font-body';
      case 'Belleza': return 'font-headline';
      case 'Source Code Pro': return 'font-code';
      default: return 'font-body'; // Default to body font
    }
  };

  return (
    <div 
        className="min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('https://picsum.photos/seed/setupbg/1920/1080')" }}
        data-ai-hint="business building"
    >
      <div className="flex min-h-screen items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <Form {...form}>
            <Card className="w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[550px]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                      <Avatar>
                          <AvatarImage src={watchedLogo || undefined} />
                          <AvatarFallback><BriefcaseBusiness className="h-6 w-6 text-primary" /></AvatarFallback>
                      </Avatar>
                      <h1 className={cn("text-3xl font-bold text-primary", getFontClass(font))}>{watchedBusinessName || 'BrandSoft'}</h1>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>
                    <Progress value={(step / TOTAL_STEPS) * 100} className="mt-1 w-32" />
                  </div>
                </div>
                {watchedBusinessName && <CardDescription>Brandsoft Studio</CardDescription>}
                <Separator className="my-4" />
                <CardTitle className={cn("text-3xl", step === 1 ? 'font-headline' : 'font-body')}>{stepInfo[step-1].title}</CardTitle>
                <CardDescription>{stepInfo[step-1].description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto pr-3">
                <form className="space-y-6">
                    <div style={{ display: step === 1 ? 'block' : 'none' }}><Step1BrandIdentity control={form.control} form={form} /></div>
                    <div style={{ display: step === 2 ? 'block' : 'none' }}><Step2BusinessProfile control={form.control} /></div>
                    <div style={{ display: step === 3 ? 'block' : 'none' }}><Step3ModuleSelection control={form.control} /></div>
                    <div style={{ display: step === 4 ? 'block' : 'none' }}>
                       {isFinishing ? (
                         <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                           <Loader2 className="h-12 w-12 animate-spin text-primary" />
                           <p className="text-xl font-medium font-headline">Finalizing your setup...</p>
                           <p className="text-muted-foreground">Just a moment while we save your preferences.</p>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                           <PartyPopper className="h-16 w-16 text-primary" />
                           <p className="text-2xl font-medium font-headline">Configuration Complete!</p>
                           <p className="text-muted-foreground max-w-sm">You are all set to start creating amazing documents. Click "Finish Setup" to go to your dashboard.</p>
                         </div>
                       )}
                    </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between pt-6 sticky bottom-0 bg-card">
                <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1 || isFinishing}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button type="button" onClick={nextStep} disabled={isFinishing && step === TOTAL_STEPS}>
                  {isFinishing && step === TOTAL_STEPS && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {step === TOTAL_STEPS ? 'Finish Setup' : 'Next'}
                  {step < TOTAL_STEPS && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
        </Form>
      </div>
    </div>
  );
}

function Step1BrandIdentity({ control, form }: { control: Control<FormData>, form: any }) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const subscription = form.watch((value: { logo: any; }, { name }: any) => {
      if (name === 'logo' && value.logo !== logoPreview) {
        setLogoPreview(value.logo);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, logoPreview]);


  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        form.setValue('logo', dataUrl, { shouldDirty: true, shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <FormField
            control={control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Company LLC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="logo"
            render={() => (
              <FormItem>
                <FormLabel>Logo</FormLabel>
                <FormControl>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload Logo
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 rounded-md border border-dashed p-4 h-full">
          <Avatar className="h-24 w-24">
            <AvatarImage src={logoPreview || undefined} alt={form.watch('businessName')} />
            <AvatarFallback className="text-3xl">
              {form.watch('businessName')?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">Logo Preview</p>
        </div>
      </div>
       <FormField
            control={control}
            name="font"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Font</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Belleza">Belleza</SelectItem>
                        <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="primaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Color</FormLabel>
              <FormControl>
                <Input type="color" {...field} className="h-10 p-1" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="secondaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accent Color</FormLabel>
              <FormControl>
                <Input type="color" {...field} className="h-10 p-1" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
       <Separator />
        <FormField
            control={control}
            name="brandsoftFooter"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Enable BrandSoft Footer</FormLabel>
                        <FormDescription>
                           Show "Created by BrandSoft" on your documents.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                </FormItem>
            )}
        />
    </div>
  );
}

function Step2BusinessProfile({ control }: { control: Control<FormData> }) {
  return <div className="space-y-4">
    <FormField control={control} name="address" render={({ field }) => (
      <FormItem><FormLabel>Business Address</FormLabel><FormControl><Input placeholder="P.O. Box 303, Blantyre, Malawi" {...field} /></FormControl><FormMessage /></FormItem>
    )} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+265 999 123 456" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input placeholder="contact@yourcompany.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control} name="website" render={({ field }) => (
            <FormItem><FormLabel>Website (Optional)</FormLabel><FormControl><Input placeholder="https://yourcompany.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="taxNumber" render={({ field }) => (
            <FormItem><FormLabel>Tax / VAT Number (Optional)</FormLabel><FormControl><Input placeholder="Your Tax ID" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
    </div>
  </div>;
}

const modules = [
  { id: 'invoice', label: 'Invoice Designer', icon: FileText, status: 'available' },
  { id: 'quotation', label: 'Quotation Designer', icon: FileBarChart2, status: 'available' },
  { id: 'certificate', label: 'Certificate Designer', icon: Award, status: 'upcoming' },
  { id: 'idCard', label: 'ID Card Designer', icon: CreditCard, status: 'upcoming' },
  { id: 'marketing', label: 'Marketing', icon: Brush, status: 'upcoming' },
] as const;

function Step3ModuleSelection({ control }: { control: Control<FormData> }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {modules.filter(m => m.status === 'available').map(item => (
                    <FormField key={item.id} control={control} name={item.id} render={({ field }) => (
                        <FormItem className="relative">
                             <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="absolute top-3 right-3 h-5 w-5 z-10"
                                />
                             </FormControl>
                            <FormLabel className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer aspect-square transition-colors",
                                field.value ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:border-primary/50"
                            )}>
                                <item.icon className="w-10 h-10 mb-2" />
                                <span className="text-sm font-semibold text-center">{item.label}</span>
                            </FormLabel>
                        </FormItem>
                    )} />
                ))}
            </div>
             <div>
                <h3 className="text-sm font-medium text-muted-foreground mt-6 mb-2">Upcoming Tools</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {modules.filter(m => m.status === 'upcoming').map(item => (
                         <div key={item.id} className="relative flex flex-col items-center justify-center p-4 rounded-lg border bg-muted/50 aspect-square">
                            <div className="absolute top-2 left-2 text-xs font-bold text-destructive-foreground bg-destructive px-2 py-0.5 rounded-full">UPCOMING</div>
                             <item.icon className="w-10 h-10 mb-2 text-muted-foreground" />
                            <span className="text-sm font-semibold text-center text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
