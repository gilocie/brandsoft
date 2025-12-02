'use client';

import React from 'react';
import { Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinkIndicatorProps {
    onUnlink: () => void;
}

export const LinkIndicator = ({ onUnlink }: LinkIndicatorProps) => (
    <div style={{ position: 'absolute', top: '-28px', right: '-28px', zIndex: 1001 }}>
        <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); onUnlink(); }} title="Unlink">
            <Unlink className="h-3 w-3" />
        </Button>
    </div>
);
