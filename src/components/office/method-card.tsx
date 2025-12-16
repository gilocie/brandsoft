
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Pencil } from 'lucide-react';
import { type EditableWithdrawalMethod } from './dialogs/withdrawal-method-dialog';

interface MethodCardProps {
    method?: EditableWithdrawalMethod | 'bsCredits';
    name: string;
    description: string;
    icon: React.ElementType;
    onAction: () => void;
    isSetup: boolean;
}

export const MethodCard = ({method, name, description, icon: Icon, onAction, isSetup}: MethodCardProps) => {
    return (
        <Card>
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
            <CardContent className="flex items-center justify-end gap-2">
               <Button variant={isSetup ? 'secondary' : 'default'} size="sm" onClick={onAction}>
                  {isSetup ? <Pencil className="h-4 w-4 mr-2" /> : null}
                  {isSetup ? 'Edit' : 'Set Up'}
              </Button>
            </CardContent>
        </Card>
    );
}
