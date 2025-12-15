

'use client';

import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldOff } from 'lucide-react';

export const VerificationItem = ({ title, status, actionText, onAction, actionDisabled = false }: { title: string, status: boolean, actionText: string, onAction: () => void, actionDisabled?: boolean }) => (
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
        <Button variant="secondary" size="sm" onClick={onAction} disabled={actionDisabled}>{actionText}</Button>
    </div>
);
