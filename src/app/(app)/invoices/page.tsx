'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  PlusCircle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const invoices = [
  {
    invoiceId: 'INV001',
    customer: 'Liam Johnson',
    date: '2023-06-23',
    dueDate: '2023-07-23',
    amount: 250.0,
    status: 'Paid',
  },
  {
    invoiceId: 'INV002',
    customer: 'Olivia Smith',
    date: '2023-07-15',
    dueDate: '2023-08-15',
    amount: 150.0,
    status: 'Pending',
  },
  {
    invoiceId: 'INV003',
    customer: 'Noah Williams',
    date: '2023-08-01',
    dueDate: '2023-09-01',
    amount: 350.0,
    status: 'Paid',
  },
  {
    invoiceId: 'INV004',
    customer: 'Emma Brown',
    date: '2023-09-10',
    dueDate: '2023-10-10',
    amount: 450.0,
    status: 'Overdue',
  },
  {
    invoiceId: 'INV005',
    customer: 'James Jones',
    date: '2023-10-20',
    dueDate: '2023-11-20',
    amount: 550.0,
    status: 'Pending',
  },
];

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive';
} = {
  Paid: 'default',
  Pending: 'secondary',
  Overdue: 'destructive',
};

export default function InvoicesPage() {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Invoice Engine</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your professional invoices here.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={layout} onValueChange={(value) => { if(value) setLayout(value as 'grid' | 'list')}} className="hidden md:flex">
                <ToggleGroupItem value="grid" aria-label="Grid view">
                    <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
            </Button>
        </div>
      </div>

      <div className={cn(
        "gap-6",
        layout === 'grid' 
            ? "grid md:grid-cols-2 lg:grid-cols-3" 
            : "flex flex-col"
      )}>
        {invoices.map((invoice) => (
          <Card key={invoice.invoiceId} className={cn(
            "flex flex-col",
            layout === 'list' && "flex-row items-center"
          )}>
            <div className={cn("flex-grow", layout === 'list' && "w-full")}>
                <CardHeader className={cn(layout === 'list' && "p-4")}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className={cn(layout === 'list' && "text-base font-semibold")}>{invoice.customer}</CardTitle>
                      <CardDescription className={cn(layout === 'list' && "text-xs")}>{invoice.invoiceId}</CardDescription>
                    </div>
                     <div className={cn(layout === 'grid' ? "flex" : "hidden")}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                            <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={cn("flex-grow space-y-2", layout === 'list' && "p-4 pt-0 md:flex md:items-center md:justify-between md:space-y-0")}>
                  <div className={cn("text-2xl font-bold", layout === 'list' && "text-base font-bold w-1/4")}>
                    ${invoice.amount.toFixed(2)}
                  </div>
                  <div className={cn("text-sm text-muted-foreground", layout === 'list' && "text-xs w-1/4")}>
                    <p>Date: {invoice.date}</p>
                    <p>Due: {invoice.dueDate}</p>
                  </div>
                   <div className={cn(layout === 'list' && "w-1/4")}>
                      <Badge variant={statusVariantMap[invoice.status]} className={cn(layout === 'grid' ? "w-full justify-center" : "w-auto")}>
                        {invoice.status}
                      </Badge>
                   </div>
                </CardContent>
            </div>
             <div className={cn(layout === 'list' ? "flex items-center p-4" : "hidden")}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Download PDF</DropdownMenuItem>
                    <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardFooter className={cn(layout === 'grid' ? "flex" : "hidden")}>
               <Badge variant={statusVariantMap[invoice.status]} className="w-full justify-center">
                {invoice.status}
              </Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
