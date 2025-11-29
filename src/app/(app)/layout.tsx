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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrandsoft } from "@/hooks/use-brandsoft.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", enabledKey: null },
  { href: "/invoices", icon: FileText, label: "Invoices", enabledKey: "invoice" },
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

  const visibleNavItems = getVisibleNavItems();
  const pageTitle = navItems.find(item => pathname.startsWith(item.href))?.label || "Dashboard";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-6 w-6 text-primary-foreground" />
            <h1 className="text-xl font-headline font-bold text-primary-foreground">
              BrandSoft
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {config ? visibleNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )) : (
              // Skeleton loading for nav items
              Array.from({length: 5}).map((_, i) => <SidebarMenuSkeleton key={i} showIcon />)
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto mb-[50px]">
          <SidebarMenu>
            <SidebarMenuItem>
              {config ? (
                <div className="flex items-center gap-3 p-2 text-left">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={config.brand.logo} alt={config.brand.businessName} />
                    <AvatarFallback>{config.brand.businessName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{config.brand.businessName}</p>
                      <p className="text-xs text-sidebar-foreground/70 truncate">{config.profile.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 px-4 md:px-6 z-10">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold font-headline">
            {pageTitle}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
