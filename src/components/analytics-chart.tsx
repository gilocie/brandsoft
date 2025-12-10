
'use client';

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice, Quotation } from "@/hooks/use-brandsoft";

interface AnalyticsChartProps {
  invoices: Invoice[];
  quotations: Quotation[];
  currencyCode: string; // Keep for potential future use or other charts
}

const INVOICE_CHART_CONFIG = {
  Paid: { label: "Paid", color: "hsl(var(--chart-2))" },
  Pending: { label: "Pending", color: "hsl(var(--chart-3))" },
  Overdue: { label: "Overdue", color: "hsl(var(--destructive))" },
  Canceled: { label: "Canceled", color: "hsl(var(--muted-foreground))" },
} as const;

const QUOTATION_CHART_CONFIG = {
  Sent: { label: "Sent", color: "hsl(var(--chart-1))" },
  Accepted: { label: "Accepted", color: "hsl(var(--chart-2))" },
  Declined: { label: "Declined", color: "hsl(var(--destructive))" },
  Draft: { label: "Draft", color: "hsl(var(--muted-foreground))" },
} as const;


export function AnalyticsChart({ invoices, quotations }: AnalyticsChartProps) {

  const chartData = useMemo(() => {
    const invoiceCounts = (invoices || []).reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<Invoice['status'], number>);
    
    const quotationCounts = (quotations || []).reduce((acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
    }, {} as Record<Quotation['status'], number>);

    return [
      { name: 'Invoices', ...invoiceCounts },
      { name: 'Quotations', ...quotationCounts },
    ];
  }, [invoices, quotations]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Document Status Overview</CardTitle>
            <CardDescription>A summary of your current invoices and quotations by status.</CardDescription>
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
              <Bar dataKey="Paid" stackId="a" fill={INVOICE_CHART_CONFIG.Paid.color} name="Paid Inv." />
              <Bar dataKey="Pending" stackId="a" fill={INVOICE_CHART_CONFIG.Pending.color} name="Pending Inv." />
              <Bar dataKey="Overdue" stackId="a" fill={INVOICE_CHART_CONFIG.Overdue.color} name="Overdue Inv." />
              <Bar dataKey="Canceled" stackId="a" fill={INVOICE_CHART_CONFIG.Canceled.color} name="Canceled Inv." />
               {/* Quotation Bars */}
              <Bar dataKey="Sent" stackId="b" fill={QUOTATION_CHART_CONFIG.Sent.color} name="Sent Quotes" />
              <Bar dataKey="Accepted" stackId="b" fill={QUOTATION_CHART_CONFIG.Accepted.color} name="Accepted Quotes" />
              <Bar dataKey="Declined" stackId="b" fill={QUOTATION_CHART_CONFIG.Declined.color} name="Declined Quotes" />
              <Bar dataKey="Draft" stackId="b" fill={QUOTATION_CHART_CONFIG.Draft.color} name="Draft Quotes" />
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
