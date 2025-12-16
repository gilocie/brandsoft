
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type Transaction, type Affiliate } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, AtSign, BadgeCheck, Phone, User, Calendar, ShieldAlert, KeyRound, Camera, UserCheck, CreditCard, Users, Shield, TrendingDown, TrendingUp, UserX, Trash2 } from 'lucide-react';
import { StatCard } from '@/components/office/stat-card';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ClientCard } from '@/components/affiliate/client-card';

// Extend transaction to include optional status
type DisplayTransaction = Transaction & { status?: 'pending' | 'processing' | 'completed' };

export default function AffiliateDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { config, saveConfig } = useBrandsoft();
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const affiliate = useMemo(() => {
        // As we only have one affiliate in the current data structure, we find it.
        // In a real multi-affiliate app, you'd find by username param.
        return config?.affiliate;
    }, [config?.affiliate, params.username]);

    const allTransactions = useMemo(() => {
        if (!affiliate?.transactions) return [];
        // Default status to 'completed' for old transactions, 'pending' for new ones.
        return affiliate.transactions.map(t => ({...t, status: (t as any).status || 'completed' }));
    }, [affiliate?.transactions]);
    
    // Filter for actual withdrawal debits (not fees or credit purchases)
    const withdrawalTransactions = useMemo(() => {
        return allTransactions.filter(t => 
            t.type === 'debit' && 
            !t.description.toLowerCase().includes('fee') && 
            !t.description.toLowerCase().includes('credit')
        );
    }, [allTransactions]);

    const pendingWithdrawals = useMemo(() => withdrawalTransactions.filter(t => t.status === 'pending'), [withdrawalTransactions]);
    const processingWithdrawals = useMemo(() => withdrawalTransactions.filter(t => t.status === 'processing'), [withdrawalTransactions]);
    const completedWithdrawals = useMemo(() => withdrawalTransactions.filter(t => t.status === 'completed'), [withdrawalTransactions]);

    const creditTransactions = useMemo(() => {
        // This includes commissions (credit) and credit purchases (debit)
        return allTransactions.filter(t => 
            t.type === 'credit' || 
            (t.type === 'debit' && t.description.toLowerCase().includes('credit'))
        );
    }, [allTransactions]);


    if (!affiliate) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-xl font-semibold">Affiliate not found</h2>
                <p className="text-muted-foreground">The requested affiliate could not be found.</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin</Link>
                </Button>
            </div>
        );
    }
    
    const handleResetSecurity = () => {
        if (!config) return;
        
        const newAffiliateData = {
            ...affiliate,
            securityQuestion: false,
            securityQuestionData: undefined
        };
        
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false });
        
        toast({
            title: "Security Question Reset!",
            description: `${affiliate.fullName}'s security question has been cleared. They will be prompted to set a new one.`,
        });
        
        setIsResetConfirmOpen(false);
    };
    
    const handleDeactivateAffiliate = () => {
        // Placeholder for deactivation logic
        console.log(`Deactivating ${affiliate.fullName}`);
        toast({ title: 'Affiliate Deactivated' });
        setIsDeactivateOpen(false);
    };

    const handleDeleteAffiliate = () => {
        // This is a destructive action.
        if (config) {
             saveConfig({ ...config, affiliate: undefined }, { redirect: false });
             toast({ title: 'Affiliate Deleted' });
             setIsDeleteOpen(false);
             router.push('/admin');
        }
    };

    const totalClients = affiliate.clients.length;
    const activeClients = affiliate.clients.filter(c => c.status === 'active').length;
    const totalSales = affiliate.totalSales || 0;
    const unclaimedCommission = affiliate.unclaimedCommission || 0;

    const renderTransactionTable = (transactions: DisplayTransaction[], emptyMessage: string) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.length > 0 ? transactions.map(t => (
                    <TableRow key={t.id}>
                        <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell className={cn("text-right font-medium", t.type === 'credit' ? 'text-green-600' : 'text-red-600')}>
                            {t.type === 'credit' ? '+' : '-'} K{t.amount.toLocaleString()}
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow><TableCell colSpan={3} className="text-center h-24">{emptyMessage}</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="container mx-auto space-y-6">
            <Button variant="ghost" asChild>
                <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Admin</Link>
            </Button>
            
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start gap-6">
                    <Avatar className="h-28 w-28 border">
                        <AvatarImage src={affiliate.profilePic} />
                        <AvatarFallback>{affiliate.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-3xl font-headline">{affiliate.fullName}</CardTitle>
                             <BadgeCheck className="h-6 w-6 text-green-500" />
                             <div className="flex-grow" />
                             <Button variant="outline" size="sm" onClick={() => setIsDeactivateOpen(true)}><UserX className="mr-2 h-4 w-4"/> Deactivate</Button>
                             <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                        </div>
                        <CardDescription className="text-base text-muted-foreground flex items-center gap-2">
                           <AtSign className="h-4 w-4" /> {affiliate.username}
                        </CardDescription>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {affiliate.phone || 'Not provided'}</div>
                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Joined: {new Date(affiliate.clients[0]?.joinDate || Date.now()).toLocaleDateString()}</div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Clients" value={totalClients} icon={User} footer="All referred clients" />
                <StatCard title="Active Clients" value={activeClients} icon={UserCheck} footer={`${totalClients > 0 ? ((activeClients/totalClients) * 100).toFixed(0) : 0}% retention`} />
                <StatCard title="Total Sales" value={totalSales} isCurrency icon={User} footer="Lifetime sales volume" />
                <StatCard title="Unclaimed" value={unclaimedCommission} isCurrency icon={User} footer="Awaiting push to wallet" />
            </div>

            <Tabs defaultValue="transactions">
                <TabsList>
                    <TabsTrigger value="transactions">Withdraw Transactions</TabsTrigger>
                    <TabsTrigger value="credits">Credit Transactions</TabsTrigger>
                    <TabsTrigger value="team">Team Members</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdrawal History</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Tabs defaultValue="pending">
                            <TabsList>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="processing">Processing</TabsTrigger>
                                <TabsTrigger value="completed">Completed</TabsTrigger>
                            </TabsList>
                            <TabsContent value="pending" className="pt-4">
                                {renderTransactionTable(pendingWithdrawals, "No pending withdrawals.")}
                            </TabsContent>
                            <TabsContent value="processing" className="pt-4">
                                {renderTransactionTable(processingWithdrawals, "No withdrawals being processed.")}
                            </TabsContent>
                            <TabsContent value="completed" className="pt-4">
                                {renderTransactionTable(completedWithdrawals, "No completed withdrawals.")}
                            </TabsContent>
                           </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="credits" className="pt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Credit & Commission History</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {renderTransactionTable(creditTransactions, "No credit or commission transactions.")}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="team" className="pt-6">
                   <Tabs defaultValue="clients">
                       <TabsList>
                           <TabsTrigger value="clients">Clients</TabsTrigger>
                           <TabsTrigger value="invites">Invites</TabsTrigger>
                       </TabsList>
                       <TabsContent value="clients" className="pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Referred Clients</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {affiliate.clients.map(client => (
                                        <ClientCard key={client.id} client={client} />
                                    ))}
                                </CardContent>
                            </Card>
                       </TabsContent>
                       <TabsContent value="invites" className="pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sent Invites</CardTitle>
                                </CardHeader>
                                <CardContent className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                                    <p className="text-muted-foreground">Invitation tracking coming soon.</p>
                                </CardContent>
                            </Card>
                       </TabsContent>
                   </Tabs>
                </TabsContent>
                 <TabsContent value="security" className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5"/> Admin Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-medium text-sm">Reset Security Question</p>
                                        <p className="text-xs text-muted-foreground">Allows user to set a new question and answer.</p>
                                    </div>
                                    <Button variant="destructive" onClick={() => setIsResetConfirmOpen(true)}>
                                        <KeyRound className="h-4 w-4 mr-2"/>
                                        Reset
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5"/> ID Photos</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="h-40 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">Front of ID</div>
                                <div className="h-40 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">Back of ID</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
            
            <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently delete {affiliate.fullName}'s current security question and answer. They will need to set a new one to recover their account. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetSecurity} className="bg-destructive hover:bg-destructive/90">Yes, Reset It</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate {affiliate?.fullName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will temporarily suspend their account and prevent them from earning commissions. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivateAffiliate}>Deactivate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {affiliate?.fullName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is irreversible and will permanently remove this affiliate from your system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAffiliate} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
