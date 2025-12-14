
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Globe, Clock, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuotationRequest } from '@/hooks/use-brandsoft';
import { QuotationRequestActions } from './quotation-request-actions';
import { format } from 'date-fns';

interface QuotationRequestListProps {
    requests: QuotationRequest[];
    layout: 'grid' | 'list';
    onSelectAction: (action: 'view' | 'edit' | 'delete' | 'close', request: QuotationRequest) => void;
}

export const QuotationRequestList = ({ requests, layout, onSelectAction }: QuotationRequestListProps) => {
    if (requests.length === 0) {
        return (
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                <p className="text-muted-foreground">You have not sent any quotation requests.</p>
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
            {requests.map((request) => {
              const visibility = request.isPublic 
                ? { text: "Public Request", icon: Globe, className: "text-blue-500" } 
                : { text: `${request.companyIds?.length || 0} Suppliers`, icon: Users, className: "text-muted-foreground" };

              return (
              <Card key={request.id} className={cn(
                "flex flex-col",
                layout === 'list' && "flex-row items-center p-4 gap-4"
              )}>
                <div className="flex-grow">
                    <CardHeader className={cn(layout === 'list' ? 'p-0' : 'p-6 pb-2')}>
                        <CardTitle className="text-base font-semibold truncate">{request.title}</CardTitle>
                        <CardDescription className="text-xs">{new Date(request.date).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("flex-grow space-y-2", layout === 'list' ? 'p-0 pt-2' : 'p-6 pt-4')}>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <visibility.icon className={cn("h-3 w-3", visibility.className)} />
                          <span className={cn(visibility.className)}>{visibility.text}</span>
                        </div>
                        {request.isPublic && request.industries && request.industries.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Layers className="h-3 w-3" />
                                <span>{request.industries.length} categories</span>
                            </div>
                        )}
                      </div>
                       <div className="flex items-center justify-between text-xs text-muted-foreground">
                         <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>Expires {format(new Date(request.dueDate), 'dd MMM yyyy')}</span>
                         </div>
                        <div className={cn(layout === 'grid' ? "flex" : "hidden")}>
                            <QuotationRequestActions request={request} onSelectAction={onSelectAction} />
                        </div>
                      </div>
                    </CardContent>
                </div>
                <div className={cn(layout === 'list' ? "flex items-center" : "hidden")}>
                    <QuotationRequestActions request={request} onSelectAction={onSelectAction} />
                </div>
              </Card>
            )})}
        </div>
    )
}
