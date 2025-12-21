
"use client";

import { useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import brandsoftBackground from '@/app/backgrounds/background.jpg';

const formSchema = z.object({
  serialKey: z.string().min(1, { message: "Serial key is required." }),
});

// Admin Activation Key: BS-GSS-XXXXXXXX-XXXXXX (Brandsoft-GoSaveSite)
// Affiliate Activation Key: BS-AFF-XXXXXXXX-XXXXXX (Brandsoft-Affiliate)
// For testing, we will use a valid admin key format.
const VALID_SERIAL = 'BS-GSS-DEMO0000-000000';

export default function ActivationPage() {
  const { activate } = useBrandsoft();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialKey: "",
    },
  });
  
  const handleSerialKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
      let formattedValue = rawValue;
      
      if (rawValue.length > 2) {
        formattedValue = `${rawValue.slice(0, 2)}-${rawValue.slice(2)}`;
      }
      if (rawValue.length > 5) {
        formattedValue = `${rawValue.slice(0, 2)}-${rawValue.slice(2, 5)}-${rawValue.slice(5)}`;
      }
      if (rawValue.length > 13) {
        formattedValue = `${rawValue.slice(0, 2)}-${rawValue.slice(2, 5)}-${rawValue.slice(5, 13)}-${rawValue.slice(13, 20)}`;
      }

      form.setValue('serialKey', formattedValue.slice(0, 26)); // Max length with hyphens
  };
  
  const rawValue = form.watch('serialKey').replace(/-/g, '');

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTimeout(() => { // Simulate network delay
      // Normalize both keys for comparison
      const submittedKey = values.serialKey.replace(/-/g, '').toUpperCase();
      const validKey = VALID_SERIAL.replace(/-/g, '').toUpperCase();

      let success = false;
      if(submittedKey === validKey) {
        success = activate(VALID_SERIAL);
      } else {
        success = activate(values.serialKey);
      }

      if (!success) {
        toast({
          variant: "destructive",
          title: "Activation Failed",
          description: "The serial key is invalid. Please try again.",
        });
      }
      setIsLoading(false);
    }, 1000);
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-background p-4 font-body bg-cover bg-center"
      style={{ backgroundImage: `url(${brandsoftBackground.src})` }}
      data-ai-hint="business building"
    >
      <div className="absolute inset-0 bg-black/80" />
      <Card className="w-full max-w-md shadow-2xl z-10 bg-background">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="font-body text-2xl">Software Activation</CardTitle>
          <CardDescription>Please enter your serial key to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="serialKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-center block">Serial Key</FormLabel>
                     <div className="relative">
                        <FormControl>
                          <Input 
                            {...field}
                            onChange={handleSerialKeyChange}
                            placeholder="XX-XXX-XXXXXXXX-XXXXXX" 
                            className="text-center placeholder:text-center font-mono tracking-widest"
                            maxLength={26}
                          />
                        </FormControl>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {rawValue.length}/20
                        </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col text-center text-xs text-muted-foreground">
            <p>Enter your serial key to unlock all features of BrandSoft.</p>
            <p className="mt-2">For testing purposes, use: <code className="font-code p-1 bg-muted rounded-sm">{VALID_SERIAL}</code></p>
        </CardFooter>
      </Card>
    </div>
  );
}
