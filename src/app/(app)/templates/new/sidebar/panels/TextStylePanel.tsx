'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ColorInput, SliderWithLabel } from '../components';
import { GOOGLE_FONTS, FONT_WEIGHTS } from '../../canvas/utils';

export const TextStylePanel = () => {
    const { selectedElementId, elements, updateElementProps, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'text');

    if (!element) return null;

    return (
        <AccordionItem value="text-style">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Text Style
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                {/* Font Family */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Font Family</Label>
                    <Select
                        value={element.props.fontFamily || 'Arial'}
                        onValueChange={(v) => {
                            updateElementProps(element.id, { fontFamily: v });
                            commitHistory();
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            {GOOGLE_FONTS.map((font) => (
                                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                    {font}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Font Weight */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Font Weight</Label>
                    <Select
                        value={String(element.props.fontWeight || 400)}
                        onValueChange={(v) => {
                            updateElementProps(element.id, { fontWeight: Number(v) });
                            commitHistory();
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FONT_WEIGHTS.map(({ value, label }) => (
                                <SelectItem key={value} value={String(value)}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Font Size */}
                <SliderWithLabel
                    label="Font Size"
                    value={element.props.fontSize || 14}
                    min={8}
                    max={200}
                    unit="px"
                    onChange={(v) => updateElementProps(element.id, { fontSize: v })}
                    onCommit={commitHistory}
                    showInput
                />

                {/* Text Color */}
                <ColorInput
                    label="Text Color"
                    value={element.props.color || '#000000'}
                    onChange={(v) => updateElementProps(element.id, { color: v })}
                    onBlur={commitHistory}
                />

                {/* Text Alignment */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Alignment</Label>
                    <ToggleGroup
                        type="single"
                        value={element.props.textAlign || 'center'}
                        onValueChange={(v) => {
                            if (v) {
                                updateElementProps(element.id, { textAlign: v as 'left' | 'center' | 'right' });
                                commitHistory();
                            }
                        }}
                        className="justify-start"
                    >
                        <ToggleGroupItem value="left" size="sm" className="h-8 w-8">
                            <AlignLeft className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="center" size="sm" className="h-8 w-8">
                            <AlignCenter className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="right" size="sm" className="h-8 w-8">
                            <AlignRight className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {/* Line Height */}
                <SliderWithLabel
                    label="Line Height"
                    value={Math.round((element.props.lineHeight || 1.3) * 100)}
                    min={80}
                    max={250}
                    unit="%"
                    onChange={(v) => updateElementProps(element.id, { lineHeight: v / 100 })}
                    onCommit={commitHistory}
                />

                {/* Letter Spacing */}
                <SliderWithLabel
                    label="Letter Spacing"
                    value={element.props.letterSpacing || 0}
                    min={-5}
                    max={20}
                    unit="px"
                    onChange={(v) => updateElementProps(element.id, { letterSpacing: v })}
                    onCommit={commitHistory}
                />
            </AccordionContent>
        </AccordionItem>
    );
};
