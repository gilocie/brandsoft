

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

export const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    footer, 
    isCurrency = false,
    currencyPrefix = 'K',
    valuePrefix = '',
    children
}: { 
    icon: React.ElementType, 
    title: string, 
    value: string | number, 
    footer: string, 
    isCurrency?: boolean,
    currencyPrefix?: string,
    valuePrefix?: string,
    children?: ReactNode
}) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    const displayValue = isCurrency ? numericValue.toLocaleString() : value;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">
                {isCurrency && <span>{currencyPrefix}</span>}
                {valuePrefix}{displayValue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{footer}</p>
            {children && <div className="mt-4">{children}</div>}
            </CardContent>
        </Card>
    );
};
