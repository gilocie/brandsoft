'use client';

import {
  useBrandsoft,
  type Invoice,
  type Purchase,
} from '@/hooks/use-brandsoft';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Award,
  CreditCard,
  FileBarChart2,
  Brush,
  ArrowRight,
  Library,
  Users,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileClock,
  FileX,
  Lock,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AnalyticsChart } from '@/components/analytics-chart';
import { ManagePlanDialog } from '@/components/manage-plan-dialog';
import { useRouter } from 'next/navigation';

const modules = [
  {
    title: 'Invoice Designer',
    description: 'Create and manage invoices.',
    icon: FileText,
    href: '/invoices',
    enabledKey: 'invoice',
    isLocked: false,
  },
  {
    title: 'Quotation Designer',
    description: 'Generate and send quotations.',
    icon: FileBarChart2,
    href: '/quotations',
    enabledKey: 'quotation',
    isLocked: false,
  },
  {
    title: 'Certificate Designer',
    description: 'Design professional certificates.',
    icon: Award,
    href: '/certificates',
    enabledKey: 'certificate',
    isLocked: true,
  },
];

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  formatAsCurrency = false,
  variant,
  currencyCode,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  formatAsCurrency?: boolean;
  variant?: 'default' | 'primary';
  currencyCode?: string;
}) => (
  <Card className={cn(variant === 'primary' && 'bg-primary text-primary-foreground')}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon
        className={cn(
          'h-4 w-4',
          variant === 'primary'
            ? 'text-primary-foreground/70'
            : 'text-muted-foreground'
        )}
      />
    </CardHeader>
    <CardContent>
      <div className="text-xl sm:text-2xl font-bold break-words">
        {formatAsCurrency && (currencyCode || '')}
        {typeof value === 'number' && formatAsCurrency
          ? value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : value}
      </div>
      <p
        className={cn(
          'text-xs',
          variant === 'primary'
            ? 'text-primary-foreground/80'
            : 'text-muted-foreground'
        )}
      >
        {description}
      </p>
    </CardContent>
  </Card>
);

