
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrandsoft, type AffiliateClient } from '@/hooks/use-brandsoft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Ban, Briefcase, User, Wallet, CirclePlus, Clock } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/office/stat-card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { config, saveConfig } = useBrandsoft();
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const client = useMemo(() => {
    // In a multi-affiliate setup, you'd get the specific affiliate first.
    // For now, we assume one affiliate and find the client in their list.
    return config?.affiliate?.clients.find(c => c.id === params.id);
  }, [config, params.id]);

  const handleSuspend = () => {
    if (!client) return;
    // Placeholder for suspension logic
    console.log(`Suspending client: ${client.name}`);
    toast({
      title: "Client Suspended",
      description: `${client.name} has been suspended.`,
    });
    setIsSuspendOpen(false);
  };

  const handleTopUp = () => {
    if (!client) return;
    // Placeholder for top-up logic
    console.log(`Topping up for client: ${client.name}`);
    toast({
      title: "Top-up Action",
      description: `Ready to top-up wallet for ${client.name}.`,
    });
    setIsTopUpOpen(false);
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-xl font-semibold">Client not found</h2>
        <p className="text-muted-foreground">The requested client could not be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/office"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Office</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/office?tab=clients"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Office</Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-28 w-28 border">
            <AvatarImage src={client.avatar} alt={client.name} />
            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1 text-center md:text-left">
            <CardTitle className="text-3xl font-headline">{client.name}</CardTitle>
            <CardDescription className="text-base text-muted-foreground flex items-center justify-center md:justify-start gap-4">
              <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Plan: {client.plan}</span>
              {client.status === 'active' && client.remainingDays !== undefined && (
                <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {client.remainingDays} days left</span>
              )}
            </CardDescription>
             <div className="pt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
             </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Client Wallet" value={client.walletBalance || 0} isCurrency icon={Wallet} footer="Funds available to the client">
             <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setIsTopUpOpen(true)}>
                <CirclePlus className="mr-2 h-4 w-4" /> Top Up Wallet
            </Button>
        </StatCard>
        <Card>
            <CardHeader>
                <CardTitle>Client Actions</CardTitle>
                <CardDescription>Manage this client's account.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full" onClick={() => setIsSuspendOpen(true)}>
                    <Ban className="mr-2 h-4 w-4" /> Suspend Client
                </Button>
            </CardContent>
        </Card>
      </div>

       <AlertDialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Suspend {client.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will temporarily disable their account. Are you sure?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSuspend}>Suspend</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Top Up Wallet</AlertDialogTitle>
                  <AlertDialogDescription>
                      This functionality is not yet implemented.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleTopUp()}>OK</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
