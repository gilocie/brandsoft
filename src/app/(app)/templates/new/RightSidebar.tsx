'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Trash2, UploadCloud, X, Copy, ChevronsUp, ChevronsDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Reusable Input Component
const InputWithLabel = ({ label, className, ...props }: { label: string; className?: string } & React.ComponentProps<typeof Input>) => (
    <div className={`flex items-center gap-2 px-1 ${className || ''}`}>
        <Label className="text-xs w-12 shrink-0">{label}</Label>
        <Input className="h-8 text-xs" {...props} />
    </div>
);

// Color Input Component
const ColorInput = ({ label, value, onChange, onBlur }: { label: string; value: string; onChange: (value: string) => void; onBlur?: () => void }) => (
    <div className="space-y-1 px-1">
        <Label className="text-xs">{label}</Label>
        <div className="flex gap-2">
            <Input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                className="w-10 h-8 p-1 cursor-pointer"
            />
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                className="flex-1 h-8 text-xs"
            />
        </div>
    </div>
);

// Slider with Label Component
const SliderWithLabel = ({ label, value, min, max, step = 1, unit = '', onChange, onCommit }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
    onCommit?: () => void;
}) => (
    <div className="space-y-2 px-1">
        <div className="flex justify-between">
            <Label className="text-xs">{label}</Label>
            <span className="text-xs text-muted-foreground">{value}{unit}</span>
        </div>
        <Slider
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={([v]) => onChange(v)}
            onValueCommit={onCommit ? () => onCommit() : undefined}
        />
    </div>
);

// Actions Panel for selected element
const ActionsPanel = () => {
    const { selectedElementId, deleteElement, duplicateElement, bringToFront, sendToBack, bringForward, sendBackward } = useCanvasStore();

    if (!selectedElementId) return null;

    return (
        <div className="px-4 py-2">
            <Label className="text-xs font-medium mb-2 block">Quick Actions</Label>
            <div className="flex gap-1 flex-wrap">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => duplicateElement(selectedElementId)}
                    title="Duplicate"
                >
                    <Copy className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => bringToFront(selectedElementId)}
                    title="Bring to Front"
                >
                    <ChevronsUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => bringForward(selectedElementId)}
                    title="Bring Forward"
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => sendBackward(selectedElementId)}
                    title="Send Backward"
                >
                    <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => sendToBack(selectedElementId)}
                    title="Send to Back"
                >
                    <ChevronsDown className="h-4 w-4" />
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteElement(selectedElementId)}
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

// Position Panel
const PositionPanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId);

    if (!element) return null;

    const handleChange = (prop: 'x' | 'y' | 'width' | 'height' | 'rotation', value: string) => {
        const numValue = Number(value);
        if (prop === 'width' || prop === 'height') {
            updateElement(element.id, { [prop]: Math.max(20, numValue) });
        } else {
            updateElement(element.id, { [prop]: numValue });
        }
    };

    const handleCommit = () => {
        commitHistory();
    };

    const resetRotation = () => {
        updateElement(element.id, { rotation: 0 });
        commitHistory();
    };

    return (
        <AccordionItem value="position">
            <AccordionTrigger className="text-xs font-medium">Transform</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                    <InputWithLabel label="X" type="number" value={element.x.toFixed(0)} onChange={e => handleChange('x', e.target.value)} onBlur={handleCommit} />
                    <InputWithLabel label="Y" type="number" value={element.y.toFixed(0)} onChange={e => handleChange('y', e.target.value)} onBlur={handleCommit} />
                    <InputWithLabel label="W" type="number" value={element.width.toFixed(0)} onChange={e => handleChange('width', e.target.value)} onBlur={handleCommit} />
                    <InputWithLabel label="H" type="number" value={element.height.toFixed(0)} onChange={e => handleChange('height', e.target.value)} onBlur={handleCommit} />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <InputWithLabel label="Angle" type="number" value={element.rotation.toFixed(0)} onChange={e => handleChange('rotation', e.target.value)} onBlur={handleCommit} />
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={resetRotation} title="Reset Rotation">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

// Opacity Panel
const OpacityPanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId);

    if (!element) return null;

    const handlePropChange = (prop: string, value: any) => {
        updateElement(element.id, { props: { ...element.props, [prop]: value } });
    };

    return (
        <AccordionItem value="opacity">
            <AccordionTrigger className="text-xs font-medium">Opacity</AccordionTrigger>
            <AccordionContent className="pt-2">
                <SliderWithLabel
                    label="Opacity"
                    value={Math.round((element.props.opacity ?? 1) * 100)}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => handlePropChange('opacity', v / 100)}
                    onCommit={commitHistory}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