const PlanStatusCard = ({ purchase }: { purchase: Purchase | null }) => {
  const { acknowledgeDeclinedPurchase } = useBrandsoft();
  const [remainingDays, setRemainingDays] = useState(0);
  const router = useRouter();

  const handleViewDeclined = (orderId: string) => {
    router.push(`/verify-purchase?orderId=${orderId}`);
  };

  useEffect(() => {
    if (!purchase || purchase.status !== 'active' || !purchase.expiresAt) {
      return;
    }

    const testDurations: { [key: string]: number } = {
      '1 Month': 10 * 60 * 1000,
      '3 Months': 15 * 60 * 1000,
      '6 Months': 30 * 60 * 1000,
      '1 Year': 35 * 60 * 1000,
    };
    const testDuration = purchase.planPeriod ? testDurations[purchase.planPeriod] : undefined;
    const isTestMode = !!testDuration;

    const calculateRemaining = () => {
      const now = new Date().getTime();
      let expiryTime;

      if (isTestMode && purchase.date) {
        const activationTime = new Date(purchase.date).getTime();
        expiryTime = activationTime + testDuration;
      } else {
        expiryTime = new Date(purchase.expiresAt).getTime();
      }

      const remainingMs = Math.max(0, expiryTime - now);
      const remaining = isTestMode
        ? remainingMs / (1000 * 60)
        : Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
      setRemainingDays(remaining);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, isTestMode ? 1000 : 60000);

    return () => clearInterval(interval);
  }, [purchase]);

  if (!purchase) {
    return (
      <Card className="bg-green-900 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Free Trial</CardTitle>
          <Crown className="h-4 w-4 text-white/70" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Active</div>
          <p className="text-xs text-white/80">&nbsp;</p>
          <ManagePlanDialog isExpiringSoon={false} isExpired={false} />
        </CardContent>
      </Card>
    );
  }

  // Active
  if (purchase.status === 'active') {
    const isTestMode = !!{
      '1 Month': true,
      '3 Months': true,
      '6 Months': true,
      '1 Year': true,
    }[purchase.planPeriod];
    const isExpired = remainingDays <= 0;
    const isExpiringSoon =
      !isExpired && (isTestMode ? remainingDays <= 2 : remainingDays <= 5);
    const displayUnit = isTestMode
      ? Math.ceil(remainingDays) > 1 ? 'Mins' : 'Min'
      : Math.ceil(remainingDays) > 1 ? 'Days' : 'Day';
    const displayValue = isExpired ? '0' : Math.ceil(remainingDays);
    const displayText = isExpired ? `0 ${displayUnit}` : `${displayValue} ${displayUnit}`;

    return (
      <Card className={cn('text-white', isExpired && 'bg-gray-500', isExpiringSoon && 'bg-destructive', !isExpiringSoon && !isExpired && 'bg-green-900')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{purchase.planName}</CardTitle>
          {isExpired ? <XCircle className="h-4 w-4 text-white/70" /> : <Crown className="h-4 w-4 text-white/70" />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isExpired ? 'Expired' : displayText}</div>
          <p className="text-xs text-white/80">{isExpired ? 'Your plan has expired.' : 'Remaining'}</p>
          <ManagePlanDialog isExpiringSoon={isExpiringSoon} isExpired={isExpired} />
        </CardContent>
      </Card>
    );
  }

  // Pending
  if (purchase.status === 'pending') {
    return (
      <Card className="bg-amber-500 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Purchase Pending</CardTitle>
          <Clock className="h-4 w-4 text-white/70" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold capitalize">{purchase.status}</div>
          <p className="text-xs text-white/80">{purchase.planName} Plan</p>
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link href={`/verify-purchase?orderId=${purchase.orderId}`}>View</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Declined
  if (purchase.status === 'declined' && !purchase.isAcknowledged) {
    return (
      <Card className="bg-destructive text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Purchase Declined</CardTitle>
          <XCircle className="h-4 w-4 text-white/70" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold capitalize">{purchase.status}</div>
          <p className="text-xs text-white/80">{purchase.planName} Plan</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => handleViewDeclined(purchase.orderId)}>
              View Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default function DashboardPage() {
  const { config, updatePurchaseStatus } = useBrandsoft();
  
  // Add a force refresh counter to trigger re-renders
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Memoized refresh function that forces a re-render
  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    updatePurchaseStatus();
  }, [updatePurchaseStatus]);

  // ✅ FIX: Proper real-time synchronization
  useEffect(() => {
    // 1. Initial check on mount
    updatePurchaseStatus();

    // 2. Storage event listener for cross-tab updates
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to brandsoft-config changes
      if (e.key === 'brandsoft-config' || e.key === null) {
        console.log('Storage changed, refreshing dashboard...');
        forceRefresh();
      }
    };

    // 3. Custom event listener for same-tab updates
    const handleCustomUpdate = (e: Event) => {
      console.log('Custom update event received');
      forceRefresh();
    };

    // 4. Visibility change listener (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing...');
        forceRefresh();
      }
    };

    // 5. Focus listener (when window gains focus)
    const handleFocus = () => {
      console.log('Window focused, refreshing...');
      forceRefresh();
    };

    // 6. Polling as backup (every 3 seconds)
    const pollInterval = setInterval(() => {
      forceRefresh();
    }, 3000);

    // Register all listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('brandsoft-update', handleCustomUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('brandsoft-update', handleCustomUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [forceRefresh, updatePurchaseStatus]);

  // ✅ FIX: Add refreshKey as dependency to force recalculation
  const stats = useMemo(() => {
    if (!config) {
      return {
        paidCount: 0,
        unpaidCount: 0,
        overdueCount: 0,
        canceledCount: 0,
        totalCustomers: 0,
        totalProducts: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        canceledAmount: 0,
        quotationsSent: 0,
        receiptsIssued: 0,
      };
    }

    const invoices = config.invoices || [];
    const quotations = config.quotations || [];

    const paidInvoices = invoices.filter((inv) => inv.status === 'Paid');
    const unpaidInvoices = invoices.filter(
      (inv) => inv.status === 'Pending' || inv.status === 'Overdue'
    );
    const canceledInvoices = invoices.filter((inv) => inv.status === 'Canceled');

    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const canceledAmount = canceledInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      paidCount: paidInvoices.length,
      unpaidCount: invoices.filter((inv) => inv.status === 'Pending').length,
      overdueCount: invoices.filter((inv) => inv.status === 'Overdue').length,
      canceledCount: canceledInvoices.length,
      totalCustomers: config.customers?.length || 0,
      totalProducts: config.products?.length || 0,
      paidAmount,
      unpaidAmount,
      canceledAmount,
      quotationsSent: quotations.filter(
        (q) => q.status === 'Sent' || q.status === 'Accepted'
      ).length,
      receiptsIssued: paidInvoices.length,
    };
  }, [config, refreshKey]); // ← Added refreshKey dependency

  // ✅ FIX: Add refreshKey dependency to force recalculation
  const purchaseToShow = useMemo((): Purchase | null => {
    if (!config?.purchases || config.purchases.length === 0) return null;

    const purchases = [...config.purchases].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestOrder = purchases[0];

    if (latestOrder.status === 'pending') {
      return latestOrder;
    }

    if (latestOrder.status === 'declined' && !latestOrder.isAcknowledged) {
      return latestOrder;
    }

    const active = purchases.find((p) => p.status === 'active');
    if (active) return active;

    return null;
  }, [config?.purchases, refreshKey]); // ← Added refreshKey dependency

  if (!config) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
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

  const enabledModules = modules.filter(
    (m) =>
      m.enabledKey === null ||
      config.modules[m.enabledKey as keyof typeof config.modules]
  );
  const currencyCode = config.profile.defaultCurrency;

  const getFontClass = (fontName?: string) => {
    switch (fontName) {
      case 'Poppins':
        return 'font-body';
      case 'Belleza':
        return 'font-headline';
      case 'Source Code Pro':
        return 'font-code';
      default:
        return 'font-body';
    }
  };

  const invoiceModule = enabledModules.find(
    (m) => m.title === 'Invoice Designer'
  );
  const quotationModule = enabledModules.find(
    (m) => m.title === 'Quotation Designer'
  );
  const certificateModule = enabledModules.find(
    (m) => m.title === 'Certificate Designer'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-3xl font-bold', getFontClass(config.brand.font))}>
          Welcome back, {config.brand.businessName}!
        </h1>
        <p className="text-muted-foreground">
          Here's a snapshot of your business activity.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Revenue"
              value={stats.paidAmount}
              icon={DollarSign}
              description={`${stats.paidCount} paid invoices`}
              formatAsCurrency
              variant="primary"
              currencyCode={currencyCode}
            />
            <StatCard
              title="Outstanding"
              value={stats.unpaidAmount}
              icon={FileClock}
              description={`${
                stats.unpaidCount + stats.overdueCount
              } unpaid invoices`}
              formatAsCurrency
              variant="primary"
              currencyCode={currencyCode}
            />
            <StatCard
              title="Canceled"
              value={stats.canceledAmount}
              icon={FileX}
              description={`${stats.canceledCount} canceled invoices`}
              formatAsCurrency
              variant="primary"
              currencyCode={currencyCode}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Paid Invoices"
          value={stats.paidCount}
          icon={CheckCircle}
          description="Total completed payments"
        />
        <StatCard
          title="Unpaid Invoices"
          value={stats.unpaidCount + stats.overdueCount}
          icon={FileClock}
          description="Pending or overdue invoices"
        />
        <StatCard
          title="Quotations Sent"
          value={stats.quotationsSent}
          icon={FileBarChart2}
          description="Total quotations issued"
        />
        <PlanStatusCard purchase={purchaseToShow} />
      </div>

      <div>
        <h2 className="text-2xl font-headline font-bold mt-8 mb-2">
          What would you like to create today?
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoiceModule && (
          <Card className="flex flex-col text-center transition-all hover:shadow-lg p-4 hover:-translate-y-1">
            <CardHeader className="items-center">
              <div className="p-3 rounded-lg bg-primary/10 self-center mb-2">
                <invoiceModule.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-headline text-xl">
                {invoiceModule.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {invoiceModule.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end items-center">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href={invoiceModule.href}>
                  Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {quotationModule && (
          <Card className="flex flex-col text-center transition-all hover:shadow-lg p-4 hover:-translate-y-1">
            <CardHeader className="items-center">
              <div className="p-3 rounded-lg bg-primary/10 self-center mb-2">
                <quotationModule.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-headline text-xl">
                {quotationModule.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {quotationModule.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end items-center">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href={quotationModule.href}>
                  Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {certificateModule && (
          <Card className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col text-center bg-muted/50 p-4">
            <CardHeader className="items-center">
              <div className="p-3 rounded-lg bg-gray-300 self-center mb-2">
                <certificateModule.icon className="h-6 w-6 text-gray-500" />
              </div>
              <CardTitle className="font-headline text-xl">
                {certificateModule.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {certificateModule.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end items-center">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-destructive">
                <Lock className="h-4 w-4" />
                <span>Upcoming</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-headline font-bold mt-8 mb-4">
          Analytics Overview
        </h2>
      </div>

      <AnalyticsChart
        invoices={config.invoices}
        quotations={config.quotations}
        currencyCode={currencyCode}
      />
    </div>
  );
}
