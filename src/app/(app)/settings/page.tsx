
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig, type Company } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useRef, ChangeEvent, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, SlidersHorizontal, User, Building, MapPin, Globe, Phone, Mail, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
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
  
  // These modify the GLOBAL settings (Sidebar, etc)
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

  // Determine the Company ID based on the ALREADY SAVED name (before editing)
  const myCompanyId = useMemo(() => {
    if (!config) return null;
    const existingCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
    return existingCompany ? existingCompany.id : null;
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

  const handleLogoChange = async (value: string) => {
    setLogoImage(value); // Updates UI immediately
  };

  const handleCoverChange = async (value: string) => {
    setCoverImage(value); // Updates UI immediately
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!config) return;

    // 1. Identify the Target ID
    // If we found a company matching the PREVIOUS name, use that ID.
    // Otherwise, generate a new one based on the new name.
    let targetCompanyId = myCompanyId;
    if (!targetCompanyId) {
        targetCompanyId = `COMP-ME-${data.businessName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
    }

    // 2. FORCE SAVE images to the Company Specific Key
    // NOTE: We use `logoImage` (state) because the user might not have changed the image in this session,
    // but we need to make sure the specific key is populated.
    if (logoImage) {
        await saveImageToDB(`company-logo-${targetCompanyId}`, logoImage);
    }
    if (coverImage) {
        await saveImageToDB(`company-cover-${targetCompanyId}`, coverImage);
    }

    // 3. Update the companies list
    const companies = config.companies || [];
    const myCompanyIndex = companies.findIndex(c => c.id === targetCompanyId);

    const updatedMyCompany: Partial<Company> = {
        id: targetCompanyId,
        name: data.businessName,
        companyName: data.businessName,
        description: data.description,
        // Mark as indexed-db so Marketplace knows to check DB
        logo: logoImage ? 'indexed-db' : undefined,
        coverImage: coverImage ? 'indexed-db' : undefined,
        website: data.website,
        phone: data.phone,
        email: data.email,
        address: data.address,
        town: data.town,
        industry: data.industry,
        customerType: 'company',
        version: (myCompanyIndex > -1 ? companies[myCompanyIndex].version || 0 : 0) + 1
    };

    const newCompanies = [...companies];
    
    if (myCompanyIndex > -1) {
        // Update existing
        newCompanies[myCompanyIndex] = { ...newCompanies[myCompanyIndex], ...updatedMyCompany } as Company;
    } else {
        // Create new
        newCompanies.push({
            ...updatedMyCompany,
            id: targetCompanyId, 
            logo: logoImage ? 'indexed-db' : undefined,
            coverImage: coverImage ? 'indexed-db' : undefined,
        } as Company);
    }

    // 4. Update the global config
    const newConfig: BrandsoftConfig = {
        ...config,
        brand: {
            ...config.brand,
            businessName: data.businessName,
            description: data.description || '',
            logo: logoImage ? 'indexed-db' : config.brand.logo, 
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
        description: "Your company profile and marketplace listing have been updated.",
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
                    onChange={handleCoverChange}
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
                              onChange={handleLogoChange}
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

Step 4: Now, fix the import in the Company Detail Page
The last step is to fix the import in the marketplace detail page.

Replace src/app/(app)/marketplace/[id]/page.tsx with this:

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type Company, type Product, type Review } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, MapPin, Globe, Phone, Mail, FileBarChart2, ArrowLeft, Info, Package, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { RatingDialog } from '@/components/rating-dialog';
import { Separator } from '@/components/ui/separator';
import { getImageFromDB } from '@/hooks/use-brand-image'; // FIX: This was the final import that needed fixing
import { Skeleton } from '@/components/ui/skeleton';

const fallBackCover = 'https://picsum.photos/seed/shopcover/1200/400';
const REVIEWS_PER_PAGE = 10;

// Helper to check if a value is a valid image URL
const isValidImageUrl = (value: string | undefined): boolean => {
  if (!value) return false;
  if (value === 'indexed-db') return false;
  if (value === '') return false;
  return true;
};


export default function VirtualShopPage() {
  const params = useParams();
  const router = useRouter();
  const { config, addReview } = useBrandsoft();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(0);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isImagesLoading, setIsImagesLoading] = useState(true);

  const business = useMemo(() => {
    return config?.companies.find(c => c.id === params.id) || null;
  }, [config?.companies, params.id]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchImages = async () => {
      if (!business) {
        setIsImagesLoading(false);
        return;
      }
      
      setIsImagesLoading(true);
      
      const logoKey = `company-logo-${business.id}`;
      const coverKey = `company-cover-${business.id}`;

      const [logo, cover] = await Promise.all([
        getImageFromDB(logoKey),
        getImageFromDB(coverKey)
      ]);
      
      if (isMounted) {
        const fallbackLogo = isValidImageUrl(business.logo) ? business.logo : null;
        const fallbackCover = isValidImageUrl(business.coverImage) ? business.coverImage : null;
        
        setLogoUrl(logo || fallbackLogo || null);
        setCoverUrl(cover || fallbackCover || null);
        setIsImagesLoading(false);
      }
    };

    fetchImages();
    
    return () => { isMounted = false; };
  }, [business]);

  const products = useMemo(() => {
    return config?.products || [];
  }, [config?.products]);

  const currentUserId = useMemo(() => {
    if (!config) return null;
    
    const asCompany = config.companies.find(c => c.companyName === config.brand.businessName);
    if (asCompany) return asCompany.id;
  
    const asCustomer = config.customers.find(c => c.name === config.brand.businessName);
    if (asCustomer) return asCustomer.id;
  
    return 'CUST-DEMO-ME'; 
  }, [config]);
  
  const reviews = useMemo(() => {
    if (!config?.reviews || !business) return [];
    return config.reviews.filter(r => r.businessId === business.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [config?.reviews, business]);
  
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return total / reviews.length;
  }, [reviews]);
  
  const paginatedReviews = useMemo(() => {
    const startIndex = reviewsPage * REVIEWS_PER_PAGE;
    return reviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [reviews, reviewsPage]);
  const totalReviewPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);

  const isOwnProfile = business?.id === currentUserId;

  if (!business) {
    return (
        <div className="text-center py-10">
            Business not found.
        </div>
    );
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  const handleRequestQuotation = () => {
    if (selectedProductIds.length > 0 && currentUserId) {
      const productQuery = selectedProductIds.join(',');
      router.push(`/quotations/new?products=${productQuery}&customerId=${business.id}&senderId=${currentUserId}`);
    }
  };
  
  const handleRatingSubmit = (rating: number, comment: string) => {
    if (!config) {
      console.error("No config found");
      return;
    }
    
    if (!currentUserId) {
      console.error("No user ID found");
      return;
    }
    
    const newReview: Omit<Review, 'id'> = {
      businessId: business.id,
      reviewerId: currentUserId,
      reviewerName: config.brand.businessName || "Anonymous",
      rating,
      comment,
      date: new Date().toISOString(),
    };
  
    addReview(newReview);
    setIsRatingOpen(false);
  };
  
  const currencyCode = config?.profile.defaultCurrency || '';

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/marketplace"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Marketplace</Link>
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="p-0">
           <div className="relative h-48 w-full">
                {isImagesLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <Image
                      src={coverUrl || fallBackCover}
                      alt={`${business.companyName} cover`}
                      fill
                      className="object-cover"
                      data-ai-hint="office workspace"
                  />
                )}
                <div className="absolute inset-0 bg-black/50" />
                 <div className="absolute inset-0 p-6 flex flex-col md:flex-row items-start gap-6">
                    <Avatar className="h-24 w-24 border-4 border-background flex-shrink-0">
                        {isImagesLoading ? (
                          <Skeleton className="h-full w-full rounded-full" />
                        ) : (
                          <>
                            <AvatarImage src={logoUrl || undefined} />
                            <AvatarFallback><Building className="h-10 w-10" /></AvatarFallback>
                          </>
                        )}
                    </Avatar>
                    <div className="flex-1 text-white pt-2">
                        <CardTitle className="text-3xl font-headline">{business.companyName}</CardTitle>
                        <CardDescription className="mt-1 text-gray-300">{business.description || 'Leading provider in our industry.'}</CardDescription>
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                            {business.industry && <div className="flex items-center gap-2"><Building className="h-4 w-4" /> {business.industry}</div>}
                            {business.town && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {business.town}</div>}
                            {business.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> <a href={business.website} target="_blank" rel="noreferrer" className="text-primary-foreground hover:underline">{business.website}</a></div>}
                            {business.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {business.phone}</div>}
                            {business.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {business.email}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </CardHeader>
      </Card>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-headline">Product & Service Catalog</h2>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">({reviews.length} reviews)</span>
                </div>
                {!isOwnProfile && (
                    <Button variant="outline" onClick={() => setIsRatingOpen(true)}>Rate Business</Button>
                )}
            </div>
        </div>

         <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Demonstration Catalog</AlertTitle>
            <AlertDescription>
                This catalog shows all products available in the application for demonstration purposes. In a real-world scenario, it would only display products belonging to this specific business.
            </AlertDescription>
         </Alert>

        <Card>
            <CardContent className="p-0">
                 {products.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedProductIds.includes(product.id)}
                                            onCheckedChange={() => handleSelectProduct(product.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-sm truncate">{product.description || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{currencyCode}{product.price.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mb-4 text-gray-300" />
                        <h3 className="font-semibold">No Products Yet</h3>
                        <p className="text-sm">This business hasn't listed any products or services in the marketplace.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        
         {selectedProductIds.length > 0 && (
            <div className="sticky bottom-6 flex justify-center">
                <Button size="lg" className="shadow-lg animate-in fade-in zoom-in-95" onClick={handleRequestQuotation} disabled={!currentUserId}>
                    <FileBarChart2 className="mr-2 h-4 w-4" />
                    Request Quotation for {selectedProductIds.length} Item(s)
                </Button>
            </div>
        )}
      </div>

       <div className="space-y-4">
        <h2 className="text-2xl font-bold font-headline mt-8">Customer Reviews</h2>
        {reviews.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {paginatedReviews.map((review) => {
                  let reviewerLogo: string | undefined = undefined;
                  if (review.reviewerId === currentUserId) {
                      reviewerLogo = isValidImageUrl(config?.brand.logo) ? config?.brand.logo : undefined;
                  } else {
                      const reviewer = config?.companies.find(c => c.id === review.reviewerId);
                      reviewerLogo = isValidImageUrl(reviewer?.logo) ? reviewer?.logo : undefined;
                  }
                  
                  return (
                      <div key={review.id} className="p-6">
                        <div className="flex items-start gap-4">
                            <Avatar>
                                <AvatarImage src={reviewerLogo} />
                                <AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                 <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{review.reviewerName}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                 </div>
                                 <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                            </div>
                        </div>
                      </div>
                  );
                })}
              </div>
            </CardContent>
            {totalReviewPages > 1 && (
                <CardContent className="p-4 border-t">
                    <div className="flex items-center justify-between">
                         <span className="text-sm text-muted-foreground">Page {reviewsPage + 1} of {totalReviewPages}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setReviewsPage(p => p - 1)} disabled={reviewsPage === 0}>Previous</Button>
                            <Button variant="outline" size="sm" onClick={() => setReviewsPage(p => p + 1)} disabled={reviewsPage >= totalReviewPages - 1}>Next</Button>
                        </div>
                    </div>
                </CardContent>
            )}
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <h3 className="font-semibold">No Reviews Yet</h3>
            <p className="text-sm mt-1">Be the first one to share your experience.</p>
          </div>
        )}
      </div>

       <RatingDialog 
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          onSubmit={handleRatingSubmit}
          businessName={business.companyName}
        />
    </div>
  );
}