// Shape Fill Panel
const ShapeFillPanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');

    if (!element) return null;

    const handlePropChange = (prop: string, value: any) => {
        updateElement(element.id, { props: { ...element.props, [prop]: value } });
    };

    return (
        <AccordionItem value="fill">
            <AccordionTrigger className="text-xs font-medium">Fill</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <ColorInput
                    label="Fill Color"
                    value={element.props.backgroundColor || '#cccccc'}
                    onChange={(v) => handlePropChange('backgroundColor', v)}
                    onBlur={commitHistory}
                />
                <SliderWithLabel
                    label="Fill Opacity"
                    value={Math.round((element.props.fillOpacity ?? 1) * 100)}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => handlePropChange('fillOpacity', v / 100)}
                    onCommit={commitHistory}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

// Shape Stroke/Border Panel
const ShapeStrokePanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');

    if (!element) return null;

    const handlePropChange = (prop: string, value: any) => {
        updateElement(element.id, { props: { ...element.props, [prop]: value } });
    };

    return (
        <AccordionItem value="stroke">
            <AccordionTrigger className="text-xs font-medium">Stroke / Border</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <ColorInput
                    label="Stroke Color"
                    value={element.props.borderColor || '#000000'}
                    onChange={(v) => handlePropChange('borderColor', v)}
                    onBlur={commitHistory}
                />
                <SliderWithLabel
                    label="Stroke Width"
                    value={element.props.borderWidth || 0}
                    min={0}
                    max={20}
                    unit="px"
                    onChange={(v) => handlePropChange('borderWidth', v)}
                    onCommit={commitHistory}
                />
                <div className="px-1">
                    <Label className="text-xs">Stroke Style</Label>
                    <Select
                        value={element.props.borderStyle || 'solid'}
                        onValueChange={(v) => {
                            handlePropChange('borderStyle', v);
                            commitHistory();
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs mt-1">
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
                <InputWithLabel
                    label="Radius"
                    value={element.props.borderRadius || '0'}
                    onChange={(e) => handlePropChange('borderRadius', e.target.value)}
                    onBlur={commitHistory}
                    placeholder="e.g., 10px or 50%"
                />
            </AccordionContent>
        </AccordionItem>
    );
};

// Shape Shadow Panel
const ShapeShadowPanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');

    if (!element) return null;

    const handlePropChange = (prop: string, value: any) => {
        updateElement(element.id, { props: { ...element.props, [prop]: value } });
    };

    const clearShadow = () => {
        updateElement(element.id, {
            props: {
                ...element.props,
                shadowColor: undefined,
                shadowBlur: 0,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        });
        commitHistory();
    };

    return (
        <AccordionItem value="shadow">
            <AccordionTrigger className="text-xs font-medium">Shadow</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <ColorInput
                    label="Shadow Color"
                    value={element.props.shadowColor || '#000000'}
                    onChange={(v) => handlePropChange('shadowColor', v)}
                    onBlur={commitHistory}
                />
                <SliderWithLabel
                    label="Blur"
                    value={element.props.shadowBlur || 0}
                    min={0}
                    max={50}
                    unit="px"
                    onChange={(v) => handlePropChange('shadowBlur', v)}
                    onCommit={commitHistory}
                />
                <div className="grid grid-cols-2 gap-2">
                    <InputWithLabel
                        label="X"
                        type="number"
                        value={element.props.shadowOffsetX || 0}
                        onChange={(e) => handlePropChange('shadowOffsetX', Number(e.target.value))}
                        onBlur={commitHistory}
                    />
                    <InputWithLabel
                        label="Y"
                        type="number"
                        value={element.props.shadowOffsetY || 0}
                        onChange={(e) => handlePropChange('shadowOffsetY', Number(e.target.value))}
                        onBlur={commitHistory}
                    />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={clearShadow}>
                    Clear Shadow
                </Button>
            </AccordionContent>
        </AccordionItem>
    );
};

// Shape Effects Panel (Blur)
const ShapeEffectsPanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'shape');

    if (!element) return null;

    const handlePropChange = (prop: string, value: any) => {
        updateElement(element.id, { props: { ...element.props, [prop]: value } });
    };

    return (
        <AccordionItem value="effects">
            <AccordionTrigger className="text-xs font-medium">Effects</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <SliderWithLabel
                    label="Blur"
                    value={element.props.blur || 0}
                    min={0}
                    max={20}
                    unit="px"
                    onChange={(v) => handlePropChange('blur', v)}
                    onCommit={commitHistory}
                />
            </AccordionContent>
        </AccordionItem>
    );
};

