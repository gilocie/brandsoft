
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AffiliateClient } from "@/hooks/use-brandsoft";
import { Button } from "../ui/button";
import { Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ClientCardProps {
  client: AffiliateClient;
}

export const ClientCard = ({ client }: ClientCardProps) => {
  const isExpired = client.status === 'expired';
  const remainingDays = client.remainingDays || 0;
  const isExpiringSoon = !isExpired && remainingDays <= 7;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center gap-4 p-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={client.avatar} />
          <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <CardTitle className="text-lg">{client.name}</CardTitle>
            <CardDescription>Plan: {client.plan}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-between p-4 pt-0">
        <Badge variant={isExpired ? 'destructive' : 'success'} className="capitalize">
          {client.status}
        </Badge>
        {!isExpired && (
            <div className={cn(
                "flex items-center gap-1.5 text-xs font-medium",
                isExpiringSoon ? "text-destructive" : "text-muted-foreground"
            )}>
                <Clock className="h-3 w-3" />
                <span>{remainingDays} days left</span>
            </div>
        )}
      </CardContent>
      <CardContent className="p-4 pt-0">
        <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/office/clients/${client.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Client
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
