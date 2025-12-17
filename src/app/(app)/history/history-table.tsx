
'use client';

import { useMemo, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSearch } from 'lucide-react';
import type { Purchase } from '@/hooks/use-brandsoft';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface HistoryTableProps {
  purchases: Purchase[];
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  active: 'success',
  pending: 'default',
  declined: 'destructive',
  inactive: 'outline',
};

const ITEMS_PER_PAGE = 10;

export const HistoryTable = ({ purchases }: HistoryTableProps) => {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(0);

    const paginatedPurchases = useMemo(() => {
        const startIndex = currentPage * ITEMS_PER_PAGE;
        return purchases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [purchases, currentPage]);

    const totalPages = Math.ceil(purchases.length / ITEMS_PER_PAGE);

    const handleViewOrder = (orderId: string) => {
        router.push(`/verify-purchase?orderId=${orderId}`);
    };

    if (purchases.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-48 rounded-lg border-2 border-dashed">
                <FileSearch className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No transactions found in this category.</p>
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedPurchases.map((p) => (
                        <TableRow key={p.orderId} onClick={() => handleViewOrder(p.orderId)} className="cursor-pointer">
                            <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-mono">{p.orderId}</TableCell>
                            <TableCell className="font-medium">{p.planName}</TableCell>
                            <TableCell>{p.planPrice}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariantMap[p.status] || 'secondary'} className="capitalize">{p.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                     <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(pg => pg - 1)}
                            disabled={currentPage === 0}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(pg => pg + 1)}
                            disabled={currentPage >= totalPages - 1}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};
