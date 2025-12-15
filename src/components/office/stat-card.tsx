
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    footer, 
    isCurrency = false,
    showMwk = false,
    usdToMwkRate = 1700
}: { 
    icon: React.ElementType, 
    title: string, 
    value: string | number, 
    footer: string, 
    isCurrency?: boolean,
    showMwk?: boolean,
    usdToMwkRate?: number
}) => {
    const numericValue = typeof value === 'number' ? value : 0;
    const mwkValue = numericValue * usdToMwkRate;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">
                {isCurrency && <span className="text-muted-foreground">$</span>}
                {isCurrency ? numericValue.toLocaleString() : value}
            </div>
            {showMwk && isCurrency && (
                <p className="text-xs text-muted-foreground">~K{mwkValue.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{footer}</p>
            </CardContent>
        </Card>
    );
};
