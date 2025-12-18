
'use client';

import { Purchase } from '@/hooks/use-brandsoft';
import { StatCard } from './stat-card';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';

interface TopUpNotificationCardProps {
    pendingOrders: Purchase[];
    onViewAll: () => void;
}

export const TopUpNotificationCard = ({ pendingOrders, onViewAll }: TopUpNotificationCardProps) => {
    if (pendingOrders.length === 0) return null;
    
    const isSingleOrder = pendingOrders.length === 1;
    const orderId = isSingleOrder ? pendingOrders[0].orderId : '';

    return (
        <StatCard
            icon={Bell}
            title="Pending Top-ups"
            value={pendingOrders.length}
            footer={isSingleOrder ? `Order ID: ${orderId}` : `${pendingOrders.length} orders need verification.`}
            className="border-primary"
        >
            <Button size="sm" className="w-full mt-2" onClick={onViewAll}>
                {isSingleOrder ? 'View Order' : 'View All'}
            </Button>
        </StatCard>
    );
};
