

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Globe, Clock, Layers, Trash2, FilePenLine, Eye, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuotationRequest } from '@/hooks/use-brandsoft';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuotationRequestListProps {
    requests: QuotationRequest[];
    onSelectAction: (action: 'view' | 'edit' | 'delete' | 'close', request: QuotationRequest) => void;
}

export const QuotationRequestList = ({ requests, onSelectAction }: QuotationRequestListProps) => {
    if (requests.length === 0) {
        return (
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                <p className="text-muted-foreground">You have not sent any quotation requests.</p>
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => {
              const visibility = request.isPublic
                ? { text: "Public Request", icon: Globe, className: "text-blue-500" }
                : { text: `${request.companyIds?.length || 0} Suppliers`, icon: Users, className: "text-muted-foreground" };

              return (
              <Card key={request.id} className="flex flex-col">
                <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-base font-semibold truncate pr-2">{request.title}</CardTitle>
                            <CardDescription className="text-xs">{new Date(request.date).toLocaleDateString()}</CardDescription>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {request.status === 'open' && (
                                    <DropdownMenuItem onClick={() => onSelectAction('close', request)}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Mark as Sorted
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onSelectAction('edit', request)}>
                                    <FilePenLine className="mr-2 h-4 w-4" />
                                    Edit Request
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onSelectAction('delete', request)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Request
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between p-4 pt-0">
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <visibility.icon className={cn("h-3 w-3", visibility.className)} />
                          <span className={cn(visibility.className)}>{visibility.text}</span>
                        </div>
                        {request.isPublic && request.industries && request.industries.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Layers className="h-3 w-3" />
                                <span>{request.industries.length} categories</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Expires {format(new Date(request.dueDate), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <Button variant="outline" size="sm" className="w-full" onClick={() => onSelectAction('view', request)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                        </Button>
                    </div>
                </CardContent>
              </Card>
            )})}
        </div>
    )
}
