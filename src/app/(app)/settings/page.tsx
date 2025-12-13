
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UploadCloud, Paintbrush, SlidersHorizontal, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';


const settingsSchema = z.object({
  // Branding
  businessName: z.string().min(2, "Business name is required"),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  font: z.string().optional(),
  // Profile
  description: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  town: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  taxNumber: z.string().optional(),
  // Button
  buttonPrimaryBg: z.string().optional(),
  buttonPrimaryBgHover: z.string().optional(),
  buttonPrimaryText: z.string().optional(),
  buttonPrimaryTextHover: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;


export default function SettingsPage() {
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: '',
      logo: '',
      primaryColor: '#9400D3',
      secondaryColor: '#D87093',
      font: 'Poppins',
      buttonPrimaryBg: '#9400D3',
      buttonPrimaryBgHover: '#8A2BE2',
      buttonPrimaryText: '#FFFFFF',
      buttonPrimaryTextHover: '#FFFFFF',
    },
  });
  
  useEffect(() => {
    if (config) {
        form.reset({
            businessName: config.brand.businessName,
            logo: config.brand.logo,
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
        setLogoPreview(config.brand.logo);
    }
  }, [config, form]);
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        form.setValue('logo', dataUrl, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = (data: SettingsFormData) => {
    if (config) {
      const newConfig: BrandsoftConfig = {
        ...config,
        brand: {
          ...config.brand,
          businessName: data.businessName,
          description: data.description || '',
          logo: data.logo || '',
          primaryColor: data.primaryColor || '#9400D3',
          secondaryColor: data.secondaryColor || '#D87093',
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
      };
      saveConfig(newConfig, { redirect: false });
      toast({
        title: "Settings Saved",
        description: "Your new settings have been applied.",
      });
    }
  };

  if (!config) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application-wide settings here.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="branding"><Paintbrush className="mr-2 h-4 w-4" />Branding</TabsTrigger>
                     <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                    <TabsTrigger value="modules"><SlidersHorizontal className="mr-2 h-4 w-4" />Modules</TabsTrigger>
                </TabsList>
                
                <TabsContent value="branding" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Brand Identity</CardTitle>
                            <CardDescription>Update your company's branding details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-4">
                                    <FormField control={form.control} name="businessName" render={({ field }) => (
                                        <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="logo" render={() => (
                                        <FormItem>
                                            <FormLabel>Logo</FormLabel>
                                            <FormControl>
                                                <div>
                                                    <Input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload}/>
                                                    <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} className="w-full">
                                                        <UploadCloud className="mr-2 h-4 w-4" /> Upload Logo
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="flex flex-col items-center justify-center space-y-2 rounded-md border border-dashed p-4 h-full">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={logoPreview || undefined} alt={config?.brand.businessName} />
                                        <AvatarFallback className="text-3xl">
                                            {config?.brand.businessName?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm text-muted-foreground">Logo Preview</p>
                                </div>
                            </div>
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Company Description</FormLabel><FormControl><Textarea placeholder="A brief description of what your business does." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="font" render={({ field }) => (
                                <FormItem><FormLabel>Font</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a font" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Poppins">Poppins</SelectItem>
                                        <SelectItem value="Belleza">Belleza</SelectItem>
                                        <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                                        <SelectItem value="Arial">Arial</SelectItem>
                                        <SelectItem value="Verdana">Verdana</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="primaryColor" render={({ field }) => (
                                <FormItem><FormLabel>Primary Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="secondaryColor" render={({ field }) => (
                                <FormItem><FormLabel>Accent Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Button Customization</CardTitle>
                            <CardDescription>Define the look of your primary buttons.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Normal State</h4>
                                    <FormField control={form.control} name="buttonPrimaryBg" render={({ field }) => (
                                        <FormItem><FormLabel>Background</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="buttonPrimaryText" render={({ field }) => (
                                        <FormItem><FormLabel>Text Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
                                    )} />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Hover State</h4>
                                    <FormField control={form.control} name="buttonPrimaryBgHover" render={({ field }) => (
                                        <FormItem><FormLabel>Background</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="buttonPrimaryTextHover" render={({ field }) => (
                                        <FormItem><FormLabel>Text Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl></FormItem>
                                    )} />
                                </div>
                           </div>
                           <div className="pt-4">
                                <Label>Preview</Label>
                                <div className="p-4 rounded-md border flex justify-center">
                                    <Button 
                                        type="button" 
                                        className="btn-primary-custom"
                                        style={{
                                            '--btn-primary-bg': form.watch('buttonPrimaryBg'),
                                            '--btn-primary-text': form.watch('buttonPrimaryText'),
                                            '--btn-primary-bg-hover': form.watch('buttonPrimaryBgHover'),
                                            '--btn-primary-text-hover': form.watch('buttonPrimaryTextHover'),
                                        } as React.CSSProperties}
                                    >
                                        Primary Button
                                    </Button>
                               </div>
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile & Contact Information</CardTitle>
                            <CardDescription>This information will appear on your documents and your public profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <FormField control={form.control} name="industry" render={({ field }) => (
                                    <FormItem><FormLabel>Industry</FormLabel><FormControl><Input placeholder="e.g., Graphic Design, Retail" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="town" render={({ field }) => (
                                    <FormItem><FormLabel>Town/Area</FormLabel><FormControl><Input placeholder="e.g., Blantyre, Lilongwe" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="modules">
                     <Card>
                        <CardHeader>
                            <CardTitle>Module Options</CardTitle>
                            <CardDescription>Enable or disable specific application modules.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
