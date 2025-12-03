
'use client';

import React from 'react';
import { useCanvasStore, type PageDetails } from '@/stores/canvas-store';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InputWithLabel } from '../components';

const presets: (Omit<PageDetails, 'background' | 'backgroundType' | 'backgroundColor' | 'gradientStops' | 'gradientAngle' | 'colorMode' | 'bitDepth'> & { name: string })[] = [
    { name: 'Letter', width: 8.5, height: 11, unit: 'in', ppi: 300, orientation: 'portrait' },
    { name: 'A4', width: 21, height: 29.7, unit: 'cm', ppi: 300, orientation: 'portrait' },
    { name: 'A5', width: 14.8, height: 21, unit: 'cm', ppi: 300, orientation: 'portrait' },
    { name: 'HD', width: 1920, height: 1080, unit: 'px', ppi: 72, orientation: 'landscape' },
    { name: 'Social', width: 1080, height: 1080, unit: 'px', ppi: 72, orientation: 'portrait' },
];


export const PageDimensionsPanel = () => {
    const { pages, currentPageIndex, updatePageDetails, commitHistory } = useCanvasStore();
    const pageDetails = pages[currentPageIndex]?.pageDetails;

    if (!pageDetails) return null;

    const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
        if (!orientation) return;
        const currentIsPortrait = pageDetails.height > pageDetails.width;
        const newIsPortrait = orientation === 'portrait';
        if (currentIsPortrait !== newIsPortrait) {
            updatePageDetails({ width: pageDetails.height, height: pageDetails.width, orientation });
        } else {
            updatePageDetails({ orientation });
        }
        commitHistory();
    };

    const getResolution = () => {
        const { width, height, unit, ppi } = pageDetails;
        if (!width || !height || !ppi) return '...';
        if (unit === 'px') return `${Math.round(width)} x ${Math.round(height)} px`;
        
        let pxWidth = unit === 'in' ? width * ppi : (width / 2.54) * ppi;
        let pxHeight = unit === 'in' ? height * ppi : (height / 2.54) * ppi;
        
        return `${Math.round(pxWidth)} x ${Math.round(pxHeight)} px @ ${ppi} PPI`;
    };
    
    const handlePresetChange = (presetName: string) => {
        const preset = presets.find(p => p.name === presetName);
        if (preset) {
            updatePageDetails({
                width: preset.width,
                height: preset.height,
                unit: preset.unit,
                ppi: preset.ppi,
                orientation: preset.height > preset.width ? 'portrait' : 'landscape',
            });
            commitHistory();
        }
    };

    const getCurrentPreset = () => {
        const currentPreset = presets.find(p =>
            p.width === pageDetails.width &&
            p.height === pageDetails.height &&
            p.unit === pageDetails.unit &&
            p.ppi === pageDetails.ppi
        );
        return currentPreset ? currentPreset.name : 'Custom';
    };


    return (
        <AccordionItem value="dimensions">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Page Setup
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-3 space-y-3">
                 <div className="space-y-1.5">
                    <Label className="text-xs">Preset</Label>
                    <Select value={getCurrentPreset()} onValueChange={handlePresetChange}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select a preset" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Custom">Custom</SelectItem>
                            {presets.map(p => (
                                <SelectItem key={p.name} value={p.name}>
                                    {p.name} ({p.width}{p.unit} x {p.height}{p.unit})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <InputWithLabel
                        label="W"
                        type="number"
                        step="0.1"
                        value={pageDetails.width}
                        onChange={(e) => updatePageDetails({ width: Number(e.target.value) })}
                        onBlur={commitHistory}
                        labelWidth="w-4"
                    />
                    <InputWithLabel
                        label="H"
                        type="number"
                        step="0.1"
                        value={pageDetails.height}
                        onChange={(e) => updatePageDetails({ height: Number(e.target.value) })}
                        onBlur={commitHistory}
                        labelWidth="w-4"
                    />
                </div>
                 <div className="flex items-end gap-2">
                    <div className="flex-grow space-y-1.5">
                        <Label className="text-xs">Units</Label>
                        <Select
                            value={pageDetails.unit}
                            onValueChange={(v) => {
                                updatePageDetails({ unit: v as 'in' | 'px' | 'cm' });
                                commitHistory();
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in">Inches</SelectItem>
                                <SelectItem value="px">Pixels</SelectItem>
                                <SelectItem value="cm">Centimeters</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <ToggleGroup type="single" value={pageDetails.orientation} onValueChange={(v) => {if(v) handleOrientationChange(v as 'portrait' | 'landscape')}} className="border rounded-md h-8 p-0.5 bg-muted">
                        <ToggleGroupItem value="portrait" className="h-full px-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-sm">
                            <div className="w-2.5 h-3.5 border border-current rounded-sm" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="landscape" className="h-full px-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-sm">
                            <div className="w-3.5 h-2.5 border border-current rounded-sm" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs">PPI/DPI</Label>
                        <Input
                            type="number"
                            min="1"
                            max="5000"
                            step="1"
                            value={pageDetails.ppi}
                            onChange={(e) => updatePageDetails({ ppi: Number(e.target.value) })}
                            onBlur={commitHistory}
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Resolution</Label>
                        <div className="text-[10px] text-muted-foreground bg-muted px-2 h-8 flex items-center rounded-md">
                           {getResolution()}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs">Color Mode</Label>
                        <Select value={pageDetails.colorMode} onValueChange={(v) => { updatePageDetails({ colorMode: v as any }); commitHistory(); }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RGB">RGB</SelectItem>
                                <SelectItem value="CMYK">CMYK</SelectItem>
                                <SelectItem value="Grayscale">Grayscale</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Bit Depth</Label>
                        <Select value={pageDetails.bitDepth} onValueChange={(v) => { updatePageDetails({ bitDepth: v as any }); commitHistory(); }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="8">8-bit</SelectItem>
                                <SelectItem value="16">16-bit</SelectItem>
                                <SelectItem value="32">32-bit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

            </AccordionContent>
        </AccordionItem>
    );
};
