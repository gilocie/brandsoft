
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

const settingsSchema = z.object({
  defaultCurrency: z.string().min(1, "Default currency is required"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();

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
                                <FormItem>
                                <FormLabel>Default Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a default currency" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {currencies.map(currency => (
                                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    This will be the default currency for new invoices.
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
