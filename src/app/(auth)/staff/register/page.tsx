
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Affiliate } from '@/hooks/use-brandsoft';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PartyPopper } from 'lucide-react';
import brandsoftBackground from '@/app/backgrounds/background.jpg';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  username: z.string().min(3, "Username must be at least 3 characters.").refine(s => !s.includes(' '), 'Username cannot contain spaces.'),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof formSchema>;

export default function StaffRegisterPage() {
  const { registerAffiliate } = useBrandsoft();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [generatedStaffId, setGeneratedStaffId] = useState('');

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", username: "", password: "", confirmPassword: "" },
  });

  function onSubmit(values: RegistrationFormData) {
    setIsLoading(true);
    setTimeout(() => {
      const newStaffId = registerAffiliate(values);
      if (newStaffId) {
        setGeneratedStaffId(newStaffId);
        setRegistrationSuccess(true);
        toast({
          title: "Registration Successful!",
          description: "Your staff account has been created.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "An affiliate account may already exist.",
        });
      }
      setIsLoading(false);
    }, 1000);
  }

  if (registrationSuccess) {
    return (
      <div 
        className="flex min-h-screen items-center justify-center bg-background p-4 font-body bg-cover bg-center"
        style={{ backgroundImage: `url(${brandsoftBackground.src})` }}
      >
        <div className="absolute inset-0 bg-black/80" />
        <Card className="w-full max-w-md shadow-2xl z-10 bg-background text-center">
          <CardHeader>
             <div className="mx-auto bg-green-100 rounded-full p-3 w-fit mb-4">
               <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
            <CardDescription>
              Your staff account is ready. Here is your unique Staff ID.
              Keep it safe as it will be used by your clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Your Staff ID</p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider">{generatedStaffId}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/staff/login">Proceed to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
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
          <CardTitle className="font-body text-2xl">Staff Registration</CardTitle>
          <CardDescription>Create your affiliate account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input placeholder="johndoe" {...field} /></FormControl>
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
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-sm">
           <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link href="/staff/login" className="font-medium text-primary hover:underline">
                    Login here
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
