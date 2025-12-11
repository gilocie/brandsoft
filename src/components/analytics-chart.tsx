
'use client';

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Invoice, Quotation } from "@/hooks/use-brandsoft";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, format, parseISO } from "date-fns";

interface AnalyticsChartProps {
  invoices: Invoice[];
  quotations: Quotation[];
  currencyCode: string;
}

const INVOICE_CHART_CONFIG: Record<Invoice['status'], { label: string; color: string }> = {
  Paid: { label: "Paid", color: "hsl(var(--chart-2))" },
  Pending: { label: "Pending", color: "hsl(var(--chart-1))" },
  Overdue: { label: "Overdue", color: "hsl(var(--destructive))" },
  Canceled: { label: "Canceled", color: "hsl(var(--muted-foreground))" },
  Draft: { label: "Draft", color: "hsl(var(--muted))" }
} as const;

const QUOTATION_CHART_CONFIG: Record<Quotation['status'], { label: string; color: string }> = {
  Sent: { label: "Sent", color: "hsl(var(--chart-4))" },
  Accepted: { label: "Accepted", color: "hsl(var(--chart-5))" },
  Declined: { label: "Declined", color: "hsl(var(--destructive))" },
  Draft: { label: "Draft", color: "hsl(var(--muted))" },
} as const;

type DocumentType = "all" | "invoices" | "quotations";
type TimePeriod = "weekly" | "monthly" | "yearly";

export function AnalyticsChart({ invoices, quotations }: AnalyticsChartProps) {
  const [documentType, setDocumentType] = useState<DocumentType>("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");

  const chartData = useMemo(() => {
    const now = new Date();
    let interval;
    let dataFormat;

    switch (timePeriod) {
      case 'weekly':
        interval = { start: startOfWeek(now), end: endOfWeek(now) };
        dataFormat = 'EEE'; // e.g., Mon, Tue
        const days = eachDayOfInterval(interval);
        return days.map(day => {
            const dayString = format(day, 'yyyy-MM-dd');
            const dayInvoices = invoices.filter(inv => format(parseISO(inv.date), 'yyyy-MM-dd') === dayString);
            const dayQuotations = quotations.filter(q => format(parseISO(q.date), 'yyyy-MM-dd') === dayString);
            const invoiceCounts = dayInvoices.reduce((acc, inv) => ({ ...acc, [inv.status]: (acc[inv.status] || 0) + 1 }), {} as Record<string, number>);
            const quoteCounts = dayQuotations.reduce((acc, q) => ({ ...acc, [q.status]: (acc[q.status] || 0) + 1 }), {} as Record<string, number>);
            return { name: format(day, dataFormat), ...invoiceCounts, ...quoteCounts };
        });
      case 'monthly':
        interval = { start: startOfYear(now), end: endOfYear(now) };
        dataFormat = 'MMM'; // e.g., Jan, Feb
         const months = eachMonthOfInterval(interval);
         return months.map(month => {
            const monthString = format(month, 'yyyy-MM');
            const monthInvoices = invoices.filter(inv => format(parseISO(inv.date), 'yyyy-MM') === monthString);
            const monthQuotations = quotations.filter(q => format(parseISO(q.date), 'yyyy-MM') === monthString);
            const invoiceCounts = monthInvoices.reduce((acc, inv) => ({ ...acc, [inv.status]: (acc[inv.status] || 0) + 1 }), {} as Record<string, number>);
            const quoteCounts = monthQuotations.reduce((acc, q) => ({ ...acc, [q.status]: (acc[q.status] || 0) + 1 }), {} as Record<string, number>);
            return { name: format(month, dataFormat), ...invoiceCounts, ...quoteCounts };
        });
      case 'yearly':
        const allDates = [...invoices.map(i => i.date), ...quotations.map(q => q.date)];
        const minYear = Math.min(...allDates.map(d => parseISO(d).getFullYear()));
        const maxYear = now.getFullYear();
        const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
        return years.map(year => {
            const yearInvoices = invoices.filter(inv => parseISO(inv.date).getFullYear() === year);
            const yearQuotations = quotations.filter(q => parseISO(q.date).getFullYear() === year);
            const invoiceCounts = yearInvoices.reduce((acc, inv) => ({ ...acc, [inv.status]: (acc[inv.status] || 0) + 1 }), {} as Record<string, number>);
            const quoteCounts = yearQuotations.reduce((acc, q) => ({ ...acc, [q.status]: (acc[q.status] || 0) + 1 }), {} as Record<string, number>);
            return { name: String(year), ...invoiceCounts, ...quoteCounts };
        });
    }
  }, [invoices, quotations, timePeriod]);
  
  const showInvoices = documentType === "all" || documentType === "invoices";
  const showQuotations = documentType === "all" || documentType === "quotations";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="hidden sm:block">
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>A summary of your documents created over time.</CardDescription>
          </div>
           <div className="flex flex-col sm:flex-row items-center gap-2">
            <Tabs value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="quotations">Quotations</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{fontSize: "12px"}}/>
               {/* Invoice Bars */}
               {showInvoices && Object.entries(INVOICE_CHART_CONFIG).map(([status, config]) => (
                    <Bar key={`inv-${status}`} dataKey={status} stackId="a" fill={config.color} name={`${config.label} Inv.`} />
               ))}
               {/* Quotation Bars */}
               {showQuotations && Object.entries(QUOTATION_CHART_CONFIG).map(([status, config]) => (
                    <Bar key={`quo-${status}`} dataKey={status} stackId="a" fill={config.color} name={`${config.label} Quotes`} />
               ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[350px] w-full items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">No data available for the selected period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
