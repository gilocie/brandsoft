
'use client';

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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  ChevronDown,
  KeyRound,
  User,
  Store,
  MessageSquareQuote,
  Bell,
  Shield,
  History,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { WalletBalance } from '@/components/wallet-balance';

const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', enabledKey: null },
  { href: '/history', icon: Wallet, label: 'Wallet', enabledKey: null },
  { href: '/office', icon: BriefcaseBusiness, label: 'Office', enabledKey: null },
  { href: '/invoices', icon: FileText, label: 'Invoices', enabledKey: 'invoice' },
  { href: '/quotations', icon: FileBarChart2, label: 'Quotations', enabledKey: 'quotation' },
  { href: '/quotation-requests', icon: MessageSquareQuote, label: 'Requests', enabledKey: 'quotation' },
  { href: '/products', icon: Package, label: 'Products', enabledKey: 'invoice' },
  { href: '/companies', icon: Users, label: 'Companies', enabledKey: null },
  { href: '/marketplace', icon: Store, label: 'Suppliers', enabledKey: null },
  { href: '/admin', icon: Shield, label: 'Admin', enabledKey: null },
];

const upcomingNavItems = [
  { href: '/certificates', icon: Award, label: 'Certificates', enabledKey: 'certificate' },
  { href: '/id-cards', icon: CreditCard, label: 'ID Cards', enabledKey: 'idCard' },
  { href: '/marketing-materials', icon: Brush, label: 'Marketing', enabledKey: 'marketing' },
  { href: '/templates', icon: Library, label: 'Templates', enabledKey: null },
];

const navItems = [...mainNavItems, ...upcomingNavItems];

const HeaderWalletCard = () => {
  const { config } = useBrandsoft();
  if (!config?.profile) return null;

  const balance = config.profile.walletBalance || 0;
  const creditValue = config.admin?.exchangeValue || 1000;
  const bsCredits = balance / creditValue;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="flex-shrink-0">
          <Wallet className="h-5 w-5 mr-2" />
          Wallet
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Wallet Balance</h4>
            <p className="text-sm text-muted-foreground">
              Your available funds for purchases.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border bg-muted p-4">
            <p className="text-4xl font-bold">
                {config.profile.defaultCurrency || 'K'}{balance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
                ≈ BS {bsCredits.toFixed(2)}
            </p>
          </div>
          <WalletBalance variant="default" className="w-full" />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { config } = useBrandsoft();

  const currentUserId = useMemo(() => {
    if (!config || !config.brand) return null;
    const myCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
    return myCompany?.id || null;
  }, [config]);

  const notificationCount = useMemo(() => {
    if (!config) return 0;
    const incomingCount = config.incomingRequests?.length || 0;
    const responseCount = config.requestResponses?.length || 0;
    return incomingCount + responseCount;
  }, [config]);


  const getVisibleNavItems = (items: typeof mainNavItems) => {
    if (!config) return [];
    return items.filter(item => {
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

  const visibleMainNavItems = getVisibleNavItems(mainNavItems);
  const visibleUpcomingNavItems = getVisibleNavItems(upcomingNavItems);
  
  const pageTitle = navItems.find(item => pathname.startsWith(item.href))?.label || 'Dashboard';

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
                    <h1 className={cn('text-base font-bold', getFontClass(config.brand.font))}>
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
            {config ? visibleMainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} className="relative">
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                     {item.href === '/quotation-requests' && notificationCount > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {notificationCount}
                        </span>
                    )}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )) : (
              // Skeleton loading for nav items
              Array.from({length: 5}).map((_, i) => <SidebarMenuSkeleton key={i} showIcon />)
            )}
          </SidebarMenu>
          
          <SidebarSeparator className="my-2" />

          <Accordion type="single" collapsible className="w-full px-2">
            <AccordionItem value="upcoming-tools" className="border-none">
              <AccordionTrigger className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:no-underline text-xs font-medium rounded-md px-2 [&[data-state=open]>svg]:text-sidebar-foreground">
                <span className="flex-1 text-left">Upcoming Tools</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <SidebarMenu className="px-0">
                    {config ? visibleUpcomingNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            disabled
                            isActive={pathname.startsWith(item.href)}
                            tooltip={item.label}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    )) : (
                    // Skeleton loading for nav items
                    Array.from({length: 4}).map((_, i) => <SidebarMenuSkeleton key={i} showIcon />)
                    )}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 px-4 md:px-6 z-10 min-w-0 flex-shrink-0">
          <SidebarTrigger className="md:hidden flex-shrink-0" />
          <h1 className="text-lg font-semibold font-headline flex-1 truncate">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-2">
            <HeaderWalletCard />
            <Button variant="ghost" size="icon" asChild className="flex-shrink-0 relative">
              <Link href="/quotation-requests?subtab=incoming">
                <Bell className="h-6 w-6" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                    {notificationCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
        <footer className="p-4 text-center text-sm text-muted-foreground border-t bg-background flex-shrink-0">
          © 2025 BrandSoft. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
