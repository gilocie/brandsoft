
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Target } from 'lucide-react';
import type { Affiliate } from '@/hooks/use-brandsoft';
import { Progress } from '@/components/ui/progress';
import { addDays, differenceInDays } from 'date-fns';

interface BonusProgressDialogProps {
  affiliate: Affiliate;
}

export const BonusProgressDialog = ({ affiliate }: BonusProgressDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const bonusAmount = affiliate.bonus || 0;
  const clientsReferred = affiliate.bonusChallengeClients || 0;
  const goal = 10;
  const progress = (clientsReferred / goal) * 100;
  
  const challengeStartDate = affiliate.bonusChallengeStartDate ? new Date(affiliate.bonusChallengeStartDate) : null;
  const daysLeft = challengeStartDate ? 30 - differenceInDays(new Date(), challengeStartDate) : 0;


  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Bonus Tier</CardTitle>
                <Gift className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              {affiliate.isBonusTierActive ? 'K20,000 monthly bonus active!' : 'Refer 10 clients in 30 days.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold">K{bonusAmount.toLocaleString()}</p>
        </CardContent>
        <CardContent>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">View Progress</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary"/>Referral Bonus Challenge</DialogTitle>
                    <DialogDescription>
                        Refer {goal} new clients within 30 days to unlock a K20,000 recurring monthly bonus.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-center">
                        <p className="text-5xl font-bold">{clientsReferred}<span className="text-2xl text-muted-foreground">/{goal}</span></p>
                        <p className="text-sm text-muted-foreground">Clients Referred</p>
                    </div>
                    <Progress value={progress} />
                     {challengeStartDate && (
                         <div className="text-center text-sm text-muted-foreground">
                            {daysLeft > 0 ? (
                                <p>{daysLeft} days left to complete the challenge.</p>
                            ) : (
                                <p>Challenge period has ended. Start a new one with your next referral!</p>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
          </Dialog>
        </CardContent>
    </Card>
  );
};
