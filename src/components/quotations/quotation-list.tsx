
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBrandsoft, type Quotation } from '@/hooks/use-brandsoft';
import { ActionsMenu } from './actions-menu';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'accent' | 'primary';
} = {
  Draft: 'secondary',
  Sent: 'primary',
  Accepted: 'success',
  Declined: 'destructive',
};

interface QuotationListProps {
    quotations: Quotation[];
    layout: 'grid' | 'list';
    onSelectAction: (action: 'view' | 'edit' | 'delete' | 'download' | 'send' | 'accept' | 'decline', quotation: Quotation) => void;
    currencyCode: string;
}

export const QuotationList = ({quotations, layout, onSelectAction, currencyCode}: QuotationListProps) => {
    
    const { config } = useBrandsoft();

    if (quotations.length === 0) {
        return (
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                <p className="text-muted-foreground">No quotations found in this category.</p>
            </div>
        )
    }

    return (
        <div className={cn(
            "gap-6",
            layout === 'grid' 
                ? "grid md:grid-cols-2 lg:grid-cols-3" 
                : "flex flex-col"
          )}>
            {quotations.map((quotation) => {
              const customer = config?.customers.find(c => c.id === quotation.customerId);
              const customerName = customer?.companyName || customer?.name || quotation.customer;
              
              return (
              <Card key={quotation.quotationId} className={cn(
                "flex flex-col",
                layout === 'list' && "flex-row items-center"
              )}>
                <div className={cn("flex-grow", layout === 'list' && "w-full")}>
                    <CardHeader className={cn(layout === 'list' ? "p-4" : "p-6")}>
                        <CardTitle className={cn("truncate", layout === 'list' && "text-base font-semibold")}>{customerName}</CardTitle>
                        <CardDescription className={cn(layout === 'list' && "text-xs")}>{quotation.quotationId}</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("flex-grow space-y-2", layout === 'list' ? "p-4 pt-0 md:flex md:items-center md:justify-between md:space-y-0" : "p-6 pt-0")}>
                      <div className={cn("text-2xl font-bold", layout === 'list' && "text-base font-bold w-1/4")}>
                        {quotation.currency || currencyCode}{quotation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={cn("text-sm text-muted-foreground", layout === 'list' && "text-xs w-1/4")}>
                        <p>Date: {quotation.date}</p>
                        <p>Valid Until: {quotation.validUntil}</p>
                      </div>
                       <div className={cn("flex items-center justify-between", layout === 'list' && "w-auto")}>
                            <Badge variant={statusVariantMap[quotation.status]} className="w-auto">
                                {quotation.status}
                            </Badge>
                            <div className={cn(layout === 'grid' ? "flex" : "hidden")}>
                                <ActionsMenu quotation={quotation} onSelectAction={onSelectAction} />
                            </div>
                       </div>
                    </CardContent>
                </div>
                 <div className={cn(layout === 'list' ? "flex items-center p-4" : "hidden")}>
                    <ActionsMenu quotation={quotation} onSelectAction={onSelectAction} />
                </div>
    
              </Card>
            )})}
          </div>
    )
};