// Text Style Panel
const TextPanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'text');

    if (!element) return null;

    const handlePropChange = (prop: string, value: any) => {
        updateElement(element.id, { props: { ...element.props, [prop]: value } });
    };

    return (
        <>
            <AccordionItem value="text-content">
                <AccordionTrigger className="text-xs font-medium">Content</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                    <div className="px-1">
                        <Label className="text-xs">Text</Label>
                        <Input
                            value={element.props.text || ''}
                            onChange={(e) => handlePropChange('text', e.target.value)}
                            onBlur={commitHistory}
                            className="h-8 text-xs mt-1"
                            placeholder="Enter text..."
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="text-style">
                <AccordionTrigger className="text-xs font-medium">Text Style</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                    <SliderWithLabel
                        label="Font Size"
                        value={element.props.fontSize || 14}
                        min={8}
                        max={200}
                        unit="px"
                        onChange={(v) => handlePropChange('fontSize', v)}
                        onCommit={commitHistory}
                    />
                    <ColorInput
                        label="Text Color"
                        value={element.props.color || '#000000'}
                        onChange={(v) => handlePropChange('color', v)}
                        onBlur={commitHistory}
                    />
                    <div className="px-1">
                        <Label className="text-xs">Font Family</Label>
                        <Select
                            value={element.props.fontFamily || 'Arial'}
                            onValueChange={(v) => {
                                handlePropChange('fontFamily', v);
                                commitHistory();
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Helvetica">Helvetica</SelectItem>
                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                                <SelectItem value="Courier New">Courier New</SelectItem>
                                <SelectItem value="Verdana">Verdana</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="px-1">
                        <Label className="text-xs">Font Weight</Label>
                        <Select
                            value={String(element.props.fontWeight || 400)}
                            onValueChange={(v) => {
                                handlePropChange('fontWeight', Number(v));
                                commitHistory();
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="300">Light</SelectItem>
                                <SelectItem value="400">Regular</SelectItem>
                                <SelectItem value="500">Medium</SelectItem>
                                <SelectItem value="600">Semi Bold</SelectItem>
                                <SelectItem value="700">Bold</SelectItem>
                                <SelectItem value="800">Extra Bold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="px-1">
                        <Label className="text-xs">Text Align</Label>
                        <Select
                            value={element.props.textAlign || 'center'}
                            onValueChange={(v) => {
                                handlePropChange('textAlign', v);
                                commitHistory();
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </>
    );
};

// Page Dimensions Panel
const PageDimensionsPanel = () => {
    const { pageDetails, updatePageDetails, commitHistory } = useCanvasStore();

    const handlePageDetailChange = (prop: keyof typeof pageDetails, value: any) => {
        updatePageDetails({ [prop]: value });
    };

    return (
        <AccordionItem value="dimensions">
            <AccordionTrigger className="text-xs font-medium">Dimensions</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                    <InputWithLabel label="W" type="number" value={pageDetails.width} onChange={e => handlePageDetailChange('width', Number(e.target.value))} onBlur={commitHistory} />
                    <InputWithLabel label="H" type="number" value={pageDetails.height} onChange={e => handlePageDetailChange('height', Number(e.target.value))} onBlur={commitHistory} />
                </div>
                <div className="px-1">
                    <Label className="text-xs">Units</Label>
                    <Select value={pageDetails.unit} onValueChange={(value) => { handlePageDetailChange('unit', value); commitHistory(); }}>
                        <SelectTrigger className="h-8 text-xs mt-1">
                            <SelectValue placeholder="Select unit" />
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

// Page Background Panel with Image Effects
const PageBackgroundPanel = () => {
    const { pageDetails, updatePageDetails, updatePageBackground, commitHistory } = useCanvasStore();
    const bgInputRef = React.useRef<HTMLInputElement>(null);
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
        updatePageBackground({ image: undefined });
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

    return (
        <AccordionItem value="background">
            <AccordionTrigger className="text-xs font-medium">Background</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <ColorInput
                    label="Background Color"
                    value={pageDetails.backgroundColor}
                    onChange={(v) => updatePageDetails({ backgroundColor: v })}
                    onBlur={commitHistory}
                />

                <Separator />

                <div className="space-y-3">
                    <Label className="text-xs font-medium">Background Image</Label>
                    <Input type="file" accept="image/*" className="hidden" ref={bgInputRef} onChange={handleImageUpload} />

                    {bg.image ? (
                        <div className="space-y-3">
                            {/* Image Preview */}
                            <div className="relative w-full h-24 bg-gray-100 rounded-md overflow-hidden">
                                <img
                                    src={bg.image}
                                    alt="Background preview"
                                    className="w-full h-full object-cover"
                                    style={{
                                        opacity: bg.opacity,
                                        filter: `blur(${bg.blur}px) grayscale(${bg.grayscale}%) brightness(${bg.brightness}%) contrast(${bg.contrast}%) saturate(${bg.saturate}%)`
                                    }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => bgInputRef.current?.click()}>
                                    Change
                                </Button>
                                <Button variant="destructive" size="sm" className="flex-1" onClick={removeBackgroundImage}>
                                    Remove
                                </Button>
                            </div>

                            <Separator />

                            {/* Image Fit Options */}
                            <div className="px-1">
                                <Label className="text-xs">Image Fit</Label>
                                <Select
                                    value={bg.objectFit}
                                    onValueChange={(v: 'cover' | 'contain' | 'fill' | 'none') => {
                                        updatePageBackground({ objectFit: v });
                                        commitHistory();
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs mt-1">
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

                            {/* Image Position */}
                            <div className="px-1">
                                <Label className="text-xs">Position</Label>
                                <Select
                                    value={bg.objectPosition}
                                    onValueChange={(v) => {
                                        updatePageBackground({ objectPosition: v });
                                        commitHistory();
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs mt-1">
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

                            <Separator />

                            {/* Image Effects */}
                            <div className="space-y-3">
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
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => bgInputRef.current?.click()}>
                            <UploadCloud className="mr-2 h-4 w-4" /> Upload Image
                        </Button>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

// Element Properties Content
const ElementPropertiesContent = () => {
    const { selectedElementId, elements } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId);

    if (!element) return null;

    return (
        <div className="space-y-2">
            <ActionsPanel />
            <Separator />
            <Accordion type="multiple" defaultValue={['position', 'opacity', 'fill', 'stroke', 'text-style']} className="w-full px-2">
                <PositionPanel />
                <OpacityPanel />

                {/* Shape-specific panels */}
                {element.type === 'shape' && (
                    <>
                        <ShapeFillPanel />
                        <ShapeStrokePanel />
                        <ShapeShadowPanel />
                        <ShapeEffectsPanel />
                    </>
                )}

                {/* Text-specific panels */}
                {element.type === 'text' && (
                    <TextPanel />
                )}
            </Accordion>
        </div>
    );
};

// Page Properties Content
const PagePropertiesContent = () => {
    return (
        <div className="py-2">
            <p className="text-sm font-medium px-4 mb-2">Page Properties</p>
            <Accordion type="multiple" defaultValue={['dimensions', 'background']} className="w-full px-2">
                <PageDimensionsPanel />
                <PageBackgroundPanel />
            </Accordion>
        </div>
    );
};

interface RightSidebarProps {
    onCollapse: () => void;
    position: { x: number; y: number };
    setPosition: (position: { x: number; y: number }) => void;
}

const RightSidebar = ({ onCollapse, position, setPosition }: RightSidebarProps) => {
    const { selectedElementId, elements } = useCanvasStore();
    const selectedElement = elements.find(el => el.id === selectedElementId);

    const dragStartPos = React.useRef({ x: 0, y: 0 });
    const panelStartPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        panelStartPos.current = position;
        e.preventDefault();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - dragStartPos.current.x;
            const dy = moveEvent.clientY - dragStartPos.current.y;
            setPosition({
                x: panelStartPos.current.x - dx,
                y: panelStartPos.current.y + dy,
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <Card
            className="absolute w-72 z-20 h-[75vh] flex flex-col"
            style={{ top: position.y, right: position.x }}
        >
            <div
                className="p-2 border-b flex items-center justify-between bg-primary rounded-t-lg cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <span className="text-sm font-medium text-primary-foreground pl-2">
                    {selectedElement ? `${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties` : 'Properties'}
                </span>
                <Button variant="ghost" size="icon" onClick={onCollapse} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground cursor-pointer h-7 w-7">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-grow">
                <Tabs defaultValue={selectedElementId ? "element" : "page"} className="w-full">
                    <TabsList className="w-full rounded-none border-b">
                        <TabsTrigger value="element" className="flex-1 text-xs" disabled={!selectedElementId}>
                            Element
                        </TabsTrigger>
                        <TabsTrigger value="page" className="flex-1 text-xs">
                            Page
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="element" className="mt-0">
                        {selectedElementId ? (
                            <ElementPropertiesContent />
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Select an element to edit its properties
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="page" className="mt-0">
                        <PagePropertiesContent />
                    </TabsContent>
                </Tabs>
            </ScrollArea>
        </Card>
    );
};

export default RightSidebar;