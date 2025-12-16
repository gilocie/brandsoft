
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type Transaction } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, AtSign, BadgeCheck, Phone, User, Calendar, ShieldAlert, KeyRound, Camera, UserCheck, CreditCard, Users, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/office/stat-card';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ClientCard } from '@/components/affiliate/client-card';

export default function AffiliateDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { config, saveConfig } = useBrandsoft();
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    const affiliate = useMemo(() => {
        // As we only have one affiliate in the current data structure, we find it.
        // In a real multi-affiliate app, you'd find by username param.
        return config?.affiliate;
    }, [config?.affiliate, params.username]);
    
    const withdrawalTransactions = useMemo(() => {
        if (!affiliate?.transactions) return [];
        return affiliate.transactions.filter(t => t.type === 'debit');
    }, [affiliate?.transactions]);

    const creditTransactions = useMemo(() => {
        if (!affiliate?.transactions) return [];
        return affiliate.transactions.filter(t => t.type === 'credit');
    }, [affiliate?.transactions]);


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

    const totalClients = affiliate.clients.length;
    const activeClients = affiliate.clients.filter(c => c.status === 'active').length;
    const totalSales = affiliate.totalSales || 0;
    const unclaimedCommission = affiliate.unclaimedCommission || 0;

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
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawalTransactions.length > 0 ? withdrawalTransactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell className="text-right font-medium text-red-600">- K{t.amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No withdrawal transactions.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="credits" className="pt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Credit History</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {creditTransactions.length > 0 ? creditTransactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell className="text-right font-medium text-green-600">+ K{t.amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No credit transactions.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="team" className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
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
                 <TabsContent value="security" className="pt-6">
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
        </div>
    );
}

