'use client';

import React, { useState } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link, Unlink } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SliderWithLabel, InputWithLabel } from '../components';

export const ShapeRadiusPanel = () => {
    const { selectedElementId, elements, updateElementProps, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');
    const [linked, setLinked] = useState(true);

    if (!element) return null;

    const corners = [
        { key: 'borderTopLeftRadius', label: 'TL' },
        { key: 'borderTopRightRadius', label: 'TR' },
        { key: 'borderBottomRightRadius', label: 'BR' },
        { key: 'borderBottomLeftRadius', label: 'BL' },
    ] as const;

    const currentValues = {
        borderTopLeftRadius: element.props.borderTopLeftRadius || 0,
        borderTopRightRadius: element.props.borderTopRightRadius || 0,
        borderBottomRightRadius: element.props.borderBottomRightRadius || 0,
        borderBottomLeftRadius: element.props.borderBottomLeftRadius || 0,
    };

    const allSameValue = Object.values(currentValues).every(v => v === currentValues.borderTopLeftRadius);
    const uniformValue = allSameValue ? currentValues.borderTopLeftRadius : 0;

    const handleUniformChange = (value: number) => {
        updateElementProps(element.id, {
            borderTopLeftRadius: value,
            borderTopRightRadius: value,
            borderBottomRightRadius: value,
            borderBottomLeftRadius: value,
        });
    };

    const handleIndividualChange = (key: keyof typeof currentValues, value: number) => {
        if (linked) {
            handleUniformChange(value);
        } else {
            updateElementProps(element.id, { [key]: value });
        }
    };

    return (
        <AccordionItem value="radius">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Corner Radius
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Link Corners</Label>
                    <Button
                        variant={linked ? 'default' : 'outline'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setLinked(!linked)}
                        title={linked ? 'Unlink corners' : 'Link corners'}
                    >
                        {linked ? <Link className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
                    </Button>
                </div>

                {linked ? (
                    <SliderWithLabel
                        label="All Corners"
                        value={uniformValue}
                        min={0}
                        max={100}
                        unit="px"
                        onChange={handleUniformChange}
                        onCommit={commitHistory}
                        showInput
                    />
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {corners.map(({ key, label }) => (
                            <InputWithLabel
                                key={key}
                                label={label}
                                type="number"
                                min={0}
                                value={currentValues[key]}
                                onChange={(e) => handleIndividualChange(key, Number(e.target.value))}
                                onBlur={commitHistory}
                                labelWidth="w-8"
                            />
                        ))}
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
};
