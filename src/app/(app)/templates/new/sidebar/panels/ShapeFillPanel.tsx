
'use client';

import React from 'react';
import { useCanvasStore, type GradientStop, getBackgroundStyle } from '@/stores/canvas-store';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ColorInput, SliderWithLabel } from '../components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradientSlider } from './shared/GradientSlider';


export const ShapeFillPanel = () => {
    const { selectedElementId, pages, currentPageIndex, updateElementProps, commitHistory } = useCanvasStore();
    const elements = pages[currentPageIndex]?.elements || [];
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');

    if (!element) return null;
    
    const handleFillTypeChange = (type: 'solid' | 'gradient') => {
        updateElementProps(element.id, { fillType: type });
        commitHistory();
    };

    return (
        <AccordionItem value="fill">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Fill
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                 <Tabs value={element.props.fillType || 'solid'} onValueChange={(v) => handleFillTypeChange(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="solid" className="text-xs h-6">Solid</TabsTrigger>
                        <TabsTrigger value="gradient" className="text-xs h-6">Gradient</TabsTrigger>
                    </TabsList>
                    <TabsContent value="solid" className="mt-4 space-y-4">
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
                    </TabsContent>
                    <TabsContent value="gradient" className="mt-4 space-y-4">
                        <GradientSlider
                            stops={element.props.gradientStops || []}
                            onStopsChange={(stops) => updateElementProps(element.id, { gradientStops: stops })}
                            onCommit={commitHistory}
                        />
                         <SliderWithLabel
                            label="Angle"
                            value={element.props.gradientAngle || 90}
                            min={0} max={360} unit="°"
                            onChange={(v) => updateElementProps(element.id, { gradientAngle: v })}
                            onCommit={commitHistory}
                        />
                    </TabsContent>
                </Tabs>
            </AccordionContent>
        </AccordionItem>
    );
};
