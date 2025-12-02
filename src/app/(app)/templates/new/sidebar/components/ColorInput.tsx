'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ColorInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    allowClear?: boolean;
    onClear?: () => void;
}

export const ColorInput = ({ label, value, onChange, onBlur, allowClear, onClear }: ColorInputProps) => (
    <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <div className="flex gap-2">
            <Input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                className="w-10 h-8 p-1 cursor-pointer shrink-0"
            />
            <Input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                placeholder="#000000"
                className="flex-1 h-8 text-xs"
            />
            {allowClear && value && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={onClear}
                    title="Clear"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    </div>
);
