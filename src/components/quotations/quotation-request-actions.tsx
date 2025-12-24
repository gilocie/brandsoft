'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  FilePenLine,
  Trash2,
  CheckCircle2,
  Eye,
  Star,
} from 'lucide-react';
import type { QuotationRequest } from '@/hooks/use-brandsoft';
import { cn } from '@/lib/utils';

interface QuotationRequestActionsProps {
    request: QuotationRequest;
    onSelectAction: (action: 'view' | 'edit' | 'delete' | 'close' | 'favourite', request: QuotationRequest) => void;
    isOwner?: boolean;
}

export const QuotationRequestActions = ({ request, onSelectAction, isOwner = true }: QuotationRequestActionsProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
            <DropdownMenuItem onClick={() => onSelectAction('view', request)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
            </DropdownMenuItem>
            {isOwner && (
                <>
                    <DropdownMenuItem onClick={() => onSelectAction('favourite', request)}>
                        <Star className={cn("mr-2 h-4 w-4", request.isFavourite && "fill-amber-400 text-amber-400")} />
                        {request.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSelectAction('edit', request)}>
                        <FilePenLine className="mr-2 h-4 w-4" />
                        Edit Request
                    </DropdownMenuItem>
                    {request.status === 'open' && (
                        <DropdownMenuItem onClick={() => onSelectAction('close', request)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark as Sorted
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onSelectAction('delete', request)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Request
                    </DropdownMenuItem>
                </>
            )}
        </DropdownMenuContent>
    </DropdownMenu>
);