
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Pencil } from 'lucide-react';
import { type EditableWithdrawalMethod } from './dialogs/withdrawal-method-dialog';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface MethodCardProps {
    method?: EditableWithdrawalMethod | 'bsCredits' | 'bank';
    name: string;
    description: string;
    icon: React.ElementType;
    onAction: () => void;
    isSetup: boolean;
    isPaymentMethod?: boolean;
    onTogglePaymentMethod?: (enabled: boolean) => void;
}

export const MethodCard = ({method, name, description, icon: Icon, onAction, isSetup, isPaymentMethod, onTogglePaymentMethod}: MethodCardProps) => {
    
    // bsCredits method cannot be used by clients
    const canBePaymentMethod = method !== 'bsCredits';
    
    return (
        <Card className={cn(isPaymentMethod && "border-primary ring-1 ring-primary")}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                    <CardTitle className="text-base">{name}</CardTitle>
                </div>
                 {isSetup && <CheckCircle className="h-5 w-5 text-green-500" />}
            </CardHeader>
             <CardContent>
                <CardDescription>{description}</CardDescription>
            </CardContent>
            <CardContent className="flex items-center justify-between gap-2">
                {canBePaymentMethod && (
                    <div className="flex items-center space-x-2">
                        <Switch id={`payment-switch-${method}`} checked={isPaymentMethod} onCheckedChange={onTogglePaymentMethod} disabled={!isSetup} />
                        <Label htmlFor={`payment-switch-${method}`} className="text-xs text-muted-foreground">
                            Client Payment
                        </Label>
                    </div>
                )}
               <Button variant={isSetup ? 'secondary' : 'default'} size="sm" onClick={onAction} className={cn(!canBePaymentMethod && "ml-auto")}>
                  {isSetup ? <Pencil className="h-4 w-4 mr-2" /> : null}
                  {isSetup ? 'Edit' : 'Set Up'}
              </Button>
            </CardContent>
        </Card>
    );
}
