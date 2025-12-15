
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AffiliateClient } from "@/hooks/use-brandsoft";

interface ClientCardProps {
  client: AffiliateClient;
}

export const ClientCard = ({ client }: ClientCardProps) => {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={client.avatar} />
          <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm">{client.name}</p>
          <p className="text-xs text-muted-foreground">Plan: {client.plan}</p>
        </div>
        <Badge variant={client.status === 'active' ? 'success' : 'destructive'} className="capitalize">
          {client.status}
        </Badge>
      </CardContent>
    </Card>
  );
};
