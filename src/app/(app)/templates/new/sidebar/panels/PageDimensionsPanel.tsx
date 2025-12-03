
'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { InputWithLabel } from '../components';

export const PageDimensionsPanel = () => {
    const { pages, currentPageIndex, updatePageDetails, commitHistory } = useCanvasStore();
    const pageDetails = pages[currentPageIndex]?.pageDetails;

    if (!pageDetails) return null;

    return (
        <AccordionItem value="dimensions">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Page Dimensions
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <InputWithLabel
                        label="W"
                        type="number"
                        step="0.1"
                        value={pageDetails.width}
                        onChange={(e) => updatePageDetails({ width: Number(e.target.value) })}
                        onBlur={commitHistory}
                    />
                    <InputWithLabel
                        label="H"
                        type="number"
                        step="0.1"
                        value={pageDetails.height}
                        onChange={(e) => updatePageDetails({ height: Number(e.target.value) })}
                        onBlur={commitHistory}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Units</Label>
                    <Select
                        value={pageDetails.unit}
                        onValueChange={(v) => {
                            updatePageDetails({ unit: v as 'in' | 'px' | 'cm' });
                            commitHistory();
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="in">Inches (in)</SelectItem>
                            <SelectItem value="px">Pixels (px)</SelectItem>
                            <SelectItem value="cm">Centimeters (cm)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
