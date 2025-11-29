
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
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Combobox } from '@/components/ui/combobox';

const settingsSchema = z.object({
  defaultCurrency: z.string().min(1, "Default currency is required"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { config, saveConfig, addCurrency } = useBrandsoft();
  const { toast } = useToast();
  
  const [currencyOptions, setCurrencyOptions] = useState(
    config?.currencies?.map(c => ({label: c, value: c})) || []
  );

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultCurrency: config?.profile.defaultCurrency || 'USD',
    },
  });
  
  useEffect(() => {
    if (config) {
        form.reset({
            defaultCurrency: config.profile.defaultCurrency,
        });
        setCurrencyOptions(config.currencies.map(c => ({label: c, value: c})));
    }
  }, [config, form]);

  const onSubmit = (data: SettingsFormData) => {
    if (config) {
      const newConfig: BrandsoftConfig = {
        ...config,
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
  
  const handleCreateCurrency = (value: string) => {
    const newCurrency = value.toUpperCase();
    addCurrency(newCurrency);
    setCurrencyOptions(prev => [...prev, { label: newCurrency, value: newCurrency }]);
    form.setValue('defaultCurrency', newCurrency, { shouldValidate: true });
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
                    <CardTitle>Financial Settings</CardTitle>
                    <CardDescription>
                    Configure default settings for financial documents.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                        <FormField
                          control={form.control}
                          name="defaultCurrency"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Default Currency</FormLabel>
                               <Combobox 
                                options={currencyOptions}
                                value={field.value}
                                onChange={field.onChange}
                                onCreate={handleCreateCurrency}
                                placeholder="Select currency..."
                                createText="Create new currency"
                                notFoundText="No currency found."
                               />
                              <FormDescription>
                                This will be the default currency for new invoices. You can type to add a new one.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Save Settings</Button>
                </CardFooter>
            </Card>
        </form>
      </Form>
    </div>
  );
}
