'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

// Import all panels
import {
    ActionsPanel,
    PositionPanel,
    OpacityPanel,
    ShapeFillPanel,
    ShapeStrokePanel,
    ShapeRadiusPanel,
    ShapeShadowPanel,
    ShapeImagePanel,
    TextContentPanel,
    TextStylePanel,
    PageDimensionsPanel,
    PageBackgroundPanel,
    TemplatePanel,
} from './sidebar/panels';

// Element Properties Content
const ElementPropertiesContent = () => {
    const { selectedElementId, elements } = useCanvasStore();
    const element = elements.find(el => el.id === selectedElementId);

    if (!element) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                Select an element to edit its properties
            </div>
        );
    }

    return (
        <div className="space-y-0">
            <ActionsPanel />
            <Accordion
                type="multiple"
                defaultValue={['position', 'opacity', 'fill', 'stroke', 'radius', 'shadow', 'text-content', 'text-style']}
                className="w-full"
            >
                <PositionPanel />
                <OpacityPanel />

                {/* Shape-specific panels */}
                {element.type === 'shape' && (
                    <>
                        <ShapeFillPanel />
                        <ShapeStrokePanel />
                        <ShapeRadiusPanel />
                        <ShapeShadowPanel />
                        <ShapeImagePanel />
                    </>
                )}

                {/* Text-specific panels */}
                {element.type === 'text' && (
                    <>
                        <TextContentPanel />
                        <TextStylePanel />
                    </>
                )}

                <TemplatePanel />
            </Accordion>
        </div>
    );
};

// Page Properties Content
const PagePropertiesContent = () => {
    return (
        <div className="py-2">
            <Accordion
                type="multiple"
                defaultValue={['dimensions', 'background', 'template']}
                className="w-full"
            >
                <PageDimensionsPanel />
                <PageBackgroundPanel />
                <TemplatePanel />
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

    const getTitle = () => {
        if (!selectedElement) return 'Properties';
        const typeLabels: Record<string, string> = {
            text: 'Text',
            shape: 'Shape',
            image: 'Image',
        };
        return `${typeLabels[selectedElement.type] || 'Element'} Properties`;
    };

    return (
        <Card
            className="absolute w-72 z-20 h-[80vh] flex flex-col shadow-lg"
            style={{ top: position.y, right: position.x }}
        >
            {/* Header */}
            <div
                className="p-2 border-b flex items-center justify-between bg-primary rounded-t-lg cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <span className="text-sm font-medium text-primary-foreground pl-2">
                    {getTitle()}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCollapse}
                    className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground cursor-pointer h-7 w-7"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <Tabs
                defaultValue={selectedElementId ? 'element' : 'page'}
                value={selectedElementId ? 'element' : 'page'}
                className="flex-1 flex flex-col overflow-hidden"
            >
                <TabsList className="w-full rounded-none border-b shrink-0">
                    <TabsTrigger
                        value="element"
                        className="flex-1 text-xs"
                        disabled={!selectedElementId}
                    >
                        Element
                    </TabsTrigger>
                    <TabsTrigger value="page" className="flex-1 text-xs">
                        Page
                    </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                    <TabsContent value="element" className="mt-0 p-0">
                        <ElementPropertiesContent />
                    </TabsContent>

                    <TabsContent value="page" className="mt-0 p-0">
                        <PagePropertiesContent />
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </Card>
    );
};

export default RightSidebar;
