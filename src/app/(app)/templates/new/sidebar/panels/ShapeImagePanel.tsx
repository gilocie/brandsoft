'use client';

import React, { useRef } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Trash2 } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SliderWithLabel } from '../components';

export const ShapeImagePanel = () => {
    const { selectedElementId, elements, updateElementProps, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!element) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updateElementProps(element.id, {
                    shapeImage: event.target?.result as string,
                    shapeImageScale: 1,
                    shapeImageOffsetX: 0,
                    shapeImageOffsetY: 0,
                    shapeImageFit: 'cover',
                });
                commitHistory();
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        updateElementProps(element.id, {
            shapeImage: undefined,
            shapeImageScale: undefined,
            shapeImageOffsetX: undefined,
            shapeImageOffsetY: undefined,
            shapeImageFit: undefined,
        });
        commitHistory();
    };

    const resetPosition = () => {
        updateElementProps(element.id, {
            shapeImageOffsetX: 0,
            shapeImageOffsetY: 0,
            shapeImageScale: 1,
        });
        commitHistory();
    };

    return (
        <AccordionItem value="shape-image">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                Shape Image
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageUpload}
                />

                {element.props.shapeImage ? (
                    <>
                        {/* Preview */}
                        <div className="relative w-full h-20 bg-gray-100 rounded-md overflow-hidden">
                            <img
                                src={element.props.shapeImage}
                                alt="Shape image preview"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImagePlus className="h-3 w-3 mr-1" />
                                Replace
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                onClick={removeImage}
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                            </Button>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Image Fit</Label>
                            <Select
                                value={element.props.shapeImageFit || 'cover'}
                                onValueChange={(v) => {
                                    updateElementProps(element.id, { shapeImageFit: v as 'cover' | 'contain' | 'fill' });
                                    commitHistory();
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cover">Cover</SelectItem>
                                    <SelectItem value="contain">Contain</SelectItem>
                                    <SelectItem value="fill">Stretch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <SliderWithLabel
                            label="Scale"
                            value={Math.round((element.props.shapeImageScale || 1) * 100)}
                            min={50}
                            max={200}
                            unit="%"
                            onChange={(v) => updateElementProps(element.id, { shapeImageScale: v / 100 })}
                            onCommit={commitHistory}
                        />

                        <Button variant="outline" size="sm" className="w-full" onClick={resetPosition}>
                            Reset Position & Scale
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                            Double-click image on canvas to reposition
                        </p>
                    </>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Add Image to Shape
                    </Button>
                )}
            </AccordionContent>
        </AccordionItem>
    );
};
