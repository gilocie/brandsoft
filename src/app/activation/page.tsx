
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft } from '@/hooks/use-brandsoft.tsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  serialKey: z.string().min(1, { message: "Serial key is required." }),
});

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTimeout(() => { // Simulate network delay
      const success = activate(values.serialKey);
      if (!success) {
        toast({
          variant: "destructive",
          title: "Activation Failed",
          description: "The serial key is invalid. Please try again.",
        });
        setIsLoading(false);
      }
      // On success, the useBrandsoft hook will handle redirection.
    }, 1000);
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4 font-body"
      style={{ backgroundImage: "url('https://picsum.photos/seed/business/1920/1080')" }}
      data-ai-hint="business building"
    >
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
      <Card className="w-full max-w-md shadow-2xl z-10">
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
                    <FormControl>
                      <Input placeholder="XXXX-XXXX-XXXX-XXXX" {...field} className="text-center placeholder:text-center"/>
                    </FormControl>
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
            <p className="mt-2">For testing purposes, use: <code className="font-code p-1 bg-muted rounded-sm">BRANDSOFT-2024</code></p>
        </CardFooter>
      </Card>
    </div>
  );
}
