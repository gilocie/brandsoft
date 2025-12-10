
'use client';

import { useMemo, useState } from "react";
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Invoice } from "@/hooks/use-brandsoft";

interface AnalyticsChartProps {
  invoices: Invoice[];
  currencyCode: string;
}

export function AnalyticsChart({ invoices, currencyCode }: AnalyticsChartProps) {
  const [timeRange, setTimeRange] = useState('this-year');

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'last-year':
        startDate = startOfMonth(subMonths(now, 12));
        break;
      case 'all-time':
        startDate = new Date(0); // Epoch
        break;
      case 'this-year':
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const dataByMonth: { [key: string]: number } = {};

    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.date);
      if (invoiceDate >= startDate) {
        const month = format(invoiceDate, 'MMM yyyy');
        if (!dataByMonth[month]) {
          dataByMonth[month] = 0;
        }
        dataByMonth[month] += invoice.amount;
      }
    });

    const sortedMonths = Object.keys(dataByMonth).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return sortedMonths.map(month => ({
      name: month,
      total: dataByMonth[month],
    }));

  }, [invoices, timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Analytics</CardTitle>
            <CardDescription>An overview of your invoice amounts over time.</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="last-year">Last 12 Months</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => format(new Date(value), 'MMM')}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value) => [formatCurrency(Number(value)), 'Total']}
              />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
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
