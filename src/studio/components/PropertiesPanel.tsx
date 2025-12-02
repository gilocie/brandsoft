
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import React from 'react';

const PropertiesSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

export default function PropertiesPanel() {
    // We'll use a state to determine if an element is selected
    const selectedElement = true; // Mock selection for now

    return (
        <aside className="w-80 flex-shrink-0 border-l bg-background p-4 overflow-y-auto">
            {selectedElement ? (
                <div className="space-y-6">
                    <PropertiesSection title="Position">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="pos-x" className="text-xs text-muted-foreground">X</Label>
                                <Input id="pos-x" type="number" defaultValue="80" className="h-8" />
                            </div>
                            <div>
                                <Label htmlFor="pos-y" className="text-xs text-muted-foreground">Y</Label>
                                <Input id="pos-y" type="number" defaultValue="80" className="h-8" />
                            </div>
                        </div>
                    </PropertiesSection>
                    <PropertiesSection title="Size">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="size-w" className="text-xs text-muted-foreground">W</Label>
                                <Input id="size-w" type="number" defaultValue="300" className="h-8" />
                            </div>
                            <div>
                                <Label htmlFor="size-h" className="text-xs text-muted-foreground">H</Label>
                                <Input id="size-h" type="number" defaultValue="60" className="h-8" />
                            </div>
                        </div>
                    </PropertiesSection>

                    <PropertiesSection title="Text">
                        <div className="space-y-2">
                            <Label htmlFor="text-content">Content</Label>
                            <Input id="text-content" defaultValue="Your Company" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="font-size">Font Size</Label>
                            <Input id="font-size" type="number" defaultValue="36" />
                        </div>
                    </PropertiesSection>
                   
                    <PropertiesSection title="Fill">
                        <div className="flex items-center gap-2">
                            <Input id="font-color" type="color" defaultValue={'#9400D3'} className="p-1 h-8 w-8" />
                            <Input defaultValue="#9400D3" className="h-8" />
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
