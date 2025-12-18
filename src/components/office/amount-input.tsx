
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export const AmountInput = ({ value, onChange, className, prefix = 'K' }: { value: number, onChange: (value: number) => void, className?: string, prefix?: string }) => {
    const [displayValue, setDisplayValue] = useState<string>('');

    useEffect(() => {
        setDisplayValue(value > 0 ? value.toLocaleString() : '');
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (/^\d*\.?\d*$/.test(rawValue)) { // Allow only digits and one dot
            const numValue = Number(rawValue);
            setDisplayValue(rawValue); // Show raw value while typing for better UX
            onChange(numValue);
        }
    };
    
    const handleBlur = () => {
        // Format on blur
        const numValue = Number(displayValue.replace(/,/g, ''));
        setDisplayValue(numValue > 0 ? numValue.toLocaleString() : '');
    };

    return (
        <div className="relative text-center">
            <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-5xl font-bold text-muted-foreground pointer-events-none" style={{ left: `calc(50% - ${((displayValue.length + 2) / 2) * 1.5}rem)` }}>{prefix}</span>
            <input
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={cn(
                    "w-full bg-transparent border-none text-5xl font-bold text-center focus:outline-none focus:ring-0",
                    className
                )}
                placeholder="0"
            />
        </div>
    );
};
