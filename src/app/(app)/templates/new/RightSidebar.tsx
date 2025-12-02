
'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const PositionPanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId);

    if (!element) return null;

    const handleChange = (prop: 'x' | 'y' | 'width' | 'height' | 'rotation', value: string) => {
        updateElement(element.id, { [prop]: Number(value) });
    };

    const handleCommit = () => {
        commitHistory();
    }

    return (
        <div className="px-4 py-2">
            <p className="text-xs text-gray-500 mb-2">Position</p>
            <div className="grid grid-cols-2 gap-2">
                <InputWithLabel label="X" value={element.x.toFixed(0)} onChange={e => handleChange('x', e.target.value)} onBlur={handleCommit} />
                <InputWithLabel label="Y" value={element.y.toFixed(0)} onChange={e => handleChange('y', e.target.value)} onBlur={handleCommit} />
                <InputWithLabel label="W" value={element.width.toFixed(0)} onChange={e => handleChange('width', e.target.value)} onBlur={handleCommit} />
                <InputWithLabel label="H" value={element.height.toFixed(0)} onChange_e => handleChange('height', e.target.value)} onBlur={handleCommit} />
                <InputWithLabel label="Angle" value={element.rotation.toFixed(0)} onChange={e => handleChange('rotation', e.target.value)} onBlur={handleCommit} />
            </div>
        </div>
    )
}

const TextPanel = () => {
    const { selectedElementId, elements, updateElement, commitHistory } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId && el.type === 'text');

    if (!element) return null;
    
    const handlePropChange = (prop: string, value: any) => {
        updateElement(element.id, { props: { ...element.props, [prop]: value } });
    };

    const handleCommit = () => {
        commitHistory();
    }

    return (
        <Accordion type="multiple" defaultValue={['text-style']} className="w-full px-2">
            <AccordionItem value="text-style">
                <AccordionTrigger className="text-xs font-medium">Text Style</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <InputWithLabel label="Font Size" type="number" value={element.props.fontSize || 16} onChange={e => handlePropChange('fontSize', Number(e.target.value))} onBlur={handleCommit}/>
                    <InputWithLabel label="Color" type="color" value={element.props.color || '#000000'} onChange={e => handlePropChange('color', e.target.value)} onBlur={handleCommit} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

const InputWithLabel = ({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) => (
    <div className="flex items-center gap-2">
        <Label className="text-xs w-8">{label}</Label>
        <Input className="h-8 text-xs" {...props} />
    </div>
);


const RightSidebar = () => {
    const { selectedElementId, deleteElement } = useCanvasStore();
    
    const handleDelete = () => {
        if(selectedElementId) {
            deleteElement(selectedElementId);
        }
    }

    return (
        <aside className="w-64 bg-gray-100 border-l border-gray-200 z-10">
            <ScrollArea className="h-full">
                {selectedElementId ? (
                    <div className="space-y-4 py-4">
                        <PositionPanel />
                        <Separator />
                        <TextPanel />
                        <Separator />
                         <div className="px-4">
                           <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Element
                           </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400 p-4 text-center">
                        <p>Select an element on the canvas to see its properties.</p>
                    </div>
                )}
            </ScrollArea>
        </aside>
    )
}

export default RightSidebar;
