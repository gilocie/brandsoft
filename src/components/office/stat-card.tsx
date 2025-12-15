
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    footer, 
    isCurrency = false,
    currencyPrefix = 'K',
    valuePrefix = ''
}: { 
    icon: React.ElementType, 
    title: string, 
    value: string | number, 
    footer: string, 
    isCurrency?: boolean,
    currencyPrefix?: string,
    valuePrefix?: string,
}) => {
    const numericValue = typeof value === 'number' ? value : 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">
                {isCurrency && <span>{currencyPrefix}</span>}
                {valuePrefix}{isCurrency ? numericValue.toLocaleString() : value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{footer}</p>
            </CardContent>
        </Card>
    );
};
