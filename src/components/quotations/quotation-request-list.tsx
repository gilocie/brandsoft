'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Globe, Clock, Layers, Trash2, FilePenLine, Eye, CheckCircle2, MoreHorizontal, CalendarDays, Star } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

interface QuotationRequestListProps {
    requests: QuotationRequest[];
    onSelectAction: (action: 'view' | 'edit' | 'delete' | 'close' | 'favourite' | 'sort', request: QuotationRequest) => void;
}

export const QuotationRequestList = ({ requests, onSelectAction }: QuotationRequestListProps) => {
    if (requests.length === 0) {
        return (
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
                <p className="text-muted-foreground">No requests found in this category.</p>
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => {
              const visibility = request.isPublic
                ? { text: "Public Request", icon: Globe, className: "text-blue-500" }
                : { text: `${request.companyIds?.length || 0} Suppliers`, icon: Users, className: "text-muted-foreground" };

              const isExpired = new Date(request.dueDate) < new Date();
              const isClosed = request.status === 'closed' || request.status === 'expired';

              return (
              <Card key={request.id} className={cn("flex flex-col relative", (isExpired || isClosed) && "opacity-70")}>
                {/* Favourite indicator */}
                {request.isFavourite && (
                  <Star className="absolute top-3 right-3 h-4 w-4 fill-amber-400 text-amber-400" />
                )}
                
                <CardHeader className="p-4">
                    <div className="flex justify-between items-start pr-6">
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-base font-semibold truncate">{request.title}</CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                                <CalendarDays className="h-3 w-3" />
                                <span>{new Date(request.date).toLocaleDateString()}</span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between p-4 pt-0">
                    <div className="space-y-2">
                        {/* Status Badge */}
                        {(isClosed || request.isSorted) && (
                          <Badge variant={request.isSorted ? "default" : "secondary"} className="text-xs">
                            {request.isSorted ? 'Sorted' : 'Closed'}
                          </Badge>
                        )}
                        
                        {/* Visibility */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <visibility.icon className={cn("h-3 w-3", visibility.className)} />
                          <span className={cn(visibility.className)}>{visibility.text}</span>
                        </div>
                        
                        {/* Industries */}
                        {request.isPublic && request.industries && request.industries.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Layers className="h-3 w-3" />
                                <span>{request.industries.length} categor{request.industries.length !== 1 ? 'ies' : 'y'}</span>
                            </div>
                        )}
                        
                        {/* Due Date */}
                        <div className={cn(
                          "flex items-center gap-1.5 text-xs",
                          isExpired ? "text-destructive" : "text-muted-foreground"
                        )}>
                            <Clock className="h-3 w-3" />
                            <span>{isExpired ? 'Expired' : `Expires ${format(new Date(request.dueDate), 'dd MMM yyyy')}`}</span>
                        </div>
                        
                        {/* Response count */}
                        {(request.responseCount || 0) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {request.responseCount} response{request.responseCount !== 1 ? 's' : ''} received
                          </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => onSelectAction('view', request)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                        </Button>
                        {request.status === 'open' && !isExpired && (
                             <Button size="sm" className="flex-1" onClick={() => onSelectAction('close', request)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Sorted
                            </Button>
                        )}
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-9 w-9 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onSelectAction('favourite', request)}>
                                    <Star className={cn("mr-2 h-4 w-4", request.isFavourite && "fill-amber-400 text-amber-400")} />
                                    {request.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                                </DropdownMenuItem>
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
                </CardContent>
              </Card>
            )})}
        </div>
    )
}