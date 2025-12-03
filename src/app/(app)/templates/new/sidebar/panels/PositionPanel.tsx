'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { InputWithLabel } from '../components';

export const PositionPanel = () => {
    const { selectedElementId, pages, currentPageIndex, updateElement, commitHistory } = useCanvasStore();
    const elements = pages[currentPageIndex]?.elements || [];
    const element = elements.find(el => el.id === selectedElementId);

    if (!element) return null;

    const handleChange = (prop: 'x' | 'y' | 'width' | 'height' | 'rotation', value: string) => {
        const numValue = Number(value);
        if (prop === 'width' || prop === 'height') {
            updateElement(element.id, { [prop]: Math.max(20, numValue) });
        } else {
            updateElement(element.id, { [prop]: numValue });
        }
    };

    const resetRotation = () => {
        updateElement(element.id, { rotation: 0 });
        commitHistory();
    };

    return (
        <AccordionItem value="position">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Transform
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <InputWithLabel
                        label="X"
                        type="number"
                        value={element.x.toFixed(0)}
                        onChange={(e) => handleChange('x', e.target.value)}
                        onBlur={commitHistory}
                    />
                    <InputWithLabel
                        label="Y"
                        type="number"
                        value={element.y.toFixed(0)}
                        onChange={(e) => handleChange('y', e.target.value)}
                        onBlur={commitHistory}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <InputWithLabel
                        label="W"
                        type="number"
                        value={element.width.toFixed(0)}
                        onChange={(e) => handleChange('width', e.target.value)}
                        onBlur={commitHistory}
                    />
                    <InputWithLabel
                        label="H"
                        type="number"
                        value={element.height.toFixed(0)}
                        onChange={(e) => handleChange('height', e.target.value)}
                        onBlur={commitHistory}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <InputWithLabel
                            label="Angle"
                            type="number"
                            value={element.rotation.toFixed(0)}
                            onChange={(e) => handleChange('rotation', e.target.value)}
                            onBlur={commitHistory}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={resetRotation}
                        title="Reset Rotation"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
