
'use client';

import { Purchase } from '@/hooks/use-brandsoft';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, RefreshCw, CheckCircle } from 'lucide-react';

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'accent' | 'primary' } = {
  pending: 'accent',
  processing: 'primary',
  completed: 'success',
  active: 'success',
};

interface TopUpTableProps {
    orders: Purchase[];
    onStatusChange: (orderId: string, newStatus: 'pending' | 'processing' | 'active') => void;
    emptyMessage: string;
}

export const TopUpTable = ({ orders, onStatusChange, emptyMessage }: TopUpTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length > 0 ? orders.map(req => (
                    <TableRow key={req.orderId}>
                        <TableCell>{new Date(req.date).toLocaleDateString()}</TableCell>
                        <TableCell>{req.orderId}</TableCell>
                        <TableCell>{req.planPrice}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariantMap[req.status] || 'default'} className="capitalize">
                                {req.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={req.status !== 'pending'}>
                                        <MoreHorizontal className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => onStatusChange(req.orderId, 'processing')} disabled={req.status === 'processing' || req.status === 'active'}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Mark as Processing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onStatusChange(req.orderId, 'active')} disabled={req.status === 'active'}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">{emptyMessage}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};
