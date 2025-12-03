
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useCanvasStore, type GradientStop } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { UploadCloud, Trash2, RotateCcw, Image as ImageIcon, Plus, X } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ColorInput, SliderWithLabel } from '../components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const GradientSlider = ({ stops, onStopsChange, onCommit }: { stops: GradientStop[], onStopsChange: (stops: GradientStop[]) => void, onCommit: () => void }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(0);

    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const background = `linear-gradient(to right, ${sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')})`;

    const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sliderRef.current || (e.target as HTMLElement).dataset.handle) return;
        
        const rect = sliderRef.current.getBoundingClientRect();
        const position = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        
        // Add new stop
        const newStops = [...sortedStops, { color: '#ffffff', position: Math.round(position) }];
        onStopsChange(newStops);
        setSelectedStopIndex(newStops.length - 1);
        onCommit();
    };

    const handleStopDrag = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setSelectedStopIndex(index);
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!sliderRef.current) return;
            const rect = sliderRef.current.getBoundingClientRect();
            const newPosition = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
            
            const newStops = [...sortedStops];
            newStops[index].position = newPosition;
            onStopsChange(newStops);
        };

        const handleMouseUp = () => {
            onCommit();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleStopColorChange = (color: string) => {
        if (selectedStopIndex === null) return;
        const newStops = [...sortedStops];
        newStops[selectedStopIndex].color = color;
        onStopsChange(newStops);
    };

    const handleRemoveStop = () => {
        if (selectedStopIndex === null || sortedStops.length <= 2) return;
        const newStops = sortedStops.filter((_, i) => i !== selectedStopIndex);
        onStopsChange(newStops);
        setSelectedStopIndex(Math.max(0, selectedStopIndex - 1));
        onCommit();
    };
    
    const handlePositionInput = (pos: number) => {
         if (selectedStopIndex === null) return;
         const newStops = [...sortedStops];
         newStops[selectedStopIndex].position = Math.max(0, Math.min(100, pos));
         onStopsChange(newStops);
    };

    const selectedStop = selectedStopIndex !== null ? sortedStops[selectedStopIndex] : null;

    return (
        <div className="space-y-3">
            <div ref={sliderRef} onClick={handleSliderClick} className="relative h-6 w-full rounded-full border cursor-pointer" style={{ background }}>
                {sortedStops.map((stop, index) => (
                    <div
                        key={index}
                        data-handle="true"
                        onMouseDown={(e) => handleStopDrag(e, index)}
                        className={cn(
                            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-white cursor-ew-resize",
                            selectedStopIndex === index ? "border-primary ring-2 ring-primary z-10" : "border-gray-400"
                        )}
                        style={{ left: `${stop.position}%` }}
                    />
                ))}
            </div>
            {selectedStop && (
                <div className="p-3 bg-muted rounded-md space-y-3">
                     <div className="flex items-center gap-2">
                        <ColorInput label="" value={selectedStop.color} onChange={handleStopColorChange} onBlur={onCommit} />
                        <Input
                            type="number"
                            value={Math.round(selectedStop.position)}
                            onChange={(e) => handlePositionInput(Number(e.target.value))}
                            onBlur={onCommit}
                            className="w-16 h-8 text-xs text-right"
                            min={0} max={100} step={1}
                        />
                         <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleRemoveStop} disabled={sortedStops.length <= 2}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};


export const PageBackgroundPanel = () => {
    const { pages, currentPageIndex, updatePageDetails, updatePageBackground, commitHistory } = useCanvasStore();
    const bgInputRef = useRef<HTMLInputElement>(null);

    const pageDetails = pages[currentPageIndex]?.pageDetails;
    if (!pageDetails) return null;

    const bg = pageDetails.background;
    if (!bg) return null; // Added safe guard

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updatePageBackground({ image: event.target?.result as string });
                commitHistory();
            };
            reader.readAsDataURL(file);
        }
    };

    const removeBackgroundImage = () => {
        updatePageBackground({
            image: undefined,
            offsetX: 0,
            offsetY: 0,
            scale: 1,
        });
        commitHistory();
    };

    const resetEffects = () => {
        updatePageBackground({
            opacity: 1,
            blur: 0,
            grayscale: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100,
        });
        commitHistory();
    };

    const resetPosition = () => {
        updatePageBackground({
            offsetX: 0,
            offsetY: 0,
            scale: 1,
        });
        commitHistory();
    };
    
    const handleBackgroundTypeChange = (type: 'color' | 'gradient' | 'transparent') => {
        updatePageDetails({ backgroundType: type });
        commitHistory();
    };

    return (
        <>
            <AccordionItem value="background-color">
                <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                    Background Color
                </AccordionTrigger>
                 <AccordionContent className="px-3 pb-3 space-y-4">
                     <Tabs value={pageDetails.backgroundType} onValueChange={(v) => handleBackgroundTypeChange(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-8">
                            <TabsTrigger value="color" className="text-xs h-6">Color</TabsTrigger>
                            <TabsTrigger value="gradient" className="text-xs h-6">Gradient</TabsTrigger>
                            <TabsTrigger value="transparent" className="text-xs h-6">None</TabsTrigger>
                        </TabsList>
                        <TabsContent value="color" className="mt-4">
                            <ColorInput
                                label=""
                                value={pageDetails.backgroundColor}
                                onChange={(v) => updatePageDetails({ backgroundColor: v })}
                                onBlur={commitHistory}
                            />
                        </TabsContent>
                         <TabsContent value="gradient" className="mt-4 space-y-4">
                            <GradientSlider 
                                stops={pageDetails.gradientStops} 
                                onStopsChange={(stops) => updatePageDetails({ gradientStops: stops })}
                                onCommit={commitHistory}
                            />
                             <SliderWithLabel
                                label="Angle"
                                value={pageDetails.gradientAngle || 90}
                                min={0} max={360} unit="°"
                                onChange={(v) => updatePageDetails({ gradientAngle: v })}
                                onCommit={commitHistory}
                            />
                        </TabsContent>
                         <TabsContent value="transparent" className="mt-4">
                            <div className="text-sm text-center text-muted-foreground p-2 border rounded-md">
                                Background is transparent.
                            </div>
                        </TabsContent>
                    </Tabs>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="background-image">
                 <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                   Background Image
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-4">
                    <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={bgInputRef}
                        onChange={handleImageUpload}
                    />

                    {bg.image ? (
                        <>
                            <div
                                className="relative w-full h-24 bg-gray-100 rounded-md overflow-hidden"
                                style={{
                                    backgroundImage: `url(${bg.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => bgInputRef.current?.click()}
                                >
                                    Change
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1"
                                    onClick={removeBackgroundImage}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                </Button>
                            </div>

                            <Separator />

                            <div className="space-y-1.5">
                                <Label className="text-xs">Image Fit</Label>
                                <Select
                                    value={bg.objectFit}
                                    onValueChange={(v) => {
                                        updatePageBackground({ objectFit: v as 'cover' | 'contain' | 'fill' | 'none' });
                                        commitHistory();
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cover">Cover (fill & crop)</SelectItem>
                                        <SelectItem value="contain">Contain (fit inside)</SelectItem>
                                        <SelectItem value="fill">Stretch to fill</SelectItem>
                                        <SelectItem value="none">Original size</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button variant="outline" size="sm" className="w-full" onClick={resetPosition}>
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset Position & Scale
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                Double-click background on canvas to reposition
                            </p>

                            <Separator />

                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-medium">Image Effects</Label>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetEffects}>
                                    Reset
                                </Button>
                            </div>
                            
                            <SliderWithLabel label="Opacity" value={Math.round(bg.opacity * 100)} min={0} max={100} unit="%" onChange={(v) => updatePageBackground({ opacity: v / 100 })} onCommit={commitHistory} />
                            <SliderWithLabel label="Blur" value={bg.blur} min={0} max={20} unit="px" onChange={(v) => updatePageBackground({ blur: v })} onCommit={commitHistory} />
                            <SliderWithLabel label="Grayscale" value={bg.grayscale} min={0} max={100} unit="%" onChange={(v) => updatePageBackground({ grayscale: v })} onCommit={commitHistory} />
                            <SliderWithLabel label="Brightness" value={bg.brightness} min={0} max={200} unit="%" onChange={(v) => updatePageBackground({ brightness: v })} onCommit={commitHistory} />
                            <SliderWithLabel label="Contrast" value={bg.contrast} min={0} max={200} unit="%" onChange={(v) => updatePageBackground({ contrast: v })} onCommit={commitHistory} />
                            <SliderWithLabel label="Saturate" value={bg.saturate} min={0} max={200} unit="%" onChange={(v) => updatePageBackground({ saturate: v })} onCommit={commitHistory} />
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => bgInputRef.current?.click()}
                        >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Upload Background Image
                        </Button>
                    )}
                </AccordionContent>
            </AccordionItem>
        </>
    );
};
