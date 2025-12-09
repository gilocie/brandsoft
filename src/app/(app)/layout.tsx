
"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  FileText,
  Award,
  CreditCard,
  FileBarChart2,
  Brush,
  Library,
  Users,
  Package,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", enabledKey: null },
  { href: "/invoices", icon: FileText, label: "Invoices", enabledKey: "invoice" },
  { href: "/customers", icon: Users, label: "Customers", enabledKey: "invoice" },
  { href: "/products", icon: Package, label: "Products", enabledKey: "invoice" },
  { href: "/certificates", icon: Award, label: "Certificates", enabledKey: "certificate" },
  { href: "/id-cards", icon: CreditCard, label: "ID Cards", enabledKey: "idCard" },
  { href: "/quotations", icon: FileBarChart2, label: "Quotations", enabledKey: "quotation" },
  { href: "/marketing-materials", icon: Brush, label: "Marketing", enabledKey: "marketing" },
  { href: "/templates", icon: Library, label: "Templates", enabledKey: null },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { config } = useBrandsoft();

  const getVisibleNavItems = () => {
    if (!config) return [];
    return navItems.filter(item => {
      if (item.enabledKey === null) return true;
      return config.modules[item.enabledKey as keyof typeof config.modules];
    });
  };

  const getFontClass = (fontName?: string) => {
    switch(fontName) {
      case 'Poppins': return 'font-body';
      case 'Belleza': return 'font-headline';
      case 'Source Code Pro': return 'font-code';
      default: return 'font-body';
    }
  };

  const visibleNavItems = getVisibleNavItems();
  const pageTitle = navItems.find(item => pathname.startsWith(item.href))?.label || "Dashboard";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            {config ? (
                <Link href="/settings" className="flex items-center gap-2 text-sidebar-foreground">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={config.brand.logo} alt={config.brand.businessName} />
                        <AvatarFallback>
                            <BriefcaseBusiness className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <h1 className={cn("text-base font-bold", getFontClass(config.brand.font))}>
                        {config.brand.businessName}
                    </h1>
                </Link>
            ) : (
                <>
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-24" />
                </>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {config ? visibleNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )) : (
              // Skeleton loading for nav items
              Array.from({length: 7}).map((_, i) => <SidebarMenuSkeleton key={i} showIcon />)
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto mb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              {config ? (
                <div className="flex flex-col items-center justify-center p-2 text-center space-y-2">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                        <BriefcaseBusiness className="h-8 w-8 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-semibold text-sidebar-foreground/80">BrandSoft Studio</p>
                </div>
              ) : (
                <div className="flex items-center justify-center p-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 px-4 md:px-6 z-10">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold font-headline flex-1">
            {pageTitle}
          </h1>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </header>
        <div className="flex-1 flex flex-col overflow-x-hidden">
            <main className="flex-1 p-4 md:p-6">{children}</main>
            <footer className="p-4 pb-4 text-center text-sm text-muted-foreground sticky bottom-0 bg-background">
              © 2025 BrandSoft. All rights reserved.
            </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
