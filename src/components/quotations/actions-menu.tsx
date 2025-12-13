
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
  FileDown,
  Send,
  Eye,
  FileCheck2,
  XCircle,
} from 'lucide-react';
import type { Quotation } from '@/hooks/use-brandsoft';

interface ActionsMenuProps {
    quotation: Quotation;
    onSelectAction: (action: 'view' | 'edit' | 'delete' | 'download' | 'send' | 'accept' | 'decline', quotation: Quotation) => void;
}

export const ActionsMenu = ({ quotation, onSelectAction }: ActionsMenuProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="default" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelectAction('view', quotation)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => onSelectAction('edit', quotation)}>
                <FilePenLine className="mr-2 h-4 w-4" />
                Edit Quotation
            </DropdownMenuItem>
            {(quotation.status === 'Sent' || quotation.status === 'Draft') && (
                <>
                <DropdownMenuItem onClick={() => onSelectAction('accept', quotation)}>
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    Mark as Accepted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectAction('decline', quotation)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Declined
                </DropdownMenuItem>
                </>
            )}
            <DropdownMenuItem onClick={() => onSelectAction('download', quotation)}>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelectAction('send', quotation)}>
                <Send className="mr-2 h-4 w-4" />
                Send Quotation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSelectAction('delete', quotation)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);
