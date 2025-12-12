

"use client";

import { useBrandsoft, type Invoice, type Quotation, type Purchase } from "@/hooks/use-brandsoft";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Award, CreditCard, FileBarChart2, Brush, ArrowRight, Library, Users, Package, CheckCircle, XCircle, Clock, AlertTriangle, DollarSign, FileClock, FileX, Receipt, Lock, Crown, Check } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnalyticsChart } from "@/components/analytics-chart";
import { ManagePlanDialog } from "@/components/manage-plan-dialog";

const modules = [
  { title: "Invoice Designer", description: "Create and manage invoices.", icon: FileText, href: "/invoices", enabledKey: "invoice", isLocked: false },
  { title: "Quotation Designer", description: "Generate and send quotations.", icon: FileBarChart2, href: "/quotations", enabledKey: "quotation", isLocked: false },
  { title: "Certificate Designer", description: "Design professional certificates.", icon: Award, href: "/certificates", enabledKey: "certificate", isLocked: true },
];

const StatCard = ({ title, value, icon: Icon, description, formatAsCurrency = false, variant, currencyCode }: { title: string, value: string | number, icon: React.ElementType, description: string, formatAsCurrency?: boolean, variant?: "default" | "primary", currencyCode?: string }) => (
    <Card className={cn(variant === 'primary' && "bg-primary text-primary-foreground")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={cn("h-4 w-4", variant === 'primary' ? "text-primary-foreground/70" : "text-muted-foreground")} />
        </CardHeader>
        <CardContent>
            <div className="text-xl sm:text-2xl font-bold break-words">
                 {formatAsCurrency && (currencyCode || '')}{typeof value === 'number' && formatAsCurrency ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
            </div>
            <p className={cn("text-xs", variant === 'primary' ? "text-primary-foreground/80" : "text-muted-foreground")}>{description}</p>
        </CardContent>
    </Card>
);

const PlanStatusCard = ({ purchase }: { purchase: Purchase | null }) => {
    const { updatePurchaseStatus } = useBrandsoft();
    const [remainingDays, setRemainingDays] = useState(0);
    const activePurchase = purchase && purchase.status === 'active' ? purchase : null;

    useEffect(() => {
        if (!activePurchase?.expiresAt) {
            if (activePurchase) updatePurchaseStatus();
            return;
        }

        const testDurations: { [key: string]: number } = {
            '1 Month': 10 * 60 * 1000,
            '3 Months': 15 * 60 * 1000,
            '6 Months': 30 * 60 * 1000,
            '1 Year': 35 * 60 * 1000,
        };
        const testDuration = activePurchase.planPeriod ? testDurations[activePurchase.planPeriod] : undefined;
        const isTestMode = !!testDuration;
        
        const calculateRemaining = () => {
            const now = new Date().getTime();
            let expiryTime;

            if (isTestMode && activePurchase.date) {
                const activationTime = new Date(activePurchase.date).getTime();
                expiryTime = activationTime + testDuration;
            } else if(activePurchase.expiresAt) {
                expiryTime = new Date(activePurchase.expiresAt).getTime();
            } else {
                return;
            }

            const remainingMs = Math.max(0, expiryTime - now);
            const remaining = isTestMode ? (remainingMs / (1000 * 60)) : Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
            setRemainingDays(remaining);
            
            if (now >= expiryTime) {
              updatePurchaseStatus();
            }
        };

        calculateRemaining();
        const interval = setInterval(calculateRemaining, isTestMode ? 1000 : 60000);

        return () => clearInterval(interval);
    }, [activePurchase, updatePurchaseStatus]);
    
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
    
    // Logic for active plan
    if (purchase.status === 'active') {
        const isTestMode = !!({'1 Month': true, '3 Months': true, '6 Months': true, '1 Year': true}[purchase.planPeriod]);
        const isExpired = remainingDays <= 0;
        const isExpiringSoon = !isExpired && (isTestMode ? remainingDays <= 2 : remainingDays <= 5);
        const displayUnit = isTestMode ? (Math.ceil(remainingDays) > 1 ? 'Mins' : 'Min') : (Math.ceil(remainingDays) > 1 ? 'Days' : 'Day');
        const displayValue = isExpired ? '0' : Math.ceil(remainingDays);
        const displayText = isExpired ? `0 ${displayUnit}` : `${displayValue} ${displayUnit}`;
        
        return (
            <Card className={cn(
                "text-white",
                isExpired && "bg-gray-500",
                isExpiringSoon && "bg-destructive",
                !isExpiringSoon && !isExpired && "bg-green-900",
            )}>
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

    // Logic for pending plan
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
    
    // Logic for declined plan
    if (purchase.status === 'declined') {
        return (
             <Card className="bg-destructive text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Purchase Declined</CardTitle>
                    <XCircle className="h-4 w-4 text-white/70" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold capitalize">{purchase.status}</div>
                    <p className="text-xs text-white/80">{purchase.planName} Plan</p>
                    <Button asChild variant="secondary" size="sm" className="mt-4">
                        <Link href={`/verify-purchase?orderId=${purchase.orderId}`}>View Details</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return null; // Fallback for 'inactive' or other statuses
};


export default function DashboardPage() {
  const { config } = useBrandsoft();

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
    
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const unpaidInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue');
    const canceledInvoices = invoices.filter(inv => inv.status === 'Canceled');

    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const canceledAmount = canceledInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    return {
        paidCount: paidInvoices.length,
        unpaidCount: invoices.filter(inv => inv.status === 'Pending').length,
        overdueCount: invoices.filter(inv => inv.status === 'Overdue').length,
        canceledCount: canceledInvoices.length,
        totalCustomers: config.customers?.length || 0,
        totalProducts: config.products?.length || 0,
        paidAmount,
        unpaidAmount,
        canceledAmount,
        quotationsSent: quotations.filter(q => q.status === 'Sent' || q.status === 'Accepted').length,
        receiptsIssued: paidInvoices.length,
    }
  }, [config]);

   // --- FIXED LOGIC HERE ---
   const purchaseToShow = useMemo((): Purchase | null => {
      if (!config?.purchases || config.purchases.length === 0) return null;
      
      // Sort by date descending (Newest first)
      const purchases = [...config.purchases].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // 1. Priority: Pending (Show this first so user knows order is processing)
      const pending = purchases.find(p => p.status === 'pending');
      if (pending) return pending;

      // 2. Priority: Active (Show this if no pending orders exist)
      const active = purchases.find(p => p.status === 'active');
      if (active) return active;

      // 3. Priority: Declined (Only if unacknowledged)
      const latestDeclined = purchases.find(p => p.status === 'declined' && !p.isAcknowledged);
      if (latestDeclined) return latestDeclined;
      
      return null;

  }, [config?.purchases]);
  // ------------------------


  if (!config) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}
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
  const currencyCode = config.profile.defaultCurrency;

  const getFontClass = (fontName?: string) => {
    switch(fontName) {
      case 'Poppins': return 'font-body';
      case 'Belleza': return 'font-headline';
      case 'Source Code Pro': return 'font-code';
      default: return 'font-body';
    }
  };

  const invoiceModule = enabledModules.find(m => m.title === 'Invoice Designer');
  const quotationModule = enabledModules.find(m => m.title === 'Quotation Designer');
  const certificateModule = enabledModules.find(m => m.title === 'Certificate Designer');

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn("text-3xl font-bold", getFontClass(config.brand.font))}>Welcome back, {config.brand.businessName}!</h1>
        <p className="text-muted-foreground">Here's a snapshot of your business activity.</p>
      </div>
       
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard title="Total Revenue" value={stats.paidAmount} icon={DollarSign} description={`${stats.paidCount} paid invoices`} formatAsCurrency variant="primary" currencyCode={currencyCode} />
                  <StatCard title="Outstanding" value={stats.unpaidAmount} icon={FileClock} description={`${stats.unpaidCount + stats.overdueCount} unpaid invoices`} formatAsCurrency variant="primary" currencyCode={currencyCode} />
                  <StatCard title="Canceled" value={stats.canceledAmount} icon={FileX} description={`${stats.canceledCount} canceled invoices`} formatAsCurrency variant="primary" currencyCode={currencyCode} />
                </div>
            </CardContent>
        </Card>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Paid Invoices" value={stats.paidCount} icon={CheckCircle} description="Total completed payments" />
          <StatCard title="Unpaid Invoices" value={stats.unpaidCount + stats.overdueCount} icon={FileClock} description="Pending or overdue invoices" />
          <StatCard title="Quotations Sent" value={stats.quotationsSent} icon={FileBarChart2} description="Total quotations issued" />
          <PlanStatusCard purchase={purchaseToShow} />
      </div>
      
      <div>
        <h2 className="text-2xl font-headline font-bold mt-8 mb-2">What would you like to create today?</h2>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoiceModule && (
                 <Card className="flex flex-col text-center transition-all hover:shadow-lg p-4 hover:-translate-y-1">
                    <CardHeader className="items-center">
                        <div className="p-3 rounded-lg bg-primary/10 self-center mb-2">
                            <invoiceModule.icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-xl">{invoiceModule.title}</CardTitle>
                        <CardDescription className="mt-1">{invoiceModule.description}</CardDescription>
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
                        <CardTitle className="font-headline text-xl">{quotationModule.title}</CardTitle>
                        <CardDescription className="mt-1">{quotationModule.description}</CardDescription>
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
                        <CardTitle className="font-headline text-xl">{certificateModule.title}</CardTitle>
                        <CardDescription className="mt-1">{certificateModule.description}</CardDescription>
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
            <h2 className="text-2xl font-headline font-bold mt-8 mb-4">Analytics Overview</h2>
        </div>
        
        <AnalyticsChart invoices={config.invoices} quotations={config.quotations} currencyCode={currencyCode} />

    </div>
  );
}
