
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuotationRequest } from '@/hooks/use-brandsoft';

interface QuotationRequestListProps {
    requests: QuotationRequest[];
    layout: 'grid' | 'list';
}

export const QuotationRequestList = ({ requests, layout }: QuotationRequestListProps) => {
    if (requests.length === 0) {
        return (
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                <p className="text-muted-foreground">No quotation requests found.</p>
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
                    <CardContent className={cn("flex-grow", layout === 'list' ? 'p-0 pt-2' : 'p-6 pt-4')}>
                      <div className="flex items-center gap-2 text-xs">
                        <visibility.icon className={cn("h-4 w-4", visibility.className)} />
                        <span className={cn(visibility.className)}>{visibility.text}</span>
                      </div>
                    </CardContent>
                </div>
                {layout === 'grid' && (
                    <div className="p-6 pt-0">
                         <Button variant="outline" size="sm" className="w-full">View Details</Button>
                    </div>
                )}
                {layout === 'list' && (
                    <Button variant="outline" size="sm">View Details</Button>
                )}
              </Card>
            )})}
        </div>
    )
}
