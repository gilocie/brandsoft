
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCanvasStore, type Page, type PageDetails } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ColorInput } from './sidebar/components';
import { File, Image as ImageIcon, BookOpen, Newspaper, Contact, Bookmark, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';


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
};

const newPageSchema = z.object({
  name: z.string().min(1, "Page name is required"),
  width: z.coerce.number().min(0.1, "Width must be positive"),
  height: z.coerce.number().min(0.1, "Height must be positive"),
  unit: z.enum(['in', 'px', 'cm']),
  orientation: z.enum(['portrait', 'landscape']),
  backgroundColor: z.string(),
});

type NewPageFormData = z.infer<typeof newPageSchema>;

interface NewPageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const useLocalStorage = <T>(key: string, initialValue: T) => {
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
            backgroundColor: '#FFFFFF',
        },
    });

    const watchedBackgroundColor = form.watch('backgroundColor');

    const handlePresetSelect = (preset: CustomPreset) => {
        setActivePreset(preset.name);
        form.reset({
            ...form.getValues(),
            name: preset.name,
            width: preset.width,
            height: preset.height,
            unit: preset.unit,
            orientation: preset.width < preset.height ? 'portrait' : 'landscape',
        });
    };
    
    const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
        const { width, height } = form.getValues();
        const currentIsPortrait = width < height;
        const newIsPortrait = orientation === 'portrait';
        if (currentIsPortrait !== newIsPortrait) {
            form.setValue('width', height);
            form.setValue('height', width);
        }
        form.setValue('orientation', orientation);
    };

    const handleSavePreset = () => {
        const { name, width, height, unit } = form.getValues();
        if (!name || !width || !height || !unit) {
            toast({
                variant: 'destructive',
                title: 'Cannot Save Preset',
                description: 'Please provide a name and dimensions for your preset.',
            });
            return;
        }
        
        const newPreset: CustomPreset = { name, width, height, unit, icon: 'Bookmark' };
        
        setCustomPresets(prev => {
            const existing = prev.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                return prev.map(p => p.name.toLowerCase() === name.toLowerCase() ? newPreset : p);
            }
            return [...prev, newPreset];
        });

        toast({
            title: 'Preset Saved!',
            description: `"${name}" has been saved to your custom presets.`,
        });
    };
    
    const handleDeletePreset = (presetName: string) => {
        setCustomPresets(prev => prev.filter(p => p.name !== presetName));
        toast({
            title: 'Preset Deleted',
            description: `"${presetName}" has been removed.`,
        });
    };

    const onSubmit = (data: NewPageFormData) => {
        const newPageDetails: PageDetails = {
            width: data.width,
            height: data.height,
            unit: data.unit,
            backgroundColor: data.backgroundColor,
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

    const PresetButton = ({ preset, isCustom }: { preset: CustomPreset, isCustom: boolean }) => {
        const Icon = iconMap[preset.icon] || File;
        return (
             <div className="relative group/preset">
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-md text-left",
                        activePreset === preset.name ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                    )}
                    onClick={() => handlePresetSelect(preset)}
                >
                    <div className="p-2 rounded-md" style={{ backgroundColor: watchedBackgroundColor }}>
                        <Icon className="h-5 w-5 shrink-0" style={{ color: 'white' }} />
                    </div>
                    <div>
                        <p className="text-sm">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">{preset.width}{preset.unit} x {preset.height}{preset.unit}</p>
                    </div>
                </button>
                {isCustom && (
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/preset:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.name); }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>New Document</DialogTitle>
                    <DialogDescription>
                        Create a new page by selecting a preset or defining custom dimensions.
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex-1 flex flex-col min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-1 flex-grow min-h-0">
                            <div className="col-span-1 flex flex-col gap-4">
                                <h3 className="text-sm font-medium text-muted-foreground px-2 shrink-0">Presets</h3>
                                <ScrollArea className="flex-grow pr-4">
                                    <div className="space-y-1">
                                        {presets.map((p) => (
                                            <PresetButton key={p.name} preset={p as CustomPreset} isCustom={false} />
                                        ))}
                                    </div>
                                    {customPresets.length > 0 && (
                                        <>
                                            <Separator className="my-2" />
                                            <h3 className="text-sm font-medium text-muted-foreground px-2">Custom</h3>
                                            <div className="space-y-1">
                                                {customPresets.map((p) => (
                                                    <PresetButton key={p.name} preset={p} isCustom={true} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                     <Separator className="my-2" />
                                     <div className="shrink-0 pr-1 pb-4">
                                        <Controller
                                            control={form.control}
                                            name="backgroundColor"
                                            render={({ field }) => (
                                                <ColorInput
                                                    label="Background Color"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="col-span-2 space-y-4">
                                <div className="flex justify-between items-center gap-2">
                                    <FormField
                                        control={form.control} name="name" render={({ field }) => (
                                            <FormItem className="flex-grow"><FormLabel>Name</FormLabel><FormControl><Input {...field} className="text-lg font-semibold" /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="outline" size="sm" className="mt-7 shrink-0" onClick={handleSavePreset}>
                                        <Bookmark className="h-4 w-4 mr-2"/> Save
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="width" render={({ field }) => (
                                        <FormItem><FormLabel>Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="height" render={({ field }) => (
                                        <FormItem><FormLabel>Height</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                
                                <div className="flex items-end gap-2">
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
                                        <ToggleGroup type="single" value={field.value} onValueChange={(v) => {if(v) handleOrientationChange(v as 'portrait' | 'landscape')}} className="border rounded-md h-10 p-1">
                                            <ToggleGroupItem value="portrait" className="h-full px-2"><svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></ToggleGroupItem>
                                            <ToggleGroupItem value="landscape" className="h-full px-2"><svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22 17c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v0c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v0z" transform="rotate(-90 12 12)" /></svg></ToggleGroupItem>
                                        </ToggleGroup>
                                        <FormMessage /></FormItem>
                                    )} />
                                </div>

                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t shrink-0">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Create Document</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default NewPageDialog;

    