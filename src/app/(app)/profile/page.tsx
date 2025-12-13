
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
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  description: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  town: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  taxNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: '',
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
  
  useEffect(() => {
    if (config) {
        form.reset({
            businessName: config.brand.businessName,
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

  const onSubmit = (data: ProfileFormData) => {
    if (config) {
      const newConfig: BrandsoftConfig = {
        ...config,
        brand: {
          ...config.brand,
          businessName: data.businessName,
          description: data.description || '',
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
        title: "Profile Saved",
        description: "Your business profile has been updated.",
      });
    }
  };

  if (!config) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your public-facing business profile and contact information.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Business Details</CardTitle>
                    <CardDescription>This information may be visible to other users in the Town Marketplace.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="businessName" render={({ field }) => (
                        <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Company Description</FormLabel><FormControl><Textarea placeholder="A brief description of what your business does." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
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

            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>How your customers can reach you.</CardDescription>
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
                </CardContent>
            </Card>

            <div className="flex justify-start">
                <Button type="submit">Save Profile</Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
