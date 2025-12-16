
'use client';

import { useState, useMemo } from 'react';
import { useBrandsoft, type Affiliate, type Transaction, type AffiliateClient } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Users, BarChart, Clock, CheckCircle, RefreshCw, Briefcase } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientCard } from '@/components/affiliate/client-card';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'accent' | 'primary' } = {
  pending: 'accent',
  processing: 'primary',
  completed: 'success',
};

const plans = [
    { name: 'Free Trial', price: 'K0', features: ['Up to 10 invoices', 'Up to 10 customers', 'Basic templates'] },
    { name: 'Standard', price: 'K5,000/mo', features: ['Unlimited invoices', 'Unlimited customers', 'Premium templates', 'Email support'] },
    { name: 'Pro', price: 'K15,000/mo', features: ['All Standard features', 'API access', 'Priority support', 'Advanced analytics'] },
    { name: 'Enterprise', price: 'Custom', features: ['All Pro features', 'Dedicated support', 'Custom integrations', 'On-premise option'] },
];

export default function AdminPage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();

    // In a real multi-affiliate app, this would be a list of affiliates.
    // For this structure, we have one affiliate object.
    const affiliates = useMemo(() => (config?.affiliate ? [config.affiliate] : []), [config?.affiliate]);
    
    const allClients = useMemo(() => {
        if (!config?.affiliate?.clients) return [];
        return config.affiliate.clients;
    }, [config?.affiliate?.clients]);

    const totalAffiliates = affiliates.length;
    const totalSales = affiliates.reduce((sum, aff) => sum + (aff.totalSales || 0), 0);
    
    const withdrawalRequests = useMemo(() => {
        if (!config?.affiliate?.transactions) return [];
        return config.affiliate.transactions
            .filter(t => t.type === 'debit' && !t.description.includes('Fee'))
            .map(t => ({...t, status: t.status || 'pending', affiliateName: config.affiliate?.fullName || 'N/A' }));
    }, [config?.affiliate]);

    const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'pending');
    const totalPendingAmount = pendingWithdrawals.reduce((sum, req) => sum + req.amount, 0);

    const handleStatusChange = (transactionId: string, newStatus: 'pending' | 'processing' | 'completed') => {
        if (!config?.affiliate) return;

        const updatedTransactions = config.affiliate.transactions?.map(t => 
            t.id === transactionId ? { ...t, status: newStatus } : t
        );
        
        const newAffiliateData = {
            ...config.affiliate,
            transactions: updatedTransactions,
        };

        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
        
        toast({
            title: "Status Updated",
            description: `Withdrawal status set to ${newStatus}.`,
        });
    };

    return (
        <div className="container mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Affiliate Admin</h1>
                <p className="text-muted-foreground">Manage your team and their withdrawal requests.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Affiliates" value={totalAffiliates} icon={Users} />
                <StatCard title="Total Sales Volume" value={`K${totalSales.toLocaleString()}`} icon={BarChart} />
                <StatCard title="Pending Withdrawals" value={`K${totalPendingAmount.toLocaleString()}`} icon={Clock} />
            </div>

             <Tabs defaultValue="staff" className="w-full">
                <TabsList>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="clients">Clients</TabsTrigger>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                    <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>
                <TabsContent value="staff" className="pt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Affiliates</CardTitle>
                            <CardDescription>Your registered affiliate partners.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {affiliates.map(affiliate => (
                                <Card key={affiliate.username}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={affiliate.profilePic} />
                                            <AvatarFallback>{affiliate.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{affiliate.fullName}</p>
                                            <p className="text-sm text-muted-foreground">@{affiliate.username}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="clients" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Clients</CardTitle>
                            <CardDescription>Clients referred by all your affiliates.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {allClients.map((client: AffiliateClient) => (
                                <ClientCard key={client.id} client={client} />
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="plans" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plans</CardTitle>
                            <CardDescription>Plans available for clients to purchase.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                           {plans.map(plan => (
                                <Card key={plan.name}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Briefcase className="h-5 w-5" />
                                            {plan.name}
                                        </CardTitle>
                                        <CardDescription className="text-2xl font-bold pt-1">{plan.price}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {plan.features.map(feature => (
                                                <li key={feature} className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="options" className="pt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Options & Settings</CardTitle>
                            <CardDescription>Manage affiliate program settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                                <p className="text-muted-foreground">More settings coming soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Withdrawal Requests</CardTitle>
                    <CardDescription>Manage pending and processed withdrawals.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Affiliate</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {withdrawalRequests.length > 0 ? withdrawalRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.affiliateName}</TableCell>
                                    <TableCell>{new Date(req.date).toLocaleDateString()}</TableCell>
                                    <TableCell>K{req.amount.toLocaleString()}</TableCell>
                                    <TableCell>{req.method || 'Not specified'}</TableCell>
                                    <TableCell><Badge variant={statusVariantMap[req.status] || 'default'} className="capitalize">{req.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'processing')} disabled={req.status === 'processing'}>
                                                    <RefreshCw className="mr-2 h-4 w-4" /> Mark as Processing
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'completed')} disabled={req.status === 'completed'}>
                                                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No withdrawal requests found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
