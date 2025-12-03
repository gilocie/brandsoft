
'use client';

import React, { useState } from 'react';
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
import { File, Image, BookOpen, Newspaper, Contact } from 'lucide-react';
import { cn } from '@/lib/utils';

const presets = [
    { name: 'Letter', width: 8.5, height: 11, unit: 'in', icon: File },
    { name: 'A4', width: 21, height: 29.7, unit: 'cm', icon: File },
    { name: 'HD', width: 1920, height: 1080, unit: 'px', icon: Image },
    { name: 'Social', width: 1080, height: 1080, unit: 'px', icon: Newspaper },
    { name: 'ID Card', width: 3.375, height: 2.125, unit: 'in', icon: Contact },
    { name: 'Book', width: 6, height: 9, unit: 'in', icon: BookOpen },
];

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

const NewPageDialog = ({ isOpen, onClose }: NewPageDialogProps) => {
    const { setPages, setNewPageDialogOpen } = useCanvasStore();
    const [activePreset, setActivePreset] = useState<string | null>('Letter');

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

    const handlePresetSelect = (presetName: string) => {
        const preset = presets.find(p => p.name === presetName);
        if (preset) {
            setActivePreset(preset.name);
            form.reset({
                ...form.getValues(),
                width: preset.width,
                height: preset.height,
                unit: preset.unit as 'in' | 'px' | 'cm',
                orientation: preset.width < preset.height ? 'portrait' : 'landscape',
            });
        }
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>New Document</DialogTitle>
                    <DialogDescription>
                        Create a new page by selecting a preset or defining custom dimensions.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                            {/* Presets */}
                            <div className="col-span-1 space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Presets</h3>
                                <div className="space-y-1">
                                    {presets.map((p) => (
                                        <button
                                            key={p.name}
                                            type="button"
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-md text-left",
                                                activePreset === p.name ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                                            )}
                                            onClick={() => handlePresetSelect(p.name)}
                                        >
                                            <p.icon className="h-5 w-5 shrink-0" />
                                            <div>
                                                <p className="text-sm">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.width}{p.unit} x {p.height}{p.unit}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="col-span-2 space-y-4">
                                 <FormField
                                    control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} className="text-lg font-semibold" /></FormControl><FormMessage /></FormItem>
                                    )}
                                />

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
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default NewPageDialog;
