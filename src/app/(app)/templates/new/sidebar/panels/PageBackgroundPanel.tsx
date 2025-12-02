'use client';

import React, { useRef } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { UploadCloud, Trash2, RotateCcw } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ColorInput, SliderWithLabel } from '../components';

export const PageBackgroundPanel = () => {
    const { pageDetails, updatePageDetails, updatePageBackground, commitHistory } = useCanvasStore();
    const bgInputRef = useRef<HTMLInputElement>(null);
    const bg = pageDetails.background;

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

    return (
        <AccordionItem value="background">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Background
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                <ColorInput
                    label="Background Color"
                    value={pageDetails.backgroundColor}
                    onChange={(v) => updatePageDetails({ backgroundColor: v })}
                    onBlur={commitHistory}
                />

                <Separator />

                <div className="space-y-3">
                    <Label className="text-xs font-medium">Background Image</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={bgInputRef}
                        onChange={handleImageUpload}
                    />

                    {bg.image ? (
                        <>
                            {/* Preview */}
                            <div
                                className="relative w-full h-24 bg-gray-100 rounded-md overflow-hidden"
                                style={{
                                    backgroundImage: `url(${bg.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    opacity: bg.opacity,
                                    filter: `blur(${bg.blur}px) grayscale(${bg.grayscale}%) brightness(${bg.brightness}%) contrast(${bg.contrast}%) saturate(${bg.saturate}%)`,
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

                            {/* Image Fit */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Image Fit</Label>
                                <Select
                                    value={bg.objectFit}
                                    onValueChange={(v) => {
                                        updatePageBackground({ objectFit: v as 'cover' | 'contain' | 'fill' | 'none' });
                                        commitHistory();
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cover">Cover (fill & crop)</SelectItem>
                                        <SelectItem value="contain">Contain (fit inside)</SelectItem>
                                        <SelectItem value="fill">Stretch to fill</SelectItem>
                                        <SelectItem value="none">Original size</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Position */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Position</Label>
                                <Select
                                    value={bg.objectPosition}
                                    onValueChange={(v) => {
                                        updatePageBackground({ objectPosition: v });
                                        commitHistory();
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="center center">Center</SelectItem>
                                        <SelectItem value="top center">Top</SelectItem>
                                        <SelectItem value="bottom center">Bottom</SelectItem>
                                        <SelectItem value="left center">Left</SelectItem>
                                        <SelectItem value="right center">Right</SelectItem>
                                        <SelectItem value="top left">Top Left</SelectItem>
                                        <SelectItem value="top right">Top Right</SelectItem>
                                        <SelectItem value="bottom left">Bottom Left</SelectItem>
                                        <SelectItem value="bottom right">Bottom Right</SelectItem>
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

                            {/* Effects */}
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-medium">Image Effects</Label>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetEffects}>
                                    Reset
                                </Button>
                            </div>

                            <SliderWithLabel
                                label="Opacity"
                                value={Math.round(bg.opacity * 100)}
                                min={0}
                                max={100}
                                unit="%"
                                onChange={(v) => updatePageBackground({ opacity: v / 100 })}
                                onCommit={commitHistory}
                            />

                            <SliderWithLabel
                                label="Blur"
                                value={bg.blur}
                                min={0}
                                max={20}
                                unit="px"
                                onChange={(v) => updatePageBackground({ blur: v })}
                                onCommit={commitHistory}
                            />

                            <SliderWithLabel
                                label="Brightness"
                                value={bg.brightness}
                                min={0}
                                max={200}
                                unit="%"
                                onChange={(v) => updatePageBackground({ brightness: v })}
                                onCommit={commitHistory}
                            />

                            <SliderWithLabel
                                label="Contrast"
                                value={bg.contrast}
                                min={0}
                                max={200}
                                unit="%"
                                onChange={(v) => updatePageBackground({ contrast: v })}
                                onCommit={commitHistory}
                            />

                            <SliderWithLabel
                                label="Saturation"
                                value={bg.saturate}
                                min={0}
                                max={200}
                                unit="%"
                                onChange={(v) => updatePageBackground({ saturate: v })}
                                onCommit={commitHistory}
                            />

                            <SliderWithLabel
                                label="Grayscale"
                                value={bg.grayscale}
                                min={0}
                                max={100}
                                unit="%"
                                onChange={(v) => updatePageBackground({ grayscale: v })}
                                onCommit={commitHistory}
                            />
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => bgInputRef.current?.click()}
                        >
                            <UploadCloud className="h-4 w-4 mr-2" />
                            Upload Image
                        </Button>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
