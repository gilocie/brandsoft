
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Building,
  MessageSquareQuote,
  Bell,
  Shield,
  History,
  Wallet,
  Briefcase,
  Sun,
  Moon,
  MailQuestion,
  FileCheck2,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useBrandsoft, type Company } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import { WalletBalance } from '@/components/wallet-balance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import brandsoftLogo from '@/app/brandsoftlogo.png';

const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', enabledKey: null, roles: ['client'] },
  { href: '/history', icon: Wallet, label: 'Wallet', enabledKey: null, roles: ['client'] },
  { href: '/office', icon: LayoutDashboard, label: 'Dashboard', enabledKey: null, roles: ['staff'] },
  { href: '/office/orders', icon: Bell, label: 'Orders', enabledKey: null, roles: ['staff'] },
  { href: '/office/wallet', icon: Wallet, label: 'My Wallet', enabledKey: null, roles: ['staff'] },
  { href: '/office/clients', icon: Users, label: 'Clients', enabledKey: null, roles: ['staff'] },
  { href: '/office/features', icon: Shield, label: 'Features', enabledKey: null, roles: ['staff'] },
  { href: '/office/keys', icon: KeyRound, label: 'Keys', enabledKey: null, roles: ['staff'] },
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', enabledKey: null, roles: ['admin'] },
  { href: '/admin/staff', icon: Users, label: 'Staff', enabledKey: null, roles: ['admin'] },
  { href: '/admin/plans', icon: Briefcase, label: 'Plans', enabledKey: null, roles: ['admin'] },
  { href: '/companies', icon: Users, label: 'Companies', enabledKey: null, roles: ['admin'] },
  { href: '/invoices', icon: FileText, label: 'Invoices', enabledKey: 'invoice', roles: ['client'] },
  { href: '/quotations', icon: FileBarChart2, label: 'Quotations', enabledKey: 'quotation', roles: ['client'] },
  { href: '/quotation-requests', icon: MessageSquareQuote, label: 'Requests', enabledKey: 'quotation', roles: ['client'] },
  { href: '/products', icon: Package, label: 'Products', enabledKey: 'invoice', roles: ['client'] },
  { href: '/marketplace', icon: Building, label: 'City Market', enabledKey: null, roles: ['client', 'staff', 'admin'] },
];

const upcomingNavItems = [
  { href: '/certificates', icon: Award, label: 'Certificates', enabledKey: 'certificate', roles: ['admin'] },
  { href: '/id-cards', icon: CreditCard, label: 'ID Cards', enabledKey: 'idCard', roles: ['admin'] },
  { href: '/marketing-materials', icon: Brush, label: 'Marketing', enabledKey: 'marketing', roles: ['admin'] },
  { href: '/templates', icon: Library, label: 'Templates', enabledKey: null, roles: ['admin'] },
];

