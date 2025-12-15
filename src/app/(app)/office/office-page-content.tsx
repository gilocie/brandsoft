
'use client';

import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, DollarSign, ExternalLink, ShieldCheck, ShieldOff, UserCheck, Users } from 'lucide-react';
import { ClientCard } from '@/components/affiliate/client-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

const StatCard = ({ icon: Icon, title, value, footer, isCurrency = false }: { icon: React.ElementType, title: string, value: string | number, footer: string, isCurrency?: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {isCurrency && <span className="text-muted-foreground">$</span>}
        {typeof value === 'number' && isCurrency ? value.toLocaleString() : value}
      </div>
      <p className="text-xs text-muted-foreground">{footer}</p>
    </CardContent>
  </Card>
);

const VerificationItem = ({ title, status, actionText, onAction }: { title: string, status: boolean, actionText: string, onAction: () => void }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
            {status ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <ShieldOff className="h-5 w-5 text-destructive" />}
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className={`text-xs ${status ? 'text-green-600' : 'text-destructive'}`}>
                    {status ? 'Verified' : 'Not Verified'}
                </p>
            </div>
        </div>
        {!status && (
            <Button variant="secondary" size="sm" onClick={onAction}>{actionText}</Button>
        )}
    </div>
);


export function OfficePageContent() {
  const { config } = useBrandsoft();
  const affiliate = config?.affiliate;

  if (!affiliate) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Affiliate data not available.</p>
      </div>
    );
  }

  const activeClients = affiliate.clients.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={affiliate.profilePic} />
            <AvatarFallback>{affiliate.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold font-headline">{affiliate.fullName}</h1>
            <p className="text-muted-foreground">@{affiliate.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Input value={affiliate.affiliateLink} readOnly className="h-9 text-sm" />
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(affiliate.affiliateLink)}>
                <Copy className="h-4 w-4 mr-2"/> Copy Link
            </Button>
            <Button size="sm" asChild>
                <a href={affiliate.affiliateLink} target="_blank"><ExternalLink className="h-4 w-4 mr-2"/> Visit</a>
            </Button>
        </div>
      </div>

       <Tabs defaultValue="dashboard">
        <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clients">Clients ({affiliate.clients.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="pt-6">
            <div className="grid gap-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <StatCard icon={DollarSign} title="Available Balance" value={affiliate.balance} footer="Ready for withdrawal" isCurrency />
                    <StatCard icon={Users} title="Active Clients" value={activeClients} footer={`${affiliate.clients.length - activeClients} expired`} />
                    <StatCard icon={UserCheck} title="Total Referrals" value={affiliate.clients.length} footer="All-time client sign-ups" />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Account Verification</CardTitle>
                        <CardDescription>Complete these steps to secure your account and enable withdrawals.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <VerificationItem title="Security Questions" status={affiliate.securityQuestion} actionText="Set Questions" onAction={() => alert("Navigate to security questions page")} />
                        <VerificationItem title="Identity Verification" status={affiliate.idUploaded} actionText="Upload ID" onAction={() => alert("Open ID upload dialog")} />
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button disabled={!affiliate.securityQuestion || !affiliate.idUploaded || affiliate.balance <= 0}>
                        Withdraw Balance
                    </Button>
                </div>
            </div>
        </TabsContent>
         <TabsContent value="clients" className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {affiliate.clients.map(client => (
                    <ClientCard key={client.id} client={client} />
                ))}
            </div>
        </TabsContent>
         <TabsContent value="transactions" className="pt-6">
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Transaction history will be shown here.</p>
            </div>
        </TabsContent>
        <TabsContent value="invitations" className="pt-6">
            <div className="flex h-60 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Invitation management will be available here.</p>
            </div>
        </TabsContent>
       </Tabs>
    </div>
  );
}