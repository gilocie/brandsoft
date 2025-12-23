
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from 'lucide-react';
import brandsoftBackground from '@/app/backgrounds/background.jpg';
import Link from 'next/link';

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function StaffLoginPage() {
  const { affiliateLogin } = useBrandsoft();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTimeout(() => {
      const success = affiliateLogin(values.username, values.password);
      if (!success) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid username or password.",
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
          <CardTitle className="font-body text-2xl">Staff Login</CardTitle>
          <CardDescription>Enter your credentials to access your office.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                     <div className="relative">
                        <FormControl>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Your password"
                            {...field}
                        />
                        </FormControl>
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-sm">
           <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/staff/register" className="font-medium text-primary hover:underline">
                    Register here
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
