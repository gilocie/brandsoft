'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const StatCard = ({ icon: Icon, title, value, footer, isCurrency = false }: { icon: React.ElementType, title: string, value: string | number, footer: string, isCurrency?: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {isCurrency && <span className="text-muted-foreground">$</span>}
        {typeof value === 'number' && isCurrency ? value.toLocaleString() : value}
      </div>
      <p className="text-xs text-muted-foreground">{footer}</p>
    </CardContent>
  </Card>
);
