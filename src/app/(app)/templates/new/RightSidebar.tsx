
'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, UploadCloud, PanelRightClose } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';


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
        <Accordion type="single" collapsible defaultValue="position" className="w-full px-2">
            <AccordionItem value="position">
                 <AccordionTrigger className="text-xs font-medium">Position</AccordionTrigger>
                 <AccordionContent className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <InputWithLabel label="X" value={element.x.toFixed(0)} onChange={e => handleChange('x', e.target.value)} onBlur={handleCommit} />
                        <InputWithLabel label="Y" value={element.y.toFixed(0)} onChange={e => handleChange('y', e.target.value)} onBlur={handleCommit} />
                        <InputWithLabel label="W" value={element.width.toFixed(0)} onChange={e => handleChange('width', e.target.value)} onBlur={handleCommit} />
                        <InputWithLabel label="H" value={element.height.toFixed(0)} onChange={e => handleChange('height', e.target.value)} onBlur={handleCommit} />
                        <InputWithLabel label="Angle" value={element.rotation.toFixed(0)} onChange={e => handleChange('rotation', e.target.value)} onBlur={handleCommit} />
                    </div>
                 </AccordionContent>
            </AccordionItem>
        </Accordion>
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
                <AccordionContent className="space-y-4 pt-4">
                    <InputWithLabel label="Font Size" type="number" value={element.props.fontSize || 16} onChange={e => handlePropChange('fontSize', Number(e.target.value))} onBlur={handleCommit}/>
                    <InputWithLabel label="Color" type="color" value={element.props.color || '#000000'} onChange={e => handlePropChange('color', e.target.value)} onBlur={handleCommit} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

const PagePanel = () => {
    const { pageDetails, updatePageDetails, commitHistory } = useCanvasStore();
    const bgInputRef = React.useRef<HTMLInputElement>(null);

    const handlePageDetailChange = (prop: keyof typeof pageDetails, value: any) => {
        updatePageDetails({ [prop]: value });
    }
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updatePageDetails({ backgroundImage: event.target?.result as string });
                commitHistory();
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="py-4 space-y-4">
            <p className="text-sm font-medium px-4">Page Properties</p>
             <Accordion type="multiple" defaultValue={['dimensions', 'background']} className="w-full px-2">
                <AccordionItem value="dimensions">
                    <AccordionTrigger className="text-xs font-medium">Dimensions</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-4">
                       <div className="grid grid-cols-2 gap-2">
                         <InputWithLabel label="W" value={pageDetails.width} onChange={e => handlePageDetailChange('width', Number(e.target.value))} onBlur={commitHistory} />
                         <InputWithLabel label="H" value={pageDetails.height} onChange={e => handlePageDetailChange('height', Number(e.target.value))} onBlur={commitHistory} />
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
                <AccordionItem value="background">
                    <AccordionTrigger className="text-xs font-medium">Background</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                         <InputWithLabel label="Color" type="color" value={pageDetails.backgroundColor} onChange={e => handlePageDetailChange('backgroundColor', e.target.value)} onBlur={commitHistory} />
                         <div>
                            <Label className="text-xs px-1">Background Image</Label>
                            <Input type="file" accept="image/*" className="hidden" ref={bgInputRef} onChange={handleImageUpload} />
                            <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => bgInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" /> Upload Image
                            </Button>
                         </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

const InputWithLabel = ({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) => (
    <div className="flex items-center gap-2 px-1">
        <Label className="text-xs w-8">{label}</Label>
        <Input className="h-8 text-xs" {...props} />
    </div>
);

interface RightSidebarProps {
    onCollapse: () => void;
    position: { x: number; y: number };
    setPosition: (position: { x: number; y: number }) => void;
}

const RightSidebar = ({ onCollapse, position, setPosition }: RightSidebarProps) => {
    const { selectedElementId, deleteElement } = useCanvasStore();

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
                x: panelStartPos.current.x + dx,
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
    
    const handleDelete = () => {
        if(selectedElementId) {
            deleteElement(selectedElementId);
        }
    }
    
    const content = selectedElementId ? (
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
    ) : <PagePanel />;

    return (
        <Card 
            className="absolute w-64 z-20 h-[70vh] flex flex-col"
            style={{ top: position.y, right: position.x }}
        >
            <div 
                className="p-2 border-b flex items-center justify-end bg-primary rounded-t-lg cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <Button variant="ghost" size="icon" onClick={onCollapse} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground cursor-pointer">
                    <PanelRightClose className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="flex-grow">
               {content}
            </ScrollArea>
        </Card>
    )
}

export default RightSidebar;
