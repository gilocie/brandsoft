'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCanvasStore, type Page, type PageDetails } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, Image as ImageIcon, BookOpen, Newspaper, Contact, Bookmark, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ColorInput } from './sidebar/components/ColorInput';

const iconMap: { [key: string]: React.ElementType } = {
    File,
    ImageIcon,
    BookOpen,
    Newspaper,
    Contact,
    Bookmark,
};

const presets = [
    { name: 'Letter', width: 8.5, height: 11, unit: 'in', icon: 'File' },
    { name: 'A4', width: 21, height: 29.7, unit: 'cm', icon: 'File' },
    { name: 'HD', width: 1920, height: 1080, unit: 'px', icon: 'ImageIcon' },
    { name: 'Social', width: 1080, height: 1080, unit: 'px', icon: 'Newspaper' },
    { name: 'ID Card', width: 3.375, height: 2.125, unit: 'in', icon: 'Contact' },
    { name: 'Book', width: 6, height: 9, unit: 'in', icon: 'BookOpen' },
];

type CustomPreset = {
    name: string;
    width: number;
    height: number;
    unit: 'in' | 'px' | 'cm';
    icon: string;
    ppi: number;
    colorMode: 'RGB' | 'CMYK' | 'Grayscale';
    bitDepth: '8' | '16' | '32';
    backgroundType: 'color' | 'transparent' | 'gradient';
    backgroundColor: string;
    gradientStart?: string;
    gradientEnd?: string;
    gradientAngle?: number;
};

const newPageSchema = z.object({
  name: z.string().min(1, "Page name is required"),
  width: z.coerce.number().min(0.1, "Width must be positive"),
  height: z.coerce.number().min(0.1, "Height must be positive"),
  unit: z.enum(['in', 'px', 'cm']),
  orientation: z.enum(['portrait', 'landscape']),
  ppi: z.coerce.number().min(1).max(5000),
  backgroundType: z.enum(['color', 'transparent', 'gradient']),
  backgroundColor: z.string(),
  gradientStart: z.string().optional(),
  gradientEnd: z.string().optional(),
  gradientAngle: z.coerce.number().optional(),
  colorMode: z.enum(['RGB', 'CMYK', 'Grayscale']),
  bitDepth: z.enum(['8', '16', '32']),
});

type NewPageFormData = z.infer<typeof newPageSchema>;

interface NewPageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const useLocalStorage = <T,>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) { console.log(error); }
    };
    return [storedValue, setValue] as const;
};

