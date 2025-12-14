
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
} from 'lucide-react';
import type { QuotationRequest } from '@/hooks/use-brandsoft';

interface QuotationRequestActionsProps {
    request: QuotationRequest;
    onSelectAction: (action: 'view' | 'edit' | 'delete' | 'close', request: QuotationRequest) => void;
}

export const QuotationRequestActions = ({ request, onSelectAction }: QuotationRequestActionsProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
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
);
