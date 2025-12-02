'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface InputWithLabelProps extends React.ComponentProps<typeof Input> {
    label: string;
    labelWidth?: string;
}

export const InputWithLabel = ({ label, labelWidth = 'w-12', className, ...props }: InputWithLabelProps) => (
    <div className={`flex items-center gap-2 ${className || ''}`}>
        <Label className={`text-xs ${labelWidth} shrink-0`}>{label}</Label>
        <Input className="h-8 text-xs flex-1" {...props} />
    </div>
);
