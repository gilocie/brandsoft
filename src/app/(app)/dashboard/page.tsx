
"use client";

import { useBrandsoft } from "@/hooks/use-brandsoft.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Award, CreditCard, FileBarChart2, Brush, ArrowRight, Library } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const modules = [
  { title: "Invoice Designer", description: "Create and manage invoices.", icon: FileText, href: "/invoices", enabledKey: "invoice" },
  { title: "Certificate Designer", description: "Design professional certificates.", icon: Award, href: "/certificates", enabledKey: "certificate" },
  { title: "ID Card Designer", description: "Create company or event ID cards.", icon: CreditCard, href: "/id-cards", enabledKey: "idCard" },
  { title: "Quotation Designer", description: "Generate and send quotations.", icon: FileBarChart2, href: "/quotations", enabledKey: "quotation" },
  { title: "Marketing Materials", description: "Design flyers, posters, and more.", icon: Brush, href: "/marketing-materials", enabledKey: "marketing" },
  { title: "Template Marketplace", description: "Browse and manage templates.", icon: Library, href: "/templates", enabledKey: null },
];

export default function DashboardPage() {
  const { config } = useBrandsoft();

  if (!config) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  const enabledModules = modules.filter(m => m.enabledKey === null || config.modules[m.enabledKey as keyof typeof config.modules]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Welcome back, {config.brand.businessName}!</h1>
        <p className="text-muted-foreground">What would you like to create today?</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enabledModules.map((module) => (
          <Card key={module.title} className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <module.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl">{module.title}</CardTitle>
                  <CardDescription className="mt-1">{module.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Button asChild variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary/80">
                <Link href={module.href}>
                  Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
