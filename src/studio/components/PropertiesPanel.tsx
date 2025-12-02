
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import React, from 'react';
import { useCanvas } from '../hooks/useCanvas';

const PropertiesSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

export default function PropertiesPanel() {
    const { elements, selectedElementId, updateElement } = useCanvas();
    const selectedElement = elements.find(el => el.id === selectedElementId);

    const handlePropertyChange = (property: string, value: string | number) => {
        if (selectedElementId) {
            updateElement(selectedElementId, { [property]: value });
        }
    };
    
    return (
        <aside className="w-[200px] flex-shrink-0 border-l bg-background p-4 overflow-y-auto">
            {selectedElement ? (
                <div className="space-y-6">
                    <PropertiesSection title="Position">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="pos-x" className="text-xs text-muted-foreground">X</Label>
                                <Input id="pos-x" type="number" value={selectedElement.x} onChange={(e) => handlePropertyChange('x', parseInt(e.target.value))} className="h-8" />
                            </div>
                            <div>
                                <Label htmlFor="pos-y" className="text-xs text-muted-foreground">Y</Label>
                                <Input id="pos-y" type="number" value={selectedElement.y} onChange={(e) => handlePropertyChange('y', parseInt(e.target.value))} className="h-8" />
                            </div>
                        </div>
                    </PropertiesSection>
                    <PropertiesSection title="Size">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="size-w" className="text-xs text-muted-foreground">W</Label>
                                <Input id="size-w" type="number" value={selectedElement.width} onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))} className="h-8" />
                            </div>
                            <div>
                                <Label htmlFor="size-h" className="text-xs text-muted-foreground">H</Label>
                                <Input id="size-h" type="number" value={selectedElement.height} onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))} className="h-8" />
                            </div>
                        </div>
                    </PropertiesSection>

                    {selectedElement.type === 'text' && (
                        <PropertiesSection title="Text">
                            <div className="space-y-2">
                                <Label htmlFor="text-content">Content</Label>
                                <Input id="text-content" value={selectedElement.text} onChange={(e) => handlePropertyChange('text', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="font-size">Font Size</Label>
                                <Input id="font-size" type="number" value={selectedElement.fontSize} onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value))} />
                            </div>
                        </PropertiesSection>
                    )}
                   
                    <PropertiesSection title="Fill">
                        <div className="flex items-center gap-2">
                            <Input id="font-color" type="color" value={selectedElement.type === 'text' ? selectedElement.color : '#000000'} onChange={(e) => handlePropertyChange('color', e.target.value)} className="p-1 h-8 w-8" />
                            <Input value={selectedElement.type === 'text' ? selectedElement.color : '#000000'} onChange={(e) => handlePropertyChange('color', e.target.value)} className="h-8" />
                        </div>
                    </PropertiesSection>

                    <PropertiesSection title="Stroke">
                        <div className="flex items-center gap-2">
                            <Input id="stroke-color" type="color" defaultValue={'#000000'} className="p-1 h-8 w-8" />
                            <Input defaultValue="#000000" className="h-8" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stroke-width">Width</Label>
                            <Input id="stroke-width" type="number" defaultValue="0" />
                        </div>
                    </PropertiesSection>
                     <Separator />
                    <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Element
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
                    <p className="text-sm">Select an element on the canvas to see its properties.</p>
                </div>
            )}
        </aside>
    );
}
