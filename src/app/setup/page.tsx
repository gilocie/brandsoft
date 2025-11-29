"use client";

import { useState, useEffect } from 'react';
import { useForm, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig } from '@/hooks/use-brandsoft';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Logo } from '@/components/logo';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, PartyPopper } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const TOTAL_STEPS = 5;

const step1Schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  font: z.string().optional(),
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
  certificate: z.boolean().default(true),
  idCard: z.boolean().default(true),
  quotation: z.boolean().default(true),
  marketing: z.boolean().default(false),
});

const formSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FormData = z.infer<typeof formSchema>;

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
      font: 'Alegreya',
      address: '',
      phone: '',
      email: '',
      website: '',
      taxNumber: '',
      invoice: true,
      certificate: true,
      idCard: true,
      quotation: true,
      marketing: false,
    },
  });

  async function processSubmit(data: FormData) {
    const config: BrandsoftConfig = {
      brand: {
        businessName: data.businessName,
        logo: data.logo || '',
        primaryColor: data.primaryColor || '#9400D3',
        secondaryColor: data.secondaryColor || '#D87093',
        font: data.font || 'Alegreya',
      },
      profile: {
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website || '',
        taxNumber: data.taxNumber || '',
      },
      modules: {
        invoice: data.invoice,
        certificate: data.certificate,
        idCard: data.idCard,
        quotation: data.quotation,
        marketing: data.marketing,
      },
    };
    setIsFinishing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate saving
    saveConfig(config);
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ['businessName', 'logo'];
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
    { title: "Template Library", description: "Getting your templates ready." },
    { title: "Finish Setup", description: "You're all set!" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Logo />
            <div className="text-right">
              <p className="font-semibold text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>
              <Progress value={(step / TOTAL_STEPS) * 100} className="mt-1 w-32" />
            </div>
          </div>
          <Separator className="my-4" />
          <CardTitle className="font-headline text-3xl">{stepInfo[step-1].title}</CardTitle>
          <CardDescription>{stepInfo[step-1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <div style={{ display: step === 1 ? 'block' : 'none' }}><Step1BrandIdentity control={form.control} /></div>
              <div style={{ display: step === 2 ? 'block' : 'none' }}><Step2BusinessProfile control={form.control} /></div>
              <div style={{ display: step === 3 ? 'block' : 'none' }}><Step3ModuleSelection control={form.control} /></div>
              <div style={{ display: step === 4 ? 'block' : 'none' }}><Step4TemplateLibrary /></div>
              <div style={{ display: step === 5 ? 'block' : 'none' }}><Step5Finish isFinishing={isFinishing} /></div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1 || isFinishing}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button type="button" onClick={nextStep} disabled={isFinishing}>
                  {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {step === TOTAL_STEPS ? 'Finish Setup' : 'Next'}
                  {step < TOTAL_STEPS && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components for each wizard step for better organization.
function Step1BrandIdentity({ control }: { control: Control<FormData> }) {
  return <div className="space-y-4">
    <FormField control={control} name="businessName" render={({ field }) => (
      <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl><FormMessage /></FormItem>
    )} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control} name="primaryColor" render={({ field }) => (
          <FormItem><FormLabel>Primary Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
        )} />
        <FormField control={control} name="secondaryColor" render={({ field }) => (
          <FormItem><FormLabel>Accent Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
        )} />
    </div>
    <FormField control={control} name="logo" render={({ field }) => (
      <FormItem><FormLabel>Logo URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/logo.png" {...field} /></FormControl><FormMessage /></FormItem>
    )} />
  </div>;
}

function Step2BusinessProfile({ control }: { control: Control<FormData> }) {
  return <div className="space-y-4">
    <FormField control={control} name="address" render={({ field }) => (
      <FormItem><FormLabel>Business Address</FormLabel><FormControl><Input placeholder="123 Main St, Anytown, USA" {...field} /></FormControl><FormMessage /></FormItem>
    )} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+1 (555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>
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
  { id: 'invoice', label: 'Invoice Designer' },
  { id: 'certificate', label: 'Certificate Designer' },
  { id: 'idCard', label: 'ID Card Designer' },
  { id: 'quotation', label: 'Quotation Designer' },
  { id: 'marketing', label: 'Marketing Material Designer' },
] as const;

function Step3ModuleSelection({ control }: { control: Control<FormData> }) {
  return <div className="space-y-3">
    {modules.map(item => (
      <FormField key={item.id} control={control} name={item.id} render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <FormLabel>{item.label}</FormLabel>
          </div>
          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
    ))}
  </div>;
}

function Step4TemplateLibrary() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(oldProgress => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 20;
        return Math.min(oldProgress + diff, 100);
      });
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 min-h-[250px]">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="text-lg font-medium">Scanning for new templates...</p>
    <Progress value={progress} className="w-full" />
    {progress >= 100 && <div className="flex items-center gap-2 text-green-600 pt-2"><CheckCircle className="h-5 w-5" /><p>Template library is ready!</p></div>}
  </div>;
}

function Step5Finish({ isFinishing }: { isFinishing: boolean }) {
  return <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 min-h-[250px]">
    {isFinishing ? (
      <>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl font-medium font-headline">Finalizing your setup...</p>
        <p className="text-muted-foreground">Just a moment while we save your preferences.</p>
      </>
    ) : (
      <>
        <PartyPopper className="h-16 w-16 text-primary" />
        <p className="text-2xl font-medium font-headline">Configuration Complete!</p>
        <p className="text-muted-foreground max-w-sm">You are all set to start creating amazing documents. Click "Finish Setup" to go to your dashboard.</p>
      </>
    )}
  </div>;
}
