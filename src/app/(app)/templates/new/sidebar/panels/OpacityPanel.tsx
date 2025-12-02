'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SliderWithLabel } from '../components';

export const OpacityPanel = () => {
    const { selectedElementId, elements, updateElementProps, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId);

    if (!element) return null;

    return (
        <AccordionItem value="opacity">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Opacity
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
                <SliderWithLabel
                    label="Opacity"
                    value={Math.round((element.props.opacity ?? 1) * 100)}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => updateElementProps(element.id, { opacity: v / 100 })}
                    onCommit={commitHistory}
                />
            </AccordionContent>
        </AccordionItem>
    );
};
