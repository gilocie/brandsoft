
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type BrandsoftConfig } from '@/hooks/use-brandsoft.tsx';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PlusCircle, UploadCloud } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


const settingsSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  font: z.string().optional(),
  defaultCurrency: z.string().min(1, "Default currency is required"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const newCurrencySchema = z.object({
    currencyCode: z.string().min(3, "Currency code must be 3 characters").max(3, "Currency code must be 3 characters"),
    setAsDefault: z.boolean().default(false),
});
type NewCurrencyFormData = z.infer<typeof newCurrencySchema>;


export default function SettingsPage() {
  const { config, saveConfig, addCurrency } = useBrandsoft();
  const { toast } = useToast();
  const [isAddCurrencyOpen, setIsAddCurrencyOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: config?.brand.businessName || '',
      logo: config?.brand.logo || '',
      primaryColor: config?.brand.primaryColor || '',
      secondaryColor: config?.brand.secondaryColor || '',
      font: config?.brand.font || 'Poppins',
      defaultCurrency: config?.profile.defaultCurrency || 'USD',
    },
  });

  const newCurrencyForm = useForm<NewCurrencyFormData>({
    resolver: zodResolver(newCurrencySchema),
    defaultValues: { currencyCode: '', setAsDefault: false },
  });
  
  useEffect(() => {
    if (config) {
        form.reset({
            businessName: config.brand.businessName,
            logo: config.brand.logo,
            primaryColor: config.brand.primaryColor,
            secondaryColor: config.brand.secondaryColor,
            font: config.brand.font,
            defaultCurrency: config.profile.defaultCurrency,
        });
        setLogoPreview(config.brand.logo);
    }
  }, [config, form]);
  
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          logo: data.logo || '',
          primaryColor: data.primaryColor || '#9400D3',
          secondaryColor: data.secondaryColor || '#D87093',
          font: data.font || 'Poppins',
        },
        profile: {
          ...config.profile,
          defaultCurrency: data.defaultCurrency,
        },
      };
      saveConfig(newConfig);
      toast({
        title: "Settings Saved",
        description: "Your new settings have been applied.",
      });
    }
  };

  if (!config) {
    return <div>Loading settings...</div>;
  }
  
  const handleAddCurrency = (data: NewCurrencyFormData) => {
    const newCurrency = data.currencyCode.toUpperCase();
    addCurrency(newCurrency, data.setAsDefault);
    newCurrencyForm.reset({ currencyCode: '', setAsDefault: false });
    setIsAddCurrencyOpen(false);
    toast({
      title: "Currency Added",
      description: `"${newCurrency}" has been added to your currencies list.`,
    });
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
                            <FormField control={form.control} name="logo" render={({ field }) => (
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
                     <FormField
                        control={form.control}
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
                <CardContent className="pt-6">
                    <div className="max-w-md space-y-4">
                        <FormField
                          control={form.control}
                          name="defaultCurrency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Currency</FormLabel>
                               <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {config.currencies.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div>
                             <Dialog open={isAddCurrencyOpen} onOpenChange={setIsAddCurrencyOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Currency
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Currency</DialogTitle>
                                        <DialogDescription>
                                            Enter the 3-letter code for the new currency (e.g., INR).
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...newCurrencyForm}>
                                        <form onSubmit={newCurrencyForm.handleSubmit(handleAddCurrency)} className="space-y-4">
                                            <FormField
                                                control={newCurrencyForm.control}
                                                name="currencyCode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                    <FormLabel>Currency Code</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="EUR" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={newCurrencyForm.control}
                                                name="setAsDefault"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div className="space-y-0.5">
                                                            <FormLabel>Set as Default</FormLabel>
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
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsAddCurrencyOpen(false)}>Cancel</Button>
                                                <Button type="submit">Add Currency</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                             </Dialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-start">
                <Button type="submit">Save All Settings</Button>
            </div>
        </form>
      </Form>
    </div>
  );
}

    