
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Clock, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export interface ClientCardProps {
  client: {
    id: string;
    name: string;
    avatar?: string | null;
    plan: string;
    remainingDays?: number;
    walletBalance?: number;
    status: 'active' | 'expired';
  };
  baseUrl?: string;
  isLoadingImage?: boolean;
}

export function ClientCard({ client, baseUrl = '/office', isLoadingImage = false }: ClientCardProps) {
  const isFreeTrial = client.plan === 'Free Trial';
  const isExpired = client.status === 'expired';
  const remainingDays = client.remainingDays ?? 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {isLoadingImage ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <>
                <AvatarImage src={client.avatar || undefined} alt={client.name} />
                <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
              </>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{client.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Briefcase className="h-3 w-3" />
              {client.plan}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {isExpired ? (
              <span className="text-destructive font-medium">Expired</span>
            ) : isFreeTrial ? (
              <span className="text-green-600 font-medium">Always Active</span>
            ) : (
              <span>{remainingDays} days left</span>
            )}
          </div>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
            client.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        </div>
        
        {client.walletBalance !== undefined && (
          <div className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-2 py-1.5">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Wallet className="h-4 w-4" /> Wallet
            </span>
            <span className="font-semibold">K{client.walletBalance.toLocaleString()}</span>
          </div>
        )}
        
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`${baseUrl}/clients/${client.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
