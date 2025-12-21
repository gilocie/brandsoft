'use client';

import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type DesignSettings, type Company } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useRef, ChangeEvent, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, SlidersHorizontal, User, Building, MapPin, Globe, Phone, Mail, Eye, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Combobox } from '@/components/ui/combobox';
import Link from 'next/link';
import { useBrandImage, saveImageToDB } from '@/hooks/use-brand-image';
import { Skeleton } from '@/components/ui/skeleton';


const fallBackCover = 'https://picsum.photos/seed/settingscover/1200/300';

const settingsSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  font: z.string().optional(),
  description: z.string().max(180, "Description must be 180 characters or less.").optional(),
  address: z.string().min(5, "Address is required"),
  town: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  taxNumber: z.string().optional(),
  buttonPrimaryBg: z.string().optional(),
  buttonPrimaryBgHover: z.string().optional(),
  buttonPrimaryText: z.string().optional(),
  buttonPrimaryTextHover: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;


const SimpleImageUploadButton = ({
  onChange,
  buttonText = "Upload Image",
  iconOnly = false,
}: {
  onChange: (value: string) => void;
  buttonText?: string;
  iconOnly?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const buttonContent = iconOnly ? (
    <Button 
        type="button" 
        variant="outline" 
        size="icon"
        onClick={() => inputRef.current?.click()}
        className="rounded-full h-9 w-9"
      >
        <UploadCloud className="h-4 w-4" />
      </Button>
  ) : (
     <Button 
        type="button" 
        variant="outline" 
        onClick={() => inputRef.current?.click()}
        size="sm"
      >
        <UploadCloud className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
  );

  return (
    <>
      <Input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />
       {iconOnly ? (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                <TooltipContent><p>{buttonText}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
      ) : (
        buttonContent
      )}
    </>
  );
};


export default function SettingsPage() {
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();
  
  const { image: logoImage, isLoading: isLogoLoading, setImage: setLogoImage } = useBrandImage('logo');
  const { image: coverImage, isLoading: isCoverLoading, setImage: setCoverImage } = useBrandImage('cover');
  
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: '',
      primaryColor: '#d58d30',
      secondaryColor: '#111825',
      font: 'Poppins',
      buttonPrimaryBg: '#d58d30',
      buttonPrimaryBgHover: '#e4a04a',
      buttonPrimaryText: '#FFFFFF',
      buttonPrimaryTextHover: '#FFFFFF',
      description: '',
      address: '',
      town: '',
      industry: '',
      phone: '',
      email: '',
      website: '',
      taxNumber: '',
    },
  });
  
  const watchedValues = form.watch();

  const industries = useMemo(() => {
    if (!config?.companies) return [];
    const uniqueIndustries = [...new Set(config.companies.map(c => c.industry).filter((i): i is string => !!i).map(i => i.trim()))];
    return uniqueIndustries.map(industry => ({ value: industry.toLowerCase(), label: industry }));
  }, [config?.companies]);

  // FIX: Calculate myCompanyId more robustly - create if doesn't exist
  const myCompanyId = useMemo(() => {
    if (!config) return null;
    const existingCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
    if (existingCompany) return existingCompany.id;
    // Return a consistent ID for new companies
    return `COMP-ME-${config.brand.businessName?.replace(/\s+/g, '-').toLowerCase() || 'default'}`;
  }, [config]);

  useEffect(() => {
    if (config) {
        form.reset({
            businessName: config.brand.businessName,
            primaryColor: config.brand.primaryColor,
            secondaryColor: config.brand.secondaryColor,
            font: config.brand.font,
            buttonPrimaryBg: config.brand.buttonPrimaryBg,
            buttonPrimaryBgHover: config.brand.buttonPrimaryBgHover,
            buttonPrimaryText: config.brand.buttonPrimaryText,
            buttonPrimaryTextHover: config.brand.buttonPrimaryTextHover,
            description: config.brand.description,
            address: config.profile.address,
            town: config.profile.town,
            industry: config.profile.industry,
            phone: config.profile.phone,
            email: config.profile.email,
            website: config.profile.website,
            taxNumber: config.profile.taxNumber,
        });
    }
  }, [config, form]);

  // FIX: Handler to update logo - saves to both generic and company-specific keys
  const handleLogoChange = async (value: string) => {
    setLogoImage(value); // Saves to generic 'logo' key via useBrandImage
    
    // Also save to company-specific key immediately
    if (myCompanyId) {
      await saveImageToDB(`company-logo-${myCompanyId}`, value);
    }
  };

  // FIX: Handler to update cover - saves to both generic and company-specific keys  
  const handleCoverChange = async (value: string) => {
    setCoverImage(value); // Saves to generic 'cover' key via useBrandImage
    
    // Also save to company-specific key immediately
    if (myCompanyId) {
      await saveImageToDB(`company-cover-${myCompanyId}`, value);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!config || !myCompanyId) return;

    // FIX: Ensure images are saved to company-specific keys on submit
    if (logoImage) {
        await saveImageToDB(`company-logo-${myCompanyId}`, logoImage);
    }
    if (coverImage) {
        await saveImageToDB(`company-cover-${myCompanyId}`, coverImage);
    }

    const companies = config.companies || [];
    const myCompanyIndex = companies.findIndex(c => c.id === myCompanyId);

    const updatedMyCompany: Partial<Company> = {
        id: myCompanyId, // Ensure ID is set
        name: data.businessName,
        companyName: data.businessName,
        description: data.description,
        logo: 'indexed-db',
        coverImage: 'indexed-db',
        website: data.website,
        phone: data.phone,
        email: data.email,
        address: data.address,
        town: data.town,
        industry: data.industry,
    };

    const newCompanies = [...companies];
    if (myCompanyIndex > -1) {
        newCompanies[myCompanyIndex] = { ...newCompanies[myCompanyIndex], ...updatedMyCompany };
    } else {
        // FIX: Create new company entry with all required fields
        newCompanies.push({
            id: myCompanyId,
            name: data.businessName,
            companyName: data.businessName,
            description: data.description,
            logo: 'indexed-db',
            coverImage: 'indexed-db',
            website: data.website,
            phone: data.phone,
            email: data.email,
            address: data.address,
            town: data.town,
            industry: data.industry,
        } as Company);
    }

    const newConfig: BrandsoftConfig = {
        ...config,
        brand: {
            ...config.brand,
            businessName: data.businessName,
            description: data.description || '',
            logo: 'indexed-db',
            primaryColor: data.primaryColor || '#d58d30',
            secondaryColor: data.secondaryColor || '#111825',
            font: data.font || 'Poppins',
            buttonPrimaryBg: data.buttonPrimaryBg,
            buttonPrimaryBgHover: data.buttonPrimaryBgHover,
            buttonPrimaryText: data.buttonPrimaryText,
            buttonPrimaryTextHover: data.buttonPrimaryTextHover,
        },
        profile: {
            ...config.profile,
            address: data.address,
            town: data.town || '',
            industry: data.industry || '',
            phone: data.phone,
            email: data.email,
            website: data.website || '',
            taxNumber: data.taxNumber || '',
        },
        companies: newCompanies,
    };
    
    saveConfig(newConfig, { redirect: false, revalidate: true });
    toast({
        title: "Settings Saved",
        description: "Your new settings have been applied.",
    });
  };

  if (!config) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <Form {...form}>
        <Card className="overflow-hidden">
          <div className="relative h-48 w-full">
              {isCoverLoading ? <Skeleton className="h-full w-full" /> : 
                <Image
                    src={coverImage || fallBackCover}
                    alt={`${watchedValues.businessName} cover`}
                    fill
                    className="object-cover"
                    data-ai-hint="office workspace"
                />
              }
              <div className="absolute inset-0 bg-black/60" />
               <div className="absolute top-4 right-4 z-10">
                  <SimpleImageUploadButton
                    onChange={handleCoverChange} // FIX: Use new handler
                    buttonText="Change Cover"
                  />
              </div>

               <div className="absolute inset-0 p-6 flex flex-col md:flex-row items-end gap-6">
                  <div className="relative group/avatar">
                      <Avatar className="h-28 w-28 border-4 border-background flex-shrink-0">
                          {isLogoLoading ? <Skeleton className="h-full w-full rounded-full" /> : <AvatarImage src={logoImage || undefined} />}
                          <AvatarFallback><Building className="h-10 w-10" /></AvatarFallback>
                      </Avatar>
                       <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                            <SimpleImageUploadButton
                              onChange={handleLogoChange} // FIX: Use new handler
                              buttonText="Change Logo"
                              iconOnly={true}
                            />
                      </div>
                  </div>

                  <div className="flex-1 text-white pb-2">
                      <h1 className="text-3xl font-headline font-bold">{watchedValues.businessName}</h1>
                      <p className="mt-1 text-gray-300">{watchedValues.description || 'Your company description'}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-300">
                          {watchedValues.industry && <div className="flex items-center gap-2"><Building className="h-4 w-4" /> {watchedValues.industry}</div>}
                          {watchedValues.town && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {watchedValues.town}</div>}
                          {watchedValues.website && <a href={watchedValues.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary-foreground"><Globe className="h-4 w-4" /> {watchedValues.website}</a>}
                          {watchedValues.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {watchedValues.phone}</div>}
                          {watchedValues.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {watchedValues.email}</div>}
                      </div>
                  </div>
              </div>
          </div>
        </Card>

        <div>
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application-wide settings here.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="profile" className="w-full">
                  <div className="flex items-center justify-between border-b">
                    <TabsList className="grid grid-cols-3">
                        <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                        <TabsTrigger value="branding"><Paintbrush className="mr-2 h-4 w-4" />Branding</TabsTrigger>
                        <TabsTrigger value="modules"><SlidersHorizontal className="mr-2 h-4 w-4" />Modules</TabsTrigger>
                    </TabsList>
                    {myCompanyId && (
                      <Button variant="outline" asChild>
                          <Link href={`/marketplace/${myCompanyId}`}><Eye className="mr-2 h-4 w-4"/>View as visitor</Link>
                      </Button>
                    )}
                  </div>

                  <TabsContent value="profile" className="pt-6">
                      <Card>
                          <CardContent className="space-y-4 pt-6">
                              <FormField control={form.control} name="businessName" render={({ field }) => (
                                  <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="A brief description of what your business does."
                                                maxLength={180}
                                                {...field}
                                            />
                                        </FormControl>
                                        <div className="flex justify-between">
                                            <FormMessage />
                                            <div className="text-xs text-muted-foreground">
                                                {field.value?.length || 0}/180
                                            </div>
                                        </div>
                                    </FormItem>
                                )}
                                />
                               <FormField control={form.control} name="address" render={({ field }) => (
                                  <FormItem><FormLabel>Business Address</FormLabel><FormControl><Input placeholder="P.O. Box 303, Blantyre, Malawi" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={form.control} name="phone" render={({ field }) => (
                                      <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+265 999 123 456" {...field} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name="email" render={({ field }) => (
                                      <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input placeholder="contact@yourcompany.com" {...field} /></FormControl><FormMessage /></FormItem>
                                  )} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={form.control} name="website" render={({ field }) => (
                                      <FormItem><FormLabel>Website (Optional)</FormLabel><FormControl><Input placeholder="https://yourcompany.com" {...field} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name="taxNumber" render={({ field }) => (
                                      <FormItem><FormLabel>Tax / VAT Number (Optional)</FormLabel><FormControl><Input placeholder="Your Tax ID" {...field} /></FormControl><FormMessage /></FormItem>
                                  )} />
                              </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="industry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Industry</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={industries}
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    placeholder="Select or create an industry..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                  <FormField control={form.control} name="town" render={({ field }) => (
                                      <FormItem><FormLabel>Town/Area</FormLabel><FormControl><Input placeholder="e.g., Blantyre, Lilongwe" {...field} /></FormControl><FormMessage /></FormItem>
                                  )} />
                              </div>
                          </CardContent>
                      </Card>
                  </TabsContent>
                  
                  <TabsContent value="branding" className="pt-6">
                      <Card>
                        <CardContent className="pt-6">
                           <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                                <p className="text-muted-foreground">Branding controls are now on the profile banner.</p>
                            </div>
                        </CardContent>
                      </Card>
                  </TabsContent>
                  
                  <TabsContent value="modules" className="pt-6">
                       <Card>
                          <CardContent className="pt-6">
                             <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                                  <p className="text-muted-foreground">Feature toggles will be available here soon.</p>
                              </div>
                          </CardContent>
                      </Card>
                  </TabsContent>
              </Tabs>
              <div className="flex justify-start pt-8">
                  <Button type="submit">Save All Settings</Button>
              </div>
        </form>
      </Form>
    </div>
  );
}