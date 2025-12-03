'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ColorInput, SliderWithLabel, InputWithLabel } from '../components';

export const ShapeShadowPanel = () => {
    const { selectedElementId, pages, currentPageIndex, updateElementProps, commitHistory } = useCanvasStore();
    const elements = pages[currentPageIndex]?.elements || [];
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');

    if (!element) return null;

    const hasShadow = !!(element.props.shadowColor || element.props.shadowBlur);

    const clearShadow = () => {
        updateElementProps(element.id, {
            shadowColor: undefined,
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowSpread: 0,
            shadowInset: false,
        });
        commitHistory();
    };

    return (
        <AccordionItem value="shadow">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Shadow
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                <ColorInput
                    label="Shadow Color"
                    value={element.props.shadowColor || '#000000'}
                    onChange={(v) => updateElementProps(element.id, { shadowColor: v })}
                    onBlur={commitHistory}
                    allowClear={hasShadow}
                    onClear={clearShadow}
                />

                <SliderWithLabel
                    label="Blur"
                    value={element.props.shadowBlur || 0}
                    min={0}
                    max={50}
                    unit="px"
                    onChange={(v) => updateElementProps(element.id, { shadowBlur: v })}
                    onCommit={commitHistory}
                />

                <SliderWithLabel
                    label="Spread"
                    value={element.props.shadowSpread || 0}
                    min={-20}
                    max={50}
                    unit="px"
                    onChange={(v) => updateElementProps(element.id, { shadowSpread: v })}
                    onCommit={commitHistory}
                />

                <div className="grid grid-cols-2 gap-2">
                    <InputWithLabel
                        label="X"
                        type="number"
                        value={element.props.shadowOffsetX || 0}
                        onChange={(e) => updateElementProps(element.id, { shadowOffsetX: Number(e.target.value) })}
                        onBlur={commitHistory}
                    />
                    <InputWithLabel
                        label="Y"
                        type="number"
                        value={element.props.shadowOffsetY || 0}
                        onChange={(e) => updateElementProps(element.id, { shadowOffsetY: Number(e.target.value) })}
                        onBlur={commitHistory}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label className="text-xs">Inset Shadow</Label>
                    <Switch
                        checked={element.props.shadowInset || false}
                        onCheckedChange={(checked) => {
                            updateElementProps(element.id, { shadowInset: checked });
                            commitHistory();
                        }}
                    />
                </div>

                {hasShadow && (
                    <Button variant="outline" size="sm" className="w-full" onClick={clearShadow}>
                        Clear Shadow
                    </Button>
                )}
            </AccordionContent>
        </AccordionItem>
    );
};
