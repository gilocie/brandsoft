'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Trash2, ChevronsUp, ChevronsDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const ActionsPanel = () => {
    const { selectedElementId, deleteElement, duplicateElement, bringToFront, sendToBack, bringForward, sendBackward } = useCanvasStore();

    if (!selectedElementId) return null;

    const actions = [
        { icon: Copy, label: 'Duplicate', onClick: () => duplicateElement(selectedElementId) },
        { icon: ChevronsUp, label: 'Bring to Front', onClick: () => bringToFront(selectedElementId) },
        { icon: ArrowUp, label: 'Bring Forward', onClick: () => bringForward(selectedElementId) },
        { icon: ArrowDown, label: 'Send Backward', onClick: () => sendBackward(selectedElementId) },
        { icon: ChevronsDown, label: 'Send to Back', onClick: () => sendToBack(selectedElementId) },
        { icon: Trash2, label: 'Delete', onClick: () => deleteElement(selectedElementId), variant: 'destructive' as const },
    ];

    return (
        <div className="p-3 border-b">
            <Label className="text-xs font-medium mb-2 block">Quick Actions</Label>
            <div className="flex gap-1 flex-wrap">
                <TooltipProvider>
                    {actions.map(({ icon: Icon, label, onClick, variant }) => (
                        <Tooltip key={label}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={variant || 'outline'}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={onClick}
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
};