const HeaderWalletCard = () => {
  const { config } = useBrandsoft();
  
  const { balance, currencyCode } = useMemo(() => {
    if (!config || !config.profile?.id) {
        return { balance: 0, currencyCode: 'K' };
    }
    const company = (config.companies || []).find((c: Company) => c.id === (config.profile as any).id);
    const walletBalance = company?.walletBalance || 0;
    const code = config.profile.defaultCurrency === 'MWK' ? 'K' : config.profile.defaultCurrency || 'K';
    return { balance: walletBalance, currencyCode: code };
  }, [config]);


  if (!config?.profile) return null;

  const creditValue = config.admin?.exchangeValue || 1000;
  const bsCredits = balance / creditValue;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="flex-shrink-0 bg-green-600 text-white hover:bg-green-700">
          <Wallet className="h-5 w-5 mr-2" />
          <span className="font-bold mr-2">{currencyCode}{balance.toLocaleString()}</span>
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
                {currencyCode}{balance.toLocaleString()}
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

function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="primary"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { config, acknowledgeDeclinedPurchase } = useBrandsoft();
  const [role, setRole] = useState<'admin' | 'staff' | 'client' | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const storedRole = (localStorage.getItem('brandsoft-role') as any) || 'admin';
    setRole(storedRole);
  }, []);


  const currentUserId = useMemo(() => {
    if (!config || !config.brand) return null;
    const myCompany = config.companies?.find(c => c.companyName === config.brand.businessName);
    return myCompany?.id || null;
  }, [config]);

  const {
    notificationCount,
    requestNotificationCount,
    incomingRequestsCount,
    responsesCount,
    pendingPurchasesCount,
    processingPurchasesCount,
    declinedPurchasesCount,
    declinedPurchaseOrders,
  } = useMemo(() => {
    if (!config) return { notificationCount: 0, requestNotificationCount: 0, incomingRequestsCount: 0, responsesCount: 0, pendingPurchasesCount: 0, processingPurchasesCount: 0, declinedPurchasesCount: 0, declinedPurchaseOrders: [] };

    const incomingRequestsCount = config.incomingRequests?.length || 0;
    const responsesCount = config.requestResponses?.length || 0;
    const requestTotal = incomingRequestsCount + responsesCount;

    const pendingPurchases = (config.purchases || []).filter(p => p.status === 'pending');
    const processingPurchases = (config.purchases || []).filter(p => p.status === 'processing');
    const declinedPurchases = (config.purchases || []).filter(p => p.status === 'declined' && !p.isAcknowledged);

    const total = requestTotal + pendingPurchases.length + processingPurchases.length + declinedPurchases.length;
    
    return { 
        notificationCount: total, 
        requestNotificationCount: requestTotal, 
        incomingRequestsCount, 
        responsesCount, 
        pendingPurchasesCount: pendingPurchases.length, 
        processingPurchasesCount: processingPurchases.length,
        declinedPurchasesCount: declinedPurchases.length,
        declinedPurchaseOrders: declinedPurchases,
    };
  }, [config]);

  const handleAcknowledgeAll = () => {
    declinedPurchaseOrders.forEach(order => {
        acknowledgeDeclinedPurchase(order.orderId);
    });
    router.push('/history');
};
  
  const ordersNotificationCount = useMemo(() => {
    if (!config?.purchases) return 0;
    return config.purchases.filter(
        p => (p.planName.startsWith('Credit Purchase') || p.planName === 'Wallet Top-up') &&
             (p.status === 'pending' || p.status === 'processing')
    ).length;
  }, [config?.purchases]);
  
  const walletNotificationCount = useMemo(() => {
    if (!config?.purchases) return 0;
    // Only client-facing top-ups count for the wallet icon
    const myTopUps = config.purchases.filter(p =>
      !p.affiliateId && 
      (p.planName.toLowerCase().includes('top-up') || p.planName.toLowerCase().includes('credit purchase')) &&
      (p.status === 'pending' || p.status === 'processing')
    );
    return myTopUps.length;
  }, [config?.purchases]);
  
  useEffect(() => {
    if (hasMounted) {
        localStorage.setItem('brandsoft-role', role || 'admin');
    }
  }, [role, hasMounted]);


  useEffect(() => {
    if (!hasMounted) return;
    
    const nonClientPages = ['/admin', '/office'];
    if (role === 'admin' && !pathname.startsWith('/admin')) {
      router.push('/admin');
    } else if (role === 'staff' && !pathname.startsWith('/office')) {
      router.push('/office');
    } else if (role === 'client' && (nonClientPages.some(p => pathname.startsWith(p)) || pathname === '/')) {
      router.push('/dashboard');
    }
  }, [role, pathname, router, hasMounted]);

  const getVisibleNavItems = (items: typeof mainNavItems, currentRole: typeof role) => {
    if (!config || !currentRole) return [];
    return items.filter(item => {
        const roleMatch = item.roles.includes(currentRole);
        if (!roleMatch) return false;
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

  const visibleMainNavItems = getVisibleNavItems(mainNavItems, role);
  const visibleUpcomingNavItems = getVisibleNavItems(upcomingNavItems, role);
  
  const pageTitle = [...mainNavItems, ...upcomingNavItems].find(item => pathname.startsWith(item.href))?.label || 'Dashboard';
  
  const headerTitle = useMemo(() => {
    if (role === 'admin') return 'Admin Room';
    if (role === 'staff') return 'Office Room';
    return config?.brand.businessName;
  }, [role, config?.brand.businessName]);

  const isLinkActive = (href: string) => {
    if (href === '/office' || href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            {config ? (
                <Link href={role === 'client' ? '/settings' : (role === 'admin' ? '/admin' : '/office')} className="flex items-center gap-2 text-sidebar-foreground">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={config.brand.logo} />
                       <AvatarFallback>
                           <Image src={brandsoftLogo} alt="Brandsoft" width={20} height={20} />
                       </AvatarFallback>
                    </Avatar>
                    <h1 className={cn('text-base font-bold', getFontClass(config.brand.font))}>
                        {headerTitle}
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
                    isActive={isLinkActive(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                     {item.href === '/quotation-requests' && requestNotificationCount > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {requestNotificationCount}
                        </span>
                    )}
                    {item.href === '/office/orders' && ordersNotificationCount > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {ordersNotificationCount}
                        </span>
                    )}
                    {item.href === '/history' && walletNotificationCount > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {walletNotificationCount}
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
          
          {visibleUpcomingNavItems.length > 0 && (
            <>
              <SidebarSeparator className="my-2" />
              <Accordion type="single" collapsible defaultValue="upcoming-tools" className="w-full px-2">
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
            </>
          )}

        </SidebarContent>
        <SidebarFooter className="mt-auto mb-4 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10" 
            style={{ backgroundImage: `url(${brandsoftLogo.src})` }}
          />
          <SidebarMenu>
            <SidebarMenuItem>
              {config ? (
                <div className="relative flex flex-col items-center justify-center p-2 text-center space-y-2">
                   <Avatar className="h-12 w-12 bg-transparent">
                      <AvatarImage src={brandsoftLogo.src} />
                  </Avatar>
                  <p className="text-xs font-semibold text-sidebar-foreground/80">BrandSoft</p>
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
        <header className="flex h-14 items-center gap-4 bg-background/95 backdrop-blur-sm sticky top-0 px-4 md:px-6 z-10 min-w-0 flex-shrink-0">
          <SidebarTrigger className="md:hidden flex-shrink-0" />
          <h1 className="text-lg font-semibold font-headline flex-1 truncate hidden sm:block">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="sm:ml-auto flex-1 sm:flex-none">
                <Select value={role || 'admin'} onValueChange={(value) => setRole(value as any)}>
                    <SelectTrigger className="w-full sm:w-[130px] h-9">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             {hasMounted && (
              <div className="flex items-center gap-2">
                    {role === 'client' && <HeaderWalletCard />}
                    <ThemeToggle />
                    {role === 'client' && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="flex-shrink-0 relative">
                                        <Bell className="h-6 w-6" />
                                        {notificationCount > 0 && (
                                            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                            {notificationCount}
                                            </span>
                                        )}
                                        <span className="sr-only">Notifications</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {notificationCount > 0 ? (
                                        <>
                                            {incomingRequestsCount > 0 && (
                                                <DropdownMenuItem asChild>
                                                    <Link href="/quotation-requests?subtab=incoming" className="cursor-pointer">
                                                        <MailQuestion className="mr-2 h-4 w-4 text-blue-500" />
                                                        <span className="flex-1">You have {incomingRequestsCount} new quotation request(s).</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            {responsesCount > 0 && (
                                                <DropdownMenuItem asChild>
                                                    <Link href="/quotation-requests?subtab=response" className="cursor-pointer">
                                                        <FileCheck2 className="mr-2 h-4 w-4 text-green-500" />
                                                        <span className="flex-1">You have {responsesCount} new quotation response(s).</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                             {pendingPurchasesCount > 0 && (
                                                <DropdownMenuItem asChild>
                                                    <Link href="/history" className="cursor-pointer text-amber-600 focus:bg-amber-100 focus:text-amber-700">
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        <span className="flex-1">{pendingPurchasesCount} purchase(s) are pending.</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            {processingPurchasesCount > 0 && (
                                                <DropdownMenuItem asChild>
                                                    <Link href="/history" className="cursor-pointer text-blue-600 focus:bg-blue-100 focus:text-blue-700">
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        <span className="flex-1">{processingPurchasesCount} purchase(s) are processing.</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            {declinedPurchasesCount > 0 && (
                                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleAcknowledgeAll(); }} className="cursor-pointer text-destructive focus:bg-destructive/10">
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    <span className="flex-1">{declinedPurchasesCount} purchase(s) were declined.</span>
                                                </DropdownMenuItem>
                                            )}
                                        </>
                                    ) : (
                                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                            No new notifications.
                                        </div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                                <Link href="/settings">
                                <Settings className="h-5 w-5" />
                                <span className="sr-only">Settings</span>
                                </Link>
                            </Button>
                        </>
                    )}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
        <footer className="p-4 text-center text-sm text-muted-foreground bg-background flex-shrink-0">
          © 2025 BrandSoft. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
