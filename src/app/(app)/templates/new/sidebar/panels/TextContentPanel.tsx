'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const TextContentPanel = () => {
    const { selectedElementId, pages, currentPageIndex, updateElementProps, commitHistory } = useCanvasStore();
    const elements = pages[currentPageIndex]?.elements || [];
    const element = elements.find(el => el.id === selectedElementId && el.type === 'text');

    if (!element) return null;

    return (
        <AccordionItem value="text-content">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Content
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-2">
                <Label className="text-xs">Text</Label>
                <Textarea
                    value={element.props.text || ''}
                    onChange={(e) => updateElementProps(element.id, { text: e.target.value })}
                    onBlur={commitHistory}
                    placeholder="Enter your text..."
                    className="min-h-[80px] text-sm resize-none"
                />
            </AccordionContent>
        </AccordionItem>
    );
};
