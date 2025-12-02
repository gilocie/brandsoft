'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ColorInput, SliderWithLabel } from '../components';

export const ShapeStrokePanel = () => {
    const { selectedElementId, elements, updateElementProps, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');

    if (!element) return null;

    return (
        <AccordionItem value="stroke">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Stroke / Border
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                <ColorInput
                    label="Stroke Color"
                    value={element.props.borderColor || '#000000'}
                    onChange={(v) => updateElementProps(element.id, { borderColor: v })}
                    onBlur={commitHistory}
                />
                <SliderWithLabel
                    label="Stroke Width"
                    value={element.props.borderWidth || 0}
                    min={0}
                    max={20}
                    unit="px"
                    onChange={(v) => updateElementProps(element.id, { borderWidth: v })}
                    onCommit={commitHistory}
                />
                <div className="space-y-1.5">
                    <Label className="text-xs">Stroke Style</Label>
                    <Select
                        value={element.props.borderStyle || 'solid'}
                        onValueChange={(v) => {
                            updateElementProps(element.id, { borderStyle: v as 'solid' | 'dashed' | 'dotted' | 'none' });
                            commitHistory();
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="dashed">Dashed</SelectItem>
                            <SelectItem value="dotted">Dotted</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
