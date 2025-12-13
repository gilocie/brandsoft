
'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle as ShadcnCardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontal, Eye, FilePenLine, Trash2, Phone, Building2 } from 'lucide-react';
import type { Company } from '@/hooks/use-brandsoft';

const CompanyActions = ({ onSelectAction }: { onSelectAction: (action: 'view' | 'edit' | 'delete') => void; }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelectAction('view')}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectAction('edit')}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Edit Company
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSelectAction('delete')} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Company
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export function CompanyCard({ company, onSelectAction }: { company: Company, onSelectAction: (action: 'view' | 'edit' | 'delete') => void }) {
    return (
        <Card key={company.id} className="flex flex-col">
            <CardHeader className="p-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ShadcnCardTitle className="text-base font-semibold truncate cursor-pointer">{company.companyName}</ShadcnCardTitle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{company.companyName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-xs text-muted-foreground truncate">{company.name} - {company.email}</p>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                <div className="text-sm space-y-2">
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{company.phone}</p>
                      </div>
                    )}
                    {company.industry && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{company.industry}</p>
                      </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-end">
                <CompanyActions onSelectAction={onSelectAction} />
            </CardFooter>
        </Card>
    );
}
