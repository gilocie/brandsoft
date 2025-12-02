'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ColorInput, SliderWithLabel } from '../components';

export const ShapeFillPanel = () => {
    const { selectedElementId, elements, updateElementProps, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');

    if (!element) return null;

    return (
        <AccordionItem value="fill">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Fill
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                <ColorInput
                    label="Fill Color"
                    value={element.props.backgroundColor || '#cccccc'}
                    onChange={(v) => updateElementProps(element.id, { backgroundColor: v })}
                    onBlur={commitHistory}
                />
                <SliderWithLabel
                    label="Fill Opacity"
                    value={Math.round((element.props.fillOpacity ?? 1) * 100)}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => updateElementProps(element.id, { fillOpacity: v / 100 })}
                    onCommit={commitHistory}
                />
            </AccordionContent>
        </AccordionItem>
    );
};