const NewPageDialog = ({ isOpen, onClose }: NewPageDialogProps) => {
    const { setPages, setNewPageDialogOpen } = useCanvasStore();
    const { toast } = useToast();
    const [activePreset, setActivePreset] = useState<string | null>('Letter');
    const [customPresets, setCustomPresets] = useLocalStorage<CustomPreset[]>('custom-doc-presets', []);

    const form = useForm<NewPageFormData>({
        resolver: zodResolver(newPageSchema),
        defaultValues: {
            name: 'Untitled-1',
            width: 8.5,
            height: 11,
            unit: 'in',
            orientation: 'portrait',
            ppi: 300,
            backgroundType: 'color',
            backgroundColor: '#FFFFFF',
            gradientStart: '#FFFFFF',
            gradientEnd: '#000000',
            gradientAngle: 90,
            colorMode: 'RGB',
            bitDepth: '8',
        },
    });

    const watchedBgType = form.watch('backgroundType');
    const watchedGradientStart = form.watch('gradientStart');
    const watchedGradientEnd = form.watch('gradientEnd');

    const handlePresetSelect = (preset: Partial<CustomPreset>) => {
        setActivePreset(preset.name || null);
        const { ppi, colorMode, bitDepth, backgroundType, backgroundColor, gradientStart, gradientEnd, gradientAngle } = form.getValues();
        
        const newWidth = preset.width || 8.5;
        const newHeight = preset.height || 11;
        
        form.reset({
            name: preset.name || 'Untitled-1',
            width: newWidth,
            height: newHeight,
            unit: preset.unit || 'in',
            orientation: newHeight > newWidth ? 'portrait' : 'landscape',
            ppi: preset.ppi || ppi,
            colorMode: preset.colorMode || colorMode,
            bitDepth: preset.bitDepth || bitDepth,
            backgroundType: preset.backgroundType || backgroundType,
            backgroundColor: preset.backgroundColor || backgroundColor,
            gradientStart: preset.gradientStart || gradientStart,
            gradientEnd: preset.gradientEnd || gradientEnd,
            gradientAngle: preset.gradientAngle || gradientAngle,
        });
    };
    
    const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
        const { width, height } = form.getValues();
        const currentIsPortrait = height > width;
        const newIsPortrait = orientation === 'portrait';
        
        if (currentIsPortrait !== newIsPortrait) {
            form.setValue('width', height);
            form.setValue('height', width);
        }
        form.setValue('orientation', orientation);
    };

    const handleSavePreset = () => {
        const data = form.getValues();
        if (!data.name || !data.width || !data.height || !data.unit) {
            toast({
                variant: 'destructive',
                title: 'Cannot Save Preset',
                description: 'Please provide a name and dimensions for your preset.',
            });
            return;
        }
        
        const newPreset: CustomPreset = { 
            name: data.name, width: data.width, height: data.height, unit: data.unit, icon: 'Bookmark',
            ppi: data.ppi, colorMode: data.colorMode, bitDepth: data.bitDepth,
            backgroundType: data.backgroundType, backgroundColor: data.backgroundColor,
            gradientStart: data.gradientStart, gradientEnd: data.gradientEnd, gradientAngle: data.gradientAngle,
        };
        
        setCustomPresets(prev => {
            const existing = prev.find(p => p.name.toLowerCase() === data.name.toLowerCase());
            if (existing) {
                return prev.map(p => p.name.toLowerCase() === data.name.toLowerCase() ? newPreset : p);
            }
            return [...prev, newPreset];
        });

        toast({
            title: 'Preset Saved!',
            description: `"${data.name}" has been saved to your custom presets.`,
        });
    };
    
    const handleDeletePreset = (presetName: string) => {
        setCustomPresets(prev => prev.filter(p => p.name !== presetName));
        toast({
            title: 'Preset Deleted',
            description: `"${presetName}" has been removed.`,
        });
    };

    const getBackgroundValue = (data: NewPageFormData) => {
        if (data.backgroundType === 'transparent') {
            return 'transparent';
        } else if (data.backgroundType === 'gradient') {
            return `linear-gradient(${data.gradientAngle}deg, ${data.gradientStart}, ${data.gradientEnd})`;
        }
        return data.backgroundColor;
    };

    const onSubmit = (data: NewPageFormData) => {
        const newPageDetails: PageDetails = {
            width: data.width,
            height: data.height,
            unit: data.unit,
            ppi: data.ppi,
            orientation: data.orientation,
            colorMode: data.colorMode,
            bitDepth: data.bitDepth,
            backgroundType: data.backgroundType,
            backgroundColor: getBackgroundValue(data),
            gradientStart: data.gradientStart,
            gradientEnd: data.gradientEnd,
            gradientAngle: data.gradientAngle,
            background: {
                image: undefined,
                opacity: 1, blur: 0, grayscale: 0, brightness: 100, contrast: 100, saturate: 100,
                objectFit: 'cover', objectPosition: 'center center', offsetX: 0, offsetY: 0, scale: 1,
            }
        };

        const newPage: Page = {
            id: `page-${Date.now()}`,
            name: data.name,
            elements: [],
            pageDetails: newPageDetails,
        };

        setPages([newPage]);
        setNewPageDialogOpen(false);
    };

    const PresetButton = ({ preset, isCustom }: { preset: Partial<CustomPreset>, isCustom: boolean }) => {
        const Icon = iconMap[preset.icon || 'File'] || File;
        const isSelected = activePreset === preset.name;
        
        return (
             <div className="relative group/preset">
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-md text-left",
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-muted"
                    )}
                    onClick={() => handlePresetSelect(preset)}
                >
                    <div className={cn(
                        "p-2 rounded-md bg-muted/50 border",
                        isSelected && "bg-primary/20 border-primary/30"
                    )}>
                        <Icon className={cn(
                            "h-5 w-5 shrink-0 text-muted-foreground",
                            isSelected && "text-primary"
                        )} />
                    </div>
                    <div>
                        <p className="text-sm">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">{preset.width}{preset.unit} x {preset.height}{preset.unit}</p>
                    </div>
                </button>
                {isCustom && preset.name && (
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/preset:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.name!); }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>
        );
    }

    const getResolution = () => {
        const { width, height, unit, ppi } = form.watch();
        if (!width || !height || !ppi) return '...';
        if (unit === 'px') {
            return `${Math.round(width)} x ${Math.round(height)} px`;
        }
        
        let pxWidth = 0;
        let pxHeight = 0;
        
        if (unit === 'in') {
            pxWidth = Math.round(width * ppi);
            pxHeight = Math.round(height * ppi);
        } else if (unit === 'cm') {
            const inches = width / 2.54;
            const inchesHeight = height / 2.54;
            pxWidth = Math.round(inches * ppi);
            pxHeight = Math.round(inchesHeight * ppi);
        }
        
        return `${pxWidth} x ${pxHeight} px @ ${ppi} PPI`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 flex flex-col max-h-[90vh] h-[600px]">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
                        <div className="border-b px-6 py-4 shrink-0">
                            <DialogTitle>New Document</DialogTitle>
                            <DialogDescription>
                                Create a new page by selecting a preset or defining custom dimensions.
                            </DialogDescription>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden min-h-0">
                            {/* Left Column (Presets) */}
                            <div className="col-span-1 border-r flex flex-col overflow-hidden">
                                <ScrollArea className="flex-1">
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">Presets</h3>
                                            <div className="space-y-1">
                                                {presets.map((p) => <PresetButton key={p.name} preset={p as CustomPreset} isCustom={false} />)}
                                            </div>
                                        </div>
                                        {customPresets.length > 0 && (
                                            <div>
                                                <Separator className="my-2" />
                                                <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">Custom</h3>
                                                <div className="space-y-1">
                                                    {customPresets.map((p) => <PresetButton key={p.name} preset={p} isCustom={true} />)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                            
                            {/* Right Column (Properties) */}
                            <div className="col-span-2 flex flex-col overflow-hidden">
                                <ScrollArea className="flex-1">
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-end gap-2">
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem className="flex-grow"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <Button type="button" variant="outline" onClick={handleSavePreset}><Bookmark className="mr-2 h-4 w-4" /> Save</Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="width" render={({ field }) => (
                                                <FormItem><FormLabel>Width</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="height" render={({ field }) => (
                                                <FormItem><FormLabel>Height</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        
                                        <div className="flex items-end gap-4">
                                            <FormField control={form.control} name="unit" render={({ field }) => (
                                                <FormItem className="flex-grow"><FormLabel>Units</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="px">Pixels</SelectItem>
                                                            <SelectItem value="in">Inches</SelectItem>
                                                            <SelectItem value="cm">Centimeters</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                <FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="orientation" render={({ field }) => (
                                                <FormItem><FormLabel>Orientation</FormLabel>
                                                <ToggleGroup type="single" value={field.value} onValueChange={(v) => {if(v) handleOrientationChange(v as 'portrait' | 'landscape')}} className="border rounded-md h-10 p-1 bg-muted">
                                                    <ToggleGroupItem value="portrait" className="h-full px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-sm">
                                                        <div className="w-3 h-4 border border-current rounded-sm" />
                                                    </ToggleGroupItem>
                                                    <ToggleGroupItem value="landscape" className="h-full px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-sm">
                                                        <div className="w-4 h-3 border border-current rounded-sm" />
                                                    </ToggleGroupItem>
                                                </ToggleGroup>
                                                <FormMessage /></FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <FormLabel>Resolution</FormLabel>
                                                <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md h-10 flex items-center">
                                                    {getResolution()}
                                                </div>
                                            </div>
                                            <FormField control={form.control} name="ppi" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>PPI/DPI</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="1" max="5000" step="1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="colorMode" render={({ field }) => (
                                                <FormItem><FormLabel>Color Mode</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="RGB">RGB Color</SelectItem>
                                                            <SelectItem value="CMYK">CMYK Color</SelectItem>
                                                            <SelectItem value="Grayscale">Grayscale</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                <FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="bitDepth" render={({ field }) => (
                                                <FormItem><FormLabel>Bit Depth</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="8">8 bit</SelectItem>
                                                            <SelectItem value="16">16 bit</SelectItem>
                                                            <SelectItem value="32">32 bit</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                <FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        
                                        <FormField control={form.control} name="backgroundType" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Background Contents</FormLabel>
                                                <Tabs value={field.value} onValueChange={(v) => v && field.onChange(v as any)} className="w-full">
                                                    <TabsList className="grid w-full grid-cols-3">
                                                        <TabsTrigger value="color">Color</TabsTrigger>
                                                        <TabsTrigger value="gradient">Gradient</TabsTrigger>
                                                        <TabsTrigger value="transparent">None</TabsTrigger>
                                                    </TabsList>
                                                    <TabsContent value="color" className="mt-4">
                                                        <FormField control={form.control} name="backgroundColor" render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <ColorInput label="" value={field.value} onChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )} />
                                                    </TabsContent>
                                                    <TabsContent value="transparent" className="mt-4">
                                                        <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                                                            Background will be transparent.
                                                        </div>
                                                    </TabsContent>
                                                    <TabsContent value="gradient" className="mt-4 space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="gradientStart" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Start Color</FormLabel>
                                                                    <FormControl>
                                                                        <ColorInput label="" value={field.value || '#FFFFFF'} onChange={field.onChange} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="gradientEnd" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>End Color</FormLabel>
                                                                    <FormControl>
                                                                        <ColorInput label="" value={field.value || '#000000'} onChange={field.onChange} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                        <FormField control={form.control} name="gradientAngle" render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Angle (degrees)</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" min="0" max="360" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )} />
                                                        <div className="h-16 rounded-md border" style={{
                                                            background: `linear-gradient(${form.watch('gradientAngle') || 90}deg, ${watchedGradientStart || '#FFFFFF'}, ${watchedGradientEnd || '#000000'})`
                                                        }} />
                                                    </TabsContent>
                                                </Tabs>
                                            </FormItem>
                                        )} />
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t shrink-0">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Create Document</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default NewPageDialog;
