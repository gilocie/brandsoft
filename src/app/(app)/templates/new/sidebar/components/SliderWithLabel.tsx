'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface SliderWithLabelProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
    onCommit?: () => void;
    showInput?: boolean;
}

export const SliderWithLabel = ({
    label,
    value,
    min,
    max,
    step = 1,
    unit = '',
    onChange,
    onCommit,
    showInput = false,
}: SliderWithLabelProps) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <Label className="text-xs">{label}</Label>
            {showInput ? (
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    onBlur={onCommit}
                    className="w-16 h-6 text-xs text-right"
                    min={min}
                    max={max}
                    step={step}
                />
            ) : (
                <span className="text-xs text-muted-foreground">
                    {value}{unit}
                </span>
            )}
        </div>
        <Slider
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={([v]) => onChange(v)}
            onValueCommit={onCommit ? () => onCommit() : undefined}
        />
    </div>
);
