'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type Invoice, type Company, type Quotation, type QuotationRequest } from '@/hooks/use-brandsoft';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, PartyPopper, UploadCloud, BriefcaseBusiness, FileText, FileBarChart2, Award, CreditCard, Brush } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { hexToHsl, cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSetup } from '@/hooks/use-setup';
import brandsoftBackground from '@/app/backgrounds/background.jpg';
import BrandsoftLogo from '@/app/brandsoftlogo.png';
import Image from 'next/image';


const TOTAL_STEPS = 4;

const step1Schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  description: z.string().optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  font: z.string().optional(),
  brandsoftFooter: z.boolean().default(true),
});

const step2Schema = z.object({
  address: z.string().min(5, "Address is required"),
  town: z.string().optional(),
  industry: z.string().optional(),
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

export default function SetupPage() {
  const { saveConfig } = useBrandsoft();
  const { finalizeSetup } = useSetup(saveConfig);
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      businessName: '',
      description: '',
      logo: '',
      primaryColor: '#f5c22a',
      secondaryColor: '#2d2d2d',
      font: 'Poppins',
      brandsoftFooter: true,
      address: '',
      town: '',
      industry: '',
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
        document.documentElement.style.setProperty('--ring', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
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
    setIsFinishing(true);
    await finalizeSetup(data);
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ['businessName', 'description'];
    if (step === 2) fieldsToValidate = ['address', 'phone', 'email', 'website', 'town', 'industry'];
    
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
      default: return 'font-body';
    }
  };

  return (
    <div 
        className="h-screen overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${brandsoftBackground.src})` }}
        data-ai-hint="business building"
    >
      <div className="flex h-screen items-center justify-center bg-black/80 p-4 overflow-hidden">
        <Form {...form}>
            <Card className="w-full max-w-4xl shadow-2xl flex flex-col h-[90vh] relative">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 bg-transparent">
                          {watchedLogo ? (
                            <AvatarImage src={watchedLogo} />
                          ) : (
                            <Image src={BrandsoftLogo} alt="BrandSoft" width={40} height={40} />
                          )}
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
              
              {/* Left Navigation Button - Outside Card */}
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep} 
                disabled={step === 1 || isFinishing}
                className="fixed left-4 top-1/2 -translate-y-1/2 z-50 rounded-full h-12 w-12 shadow-lg"
                size="icon"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* Right Navigation Button - Outside Card */}
              <Button 
                type="button" 
                onClick={nextStep} 
                disabled={isFinishing && step === TOTAL_STEPS}
                className="fixed right-4 top-1/2 -translate-y-1/2 z-50 rounded-full h-12 w-12 shadow-lg"
                size="icon"
              >
                {isFinishing && step === TOTAL_STEPS ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </Button>

              <CardContent className="flex-1 overflow-y-auto min-h-0">
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="A brief description of what your business does." {...field} />
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control} name="industry" render={({ field }) => (
            <FormItem><FormLabel>Industry (Optional)</FormLabel><FormControl><Input placeholder="e.g., Graphic Design, Retail" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="town" render={({ field }) => (
            <FormItem><FormLabel>Town/Area (Optional)</FormLabel><FormControl><Input placeholder="e.g., Blantyre, Lilongwe" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
    </div>
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
            <div className="grid grid-cols-5 gap-4">
                {modules.map(item => (
                    <FormField key={item.id} control={control} name={item.id} render={({ field }) => (
                        <FormItem>
                            <FormLabel className={cn(
                                "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 h-28 aspect-square transition-colors",
                                field.value ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:border-primary/50",
                                item.status === 'available' ? 'cursor-pointer' : field.value ? 'cursor-pointer' : 'cursor-default'
                            )}>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="absolute top-2 right-2 h-4 w-4"
                                        disabled={item.status === 'available'}
                                    />
                                </FormControl>
                                {item.status === 'upcoming' && field.value && (
                                    <div className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-sm">
                                        Upcoming
                                    </div>
                                )}
                                <item.icon className="w-6 h-6 mb-2" />
                                <span className="text-xs font-semibold text-center">{item.label}</span>
                            </FormLabel>
                        </FormItem>
                    )} />
                ))}
            </div>
        </div>
    );
}