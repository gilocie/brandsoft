
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Users, UserCheck, UserX } from 'lucide-react';
import type { Affiliate } from "@/hooks/use-brandsoft";

interface AffiliateCardProps {
  affiliate: Affiliate;
  onSelectAction: (action: 'deactivate' | 'delete') => void;
}

const Stat = ({ label, value }: { label: string, value: number }) => (
    <div className="text-center">
        <p className="font-bold text-lg">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);

export const AffiliateCard = ({ affiliate, onSelectAction }: AffiliateCardProps) => {

  const totalClients = affiliate.clients.length;
  const activeClients = affiliate.clients.filter(c => c.status === 'active').length;
  const expiredClients = totalClients - activeClients;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center text-center p-4">
         <div className="relative">
             <Avatar className="h-20 w-20">
                <AvatarImage src={affiliate.profilePic} />
                <AvatarFallback>{affiliate.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="absolute -top-1 -right-1 h-7 w-7 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onSelectAction('deactivate')}>
                        <UserX className="mr-2 h-4 w-4" /> Deactivate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSelectAction('delete')} className="text-destructive focus:text-destructive">
                        <UserX className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <CardTitle className="text-lg mt-2">{affiliate.fullName}</CardTitle>
        <CardDescription>@{affiliate.username}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex justify-around items-center border-y p-3 bg-muted/50">
        <Stat label="Total Clients" value={totalClients} />
        <Stat label="Active" value={activeClients} />
        <Stat label="Expired" value={expiredClients} />
      </CardContent>
      <CardFooter className="p-3">
         <Button variant="outline" className="w-full" asChild>
            <Link href={`/admin/affiliates/${affiliate.username}`}>View Details</Link>
         </Button>
      </CardFooter>
    </Card>
  );
};
