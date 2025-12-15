
'use client';

import { useBrandsoft } from "@/hooks/use-brandsoft";
import { Button } from "./ui/button";
import { Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function WalletBalance() {
  const { config } = useBrandsoft();

  if (!config) {
    return null;
  }

  const balance = config.profile.walletBalance || 0;
  const currency = config.profile.defaultCurrency || '';

  return (
    <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm font-medium">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span>{currency}{balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                 <Button size="sm">Top up</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Top Up Wallet</DialogTitle>
                    <DialogDescription>
                        Wallet top-up functionality is coming soon.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p>This feature will allow you to add funds to your account to seamlessly pay for plan upgrades and other services.</p>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
