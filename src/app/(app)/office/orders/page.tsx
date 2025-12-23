
'use client';

import { useMemo, useState } from 'react';
import { useBrandsoft, type Purchase } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopUpTable } from '@/components/office/top-up-table';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { TopUpNotificationCard } from '@/components/office/top-up-notification-card';

export default function OfficeOrdersPage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('pending');

    const affiliate = config?.affiliate;

    const allClientPurchases = useMemo(() => {
        if (!config?.companies) return [];
        return config.companies.flatMap(c => 
            (c.purchases || []).map(p => ({ ...p, companyId: c.id }))
        );
    }, [config?.companies]);

    const pendingTopUps = useMemo(() => {
        if (!affiliate) return [];
        return allClientPurchases.filter(p =>
            p.affiliateId === affiliate.staffId &&
            (p.planName.startsWith('Credit Purchase') || p.planName === 'Wallet Top-up')
        );
    }, [allClientPurchases, affiliate]);

    const pendingOrders = useMemo(() => pendingTopUps.filter(p => p.status === 'pending'), [pendingTopUps]);
    const processingOrders = useMemo(() => pendingTopUps.filter(p => p.status === 'processing'), [pendingTopUps]);
    const completedOrders = useMemo(() => pendingTopUps.filter(p => p.status === 'active'), [pendingTopUps]);

    const handleStatusChange = (orderId: string, newStatus: 'pending' | 'processing' | 'active') => {
        if (!config?.companies) return;

        const updatedCompanies = config.companies.map(c => {
            if (c.purchases?.some(p => p.orderId === orderId)) {
                return {
                    ...c,
                    purchases: (c.purchases || []).map(p =>
                        p.orderId === orderId ? { ...p, status: newStatus } : p
                    ),
                };
            }
            return c;
        });
        
        saveConfig({ ...config, companies: updatedCompanies }, { redirect: false, revalidate: true });
        
        toast({
            title: "Status Updated",
            description: `Top-up order status set to ${newStatus}.`,
        });
    };

    if (!affiliate) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Client Orders</h1>
                    <p className="text-muted-foreground">Manage your client's wallet top-up requests.</p>
                </div>
                 <TopUpNotificationCard
                    pendingOrders={pendingOrders}
                    onViewAll={() => setActiveTab('pending')}
                />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Top-up Requests</CardTitle>
                    <CardDescription>A history of all credit sales and top-up transactions from your clients.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
                            <TabsTrigger value="processing">Processing ({processingOrders.length})</TabsTrigger>
                            <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending" className="pt-4">
                            <TopUpTable orders={pendingOrders} onStatusChange={handleStatusChange} emptyMessage="No pending top-ups." />
                        </TabsContent>
                        <TabsContent value="processing" className="pt-4">
                            <TopUpTable orders={processingOrders} onStatusChange={handleStatusChange} emptyMessage="No top-ups are being processed." />
                        </TabsContent>
                        <TabsContent value="completed" className="pt-4">
                            <TopUpTable orders={completedOrders} onStatusChange={handleStatusChange} emptyMessage="No completed top-ups." />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
